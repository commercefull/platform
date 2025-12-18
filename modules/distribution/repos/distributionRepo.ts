/**
 * Distribution Repository
 * Handles database operations for distribution warehouses, shipping zones, methods, and fulfillment
 */

import { query, queryOne } from '../../../libs/db';
import { 
  DistributionWarehouse,
  DistributionShippingZone,
  DistributionShippingMethod,
  DistributionFulfillmentPartner,
  DistributionRule,
  DistributionOrderFulfillment
} from '../../../libs/db/types';

// ============================================================================
// Types
// ============================================================================

export type DistributionWarehouseCreateParams = Omit<DistributionWarehouse, 'distributionWarehouseId' | 'createdAt' | 'updatedAt'>;
export type DistributionWarehouseUpdateParams = Partial<Omit<DistributionWarehouse, 'distributionWarehouseId' | 'createdAt' | 'updatedAt'>>;

export type DistributionShippingZoneCreateParams = Omit<DistributionShippingZone, 'distributionShippingZoneId' | 'createdAt' | 'updatedAt'>;
export type DistributionShippingZoneUpdateParams = Partial<Omit<DistributionShippingZone, 'distributionShippingZoneId' | 'createdAt' | 'updatedAt'>>;

export type DistributionShippingMethodCreateParams = Omit<DistributionShippingMethod, 'distributionShippingMethodId' | 'createdAt' | 'updatedAt'>;
export type DistributionShippingMethodUpdateParams = Partial<Omit<DistributionShippingMethod, 'distributionShippingMethodId' | 'createdAt' | 'updatedAt'>>;

export type DistributionFulfillmentPartnerCreateParams = Omit<DistributionFulfillmentPartner, 'distributionFulfillmentPartnerId' | 'createdAt' | 'updatedAt'>;
export type DistributionFulfillmentPartnerUpdateParams = Partial<Omit<DistributionFulfillmentPartner, 'distributionFulfillmentPartnerId' | 'createdAt' | 'updatedAt'>>;

export type DistributionRuleCreateParams = Omit<DistributionRule, 'distributionRuleId' | 'createdAt' | 'updatedAt'>;
export type DistributionRuleUpdateParams = Partial<Omit<DistributionRule, 'distributionRuleId' | 'createdAt' | 'updatedAt'>>;

export type DistributionOrderFulfillmentCreateParams = Omit<DistributionOrderFulfillment, 'distributionOrderFulfillmentId' | 'createdAt' | 'updatedAt'>;
export type DistributionOrderFulfillmentUpdateParams = Partial<Omit<DistributionOrderFulfillment, 'distributionOrderFulfillmentId' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Repository
// ============================================================================

export class DistributionRepo {
  // ============================================================================
  // Distribution Warehouse methods
  // ============================================================================
  
  async findAllWarehouses(): Promise<DistributionWarehouse[]> {
    const results = await query<DistributionWarehouse[]>(
      'SELECT * FROM "distributionWarehouse" ORDER BY "name" ASC'
    );
    return results || [];
  }

  async findWarehouseById(id: string): Promise<DistributionWarehouse | null> {
    return queryOne<DistributionWarehouse>(
      'SELECT * FROM "distributionWarehouse" WHERE "distributionWarehouseId" = $1',
      [id]
    );
  }

  async findWarehouseByCode(code: string): Promise<DistributionWarehouse | null> {
    return queryOne<DistributionWarehouse>(
      'SELECT * FROM "distributionWarehouse" WHERE "code" = $1',
      [code]
    );
  }

  async findActiveWarehouses(): Promise<DistributionWarehouse[]> {
    const results = await query<DistributionWarehouse[]>(
      'SELECT * FROM "distributionWarehouse" WHERE "isActive" = true ORDER BY "name" ASC'
    );
    return results || [];
  }

