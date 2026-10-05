/**
 * Inventory Event Handlers
 *
 * Subscribes to order lifecycle events to reserve/release stock and
 * emits/handles stock-level alerts.
 *
 * Called from boot/registerEventHandlers.ts on app boot.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { logger } from '../../../libs/logger';
import type { OrderRepository } from '../../order/domain/repositories/OrderRepository';
import type { ReturnRequestRepository } from '../../returns/domain/repositories/ReturnRepository';
import type { InventoryLocation } from '../../../libs/db/types';

interface CreateStockTransactionParams {
  typeId: string;
  distributionWarehouseId: string;
  distributionWarehouseBinId?: string;
  productId: string;
  productVariantId?: string;
  sku: string;
  quantity: number;
  previousQuantity?: number;
  newQuantity?: number;
  referenceType?: string;
  referenceId?: string;
  lotNumber?: string;
  serialNumber?: string;
  notes?: string;
  reason?: string;
}

/** Narrow ports for cross-module dependencies, injected at boot. */
export interface InventoryEventHandlerDeps {
  orders: Pick<OrderRepository, 'findById'>;
  returns: Pick<ReturnRequestRepository, 'findById'>;
  stock: {
    checkProductAvailability(
      productId: string,
      variantId: string | undefined,
      requiredQuantity: number,
    ): Promise<{ available: boolean; locations: unknown[] }>;
    findLocationsByProductId(productId: string): Promise<InventoryLocation[]>;
    adjustQuantity(inventoryLocationId: string, quantityChange: number, reason?: string): Promise<InventoryLocation>;
    createTransaction(input: CreateStockTransactionParams): Promise<unknown>;
    findTransactionTypeByCode(code: string): Promise<{ inventoryTransactionTypeId: string } | null>;
  };
  reservations: {
    createAtomic(params: {
      orderId: string;
      productId: string;
      variantId?: string;
      sku?: string;
      inventoryItemId: string;
      locationId: string;
      quantity: number;
      expiresAt?: Date;
    }): Promise<unknown>;
    releaseByOrder(orderId: string): Promise<unknown>;
    findByOrder(
      orderId: string,
    ): Promise<Array<{ productId: string; variantId?: string | null; quantity: number; status?: string | null }>>;
    /** Releases 'active' reservations (checkout-orchestrated ledger). */
    releaseActiveForOrder?(orderId: string, reason: 'cancelled' | 'expired'): Promise<unknown>;
  };
}

