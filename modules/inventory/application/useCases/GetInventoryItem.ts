/**
 * GetInventoryItem Use Case
 */

import { InventoryValidationError } from '../../domain/errors/InventoryErrors';

export interface GetInventoryItemInput {
  inventoryItemId?: string;
  sku?: string;
  productId?: string;
  variantId?: string;
  warehouseId?: string;
}

interface InventoryItemDetails {
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

interface InventoryRecord {
  inventoryId: string;
  productId: string;
  variantId?: string;
  locationId: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  binLocation?: string;
  cost?: number;
  updatedAt: Date;
  createdAt: Date;
}

function toItemDetails(item: InventoryRecord): InventoryItemDetails {
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
    reorderPoint: item.reorderPoint || 0,
    reorderQuantity: item.reorderQuantity || 0,
    binLocation: item.binLocation,
    costPrice: item.cost,
    isLowStock: availableQuantity > 0 && availableQuantity <= (item.reorderPoint || 0),
    isOutOfStock: availableQuantity <= 0,
    lastUpdated: item.updatedAt?.toISOString() || item.createdAt?.toISOString(),
  };
}

interface GetInventoryItemRepositoryPort {
  findById(inventoryId: string): Promise<InventoryRecord | null>;
  findBySkuAndWarehouse(sku: string, warehouseId: string): Promise<InventoryRecord | null>;
  findByProductAndWarehouse(productId: string, warehouseId: string, variantId?: string): Promise<InventoryRecord | null>;
  findBySku(sku: string, locationId?: string): Promise<InventoryRecord[]>;
}

export class GetInventoryItemUseCase {
  constructor(private readonly inventoryRepository: GetInventoryItemRepositoryPort) {}

  async execute(input: GetInventoryItemInput): Promise<GetInventoryItemOutput> {
    const item = await this.findItem(input);

    if (!item) {
      return { found: false };
    }

    return { found: true, item: toItemDetails(item) };
  }

  private async findItem(input: GetInventoryItemInput): Promise<InventoryRecord | null> {
    if (input.inventoryItemId) {
      return this.inventoryRepository.findById(input.inventoryItemId);
    }
    if (input.sku && input.warehouseId) {
      return this.inventoryRepository.findBySkuAndWarehouse(input.sku, input.warehouseId);
    }
    if (input.productId && input.warehouseId) {
      return this.inventoryRepository.findByProductAndWarehouse(input.productId, input.warehouseId, input.variantId);
    }
    throw new InventoryValidationError('Must provide inventoryItemId, sku+warehouseId, or productId+warehouseId');
  }

  async findBySku(sku: string): Promise<InventoryRecord[]> {
    return this.inventoryRepository.findBySku(sku);
  }
}
