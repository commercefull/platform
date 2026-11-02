/** Low-stock / out-of-stock / reorder alert queries over inventoryLocation. */

import { query } from '../../../../libs/db';
import { InventoryLocation as DbInventoryLocation } from '../../../../libs/db/types';

export async function getLowStockAlerts(): Promise<
  Array<{
    inventoryId: string;
    productId: string;
    variantId?: string;
    sku: string;
    locationId: string;
    quantity: number;
    threshold: number;
  }>
> {
  const rows = await query<DbInventoryLocation[]>(
    `SELECT "inventoryLocationId", "productId", "productVariantId", sku, "distributionWarehouseId", "availableQuantity", "minimumStockLevel"
    FROM "inventoryLocation"
    WHERE "status" = 'available' AND "availableQuantity" <= "minimumStockLevel" AND "availableQuantity" > 0
    ORDER BY ("minimumStockLevel" - "availableQuantity") DESC`,
  );

  return (rows || []).map((row: DbInventoryLocation) => ({
    inventoryId: row.inventoryLocationId,
    productId: row.productId,
    variantId: row.productVariantId ?? undefined,
    sku: row.sku,
    locationId: row.distributionWarehouseId,
    quantity: row.availableQuantity,
    threshold: row.minimumStockLevel ?? 0,
  }));
}

export async function getOutOfStockItems(): Promise<
  Array<{
    inventoryId: string;
    productId: string;
    variantId?: string;
    sku: string;
    locationId: string;
  }>
> {
  const rows = await query<DbInventoryLocation[]>(
    `SELECT "inventoryLocationId", "productId", "productVariantId", sku, "distributionWarehouseId"
    FROM "inventoryLocation"
    WHERE "status" = 'available' AND "availableQuantity" <= 0
    ORDER BY "updatedAt" DESC`,
  );

  return (rows || []).map((row: DbInventoryLocation) => ({
    inventoryId: row.inventoryLocationId,
    productId: row.productId,
    variantId: row.productVariantId ?? undefined,
    sku: row.sku,
    locationId: row.distributionWarehouseId,
  }));
}

export async function getItemsNeedingReorder(): Promise<
  Array<{
    inventoryId: string;
    productId: string;
    variantId?: string;
    sku: string;
    locationId: string;
    quantity: number;
    reorderPoint: number;
  }>
> {
  const rows = await query<DbInventoryLocation[]>(
    `SELECT "inventoryLocationId", "productId", "productVariantId", sku, "distributionWarehouseId", quantity, "minimumStockLevel"
    FROM "inventoryLocation"
    WHERE "status" = 'available' AND quantity <= COALESCE("minimumStockLevel", 0)
    ORDER BY (quantity - COALESCE("minimumStockLevel", 0)) ASC`,
  );

  return (rows || []).map((row: DbInventoryLocation) => ({
    inventoryId: row.inventoryLocationId,
    productId: row.productId,
    variantId: row.productVariantId ?? undefined,
    sku: row.sku,
    locationId: row.distributionWarehouseId,
    quantity: row.quantity,
    reorderPoint: row.minimumStockLevel ?? 0,
  }));
}
