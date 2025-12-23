/**
 * GetLowStockItems Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface GetLowStockItemsInput {
  warehouseId?: string;
  threshold?: number;
  page?: number;
  limit?: number;
}

export interface LowStockItem {
  inventoryItemId: string;
  productId: string;
  productName?: string;
  variantId?: string;
  warehouseId: string;
  warehouseName?: string;
  sku: string;
  currentQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  suggestedReorder: number;
}

export interface GetLowStockItemsOutput {
  items: LowStockItem[];
  total: number;
  criticalCount: number;
}

export class GetLowStockItemsUseCase {
  constructor(private readonly inventoryRepository: any) {}

  async execute(input: GetLowStockItemsInput): Promise<GetLowStockItemsOutput> {
    const page = input.page || 1;
    const limit = input.limit || 100;

    const items = await this.inventoryRepository.findLowStock({
      warehouseId: input.warehouseId,
      threshold: input.threshold,
      page,
      limit,
    });

    const criticalItems = items.filter((item: any) => item.quantity - (item.reservedQuantity || 0) <= 0);

    // Emit event for monitoring
    if (items.length > 0) {
      eventBus.emit('inventory.low', {
        count: items.length,
        criticalCount: criticalItems.length,
        warehouseId: input.warehouseId,
      });
    }

    return {
      items: items.map((item: any) => ({
        inventoryItemId: item.inventoryItemId,
        productId: item.productId,
        productName: item.productName,
        variantId: item.variantId,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouseName,
        sku: item.sku,
        currentQuantity: item.quantity - (item.reservedQuantity || 0),
        reorderPoint: item.reorderPoint,
        reorderQuantity: item.reorderQuantity,
        suggestedReorder: Math.max(item.reorderQuantity || 0, (item.reorderPoint || 0) - (item.quantity - (item.reservedQuantity || 0))),
      })),
      total: items.length,
      criticalCount: criticalItems.length,
    };
  }
}
