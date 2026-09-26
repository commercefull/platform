import type { InventoryLocation, InventoryTransaction, InventoryTransactionType } from '../../../../libs/db/types';

export interface CreateInventoryLocationInput {
  distributionWarehouseId: string;
  distributionWarehouseBinId?: string;
  productId: string;
  productVariantId?: string;
  sku: string;
  quantity?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  lotNumber?: string;
  serialNumber?: string;
  expiryDate?: Date;
  status?: string;
}

export interface UpdateInventoryLocationInput {
  quantity?: number;
  reservedQuantity?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  status?: string;
}

export interface InventoryLocationFilter {
  distributionWarehouseId?: string;
  productId?: string;
  sku?: string;
  status?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
}

export interface InventoryLocationOpsPort {
  findLocationById(inventoryLocationId: string): Promise<InventoryLocation | null>;
  findLocationBySku(sku: string, distributionWarehouseId?: string): Promise<InventoryLocation | null>;
  findLocations(filter?: InventoryLocationFilter, limit?: number, offset?: number): Promise<InventoryLocation[]>;
  createLocation(input: CreateInventoryLocationInput): Promise<InventoryLocation>;
  updateLocation(inventoryLocationId: string, input: UpdateInventoryLocationInput): Promise<InventoryLocation>;
  deleteLocation(inventoryLocationId: string): Promise<boolean>;
  findLowStockLocations(): Promise<InventoryLocation[]>;
  findOutOfStockLocations(): Promise<InventoryLocation[]>;
  findTransactionsByProductId(productId: string, limit?: number): Promise<InventoryTransaction[]>;
  findAllTransactionTypes(): Promise<InventoryTransactionType[]>;
  checkProductAvailability(
    productId: string,
    variantId?: string,
    requiredQuantity?: number,
  ): Promise<{ available: boolean; totalAvailable: number; locations: InventoryLocation[] }>;
  findAvailableQuantityAtWarehouse(
    distributionWarehouseId: string,
    productId: string,
    variantId?: string,
  ): Promise<number>;
}

export class ManageInventoryLocationsUseCase {
  constructor(private readonly inventory: InventoryLocationOpsPort) {}

  async findLocationById(inventoryLocationId: string) {
    return this.inventory.findLocationById(inventoryLocationId);
  }
  async findLocationBySku(sku: string, distributionWarehouseId?: string) {
    return this.inventory.findLocationBySku(sku, distributionWarehouseId);
  }
  async findLocations(filter?: InventoryLocationFilter, limit?: number, offset?: number) {
    return this.inventory.findLocations(filter, limit, offset);
  }
  async createLocation(input: CreateInventoryLocationInput) {
    return this.inventory.createLocation(input);
  }
  async updateLocation(inventoryLocationId: string, input: UpdateInventoryLocationInput) {
    return this.inventory.updateLocation(inventoryLocationId, input);
  }
  async deleteLocation(inventoryLocationId: string) {
    return this.inventory.deleteLocation(inventoryLocationId);
  }
  async findLowStockLocations() {
    return this.inventory.findLowStockLocations();
  }
  async findOutOfStockLocations() {
    return this.inventory.findOutOfStockLocations();
  }
  async findTransactionsByProductId(productId: string, limit?: number) {
    return this.inventory.findTransactionsByProductId(productId, limit);
  }
  async findAllTransactionTypes() {
    return this.inventory.findAllTransactionTypes();
  }
  async checkProductAvailability(productId: string, variantId?: string, requiredQuantity?: number) {
    return this.inventory.checkProductAvailability(productId, variantId, requiredQuantity);
  }
  async findAvailableQuantityAtWarehouse(distributionWarehouseId: string, productId: string, variantId?: string) {
    return this.inventory.findAvailableQuantityAtWarehouse(distributionWarehouseId, productId, variantId);
  }
}