export function registerInventoryEventHandlers(deps: InventoryEventHandlerDeps): void {
  const { orders, returns, stock, reservations } = deps;

  // Order created -> reserve inventory atomically
  eventBus.registerHandler('order.created', async payload => {
    const eventData = payload.data as Record<string, unknown>;
    const orderId = eventData.orderId as string;
    if (!orderId) return;

    try {
      const order = await orders.findById(orderId);
      if (!order) return;

      // Coverage check: checkout's synchronous reservation (status 'active')
      // may have already held stock for this order — this handler races with
      // it because order.created is emitted fire-and-forget. Only reserve the
      // uncovered remainder so the two paths cannot double-reserve.
      const existingReservations = await reservations.findByOrder(orderId).catch(() => []);
      const covered = new Map<string, number>();
      for (const r of existingReservations) {
        if (r.status !== 'reserved' && r.status !== 'active') continue;
        const key = `${r.productId}|${r.variantId ?? ''}`;
        covered.set(key, (covered.get(key) ?? 0) + r.quantity);
      }

      for (const item of order.items) {
        // Digital goods are not stock-tracked.
        if (item.isDigital) continue;

        const coverageKey = `${item.productId}|${item.productVariantId ?? ''}`;
        const alreadyReserved = covered.get(coverageKey) ?? 0;
        const needed = item.quantity - alreadyReserved;
        if (needed <= 0) continue;

        try {
          const availability = await stock.checkProductAvailability(item.productId, item.productVariantId, needed);

          if (availability.available && availability.locations.length > 0) {
            const loc = availability.locations[0] as Record<string, unknown>;
            const locationId: string = (loc.locationId as string) || (loc.inventoryLocationId as string) || '';
            if (!locationId) continue;

            const reservation = await reservations.createAtomic({
              orderId,
              productId: item.productId,
              variantId: item.productVariantId || undefined,
              inventoryItemId: (loc.inventoryItemId as string) || (loc.inventoryLevelId as string) || locationId,
              locationId,
              quantity: needed,
              expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            });

            if (reservation) {
              covered.set(coverageKey, alreadyReserved + needed);
            }

            if (!reservation) {
              eventBus.emit('inventory.reservation_failed', {
                orderId,
                productId: item.productId,
                productVariantId: item.productVariantId,
                requested: needed,
                reason: 'insufficient_stock',
              });
            }
          } else {
            eventBus.emit('inventory.reservation_failed', {
              orderId,
              productId: item.productId,
              productVariantId: item.productVariantId,
              requested: needed,
              reason: 'no_location',
            });
          }
        } catch (itemErr: unknown) {
          logger.warn(`inventory reservation failed for item ${item.productId}: ${(itemErr as Error).message}`);
          eventBus.emit('inventory.reservation_failed', {
            orderId,
            productId: item.productId,
            productVariantId: item.productVariantId,
            requested: needed,
            reason: 'error',
          });
        }
      }
    } catch (err: unknown) {
      logger.error(`order.created inventory handler error: ${(err as Error).message}`);
    }
  });

  // Order cancelled -> release inventory reservations.
  // Two ledgers exist: 'reserved' rows (this handler's createAtomic path) are
  // released by releaseByOrder; 'active' rows (checkout-orchestrated path) are
  // released by the ReleaseReservation use case. Each only touches its own
  // status so there is no double-restore.
  const releaseForOrder = async (orderId: string): Promise<void> => {
    await reservations.releaseByOrder(orderId);
    await reservations.releaseActiveForOrder?.(orderId, 'cancelled');
  };

  eventBus.registerHandler('order.cancelled', async payload => {
    const eventData = payload.data as Record<string, unknown>;
    const orderId = eventData.orderId as string;
    if (!orderId) return;
    try {
      await releaseForOrder(orderId);
    } catch (err: unknown) {
      logger.error(`order.cancelled inventory release error: ${(err as Error).message}`);
    }
  });

  // Order payment failed -> release inventory reservations
  eventBus.registerHandler('order.payment_failed', async payload => {
    const eventData = payload.data as Record<string, unknown>;
    const orderId = eventData.orderId as string;
    if (!orderId) return;
    try {
      await releaseForOrder(orderId);
    } catch (err: unknown) {
      logger.error(`order.payment_failed inventory release error: ${(err as Error).message}`);
    }
  });

  // Low stock -> audit log only; merchant alerts are sent by the notification module
  eventBus.registerHandler('inventory.low', async payload => {
    const data = payload.data as Record<string, unknown>;
    logger.warn('inventory.low: low stock', {
      productId: data.productId,
      sku: data.sku,
      currentStock: data.currentStock,
      reorderPoint: data.reorderPoint,
    });
  });

  // Out of stock -> audit log only; merchant alerts are sent by the notification module
  eventBus.registerHandler('inventory.out_of_stock', async payload => {
    const data = payload.data as Record<string, unknown>;
    logger.warn('inventory.out_of_stock', { productId: data.productId, sku: data.sku });
  });

  // Stock reserved -> log for audit trail
  eventBus.registerHandler('inventory.reserved', async payload => {
    const data = payload.data as Record<string, unknown>;
    logger.info(`inventory.reserved: product=${data.productId}, qty=${data.quantity}, order=${data.orderId}`);
  });

  // Stock released -> log for audit trail
  eventBus.registerHandler('inventory.released', async payload => {
    const data = payload.data as Record<string, unknown>;
    logger.info(`inventory.released: product=${data.productId}, qty=${data.quantity}, reason=${data.reason}`);
  });

  // Return completed -> restock items flagged restockItem that did not fail inspection.
  // Restock goes to the product's existing stock location (variant-matched where possible).
  eventBus.registerHandler('return.completed', async payload => {
    const data = payload.data as Record<string, unknown>;
    const orderReturnId = data.orderReturnId as string;
    if (!orderReturnId) return;

    try {
      const returnRequest = await returns.findById(orderReturnId);
      if (!returnRequest) {
        logger.warn(`return.completed: return ${orderReturnId} not found`);
        return;
      }

      const failed = returnRequest.inspectionFailedItems;
      const isFailed = (itemId: string): boolean => {
        if (!failed) return false;
        if (Array.isArray(failed)) return failed.includes(itemId);
        return itemId in failed;
      };

      const restockItems = returnRequest.items.filter(item => item.restockItem && !isFailed(item.orderReturnItemId));
      if (restockItems.length === 0) return;

      const order = await orders.findById(returnRequest.orderId);

      for (const item of restockItems) {
        const orderItem = order?.findItem(item.orderItemId);
        if (!orderItem) {
          logger.warn(`return.completed: order item ${item.orderItemId} not found on order ${returnRequest.orderId}`);
          continue;
        }

        const locations = await stock.findLocationsByProductId(orderItem.productId);
        const location = locations.find(l => (l.productVariantId ?? undefined) === orderItem.productVariantId) ?? locations[0];
        if (!location) {
          logger.warn(`return.completed: no stock location for product ${orderItem.productId}, cannot restock return ${orderReturnId}`);
          continue;
        }

        const updated = await stock.adjustQuantity(location.inventoryLocationId, item.quantity, 'customer_return');

        const transactionType = (await stock.findTransactionTypeByCode('RETURN')) ?? (await stock.findTransactionTypeByCode('ADJUST_UP'));
        if (transactionType) {
          await stock.createTransaction({
            typeId: transactionType.inventoryTransactionTypeId,
            distributionWarehouseId: location.distributionWarehouseId,
            distributionWarehouseBinId: location.distributionWarehouseBinId ?? undefined,
            productId: orderItem.productId,
            productVariantId: orderItem.productVariantId,
            sku: location.sku ?? orderItem.sku,
            quantity: item.quantity,
            previousQuantity: location.quantity,
            newQuantity: updated.quantity,
            referenceType: 'return',
            referenceId: orderReturnId,
            reason: 'customer_return',
            notes: `Restocked from return ${returnRequest.returnNumber}`,
          });
        }

        logger.info(
          `return.completed: restocked ${item.quantity} of product ${orderItem.productId} from return ${returnRequest.returnNumber}`,
        );
      }
    } catch (err: unknown) {
      logger.error(`return.completed handler error: ${(err as Error).message}`);
    }
  });
}
