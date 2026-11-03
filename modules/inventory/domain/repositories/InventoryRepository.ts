/**
 * Inventory Repository Port
 *
 * Domain interfaces for inventory stock locations, transactions, and
 * product availability. Row records mirror the generated schema shape.
 */

export interface InventoryStockLocation {
  inventoryLocationId: string;
  createdAt: Date;
  updatedAt: Date;
  distributionWarehouseId: string;
  distributionWarehouseBinId: string | null;
  storeId: string | null;
  productId: string;
  productVariantId: string | null;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minimumStockLevel: number | null;
  maximumStockLevel: number | null;
  lotNumber: string | null;
  serialNumber: string | null;
  expiryDate: Date | null;
  receivedDate: Date | null;
  status: 'available' | 'reserved' | 'damaged' | 'quarantine' | 'expired' | 'pending';
  lastCountDate: Date | null;
}

export interface InventoryTransaction {
  inventoryTransactionId: string;
  createdAt: Date;
  updatedAt: Date;
  typeId: string;
  distributionWarehouseId: string;
  distributionWarehouseBinId: string | null;
  productId: string;
  productVariantId: string | null;
  sku: string;
  quantity: number;
  previousQuantity: number | null;
  newQuantity: number | null;
  referenceType: string | null;
  referenceId: string | null;
  lotNumber: string | null;
  serialNumber: string | null;
  expiryDate: Date | null;
  notes: string | null;
  status: 'pending' | 'completed' | 'cancelled' | 'rejected';
  reason: string | null;
}

export interface InventoryTransactionType {
  inventoryTransactionTypeId: string;
  createdAt: Date;
  updatedAt: Date;
  code: string;
  name: string;
  description: string | null;
  affectsAvailable: boolean;
  direction: 'in' | 'out' | 'transfer' | 'adjust';
  requiresApproval: boolean;
  requiresDocumentation: boolean;
}

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

export interface CreateInventoryTransactionInput {
  typeId: string;
  distributionWarehouseId: string;
  distributionWarehouseBinId?: string;
  productId: string;
  productVariantId?: string;
  sku: string;
  quantity: number;
  previousQuantity?: number;
  newQuantity?: number;
  referenceType?: string;
  referenceId?: string;
  lotNumber?: string;
  serialNumber?: string;
  notes?: string;
  reason?: string;
}

export interface InventoryAvailabilityResult {
  available: boolean;
  totalAvailable: number;
  locations: InventoryStockLocation[];
}

export interface InventoryAvailabilityRepository {
  checkProductAvailability(productId: string, variantId?: string, requiredQuantity?: number): Promise<InventoryAvailabilityResult>;
  getTotalStockForProduct(productId: string): Promise<number>;
}

export interface InventoryStockRepository {
  findLocationsByProductId(productId: string): Promise<InventoryStockLocation[]>;
  createLocation(input: CreateInventoryLocationInput): Promise<InventoryStockLocation>;
  adjustQuantity(inventoryLocationId: string, quantityChange: number, reason?: string): Promise<InventoryStockLocation>;
  createTransaction(input: CreateInventoryTransactionInput): Promise<InventoryTransaction>;
  findTransactionTypeByCode(code: string): Promise<InventoryTransactionType | null>;
}
