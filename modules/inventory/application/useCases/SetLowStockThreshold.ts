/**
 * SetLowStockThreshold Use Case
 *
 * Sets or updates the low-stock reorder threshold for a product at a given location.
 * When stock falls below this threshold, an inventory.low event is emitted.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface SetLowStockThresholdInput {
  productId: string;
  variantId?: string;
  locationId: string;
  reorderPoint: number;
  reorderQuantity?: number;
}

export interface SetLowStockThresholdOutput {
  inventoryItemId: string;
  productId: string;
  variantId?: string;
  locationId: string;
  reorderPoint: number;
  reorderQuantity?: number;
  currentQuantity: number;
  isLowStock: boolean;
}

interface InventoryRecord {
  inventoryId: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
}

interface SetThresholdRepositoryPort {
  findByProduct(productId: string, variantId: string | undefined, locationId: string | undefined): Promise<InventoryRecord | null>;
  updateReorderPoint(inventoryItemId: string, reorderPoint: number, reorderQuantity?: number): Promise<void>;
}

export class SetLowStockThresholdUseCase {
  constructor(
    private readonly inventoryRepository: SetThresholdRepositoryPort,
  ) {}

  async execute(input: SetLowStockThresholdInput): Promise<SetLowStockThresholdOutput> {
    if (input.reorderPoint < 0) {
      throw new Error('Reorder point must be >= 0');
    }

    const inventory = await this.inventoryRepository.findByProduct(
      input.productId,
      input.variantId,
      input.locationId,
    );

    if (!inventory) {
      throw new Error('Inventory item not found for the given product and location');
    }

    await this.inventoryRepository.updateReorderPoint(
      inventory.inventoryId,
      input.reorderPoint,
      input.reorderQuantity,
    );

    const isLowStock = inventory.quantity <= input.reorderPoint;

    if (isLowStock) {
      eventBus.emit('inventory.low', {
        productId: input.productId,
        locationId: input.locationId,
        quantity: inventory.quantity,
        reorderPoint: input.reorderPoint,
      });
    }

    if (inventory.quantity === 0) {
      eventBus.emit('inventory.out_of_stock', {
        productId: input.productId,
        locationId: input.locationId,
      });
    }

    return {
      inventoryItemId: inventory.inventoryId,
      productId: input.productId,
      variantId: input.variantId,
      locationId: input.locationId,
      reorderPoint: input.reorderPoint,
      reorderQuantity: input.reorderQuantity,
      currentQuantity: inventory.quantity,
      isLowStock,
    };
  }
}
