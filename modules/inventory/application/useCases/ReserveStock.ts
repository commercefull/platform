/**
 * ReserveStock Use Case
 *
 * Reserves inventory for an order, preventing overselling.
 *
 * Item policy:
 * - digital / `unlimited` — always fully reserved, no stock mutation;
 * - `backorderable` — fully reserved even past available stock;
 * - `tracked` (default) — reserves up to available quantity only.
 *
 * Location routing: an explicit `locationId` wins; otherwise the store's
 * warehouse locations are searched (`storeId` on the input) and the
 * location with the most available stock is picked.
 *
 * Idempotent: when active reservations already exist for `orderId`, they
 * are returned instead of reserving again (safe payment-intent retries).
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { generateUUID } from '../../../../libs/uuid';

interface ReserveStockItemInput {
  productId: string;
  variantId?: string;
  sku?: string;
  quantity: number;
  locationId?: string; // warehouse or store
  orderItemId?: string; // order line this reservation covers
  isDigital?: boolean;
  inventoryPolicy?: 'tracked' | 'unlimited' | 'backorderable';
}

export interface ReserveStockInput {
  orderId: string;
  items: ReserveStockItemInput[];
  expiresAt?: Date; // When reservation expires
  channelId?: string;
  storeId?: string;
}

interface ReservationResult {
  productId: string;
  variantId?: string;
  sku?: string;
  requestedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  isFullyReserved: boolean;
  locationId?: string;
}

export interface ReserveStockOutput {
  reservationId: string;
  orderId: string;
  results: ReservationResult[];
  allReserved: boolean;
  expiresAt: string;
}

interface InventoryRecord {
  inventoryItemId: string;
  quantity: number;
  reservedQuantity: number;
  locationId?: string;
}

interface ExistingReservationRecord {
  reservationId: string;
  inventoryItemId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  locationId?: string;
  status: string;
}

interface ReserveStockRepositoryPort {
  findByProduct(productId: string, variantId: string | undefined, locationId: string | undefined): Promise<InventoryRecord | null>;
  findReservationsByOrderId(orderId: string): Promise<ExistingReservationRecord[]>;
  /** Stock locations across the store's warehouses, most available first. */
  findStoreLocations?(storeId: string, productId: string, variantId?: string): Promise<InventoryRecord[]>;
  createReservation(input: {
    reservationId: string;
    orderId: string;
    inventoryItemId: string;
    productId: string;
    variantId?: string;
    sku?: string;
    quantity: number;
    locationId?: string;
    orderItemId?: string;
    expiresAt: Date;
    status: string;
  }): Promise<void>;
  updateReservedQuantity(inventoryItemId: string, newReservedQuantity: number): Promise<void>;
  /**
   * Atomic row-locked reservation increment — prevents overselling under
   * concurrent checkouts. When absent the use case falls back to
   * check-then-act semantics.
   */
  reserveStockAtomically?(
    inventoryItemId: string,
    delta: number,
    allowBackorder: boolean,
  ): Promise<{ appliedQuantity: number; quantity: number; reservedQuantity: number; availableQuantity: number } | null>;
  /**
   * Attach the order-line reference to live reservations covering a
   * product/variant that don't have one yet — used when the event-path
   * handler created the rows before the order lines were known.
   */
  attachOrderItem?(orderId: string, productId: string, variantId: string | undefined, orderItemId: string): Promise<void>;
}

interface ItemReservationContext {
  orderId: string;
  storeId?: string;
  reservationId: string;
  expiresAt: Date;
  coveredQuantity: (productId: string, variantId?: string) => number;
}

export class ReserveStockUseCase {
  constructor(private readonly inventoryRepository: ReserveStockRepositoryPort) {}