  async createWarehouse(params: DistributionWarehouseCreateParams): Promise<DistributionWarehouse> {
    const now = new Date();
    const result = await queryOne<DistributionWarehouse>(
      `INSERT INTO "distributionWarehouse" 
      ("name", "code", "description", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [params.name, params.code, params.description || null, params.isActive ?? true, now, now]
    );
    
    if (!result) {
      throw new Error('Failed to create distribution warehouse');
    }
    return result;
  }

  async updateWarehouse(id: string, params: DistributionWarehouseUpdateParams): Promise<DistributionWarehouse> {
    const now = new Date();
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      const existing = await this.findWarehouseById(id);
      if (!existing) throw new Error(`Warehouse with ID ${id} not found`);
      return existing;
    }

    updates.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);
    values.push(id);

    const result = await queryOne<DistributionWarehouse>(
      `UPDATE "distributionWarehouse" SET ${updates.join(', ')} WHERE "distributionWarehouseId" = $${paramIndex} RETURNING *`,
      values
    );
    
    if (!result) throw new Error(`Failed to update warehouse with ID ${id}`);
    return result;
  }

  async deleteWarehouse(id: string): Promise<boolean> {
    const result = await queryOne<{ distributionWarehouseId: string }>(
      'DELETE FROM "distributionWarehouse" WHERE "distributionWarehouseId" = $1 RETURNING "distributionWarehouseId"',
      [id]
    );
    return !!result;
  }

  // ============================================================================
  // Shipping Zone methods
  // ============================================================================

  async findAllShippingZones(): Promise<DistributionShippingZone[]> {
    const results = await query<DistributionShippingZone[]>(
      'SELECT * FROM "distributionShippingZone" ORDER BY "name" ASC'
    );
    return results || [];
  }

  async findShippingZoneById(id: string): Promise<DistributionShippingZone | null> {
    return queryOne<DistributionShippingZone>(
      'SELECT * FROM "distributionShippingZone" WHERE "distributionShippingZoneId" = $1',
      [id]
    );
  }

  async findActiveShippingZones(): Promise<DistributionShippingZone[]> {
    const results = await query<DistributionShippingZone[]>(
      'SELECT * FROM "distributionShippingZone" WHERE "isActive" = true ORDER BY "name" ASC'
    );
    return results || [];
  }

  async createShippingZone(params: DistributionShippingZoneCreateParams): Promise<DistributionShippingZone> {
    const now = new Date();
    const result = await queryOne<DistributionShippingZone>(
      `INSERT INTO "distributionShippingZone" 
      ("name", "description", "isActive", "locationType", "locations", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [params.name, params.description || null, params.isActive ?? true, params.locationType, params.locations || [], now, now]
    );
    
    if (!result) throw new Error('Failed to create shipping zone');
    return result;
  }

  async updateShippingZone(id: string, params: DistributionShippingZoneUpdateParams): Promise<DistributionShippingZone> {
    const now = new Date();
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      const existing = await this.findShippingZoneById(id);
      if (!existing) throw new Error(`Shipping zone with ID ${id} not found`);
      return existing;
    }

    updates.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);
    values.push(id);

    const result = await queryOne<DistributionShippingZone>(
      `UPDATE "distributionShippingZone" SET ${updates.join(', ')} WHERE "distributionShippingZoneId" = $${paramIndex} RETURNING *`,
      values
    );
    
