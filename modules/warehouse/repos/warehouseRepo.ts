/**
 * Warehouse Repository
 * CRUD operations for distribution warehouses
 */

import { query, queryOne } from '../../../libs/db';
import { Table } from '../../../libs/db/types';
import { unixTimestamp } from '../../../libs/date';

// ============================================================================
// Table Constants
// ============================================================================

const TABLES = {
  WAREHOUSE: Table.DistributionWarehouse,
  ZONE: Table.DistributionWarehouseZone,
  BIN: Table.DistributionWarehouseBin,
};

// ============================================================================
// Types
// ============================================================================

export interface Warehouse {
  distributionWarehouseId: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  isFulfillmentCenter: boolean;
  isReturnCenter: boolean;
  isVirtual: boolean;
  merchantId?: string;
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
  operatingHours?: Record<string, any>;
  capabilities?: Record<string, any>;
  shippingMethods?: string[];
  createdBy?: string;
}

export type WarehouseCreateParams = Omit<Warehouse, 'distributionWarehouseId' | 'createdAt' | 'updatedAt'>;
export type WarehouseUpdateParams = Partial<Omit<Warehouse, 'distributionWarehouseId' | 'code' | 'createdAt' | 'updatedAt' | 'createdBy'>>;

export class WarehouseRepo {
  /**
   * Find warehouse by ID
   */
  async findById(warehouseId: string): Promise<Warehouse | null> {
    return await queryOne<Warehouse>(`SELECT * FROM "distributionWarehouse" WHERE "distributionWarehouseId" = $1`, [warehouseId]);
  }

  /**
   * Find warehouse by code
   */
  async findByCode(code: string): Promise<Warehouse | null> {
    return await queryOne<Warehouse>(`SELECT * FROM "distributionWarehouse" WHERE "code" = $1`, [code]);
  }

  /**
   * Find all warehouses
   */
  async findAll(activeOnly: boolean = false): Promise<Warehouse[]> {
    let sql = `SELECT * FROM "distributionWarehouse"`;

    if (activeOnly) {
      sql += ` WHERE "isActive" = true`;
    }

    sql += ` ORDER BY "name" ASC`;

    const results = await query<Warehouse[]>(sql);
    return results || [];
  }

  /**
   * Find default warehouse
   */
  async findDefault(): Promise<Warehouse | null> {
    return await queryOne<Warehouse>(`SELECT * FROM "distributionWarehouse" WHERE "isDefault" = true AND "isActive" = true LIMIT 1`);
  }

  /**
   * Find fulfillment centers
   */
  async findFulfillmentCenters(activeOnly: boolean = true): Promise<Warehouse[]> {
    let sql = `SELECT * FROM "distributionWarehouse" WHERE "isFulfillmentCenter" = true`;

    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }

    sql += ` ORDER BY "name" ASC`;

