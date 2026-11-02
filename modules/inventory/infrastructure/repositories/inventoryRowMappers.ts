/** Map inventoryLocation / distributionWarehouse rows to domain objects. */

import { Inventory, InventoryLocation } from '../../domain/entities/Inventory';
import { InventoryLocation as DbInventoryLocation, DistributionWarehouse as DbDistributionWarehouse } from '../../../../libs/db/types';

export interface InventoryFilters {
  productId?: string;
  variantId?: string | null;
  locationId?: string;
  sku?: string;
  isActive?: boolean;
  inStock?: boolean;
  lowStock?: boolean;
  needsReorder?: boolean;
}

export function mapToInventory(row: DbInventoryLocation): Inventory {
  return Inventory.reconstitute({
    inventoryId: row.inventoryLocationId,
    productId: row.productId,
    variantId: row.productVariantId ?? undefined,
    locationId: row.distributionWarehouseId,
    sku: row.sku,
    quantity: row.quantity,
    reservedQuantity: row.reservedQuantity,
    availableQuantity: row.availableQuantity,
    lowStockThreshold: row.minimumStockLevel ?? 5,
    reorderPoint: row.minimumStockLevel ?? 10,
    reorderQuantity: 50,
    lastRestockedAt: row.receivedDate ? new Date(row.receivedDate) : undefined,
    lastCountedAt: row.lastCountDate ? new Date(row.lastCountDate) : undefined,
    cost: undefined,
    supplierId: undefined,
    binLocation: row.distributionWarehouseBinId ?? undefined,
    expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
    batchNumber: row.lotNumber ?? undefined,
    isActive: row.status === 'available',
    metadata: undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  });
}

export function mapToLocation(row: DbDistributionWarehouse): InventoryLocation {
  const type: 'warehouse' | 'store' | 'supplier' = row.isFulfillmentCenter ? 'warehouse' : 'store';
  return {
    locationId: row.distributionWarehouseId,
    name: row.name,
    type,
    storeId: row.storeId ?? undefined,
    address: {
      street: row.addressLine1 || '',
      city: row.city || '',
      state: row.state || '',
      postalCode: row.postalCode || '',
      country: row.country || '',
    },
    isActive: Boolean(row.isActive),
    priority: row.isDefault ? 0 : 100,
    metadata: undefined,
  };
}

// ============================================================================
// Filter → WHERE clause
// ============================================================================

interface ClauseBuilder {
  conditions: string[];
  params: unknown[];
}

function addEquality(b: ClauseBuilder, column: string, value: string | undefined): void {
  if (!value) return;
  b.conditions.push(`${column} = $${b.params.length + 1}`);
  b.params.push(value);
}

function addVariantCondition(b: ClauseBuilder, filters?: InventoryFilters): void {
  if (filters?.variantId === undefined) return;
  if (filters.variantId === null) {
    b.conditions.push('"productVariantId" IS NULL');
  } else {
    addEquality(b, '"productVariantId"', filters.variantId);
  }
}

function addStockFlagConditions(b: ClauseBuilder, filters?: InventoryFilters): void {
  if (filters?.isActive !== undefined) {
    b.conditions.push(filters.isActive ? `"status" = 'available'` : `"status" != 'available'`);
  }
  if (filters?.inStock !== undefined) {
    b.conditions.push(filters.inStock ? '"availableQuantity" > 0' : '"availableQuantity" <= 0');
  }
  if (filters?.lowStock) {
    b.conditions.push('"availableQuantity" <= COALESCE("minimumStockLevel", 0)');
  }
  if (filters?.needsReorder) {
    b.conditions.push('quantity <= COALESCE("minimumStockLevel", 0)');
  }
}

export function buildInventoryWhereClause(filters?: InventoryFilters): { whereClause: string; params: unknown[] } {
  const b: ClauseBuilder = { conditions: [], params: [] };

  addEquality(b, '"productId"', filters?.productId);
  addVariantCondition(b, filters);
  addEquality(b, '"distributionWarehouseId"', filters?.locationId);
  addEquality(b, 'sku', filters?.sku);
  addStockFlagConditions(b, filters);

  return {
    whereClause: b.conditions.length > 0 ? `WHERE ${b.conditions.join(' AND ')}` : '',
    params: b.params,
  };
}
