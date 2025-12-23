/**
 * GetOutOfStockItems Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface GetOutOfStockItemsInput {
  warehouseId?: string;
  includeReserved?: boolean;
  page?: number;
  limit?: number;
}

export interface OutOfStockItem {
  inventoryItemId: string;
  productId: string;
  productName?: string;
  variantId?: string;
  warehouseId: string;
  warehouseName?: string;
  sku: string;
  reservedQuantity: number;
  reorderQuantity: number;
  lastStockedAt?: string;
  daysSinceLastStock?: number;
}

export interface GetOutOfStockItemsOutput {
  items: OutOfStockItem[];
  total: number;
  hasReservedStock: number;
}

export class GetOutOfStockItemsUseCase {
  constructor(private readonly inventoryRepository: any) {}

  async execute(input: GetOutOfStockItemsInput): Promise<GetOutOfStockItemsOutput> {
    const page = input.page || 1;
    const limit = input.limit || 100;

    const items = await this.inventoryRepository.findOutOfStock({
      warehouseId: input.warehouseId,
      includeReserved: input.includeReserved ?? false,
      page,
      limit,
    });

    const withReserved = items.filter((item: any) => (item.reservedQuantity || 0) > 0);

    // Emit event for monitoring
    if (items.length > 0) {
      eventBus.emit('inventory.out_of_stock', {
        count: items.length,
        warehouseId: input.warehouseId,
      });
    }

    const now = new Date();

    return {
      items: items.map((item: any) => {
        const lastStockedAt = item.lastStockedAt ? new Date(item.lastStockedAt) : null;
        const daysSinceLastStock = lastStockedAt
          ? Math.floor((now.getTime() - lastStockedAt.getTime()) / (1000 * 60 * 60 * 24))
          : undefined;

        return {
          inventoryItemId: item.inventoryItemId,
          productId: item.productId,
          productName: item.productName,
          variantId: item.variantId,
          warehouseId: item.warehouseId,
          warehouseName: item.warehouseName,
          sku: item.sku,
          reservedQuantity: item.reservedQuantity || 0,
          reorderQuantity: item.reorderQuantity || 0,
          lastStockedAt: lastStockedAt?.toISOString(),
          daysSinceLastStock,
        };
      }),
      total: items.length,
      hasReservedStock: withReserved.length,
    };
  }
}
