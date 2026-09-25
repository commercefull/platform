/**
 * AdjustStock Use Case
 *
 * Adjusts the on-hand quantity of an inventory stock location (corrections,
 * counts, damage, receiving). Computes the signed delta from the requested
 * adjustment mode, records an inventory transaction, and raises
 * inventory.low / inventory.out_of_stock alerts.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import type { InventoryLocation } from '../../../../libs/db/types';
import { InventoryLocationNotFoundError, InventoryValidationError } from '../../domain/errors/InventoryErrors';

export type AdjustmentReason = 'correction' | 'count' | 'damage' | 'return' | 'shrinkage' | 'expired' | 'received' | 'manual' | 'other';

export type StockAdjustmentType = 'set' | 'increment' | 'decrement';

export interface AdjustStockInput {
  inventoryLocationId: string;
  adjustmentType: StockAdjustmentType;
  /** Absolute target for 'set'; delta magnitude for 'increment'/'decrement'. */
  quantity: number;
  reason: string;
  /** Overrides the transaction type derived from the adjustment direction (ADJUST_UP/ADJUST_DOWN). */
  transactionTypeCode?: string;
  notes?: string;
  adjustedBy?: string;
  referenceId?: string; // PO number, return ID, etc.
}

export interface AdjustStockOutput {
  adjustmentId: string;
  inventoryLocationId: string;
  productId: string;
  variantId?: string;
  sku: string;
  previousQuantity: number;
  newQuantity: number;
  adjustmentAmount: number;
  reason: string;
  adjustedAt: string;
  location: InventoryLocation;
}

export interface AdjustStockLocationPort {
  findLocationById(inventoryLocationId: string): Promise<InventoryLocation | null>;
  adjustQuantity(inventoryLocationId: string, quantityChange: number, reason?: string): Promise<InventoryLocation>;
  createTransaction(input: {
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
    notes?: string;
    reason?: string;
  }): Promise<{ inventoryTransactionId?: string } | unknown>;
  findTransactionTypeByCode(code: string): Promise<{ inventoryTransactionTypeId: string } | null>;
}

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

export class AdjustStockUseCase {
  constructor(private readonly stockLocations: AdjustStockLocationPort) {}

  async execute(input: AdjustStockInput): Promise<AdjustStockOutput> {
    if (input.quantity === undefined || input.quantity === null || input.quantity < 0) {
      throw new InventoryValidationError('quantity must be a non-negative number');
    }

    const location = await this.stockLocations.findLocationById(input.inventoryLocationId);
    if (!location) {
      throw new InventoryLocationNotFoundError(input.inventoryLocationId);
    }

    const previousQuantity = location.quantity;
    let adjustmentAmount: number;

    switch (input.adjustmentType) {
      case 'set':
        adjustmentAmount = input.quantity - previousQuantity;
        break;
      case 'increment':
        adjustmentAmount = input.quantity;
        break;
      case 'decrement':
        adjustmentAmount = Math.max(0, previousQuantity - input.quantity) - previousQuantity;
        break;
      default:
        throw new InventoryValidationError(`Invalid adjustment type: ${input.adjustmentType}`);
    }

    const updatedLocation = await this.stockLocations.adjustQuantity(input.inventoryLocationId, adjustmentAmount, input.reason);

    // Record the movement (type code: explicit override, else derived from direction)
    const typeCode = input.transactionTypeCode ?? (adjustmentAmount >= 0 ? 'ADJUST_UP' : 'ADJUST_DOWN');
    const transactionType = await this.stockLocations.findTransactionTypeByCode(typeCode);

    let adjustmentId = this.generateAdjustmentId();
    if (transactionType) {
      const recorded = (await this.stockLocations.createTransaction({
        typeId: transactionType.inventoryTransactionTypeId,
        distributionWarehouseId: location.distributionWarehouseId,
        distributionWarehouseBinId: location.distributionWarehouseBinId ?? undefined,
        productId: location.productId,
        productVariantId: location.productVariantId ?? undefined,
        sku: location.sku,
        quantity: adjustmentAmount,
        previousQuantity,
        newQuantity: updatedLocation.quantity,
        referenceType: input.referenceId ? 'adjustment' : undefined,
        referenceId: input.referenceId,
        reason: input.reason,
        notes: input.notes,
      })) as { inventoryTransactionId?: string } | null;
      adjustmentId = recorded?.inventoryTransactionId ?? adjustmentId;
    }

    const effectiveNewQuantity = updatedLocation.quantity;

    if (effectiveNewQuantity === 0) {
      eventBus.emit('inventory.out_of_stock', {
        productId: location.productId,
        variantId: location.productVariantId ?? undefined,
        locationId: location.inventoryLocationId,
        sku: location.sku,
      });
    } else if (effectiveNewQuantity <= (location.minimumStockLevel ?? DEFAULT_LOW_STOCK_THRESHOLD)) {
      eventBus.emit('inventory.low', {
        productId: location.productId,
        variantId: location.productVariantId ?? undefined,
        locationId: location.inventoryLocationId,
        sku: location.sku,
        currentQuantity: effectiveNewQuantity,
        threshold: location.minimumStockLevel ?? DEFAULT_LOW_STOCK_THRESHOLD,
      });
    }

    return {
      adjustmentId,
      inventoryLocationId: location.inventoryLocationId,
      productId: location.productId,
      variantId: location.productVariantId ?? undefined,
      sku: location.sku,
      previousQuantity,
      newQuantity: effectiveNewQuantity,
      adjustmentAmount,
      reason: input.reason,
      adjustedAt: new Date().toISOString(),
      location: updatedLocation,
    };
  }

  private generateAdjustmentId(): string {
    return `adj_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
