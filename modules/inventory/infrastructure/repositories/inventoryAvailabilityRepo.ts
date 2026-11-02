import { query, queryOne } from '../../../../libs/db';
import type { InventoryLocation as DbInventoryLocation } from '../../../../libs/db/types';

export type InventoryLocation = DbInventoryLocation;

/** Product availability queries across stock locations. */
export class InventoryAvailabilityRepo {
  async checkProductAvailability(
    productId: string,
    variantId?: string,
    requiredQuantity: number = 1,
  ): Promise<{ available: boolean; totalAvailable: number; locations: InventoryLocation[] }> {
    let sql = `SELECT * FROM "inventoryLocation" WHERE "productId" = $1 AND "status" = 'available'`;
    const params: unknown[] = [productId];

    if (variantId) {
      sql += ` AND "productVariantId" = $2`;
      params.push(variantId);
    }

    const locations = await query<DbInventoryLocation[]>(sql, params);
    const locationList = locations || [];

    const totalAvailable = locationList.reduce((sum, loc) => sum + loc.availableQuantity, 0);

    return {
      available: totalAvailable >= requiredQuantity,
      totalAvailable,
      locations: locationList,
    };
  }

  async findAvailableQuantityAtWarehouse(distributionWarehouseId: string, productId: string, variantId?: string): Promise<number> {
    const row = await queryOne<{ availableQuantity: number }>(
      `SELECT "availableQuantity" FROM "inventoryLocation" WHERE "distributionWarehouseId" = $1 AND "productId" = $2${variantId ? ' AND "productVariantId" = $3' : ''} LIMIT 1`,
      variantId ? [distributionWarehouseId, productId, variantId] : [distributionWarehouseId, productId],
    );
    return row?.availableQuantity ?? 0;
  }

  /**
   * Stock locations for a product across the warehouses linked to a store,
   * ordered by most available first — used for reservation routing.
   */
  async findLocationsByStoreProduct(
    storeId: string,
    productId: string,
    variantId?: string,
  ): Promise<
    Array<{
      inventoryLocationId: string;
      distributionWarehouseId: string;
      quantity: number;
      reservedQuantity: number;
      availableQuantity: number;
    }>
  > {
    const rows = await query<
      Array<{
        inventoryLocationId: string;
        distributionWarehouseId: string;
        quantity: number;
        reservedQuantity: number;
        availableQuantity: number;
      }>
    >(
      `SELECT il."inventoryLocationId", il."distributionWarehouseId", il.quantity, il."reservedQuantity", il."availableQuantity"
       FROM "inventoryLocation" il
       JOIN "distributionWarehouse" dw ON dw."distributionWarehouseId" = il."distributionWarehouseId"
       WHERE dw."storeId" = $1 AND il."productId" = $2${variantId ? ' AND il."productVariantId" = $3' : ''} AND il.status = 'available'
       ORDER BY il."availableQuantity" DESC`,
      variantId ? [storeId, productId, variantId] : [storeId, productId],
    );
    return rows || [];
  }

  async getTotalStockForProduct(productId: string): Promise<number> {
    const sql = `
      SELECT COALESCE(SUM("availableQuantity"), 0) as total 
      FROM "inventoryLocation" 
      WHERE "productId" = $1 AND "status" = 'available'
    `;
    const result = await queryOne<{ total: string }>(sql, [productId]);
    return parseInt(result?.total || '0', 10);
  }
}
