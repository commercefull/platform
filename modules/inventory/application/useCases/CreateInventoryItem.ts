/**
 * CreateInventoryItem Use Case
 */

export interface CreateInventoryItemInput {
  productId: string;
  variantId?: string;
  warehouseId: string;
  sku: string;
  quantity: number;
  reservedQuantity?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  binLocation?: string;
  costPrice?: number;
  metadata?: Record<string, unknown>;
}

export interface CreateInventoryItemOutput {
  inventoryItemId: string;
  productId: string;
  variantId?: string;
  warehouseId: string;
  sku: string;
  quantity: number;
  availableQuantity: number;
  createdAt: string;
}

export class CreateInventoryItemUseCase {
  constructor(private readonly inventoryRepository: any) {}

  async execute(input: CreateInventoryItemInput): Promise<CreateInventoryItemOutput> {
    if (!input.productId || !input.warehouseId || !input.sku) {
      throw new Error('Product ID, warehouse ID, and SKU are required');
    }

    // Check for duplicate SKU in same warehouse
    const existing = await this.inventoryRepository.findBySkuAndWarehouse(input.sku, input.warehouseId);
    if (existing) {
      throw new Error(`Inventory item with SKU ${input.sku} already exists in this warehouse`);
    }

    const inventoryItemId = `inv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    const item = await this.inventoryRepository.create({
      inventoryItemId,
      productId: input.productId,
      variantId: input.variantId,
      warehouseId: input.warehouseId,
      sku: input.sku,
      quantity: input.quantity,
      reservedQuantity: input.reservedQuantity ?? 0,
      reorderPoint: input.reorderPoint ?? 0,
      reorderQuantity: input.reorderQuantity ?? 0,
      binLocation: input.binLocation,
      costPrice: input.costPrice,
      metadata: input.metadata,
    });

    return {
      inventoryItemId: item.inventoryItemId,
      productId: item.productId,
      variantId: item.variantId,
      warehouseId: item.warehouseId,
      sku: item.sku,
      quantity: item.quantity,
      availableQuantity: item.quantity - (item.reservedQuantity || 0),
      createdAt: item.createdAt.toISOString(),
    };
  }
}
