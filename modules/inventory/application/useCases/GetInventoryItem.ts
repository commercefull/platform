/**
 * GetInventoryItem Use Case
 */

export interface GetInventoryItemInput {
  inventoryItemId?: string;
  sku?: string;
  productId?: string;
  variantId?: string;
  warehouseId?: string;
}

export interface InventoryItemDetails {
  inventoryItemId: string;
  productId: string;
  variantId?: string;
  warehouseId: string;
  warehouseName?: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  binLocation?: string;
  costPrice?: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  lastUpdated: string;
}

export interface GetInventoryItemOutput {
  found: boolean;
  item?: InventoryItemDetails;
}

export class GetInventoryItemUseCase {
  constructor(private readonly inventoryRepository: any) {}

  async execute(input: GetInventoryItemInput): Promise<GetInventoryItemOutput> {
    let item: any = null;

    if (input.inventoryItemId) {
      item = await this.inventoryRepository.findById(input.inventoryItemId);
    } else if (input.sku && input.warehouseId) {
      item = await this.inventoryRepository.findBySkuAndWarehouse(input.sku, input.warehouseId);
    } else if (input.productId && input.warehouseId) {
      item = await this.inventoryRepository.findByProductAndWarehouse(
        input.productId,
        input.warehouseId,
        input.variantId
      );
    } else {
      throw new Error('Must provide inventoryItemId, sku+warehouseId, or productId+warehouseId');
    }

    if (!item) {
      return { found: false };
    }

    const availableQuantity = item.quantity - (item.reservedQuantity || 0);

    return {
      found: true,
      item: {
        inventoryItemId: item.inventoryItemId,
        productId: item.productId,
        variantId: item.variantId,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouseName,
        sku: item.sku,
        quantity: item.quantity,
        reservedQuantity: item.reservedQuantity || 0,
        availableQuantity,
        reorderPoint: item.reorderPoint || 0,
        reorderQuantity: item.reorderQuantity || 0,
        binLocation: item.binLocation,
        costPrice: item.costPrice,
        isLowStock: availableQuantity > 0 && availableQuantity <= (item.reorderPoint || 0),
        isOutOfStock: availableQuantity <= 0,
        lastUpdated: item.updatedAt?.toISOString() || item.createdAt?.toISOString(),
      },
    };
  }
}
