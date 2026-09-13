/**
 * Admin Inventory Repository Interface
 * Handles legacy inventory queries for the admin hub using the inventoryLevel table
 * with product joins, inventoryLocation, and inventoryTransaction tables
 */

export interface InventoryLevelWithProduct {
  inventoryLevelId: string;
  productId: string;
  productVariantId?: string;
  locationId?: string;
  quantity: number;
  reserved: number;
  reorderPoint: number;
  reorderQuantity: number;
  productName?: string;
  sku?: string;
  locationName?: string;
}

export interface InventoryStats {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export interface AdminInventoryRepository {
  findInventoryLevels(params: {
    search?: string;
    locationId?: string;
    stockStatus?: string;
    limit: number;
    offset: number;
  }): Promise<InventoryLevelWithProduct[]>;
  countInventoryLevels(params: { search?: string; locationId?: string; stockStatus?: string }): Promise<number>;
  getInventoryStats(): Promise<InventoryStats>;
  findAllLocations(): Promise<Array<{ locationId: string; name: string }>>;
  findLowStockItems(limit: number): Promise<Record<string, string>[]>;
  findLowStockReport(): Promise<Record<string, string>[]>;
  findInventoryLevelById(id: string): Promise<Record<string, string> | null>;
  adjustStockLevel(
    inventoryLevelId: string,
    newQuantity: number,
    previousQuantity: number,
    productId: string,
    locationId: string | undefined,
    adjustmentType: string,
    adjustmentQty: number,
    reason: string,
    notes: string | null,
    userId: string,
  ): Promise<void>;
  findTransactionsByLevelId(levelId: string, limit: number, offset: number): Promise<Record<string, string>[]>;
  countTransactionsByLevelId(levelId: string): Promise<number>;
  findLocationsWithStats(): Promise<Record<string, string>[]>;
}