    if (!result) throw new Error(`Failed to update shipping zone with ID ${id}`);
    return result;
  }

  async deleteShippingZone(id: string): Promise<boolean> {
    const result = await queryOne<{ distributionShippingZoneId: string }>(
      'DELETE FROM "distributionShippingZone" WHERE "distributionShippingZoneId" = $1 RETURNING "distributionShippingZoneId"',
      [id]
    );
    return !!result;
  }

  // ============================================================================
  // Shipping Method methods
  // ============================================================================

  async findAllShippingMethods(): Promise<DistributionShippingMethod[]> {
    const results = await query<DistributionShippingMethod[]>(
      'SELECT * FROM "distributionShippingMethod" ORDER BY "name" ASC'
    );
    return results || [];
  }

  async findShippingMethodById(id: string): Promise<DistributionShippingMethod | null> {
    return queryOne<DistributionShippingMethod>(
      'SELECT * FROM "distributionShippingMethod" WHERE "distributionShippingMethodId" = $1',
      [id]
    );
  }

  async findActiveShippingMethods(): Promise<DistributionShippingMethod[]> {
    const results = await query<DistributionShippingMethod[]>(
      'SELECT * FROM "distributionShippingMethod" WHERE "isActive" = true ORDER BY "name" ASC'
    );
    return results || [];
  }

  async createShippingMethod(params: DistributionShippingMethodCreateParams): Promise<DistributionShippingMethod> {
    const now = new Date();
    const result = await queryOne<DistributionShippingMethod>(
      `INSERT INTO "distributionShippingMethod" 
      ("name", "code", "description", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [params.name, params.code, params.description || null, params.isActive ?? true, now, now]
    );
    
    if (!result) throw new Error('Failed to create shipping method');
    return result;
  }

  async updateShippingMethod(id: string, params: DistributionShippingMethodUpdateParams): Promise<DistributionShippingMethod> {
    const now = new Date();
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      const existing = await this.findShippingMethodById(id);
      if (!existing) throw new Error(`Shipping method with ID ${id} not found`);
      return existing;
    }

    updates.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);
    values.push(id);

    const result = await queryOne<DistributionShippingMethod>(
      `UPDATE "distributionShippingMethod" SET ${updates.join(', ')} WHERE "distributionShippingMethodId" = $${paramIndex} RETURNING *`,
      values
    );
    
    if (!result) throw new Error(`Failed to update shipping method with ID ${id}`);
    return result;
  }

  async deleteShippingMethod(id: string): Promise<boolean> {
    const result = await queryOne<{ distributionShippingMethodId: string }>(
      'DELETE FROM "distributionShippingMethod" WHERE "distributionShippingMethodId" = $1 RETURNING "distributionShippingMethodId"',
      [id]
    );
    return !!result;
  }

  // ============================================================================
  // Fulfillment Partner methods
  // ============================================================================

  async findAllFulfillmentPartners(): Promise<DistributionFulfillmentPartner[]> {
    const results = await query<DistributionFulfillmentPartner[]>(
      'SELECT * FROM "distributionFulfillmentPartner" ORDER BY "name" ASC'
    );
    return results || [];
  }

  async findFulfillmentPartnerById(id: string): Promise<DistributionFulfillmentPartner | null> {
    return queryOne<DistributionFulfillmentPartner>(
      'SELECT * FROM "distributionFulfillmentPartner" WHERE "distributionFulfillmentPartnerId" = $1',
      [id]
    );
  }

  async findFulfillmentPartnerByCode(code: string): Promise<DistributionFulfillmentPartner | null> {
    return queryOne<DistributionFulfillmentPartner>(
      'SELECT * FROM "distributionFulfillmentPartner" WHERE "code" = $1',
      [code]
    );
  }

  async findActiveFulfillmentPartners(): Promise<DistributionFulfillmentPartner[]> {
    const results = await query<DistributionFulfillmentPartner[]>(
      'SELECT * FROM "distributionFulfillmentPartner" WHERE "isActive" = true ORDER BY "name" ASC'
    );
    return results || [];
  }

  async createFulfillmentPartner(params: DistributionFulfillmentPartnerCreateParams): Promise<DistributionFulfillmentPartner> {
    const now = new Date();
    const result = await queryOne<DistributionFulfillmentPartner>(
      `INSERT INTO "distributionFulfillmentPartner" 
      ("name", "code", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
      [params.name, params.code, params.isActive ?? true, now, now]
    );
    
    if (!result) throw new Error('Failed to create fulfillment partner');
    return result;
  }

  async updateFulfillmentPartner(id: string, params: DistributionFulfillmentPartnerUpdateParams): Promise<DistributionFulfillmentPartner> {
    const now = new Date();
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      const existing = await this.findFulfillmentPartnerById(id);
      if (!existing) throw new Error(`Fulfillment partner with ID ${id} not found`);
      return existing;
    }

    updates.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);
    values.push(id);

    const result = await queryOne<DistributionFulfillmentPartner>(
      `UPDATE "distributionFulfillmentPartner" SET ${updates.join(', ')} WHERE "distributionFulfillmentPartnerId" = $${paramIndex} RETURNING *`,
      values
    );
    
    if (!result) throw new Error(`Failed to update fulfillment partner with ID ${id}`);
    return result;
  }

  async deleteFulfillmentPartner(id: string): Promise<boolean> {
    const result = await queryOne<{ distributionFulfillmentPartnerId: string }>(
      'DELETE FROM "distributionFulfillmentPartner" WHERE "distributionFulfillmentPartnerId" = $1 RETURNING "distributionFulfillmentPartnerId"',
      [id]
    );
    return !!result;
  }

  // ============================================================================
  // Distribution Rule methods
  // ============================================================================

  async findAllDistributionRules(): Promise<DistributionRule[]> {
    const results = await query<DistributionRule[]>(
      'SELECT * FROM "distributionRule" ORDER BY "priority" ASC'
    );
    return results || [];
  }

  async findDistributionRuleById(id: string): Promise<DistributionRule | null> {
    return queryOne<DistributionRule>(
      'SELECT * FROM "distributionRule" WHERE "distributionRuleId" = $1',
      [id]
    );
  }

  async findActiveDistributionRules(): Promise<DistributionRule[]> {
    const results = await query<DistributionRule[]>(
      'SELECT * FROM "distributionRule" WHERE "isActive" = true ORDER BY "priority" ASC'
    );
    return results || [];
  }

  async findDistributionRulesByZone(zoneId: string): Promise<DistributionRule[]> {
    const results = await query<DistributionRule[]>(
      'SELECT * FROM "distributionRule" WHERE "distributionShippingZoneId" = $1 AND "isActive" = true ORDER BY "priority" ASC',
      [zoneId]
    );
    return results || [];
  }

  async findDefaultDistributionRule(): Promise<DistributionRule | null> {
    return queryOne<DistributionRule>(
      'SELECT * FROM "distributionRule" WHERE "isDefault" = true AND "isActive" = true LIMIT 1'
    );
  }

  async createDistributionRule(params: DistributionRuleCreateParams): Promise<DistributionRule> {
    const now = new Date();
    
    // If this is a default rule, clear any existing defaults
    if (params.isDefault) {
      await query('UPDATE "distributionRule" SET "isDefault" = false WHERE "isDefault" = true');
    }
    
    const result = await queryOne<DistributionRule>(
      `INSERT INTO "distributionRule" 
      ("name", "priority", "distributionWarehouseId", "distributionShippingZoneId", 
       "distributionShippingMethodId", "distributionFulfillmentPartnerId", "isDefault", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [
        params.name, params.priority, params.distributionWarehouseId || null,
        params.distributionShippingZoneId || null, params.distributionShippingMethodId || null,
        params.distributionFulfillmentPartnerId || null, params.isDefault ?? false, params.isActive ?? true, now, now
      ]
    );
    
    if (!result) throw new Error('Failed to create distribution rule');
    return result;
  }

  async updateDistributionRule(id: string, params: DistributionRuleUpdateParams): Promise<DistributionRule> {
    const now = new Date();
    
    // If this is being set as default, clear any existing defaults
    if (params.isDefault) {
      await query('UPDATE "distributionRule" SET "isDefault" = false WHERE "isDefault" = true');
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      const existing = await this.findDistributionRuleById(id);
      if (!existing) throw new Error(`Distribution rule with ID ${id} not found`);
      return existing;
    }

    updates.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);
    values.push(id);

    const result = await queryOne<DistributionRule>(
      `UPDATE "distributionRule" SET ${updates.join(', ')} WHERE "distributionRuleId" = $${paramIndex} RETURNING *`,
      values
    );
    
    if (!result) throw new Error(`Failed to update distribution rule with ID ${id}`);
    return result;
  }

  async deleteDistributionRule(id: string): Promise<boolean> {
    const result = await queryOne<{ distributionRuleId: string }>(
      'DELETE FROM "distributionRule" WHERE "distributionRuleId" = $1 RETURNING "distributionRuleId"',
      [id]
    );
    return !!result;
  }

  // ============================================================================
  // Order Fulfillment methods
  // ============================================================================

  async findAllOrderFulfillments(): Promise<DistributionOrderFulfillment[]> {
    const results = await query<DistributionOrderFulfillment[]>(
      'SELECT * FROM "distributionOrderFulfillment" ORDER BY "createdAt" DESC'
    );
    return results || [];
  }

  async findOrderFulfillmentById(id: string): Promise<DistributionOrderFulfillment | null> {
    return queryOne<DistributionOrderFulfillment>(
      'SELECT * FROM "distributionOrderFulfillment" WHERE "distributionOrderFulfillmentId" = $1',
      [id]
    );
  }

  async findOrderFulfillmentsByOrderId(orderId: string): Promise<DistributionOrderFulfillment[]> {
    const results = await query<DistributionOrderFulfillment[]>(
      'SELECT * FROM "distributionOrderFulfillment" WHERE "orderId" = $1 ORDER BY "createdAt" DESC',
      [orderId]
    );
    return results || [];
  }

  async findOrderFulfillmentsByStatus(status: string): Promise<DistributionOrderFulfillment[]> {
    const results = await query<DistributionOrderFulfillment[]>(
      'SELECT * FROM "distributionOrderFulfillment" WHERE "status" = $1 ORDER BY "createdAt" DESC',
      [status]
    );
    return results || [];
  }

  async findOrderFulfillmentsByWarehouse(warehouseId: string): Promise<DistributionOrderFulfillment[]> {
    const results = await query<DistributionOrderFulfillment[]>(
      'SELECT * FROM "distributionOrderFulfillment" WHERE "distributionWarehouseId" = $1 ORDER BY "createdAt" DESC',
      [warehouseId]
    );
    return results || [];
  }

  async createOrderFulfillment(params: DistributionOrderFulfillmentCreateParams): Promise<DistributionOrderFulfillment> {
    const now = new Date();
    const result = await queryOne<DistributionOrderFulfillment>(
      `INSERT INTO "distributionOrderFulfillment" 
      ("orderId", "status", "distributionWarehouseId", "distributionRuleId", 
       "distributionShippingMethodId", "trackingNumber", "trackingUrl", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        params.orderId, params.status, params.distributionWarehouseId || null,
        params.distributionRuleId || null, params.distributionShippingMethodId || null,
        params.trackingNumber || null, params.trackingUrl || null, now, now
      ]
    );
    
    if (!result) throw new Error('Failed to create order fulfillment');
    return result;
  }

  async updateOrderFulfillment(id: string, params: DistributionOrderFulfillmentUpdateParams): Promise<DistributionOrderFulfillment> {
    const now = new Date();
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      const existing = await this.findOrderFulfillmentById(id);
      if (!existing) throw new Error(`Order fulfillment with ID ${id} not found`);
      return existing;
    }

    updates.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);
    values.push(id);

    const result = await queryOne<DistributionOrderFulfillment>(
      `UPDATE "distributionOrderFulfillment" SET ${updates.join(', ')} WHERE "distributionOrderFulfillmentId" = $${paramIndex} RETURNING *`,
      values
    );
    
    if (!result) throw new Error(`Failed to update order fulfillment with ID ${id}`);
    return result;
  }

  async updateOrderFulfillmentStatus(
    id: string, 
    status: string, 
    trackingInfo?: { trackingNumber?: string; trackingUrl?: string }
  ): Promise<DistributionOrderFulfillment> {
    const now = new Date();
    const updates = ['"status" = $1', '"updatedAt" = $2'];
    const values: any[] = [status, now];
    let paramIndex = 3;
    
    if (trackingInfo?.trackingNumber) {
      updates.push(`"trackingNumber" = $${paramIndex++}`);
      values.push(trackingInfo.trackingNumber);
    }
    
    if (trackingInfo?.trackingUrl) {
      updates.push(`"trackingUrl" = $${paramIndex++}`);
      values.push(trackingInfo.trackingUrl);
    }
    
    // Update timestamp based on status
    if (status === 'shipped') {
      updates.push(`"shippedAt" = $${paramIndex++}`);
      values.push(now);
    } else if (status === 'delivered') {
      updates.push(`"deliveredAt" = $${paramIndex++}`);
      values.push(now);
    }
    
    values.push(id);
    
    const result = await queryOne<DistributionOrderFulfillment>(
      `UPDATE "distributionOrderFulfillment" SET ${updates.join(', ')} WHERE "distributionOrderFulfillmentId" = $${paramIndex} RETURNING *`,
      values
    );
    
    if (!result) throw new Error(`Failed to update status for order fulfillment with ID ${id}`);
    return result;
  }

  async deleteOrderFulfillment(id: string): Promise<boolean> {
    const result = await queryOne<{ distributionOrderFulfillmentId: string }>(
      'DELETE FROM "distributionOrderFulfillment" WHERE "distributionOrderFulfillmentId" = $1 RETURNING "distributionOrderFulfillmentId"',
      [id]
    );
    return !!result;
  }
}
