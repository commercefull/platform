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

interface ListInventoryRecord {
  inventoryId: string;
  productId: string;
  variantId?: string;
  locationId: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  reorderPoint: number;
}

interface ListInventoryResult {
  data: ListInventoryRecord[];
  total: number;
}

interface StatsResult {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue?: number;
}

interface ListInventoryItemsRepositoryPort {
  findAll(
    filters: Record<string, unknown>,
    pagination: { limit: number; offset: number; orderBy: string; orderDirection: 'asc' | 'desc' },
  ): Promise<ListInventoryResult>;
  getStats(filters: Record<string, unknown>): Promise<StatsResult>;
}

export class ListInventoryItemsUseCase {
  constructor(private readonly inventoryRepository: ListInventoryItemsRepositoryPort) {}

  async execute(input: ListInventoryItemsInput): Promise<ListInventoryItemsOutput> {
    const page = input.page || 1;
    const limit = input.limit || 50;
    const offset = (page - 1) * limit;

    const filters: Record<string, unknown> = {};
    if (input.warehouseId) filters.locationId = input.warehouseId;
    if (input.productId) filters.productId = input.productId;
    if (input.lowStockOnly) filters.lowStock = true;
    if (input.outOfStockOnly) filters.inStock = false;

    const sortByMap: Record<string, string> = {
      sku: 'sku',
      quantity: 'quantity',
      updatedAt: 'updatedAt',
    };

    const [result, stats] = await Promise.all([
      this.inventoryRepository.findAll(filters, {
        limit,
        offset,
        orderBy: sortByMap[input.sortBy || 'sku'] || 'sku',
        orderDirection: input.sortOrder || 'asc',
      }),
      this.inventoryRepository.getStats(filters),
    ]);

    const items = result.data || [];
    const total = result.total || 0;

    return {
      items: items.map((item: ListInventoryRecord) => {
        const availableQuantity = item.quantity - (item.reservedQuantity || 0);
        return {
          inventoryItemId: item.inventoryId,
          productId: item.productId,
          variantId: item.variantId,
          warehouseId: item.locationId,
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
      hasMore: offset + items.length < total,
      summary: {
        totalItems: stats.totalItems || total,
        lowStockCount: stats.lowStockCount || 0,
        outOfStockCount: stats.outOfStockCount || 0,
        totalValue: stats.totalValue,
      },
    };
  }
}
