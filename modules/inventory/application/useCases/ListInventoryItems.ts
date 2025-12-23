/**
 * ListInventoryItems Use Case
 */

export interface ListInventoryItemsInput {
  warehouseId?: string;
  productId?: string;
  lowStockOnly?: boolean;
  outOfStockOnly?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'sku' | 'quantity' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface InventoryItemSummary {
  inventoryItemId: string;
  productId: string;
  variantId?: string;
  warehouseId: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

export interface ListInventoryItemsOutput {
  items: InventoryItemSummary[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  summary: {
    totalItems: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalValue?: number;
  };
}

export class ListInventoryItemsUseCase {
  constructor(private readonly inventoryRepository: any) {}

  async execute(input: ListInventoryItemsInput): Promise<ListInventoryItemsOutput> {
    const page = input.page || 1;
    const limit = input.limit || 50;

    const filters: Record<string, unknown> = {};
    if (input.warehouseId) filters.warehouseId = input.warehouseId;
    if (input.productId) filters.productId = input.productId;
    if (input.lowStockOnly) filters.lowStockOnly = true;
    if (input.outOfStockOnly) filters.outOfStockOnly = true;
    if (input.search) filters.search = input.search;

    const [items, total, stats] = await Promise.all([
      this.inventoryRepository.findAll(filters, {
        page,
        limit,
        sortBy: input.sortBy || 'sku',
        sortOrder: input.sortOrder || 'asc',
      }),
      this.inventoryRepository.count(filters),
      this.inventoryRepository.getStats(filters),
    ]);

    return {
      items: items.map((item: any) => {
        const availableQuantity = item.quantity - (item.reservedQuantity || 0);
        return {
          inventoryItemId: item.inventoryItemId,
          productId: item.productId,
          variantId: item.variantId,
          warehouseId: item.warehouseId,
          sku: item.sku,
          quantity: item.quantity,
          reservedQuantity: item.reservedQuantity || 0,
          availableQuantity,
          isLowStock: availableQuantity > 0 && availableQuantity <= (item.reorderPoint || 0),
          isOutOfStock: availableQuantity <= 0,
        };
      }),
      total,
      page,
      limit,
      hasMore: page * limit < total,
      summary: {
        totalItems: stats.totalItems || total,
        lowStockCount: stats.lowStockCount || 0,
        outOfStockCount: stats.outOfStockCount || 0,
        totalValue: stats.totalValue,
      },
    };
  }
}