    const results = await query<Warehouse[]>(sql);
    return results || [];
  }

  /**
   * Find return centers
   */
  async findReturnCenters(activeOnly: boolean = true): Promise<Warehouse[]> {
    let sql = `SELECT * FROM "distributionWarehouse" WHERE "isReturnCenter" = true`;

    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }

    sql += ` ORDER BY "name" ASC`;

    const results = await query<Warehouse[]>(sql);
    return results || [];
  }

  /**
   * Find warehouses by merchant
   */
  async findByMerchantId(merchantId: string): Promise<Warehouse[]> {
    const results = await query<Warehouse[]>(`SELECT * FROM "distributionWarehouse" WHERE "merchantId" = $1 ORDER BY "name" ASC`, [
      merchantId,
    ]);
    return results || [];
  }

  /**
   * Find warehouses by country
   */
  async findByCountry(country: string, activeOnly: boolean = true): Promise<Warehouse[]> {
    let sql = `SELECT * FROM "distributionWarehouse" WHERE "country" = $1`;
    const params: any[] = [country];

    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }

    sql += ` ORDER BY "name" ASC`;

    const results = await query<Warehouse[]>(sql, params);
    return results || [];
  }

  /**
   * Find warehouses near location (by lat/lng)
   */
  async findNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 100,
    limit: number = 10,
  ): Promise<Array<Warehouse & { distance: number }>> {
    // Using Haversine formula for distance calculation
    const results = await query<Array<Warehouse & { distance: number }>>(
      `SELECT *,
        (6371 * acos(
          cos(radians($1)) * cos(radians("latitude")) *
          cos(radians("longitude") - radians($2)) +
          sin(radians($1)) * sin(radians("latitude"))
        )) AS distance
       FROM "distributionWarehouse"
       WHERE "latitude" IS NOT NULL 
         AND "longitude" IS NOT NULL
         AND "isActive" = true
       HAVING distance < $3
       ORDER BY distance ASC
       LIMIT $4`,
      [latitude, longitude, radiusKm, limit],
    );
    return results || [];
  }

  /**
   * Create warehouse
   */
  async create(params: WarehouseCreateParams): Promise<Warehouse> {
    const now = unixTimestamp();

    // Check if code already exists
    const existing = await this.findByCode(params.code);
    if (existing) {
      throw new Error(`Warehouse with code '${params.code}' already exists`);
    }

    // If setting as default, unset other defaults
    if (params.isDefault) {
      await this.unsetAllDefaults();
    }

    const result = await queryOne<Warehouse>(
      `INSERT INTO "distributionWarehouse" (
        "name", "code", "description", "isActive", "isDefault",
        "isFulfillmentCenter", "isReturnCenter", "isVirtual", "merchantId",
        "addressLine1", "addressLine2", "city", "state", "postalCode", "country",
        "latitude", "longitude", "email", "phone", "contactName",
        "timezone", "cutoffTime", "processingTime",
        "operatingHours", "capabilities", "shippingMethods", "createdBy",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
      )
      RETURNING *`,
      [
        params.name,
        params.code,
        params.description || null,
        params.isActive !== undefined ? params.isActive : true,
        params.isDefault || false,
        params.isFulfillmentCenter !== undefined ? params.isFulfillmentCenter : true,
        params.isReturnCenter !== undefined ? params.isReturnCenter : true,
        params.isVirtual || false,
        params.merchantId || null,
        params.addressLine1,
        params.addressLine2 || null,
        params.city,
        params.state,
        params.postalCode,
        params.country,
        params.latitude || null,
        params.longitude || null,
        params.email || null,
        params.phone || null,
        params.contactName || null,
        params.timezone || 'UTC',
        params.cutoffTime || '14:00:00',
        params.processingTime || 1,
        params.operatingHours ? JSON.stringify(params.operatingHours) : null,
        params.capabilities ? JSON.stringify(params.capabilities) : null,
        params.shippingMethods || null,
        params.createdBy || null,
        now,
        now,
      ],
    );

    if (!result) {
      throw new Error('Failed to create warehouse');
    }

    return result;
  }

  /**
   * Update warehouse
   */
  async update(warehouseId: string, params: WarehouseUpdateParams): Promise<Warehouse | null> {
    // If setting as default, unset other defaults
    if (params.isDefault === true) {
      await this.unsetAllDefaults(warehouseId);
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        const jsonFields = ['operatingHours', 'capabilities'];
        values.push(jsonFields.includes(key) && value ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(warehouseId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(warehouseId);

    const result = await queryOne<Warehouse>(
      `UPDATE "distributionWarehouse" 
       SET ${updateFields.join(', ')}
       WHERE "distributionWarehouseId" = $${paramIndex}
       RETURNING *`,
      values,
    );

    return result;
  }

  /**
   * Set warehouse as default
   */
  async setAsDefault(warehouseId: string): Promise<Warehouse | null> {
    return this.update(warehouseId, { isDefault: true });
  }

  /**
   * Unset all defaults (except specified warehouse)
   */
  private async unsetAllDefaults(exceptId?: string): Promise<void> {
    let sql = `UPDATE "distributionWarehouse" SET "isDefault" = false, "updatedAt" = $1 WHERE "isDefault" = true`;
    const params: any[] = [unixTimestamp()];

    if (exceptId) {
      sql += ` AND "distributionWarehouseId" != $2`;
      params.push(exceptId);
    }

    await query(sql, params);
  }

  /**
   * Activate warehouse
   */
  async activate(warehouseId: string): Promise<Warehouse | null> {
    return this.update(warehouseId, { isActive: true });
  }

  /**
   * Deactivate warehouse
   */
  async deactivate(warehouseId: string): Promise<Warehouse | null> {
    return this.update(warehouseId, { isActive: false });
  }

  /**
   * Add shipping method
   */
  async addShippingMethod(warehouseId: string, method: string): Promise<Warehouse | null> {
    const result = await queryOne<Warehouse>(
      `UPDATE "distributionWarehouse" 
       SET "shippingMethods" = array_append("shippingMethods", $1), "updatedAt" = $2
       WHERE "distributionWarehouseId" = $3
       RETURNING *`,
      [method, unixTimestamp(), warehouseId],
    );

    return result;
  }

  /**
   * Remove shipping method
   */
  async removeShippingMethod(warehouseId: string, method: string): Promise<Warehouse | null> {
    const result = await queryOne<Warehouse>(
      `UPDATE "distributionWarehouse" 
       SET "shippingMethods" = array_remove("shippingMethods", $1), "updatedAt" = $2
       WHERE "distributionWarehouseId" = $3
       RETURNING *`,
      [method, unixTimestamp(), warehouseId],
    );

    return result;
  }

  /**
   * Delete warehouse
   */
  async delete(warehouseId: string): Promise<boolean> {
    const result = await queryOne<{ warehouseId: string }>(
      `DELETE FROM "distributionWarehouse" WHERE "distributionWarehouseId" = $1 RETURNING "distributionWarehouseId"`,
      [warehouseId],
    );

    return !!result;
  }

  /**
   * Count warehouses
   */
  async count(activeOnly: boolean = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "distributionWarehouse"`;

    if (activeOnly) {
      sql += ` WHERE "isActive" = true`;
    }

    const result = await queryOne<{ count: string }>(sql);

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Search warehouses
   */
  async search(searchTerm: string, activeOnly: boolean = true): Promise<Warehouse[]> {
    let sql = `SELECT * FROM "distributionWarehouse" 
               WHERE ("name" ILIKE $1 OR "code" ILIKE $1 OR "city" ILIKE $1)`;
    const params: any[] = [`%${searchTerm}%`];

    if (activeOnly) {
      sql += ` AND "isActive" = true`;
    }

    sql += ` ORDER BY "name" ASC`;

    const results = await query<Warehouse[]>(sql, params);
    return results || [];
  }

  /**
   * Get warehouse statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    fulfillmentCenters: number;
    returnCenters: number;
    virtual: number;
  }> {
    const total = await this.count();
    const active = await this.count(true);

    const fcResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "distributionWarehouse" WHERE "isFulfillmentCenter" = true AND "isActive" = true`,
    );
    const fulfillmentCenters = fcResult ? parseInt(fcResult.count, 10) : 0;

    const rcResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "distributionWarehouse" WHERE "isReturnCenter" = true AND "isActive" = true`,
    );
    const returnCenters = rcResult ? parseInt(rcResult.count, 10) : 0;

    const vResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "distributionWarehouse" WHERE "isVirtual" = true`);
    const virtual = vResult ? parseInt(vResult.count, 10) : 0;

    return {
      total,
      active,
      fulfillmentCenters,
      returnCenters,
      virtual,
    };
  }
}

export default new WarehouseRepo();
