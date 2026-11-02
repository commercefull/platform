/**
 * Warehouse Repository Port
 *
 * Domain interface for warehouse data access (warehouses, bins, zones, receiving, pick/pack).
 */

/**
 * Normalized warehouse record as returned by the repository layer
 * (flat `distributionWarehouse` row shape).
 */
export interface WarehouseRecord {
  distributionWarehouseId: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  isFulfillmentCenter: boolean;
  isReturnCenter: boolean;
  isVirtual: boolean;
  organizationId?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  email?: string;
  phone?: string;
  contactName?: string;
  timezone: string;
  cutoffTime?: string;
  processingTime?: number;
  operatingHours?: Record<string, unknown>;
  capabilities?: Record<string, unknown>;
  shippingMethods?: string[];
  createdBy?: string;
}

export type WarehouseCreateParams = Omit<WarehouseRecord, 'distributionWarehouseId' | 'createdAt' | 'updatedAt'>;
export type WarehouseUpdateParams = Partial<
  Omit<WarehouseRecord, 'distributionWarehouseId' | 'code' | 'createdAt' | 'updatedAt' | 'createdBy'>
>;

export interface WarehouseStatistics {
  total: number;
  active: number;
  fulfillmentCenters: number;
  returnCenters: number;
  virtual: number;
}

export interface WarehouseBin {
  distributionWarehouseBinId: string;
  distributionWarehouseId: string;
  locationCode: string;
  isActive: boolean;
  binType: string;
  height?: number;
  width?: number;
  depth?: number;
  maxVolume?: number;
  maxWeight?: number;
  isPickable: boolean;
  isReceivable: boolean;
  isMixed: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WarehouseZone {
  distributionWarehouseZoneId: string;
  distributionWarehouseId: string;
  name: string;
  code: string;
  description?: string;
  zoneType: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WarehouseReceiving {
  warehouseReceivingId: string;
  distributionWarehouseId: string;
  receiptNumber: string;
  sourceType: string;
  sourceId?: string;
  status: string;
  expectedDate?: Date;
  receivedDate?: Date;
  carrierName?: string;
  trackingNumber?: string;
  packageCount?: number;
  notes?: string;
  hasDiscrepancies: boolean;
  items?: Record<string, unknown>[];
  completedAt?: Date;
  receivedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WarehousePickPack {
  warehousePickPackId: string;
  distributionWarehouseId: string;
  pickPackNumber: string;
  orderId?: string;
  fulfillmentId?: string;
  status: string;
  items?: Record<string, unknown>[];
  assignedTo?: string;
  pickingStartedAt?: Date;
  pickingCompletedAt?: Date;
  packingStartedAt?: Date;
  packingCompletedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBinInput {
  distributionWarehouseId: string;
  locationCode: string;
  binType: string;
  isActive?: boolean;
  height?: number;
  width?: number;
  depth?: number;
  maxVolume?: number;
  maxWeight?: number;
  isPickable?: boolean;
  isReceivable?: boolean;
  isMixed?: boolean;
  priority?: number;
}

export type UpdateBinInput = Partial<Omit<CreateBinInput, 'distributionWarehouseId' | 'locationCode'>>;

export interface CreateZoneInput {
  distributionWarehouseId: string;
  name: string;
  code: string;
  description?: string;
  zoneType?: string;
  isActive?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export type UpdateZoneInput = Partial<Omit<CreateZoneInput, 'distributionWarehouseId' | 'code'>>;

export interface CreateReceivingInput {
  distributionWarehouseId: string;
  receiptNumber: string;
  sourceType: string;
  sourceId?: string;
  expectedDate?: Date;
  carrierName?: string;
  trackingNumber?: string;
  packageCount?: number;
  notes?: string;
  items?: Record<string, unknown>[];
  receivedBy?: string;
}

export interface CreatePickPackInput {
  distributionWarehouseId: string;
  pickPackNumber: string;
  orderId?: string;
  fulfillmentId?: string;
  items?: Record<string, unknown>[];
  assignedTo?: string;
  notes?: string;
}