  async execute(input: ReserveStockInput): Promise<ReserveStockOutput> {
    // Idempotency: count live reservations already held for this order —
    // both 'active' rows (this use case) and 'reserved' rows (the
    // order.created event handler, which races because order.created is
    // emitted fire-and-forget) — and only reserve the uncovered remainder.
    const existing = (await this.inventoryRepository.findReservationsByOrderId(input.orderId)).filter(
      r => r.status === 'active' || r.status === 'reserved',
    );
    const coveredQuantity = (productId: string, variantId?: string): number =>
      existing.filter(r => r.productId === productId && (r.variantId ?? undefined) === variantId).reduce((sum, r) => sum + r.quantity, 0);

    const reservationId = this.generateReservationId();

    // Default expiration: 30 minutes
    const expiresAt = input.expiresAt || new Date(Date.now() + 30 * 60 * 1000);
    const ctx: ItemReservationContext = { orderId: input.orderId, storeId: input.storeId, reservationId, expiresAt, coveredQuantity };

    const results: ReservationResult[] = [];
    for (const item of input.items) {
      results.push(await this.reserveOneItem(item, ctx));
    }
    const allReserved = results.every(r => r.isFullyReserved);

    // Emit event
    eventBus.emit('inventory.reserved', {
      reservationId,
      orderId: input.orderId,
      itemCount: input.items.length,
      allReserved,
    });

    return {
      reservationId,
      orderId: input.orderId,
      results,
      allReserved,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private async reserveOneItem(item: ReserveStockItemInput, ctx: ItemReservationContext): Promise<ReservationResult> {
    const alreadyReserved = ctx.coveredQuantity(item.productId, item.variantId);
    const needed = Math.max(0, item.quantity - alreadyReserved);

    // Link the reservation rows already covering this line (created by
    // the event path before the order line existed) to the order item.
    if (item.orderItemId && alreadyReserved > 0 && this.inventoryRepository.attachOrderItem) {
      await this.inventoryRepository.attachOrderItem(ctx.orderId, item.productId, item.variantId, item.orderItemId);
    }

    // Digital and unlimited-inventory items never consume stock, and lines
    // fully covered by existing reservations do not reserve again.
    if (item.isDigital || item.inventoryPolicy === 'unlimited' || needed === 0) {
      return this.fullyReservedResult(item);
    }

    const { inventory, resolvedLocationId } = await this.resolveInventory(item, ctx.storeId);
    const backorderable = item.inventoryPolicy === 'backorderable';

    if (!inventory) {
      // No stock record: backorderable items still sell (fulfilled later).
      const totalReserved = backorderable ? item.quantity : alreadyReserved;
      return {
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        requestedQuantity: item.quantity,
        reservedQuantity: totalReserved,
        availableQuantity: 0,
        isFullyReserved: totalReserved >= item.quantity,
        locationId: resolvedLocationId,
      };
    }

    const { reserveQuantity, availableQuantity } = await this.applyReservation(inventory, needed, backorderable);

    if (reserveQuantity > 0) {
      await this.recordReservation(item, ctx, inventory, resolvedLocationId, reserveQuantity);
    }

    const totalReserved = alreadyReserved + reserveQuantity;
    return {
      productId: item.productId,
      variantId: item.variantId,
      sku: item.sku,
      requestedQuantity: item.quantity,
      reservedQuantity: totalReserved,
      availableQuantity,
      isFullyReserved: totalReserved >= item.quantity,
      locationId: resolvedLocationId,
    };
  }

  private fullyReservedResult(item: ReserveStockItemInput): ReservationResult {
    return {
      productId: item.productId,
      variantId: item.variantId,
      sku: item.sku,
      requestedQuantity: item.quantity,
      reservedQuantity: item.quantity,
      availableQuantity: item.quantity,
      isFullyReserved: true,
      locationId: item.locationId,
    };
  }

  // Get current inventory level: explicit location → store warehouse
  // routing → unscoped product lookup (adapter fallback).
  private async resolveInventory(
    item: ReserveStockItemInput,
    storeId: string | undefined,
  ): Promise<{ inventory: InventoryRecord | null; resolvedLocationId: string | undefined }> {
    let inventory = item.locationId ? await this.inventoryRepository.findByProduct(item.productId, item.variantId, item.locationId) : null;
    let resolvedLocationId = item.locationId;

    if (!inventory && storeId && this.inventoryRepository.findStoreLocations) {
      const locations = await this.inventoryRepository.findStoreLocations(storeId, item.productId, item.variantId);
      inventory = locations[0] ?? null;
      resolvedLocationId = inventory?.locationId ?? item.locationId;
    }
    if (!inventory) {
      inventory = await this.inventoryRepository.findByProduct(item.productId, item.variantId, item.locationId);
    }

    return { inventory, resolvedLocationId };
  }

  // Atomic path: the DB row-locks the location and clamps the delta at
  // remaining available stock (unless the item is backorderable), so
  // concurrent checkouts cannot oversell.
  private async applyReservation(
    inventory: InventoryRecord,
    needed: number,
    backorderable: boolean,
  ): Promise<{ reserveQuantity: number; availableQuantity: number }> {
    let availableQuantity = inventory.quantity - (inventory.reservedQuantity || 0);

    if (!this.inventoryRepository.reserveStockAtomically) {
      return { reserveQuantity: backorderable ? needed : Math.min(needed, Math.max(0, availableQuantity)), availableQuantity };
    }

    const atomic = await this.inventoryRepository.reserveStockAtomically(inventory.inventoryItemId, needed, backorderable);
    if (atomic) availableQuantity = atomic.availableQuantity;
    return { reserveQuantity: atomic ? atomic.appliedQuantity : 0, availableQuantity };
  }

  private async recordReservation(
    item: ReserveStockItemInput,
    ctx: ItemReservationContext,
    inventory: InventoryRecord,
    resolvedLocationId: string | undefined,
    reserveQuantity: number,
  ): Promise<void> {
    // Create reservation record
    await this.inventoryRepository.createReservation({
      reservationId: ctx.reservationId,
      orderId: ctx.orderId,
      inventoryItemId: inventory.inventoryItemId,
      productId: item.productId,
      variantId: item.variantId,
      sku: item.sku,
      quantity: reserveQuantity,
      locationId: resolvedLocationId,
      orderItemId: item.orderItemId,
      expiresAt: ctx.expiresAt,
      status: 'active',
    });

    // Update reserved quantity on inventory (may exceed quantity for
    // backorders) — skipped on the atomic path, which already applied it.
    if (!this.inventoryRepository.reserveStockAtomically) {
      await this.inventoryRepository.updateReservedQuantity(inventory.inventoryItemId, (inventory.reservedQuantity || 0) + reserveQuantity);
    }
  }

  private generateReservationId(): string {
    return generateUUID();
  }
}
