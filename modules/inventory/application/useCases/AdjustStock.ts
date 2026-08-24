/**
 * AdjustStock Use Case
 *
 * Adjusts inventory quantities for corrections, counts, damage, etc.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { InventoryValidationError } from '../../domain/errors/InventoryErrors';

export type AdjustmentReason = 'correction' | 'count' | 'damage' | 'return' | 'shrinkage' | 'expired' | 'received' | 'manual' | 'other';

export interface AdjustStockInput {
  productId: string;
  variantId?: string;
  sku?: string;
  locationId: string;
  adjustmentType: 'set' | 'increment' | 'decrement';
  quantity: number;
  reason: AdjustmentReason;
  notes?: string;
  adjustedBy?: string;
  referenceId?: string; // PO number, return ID, etc.
}

export interface AdjustStockOutput {
  adjustmentId: string;
  productId: string;
  variantId?: string;
  previousQuantity: number;
  newQuantity: number;
  adjustmentAmount: number;
  reason: AdjustmentReason;
  adjustedAt: string;
}

interface InventoryRecord {
  inventoryItemId: string;
  quantity: number;
  lowStockThreshold?: number;
}

interface AdjustStockRepositoryPort {
  findByProduct(productId: string, variantId: string | undefined, locationId: string): Promise<InventoryRecord | null>;
  updateQuantity(inventoryItemId: string, newQuantity: number): Promise<InventoryRecord>;
  create(input: {
    productId: string;
    variantId?: string;
    sku?: string;
    locationId: string;
    quantity: number;
    reservedQuantity: number;
  }): Promise<InventoryRecord>;
  recordTransaction(input: {
    transactionId: string;
    type: string;
    productId: string;
    variantId?: string;
    locationId: string;
    quantity: number;
    previousQuantity: number;
    newQuantity: number;
    reason: string;
    notes?: string;
    adjustedBy?: string;
    referenceId?: string;
  }): Promise<void>;
}

export class AdjustStockUseCase {
  constructor(
    private readonly inventoryRepository: AdjustStockRepositoryPort,
  ) {}

  async execute(input: AdjustStockInput): Promise<AdjustStockOutput> {
    // Get current inventory
    let inventory = await this.inventoryRepository.findByProduct(input.productId, input.variantId, input.locationId);

    const previousQuantity = inventory?.quantity || 0;
    let newQuantity: number;
    let adjustmentAmount: number;

    // Calculate new quantity based on adjustment type
    switch (input.adjustmentType) {
      case 'set':
        newQuantity = input.quantity;
        adjustmentAmount = newQuantity - previousQuantity;
        break;
      case 'increment':
        newQuantity = previousQuantity + input.quantity;
        adjustmentAmount = input.quantity;
        break;
      case 'decrement':
        newQuantity = Math.max(0, previousQuantity - input.quantity);
        adjustmentAmount = -(previousQuantity - newQuantity);
        break;
      default:
        throw new InventoryValidationError(`Invalid adjustment type: ${input.adjustmentType}`);
    }

    // Validate new quantity
    if (newQuantity < 0) {
      throw new InventoryValidationError('Quantity cannot be negative');
    }

    // Update or create inventory record
    if (inventory) {
      await this.inventoryRepository.updateQuantity(inventory.inventoryItemId, newQuantity);
    } else {
      // Create new inventory item
      inventory = await this.inventoryRepository.create({
        productId: input.productId,
        variantId: input.variantId,
        sku: input.sku,
        locationId: input.locationId,
        quantity: newQuantity,
        reservedQuantity: 0,
      });
    }

    // Generate adjustment ID
    const adjustmentId = this.generateAdjustmentId();

    // Record adjustment transaction
    await this.inventoryRepository.recordTransaction({
      transactionId: adjustmentId,
      type: 'adjustment',
      productId: input.productId,
      variantId: input.variantId,
      locationId: input.locationId,
      quantity: adjustmentAmount,
      previousQuantity,
      newQuantity,
      reason: input.reason,
      notes: input.notes,
      adjustedBy: input.adjustedBy,
      referenceId: input.referenceId,
    });

    // Check for low stock alert
    if (inventory && newQuantity <= (inventory.lowStockThreshold || 10)) {
      eventBus.emit('inventory.low', {
        productId: input.productId,
        variantId: input.variantId,
        locationId: input.locationId,
        currentQuantity: newQuantity,
        threshold: inventory.lowStockThreshold || 10,
      });
    }

    // Check for out of stock
    if (newQuantity === 0) {
      eventBus.emit('inventory.out_of_stock', {
        productId: input.productId,
        variantId: input.variantId,
        locationId: input.locationId,
      });
    }

    return {
      adjustmentId,
      productId: input.productId,
      variantId: input.variantId,
      previousQuantity,
      newQuantity,
      adjustmentAmount,
      reason: input.reason,
      adjustedAt: new Date().toISOString(),
    };
  }

  private generateAdjustmentId(): string {
    return `adj_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
