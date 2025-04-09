import { query, queryOne } from '../../../libs/db';

// Data models for distribution
export interface DistributionCenter {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  contactPhone: string;
  contactEmail: string;
  isActive: boolean;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  regions: string[];
  postalCodes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingMethod {
  id: string;
  name: string;
  code: string;
  carrier: string;
  estimatedDeliveryDays: number;
  isActive: boolean;
  basePrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FulfillmentPartner {
  id: string;
  name: string;
  code: string;
  apiKey?: string;
  apiEndpoint?: string;
  isActive: boolean;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DistributionRule {
  id: string;
  name: string;
  priority: number;
  distributionCenterId: string;
  shippingZoneId: string;
  shippingMethodId: string;
  fulfillmentPartnerId: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderFulfillment {
  id: string;
  orderId: string;
  distributionCenterId: string;
  ruleId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingMethodId: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class DistributionRepo {
  // Distribution Center methods
  async findAllDistributionCenters(): Promise<DistributionCenter[]> {
    const centers = await query<DistributionCenter[]>('SELECT * FROM "public"."distribution_center" ORDER BY "name" ASC');
    return centers || [];
  }

  async findDistributionCenterById(id: string): Promise<DistributionCenter | null> {
    return await queryOne<DistributionCenter>('SELECT * FROM "public"."distribution_center" WHERE "id" = $1', [id]);
  }

  async findDistributionCenterByCode(code: string): Promise<DistributionCenter | null> {
    return await queryOne<DistributionCenter>('SELECT * FROM "public"."distribution_center" WHERE "code" = $1', [code]);
  }

  async findActiveDistributionCenters(): Promise<DistributionCenter[]> {
    const centers = await query<DistributionCenter[]>('SELECT * FROM "public"."distribution_center" WHERE "isActive" = true ORDER BY "name" ASC');
    return centers || [];
  }

  async createDistributionCenter(center: Omit<DistributionCenter, 'id' | 'createdAt' | 'updatedAt'>): Promise<DistributionCenter> {
    const now = new Date();
    const newCenter = await queryOne<DistributionCenter>(
      `INSERT INTO "public"."distribution_center" 
      ("name", "code", "address", "city", "state", "postalCode", "country", "contactPhone", "contactEmail", "isActive", "capacity", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING *`,
      [center.name, center.code, center.address, center.city, center.state, center.postalCode, center.country, 
       center.contactPhone, center.contactEmail, center.isActive, center.capacity, now, now]
    );
    
    if (!newCenter) {
      throw new Error('Failed to create distribution center');
    }

    return newCenter;
  }

  async updateDistributionCenter(id: string, center: Partial<Omit<DistributionCenter, 'id' | 'createdAt' | 'updatedAt'>>): Promise<DistributionCenter> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic update query based on provided fields
    Object.entries(center).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      const existingCenter = await this.findDistributionCenterById(id);
      if (!existingCenter) {
        throw new Error(`Distribution center with ID ${id} not found`);
      }
      return existingCenter;
    }

    updates.push(`"updatedAt" = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const result = await queryOne<DistributionCenter>(
      `UPDATE "public"."distribution_center" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update distribution center with ID ${id}`);
    }
    
    return result;
  }

  async deleteDistributionCenter(id: string): Promise<boolean> {
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."distribution_center" 
        WHERE "id" = $1 
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [id]
    );
    
    return result ? parseInt(result.count) > 0 : false;
  }

  // Shipping Zone methods
  async findAllShippingZones(): Promise<ShippingZone[]> {
    const zones = await query<ShippingZone[]>('SELECT * FROM "public"."shipping_zone" ORDER BY "name" ASC');
    return zones || [];
  }

  async findShippingZoneById(id: string): Promise<ShippingZone | null> {
    return await queryOne<ShippingZone>('SELECT * FROM "public"."shipping_zone" WHERE "id" = $1', [id]);
  }

  async findActiveShippingZones(): Promise<ShippingZone[]> {
    const zones = await query<ShippingZone[]>('SELECT * FROM "public"."shipping_zone" WHERE "isActive" = true ORDER BY "name" ASC');
    return zones || [];
  }

  async createShippingZone(zone: Omit<ShippingZone, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShippingZone> {
    const now = new Date();
    const result = await queryOne<ShippingZone>(
      `INSERT INTO "public"."shipping_zone" 
      ("name", "countries", "regions", "postalCodes", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [zone.name, zone.countries, zone.regions, zone.postalCodes, zone.isActive, now, now]
    );

    return result!;
  }

  async updateShippingZone(id: string, zone: Partial<Omit<ShippingZone, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ShippingZone> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(zone).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      const existingZone = await this.findShippingZoneById(id);
      if (!existingZone) {
        throw new Error(`Shipping zone with ID ${id} not found`);
      }
      return existingZone;
    }

    updates.push(`"updatedAt" = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const result = await queryOne<ShippingZone>(
      `UPDATE "public"."shipping_zone" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update shipping zone with ID ${id}`);
    }
    
    return result;
  }

  async deleteShippingZone(id: string): Promise<boolean> {
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."shipping_zone" 
        WHERE "id" = $1 
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [id]
    );
    
    return result ? parseInt(result.count) > 0 : false;
  }

  // Shipping Method methods
  async findAllShippingMethods(): Promise<ShippingMethod[]> {
    const methods = await query<ShippingMethod[]>('SELECT * FROM "public"."shipping_method" ORDER BY "name" ASC');
    return methods || [];
  }

  async findShippingMethodById(id: string): Promise<ShippingMethod | null> {
    return await queryOne<ShippingMethod>('SELECT * FROM "public"."shipping_method" WHERE "id" = $1', [id]);
  }

  async findShippingMethodsByCarrier(carrier: string): Promise<ShippingMethod[]> {
    const methods = await query<ShippingMethod[]>('SELECT * FROM "public"."shipping_method" WHERE "carrier" = $1 ORDER BY "name" ASC', [carrier]);
    return methods || [];
  }

  async findActiveShippingMethods(): Promise<ShippingMethod[]> {
    const methods = await query<ShippingMethod[]>('SELECT * FROM "public"."shipping_method" WHERE "isActive" = true ORDER BY "name" ASC');
    return methods || [];
  }

  async createShippingMethod(method: Omit<ShippingMethod, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShippingMethod> {
    const now = new Date();
    const result = await queryOne<ShippingMethod>(
      `INSERT INTO "public"."shipping_method" 
      ("name", "code", "carrier", "estimatedDeliveryDays", "isActive", "basePrice", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [method.name, method.code, method.carrier, method.estimatedDeliveryDays, method.isActive, method.basePrice, now, now]
    );

    return result!;
  }

  async updateShippingMethod(id: string, method: Partial<Omit<ShippingMethod, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ShippingMethod> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(method).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      const existingMethod = await this.findShippingMethodById(id);
      if (!existingMethod) {
        throw new Error(`Shipping method with ID ${id} not found`);
      }
      return existingMethod;
    }

    updates.push(`"updatedAt" = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const result = await queryOne<ShippingMethod>(
      `UPDATE "public"."shipping_method" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update shipping method with ID ${id}`);
    }
    
    return result!;
  }

  async deleteShippingMethod(id: string): Promise<boolean> {
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."shipping_method" 
        WHERE "id" = $1 
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [id]
    );
    
    return result ? parseInt(result.count) > 0 : false;
  }

  // Fulfillment Partner methods
  async findAllFulfillmentPartners(): Promise<FulfillmentPartner[]> {
    const partners = await query<FulfillmentPartner[]>('SELECT * FROM "public"."fulfillment_partner" ORDER BY "name" ASC');
    return partners || [];
  }

  async findFulfillmentPartnerById(id: string): Promise<FulfillmentPartner | null> {
    return await queryOne<FulfillmentPartner>('SELECT * FROM "public"."fulfillment_partner" WHERE "id" = $1', [id]);
  }

  async findFulfillmentPartnerByCode(code: string): Promise<FulfillmentPartner | null> {
    return await queryOne<FulfillmentPartner>('SELECT * FROM "public"."fulfillment_partner" WHERE "code" = $1', [code]);
  }

  async findActiveFulfillmentPartners(): Promise<FulfillmentPartner[]> {
    const partners = await query<FulfillmentPartner[]>('SELECT * FROM "public"."fulfillment_partner" WHERE "isActive" = true ORDER BY "name" ASC');
    return partners || [];
  }

  async createFulfillmentPartner(partner: Omit<FulfillmentPartner, 'id' | 'createdAt' | 'updatedAt'>): Promise<FulfillmentPartner> {
    const now = new Date();
    const result = await queryOne<FulfillmentPartner>(
      `INSERT INTO "public"."fulfillment_partner" 
      ("name", "code", "apiKey", "apiEndpoint", "isActive", "contactName", "contactEmail", "contactPhone", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [partner.name, partner.code, partner.apiKey, partner.apiEndpoint, partner.isActive,
       partner.contactName, partner.contactEmail, partner.contactPhone, now, now]
    );

    return result!;
  }

  async updateFulfillmentPartner(id: string, partner: Partial<Omit<FulfillmentPartner, 'id' | 'createdAt' | 'updatedAt'>>): Promise<FulfillmentPartner> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(partner).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      const existingPartner = await this.findFulfillmentPartnerById(id);
      if (!existingPartner) {
        throw new Error(`Fulfillment partner with ID ${id} not found`);
      }
      return existingPartner;
    }

    updates.push(`"updatedAt" = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const result = await queryOne<FulfillmentPartner>(
      `UPDATE "public"."fulfillment_partner" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update fulfillment partner with ID ${id}`);
    }
    
    return result!;
  }

  async deleteFulfillmentPartner(id: string): Promise<boolean> {
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."fulfillment_partner" 
        WHERE "id" = $1 
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [id]
    );
    
    return result ? parseInt(result.count) > 0 : false;
  }

  // Distribution Rule methods
  async findAllDistributionRules(): Promise<DistributionRule[]> {
    const rules = await query<DistributionRule[]>('SELECT * FROM "public"."distribution_rule" ORDER BY "priority" ASC');
    return rules || [];
  }

  async findDistributionRuleById(id: string): Promise<DistributionRule | null> {
    return await queryOne<DistributionRule>('SELECT * FROM "public"."distribution_rule" WHERE "id" = $1', [id]);
  }

  async findActiveDistributionRules(): Promise<DistributionRule[]> {
    const rules = await query<DistributionRule[]>('SELECT * FROM "public"."distribution_rule" WHERE "isActive" = true ORDER BY "priority" ASC');
    return rules || [];
  }

  async findDistributionRulesByZone(zoneId: string): Promise<DistributionRule[]> {
    const rules = await query<DistributionRule[]>(
      'SELECT * FROM "public"."distribution_rule" WHERE "shippingZoneId" = $1 AND "isActive" = true ORDER BY "priority" ASC',
      [zoneId]
    );
    return rules || [];
  }

  async findDefaultDistributionRule(): Promise<DistributionRule | null> {
    const rule = await queryOne<DistributionRule>('SELECT * FROM "public"."distribution_rule" WHERE "isDefault" = true AND "isActive" = true LIMIT 1');
    return rule || null;
  }

  async createDistributionRule(rule: Omit<DistributionRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<DistributionRule> {
    const now = new Date();
    
    // If this is a default rule, clear any existing defaults
    if (rule.isDefault) {
      await query('UPDATE "public"."distribution_rule" SET "isDefault" = false WHERE "isDefault" = true');
    }
    
    const result = await queryOne<DistributionRule>(
      `INSERT INTO "public"."distribution_rule" 
      ("name", "priority", "distributionCenterId", "shippingZoneId", "shippingMethodId", "fulfillmentPartnerId", "isDefault", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [rule.name, rule.priority, rule.distributionCenterId, rule.shippingZoneId,
       rule.shippingMethodId, rule.fulfillmentPartnerId, rule.isDefault, rule.isActive, now, now]
    );
    
    if (!result) {
      throw new Error('Failed to create distribution rule');
    }
    
    return result;
  }

  async updateDistributionRule(id: string, rule: Partial<Omit<DistributionRule, 'id' | 'createdAt' | 'updatedAt'>>): Promise<DistributionRule> {
    // If this is being set as default, clear any existing defaults
    if (rule.isDefault) {
      await query('UPDATE "public"."distribution_rule" SET "isDefault" = false WHERE "isDefault" = true');
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(rule).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      const existingRule = await this.findDistributionRuleById(id);
      if (!existingRule) {
        throw new Error(`Distribution rule with ID ${id} not found`);
      }
      return existingRule;
    }

    updates.push(`"updatedAt" = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const result = await queryOne<DistributionRule>(
      `UPDATE "public"."distribution_rule" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update distribution rule with ID ${id}`);
    }
    
    return result;
  }

  async deleteDistributionRule(id: string): Promise<boolean> {
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."distribution_rule" 
        WHERE "id" = $1 
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [id]
    );
    
    return result ? parseInt(result.count) > 0 : false;
  }

  // Order Fulfillment methods
  async findAllOrderFulfillments(): Promise<OrderFulfillment[]> {
    const fulfillments = await query<OrderFulfillment[]>('SELECT * FROM "public"."order_fulfillment" ORDER BY "createdAt" DESC');
    return fulfillments || [];
  }

  async findOrderFulfillmentById(id: string): Promise<OrderFulfillment | null> {
    const fulfillment = await queryOne<OrderFulfillment>('SELECT * FROM "public"."order_fulfillment" WHERE "id" = $1', [id]);
    return fulfillment || null;
  }

  async findOrderFulfillmentsByOrderId(orderId: string): Promise<OrderFulfillment[]> {
    const fulfillments = await query<OrderFulfillment[]>(
      'SELECT * FROM "public"."order_fulfillment" WHERE "orderId" = $1 ORDER BY "createdAt" DESC',
      [orderId]
    );
    return fulfillments || [];
  }

  async findOrderFulfillmentsByStatus(status: OrderFulfillment['status']): Promise<OrderFulfillment[]> {
    const fulfillments = await query<OrderFulfillment[]>(
      'SELECT * FROM "public"."order_fulfillment" WHERE "status" = $1 ORDER BY "createdAt" DESC',
      [status]
    );
    return fulfillments || [];
  }

  async findOrderFulfillmentsByDistributionCenter(centerId: string): Promise<OrderFulfillment[]> {
    const fulfillments = await query<OrderFulfillment[]>(
      'SELECT * FROM "public"."order_fulfillment" WHERE "distributionCenterId" = $1 ORDER BY "createdAt" DESC',
      [centerId]
    );
    return fulfillments || [];
  }

  async createOrderFulfillment(fulfillment: Omit<OrderFulfillment, 'id' | 'createdAt' | 'updatedAt'>): Promise<OrderFulfillment> {
    const now = new Date();
    const result = await queryOne<OrderFulfillment>(
      `INSERT INTO "public"."order_fulfillment" 
      ("orderId", "distributionCenterId", "ruleId", "status", "shippingMethodId", "trackingNumber", "trackingUrl", "shippedAt", "deliveredAt", "notes", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [fulfillment.orderId, fulfillment.distributionCenterId, fulfillment.ruleId, fulfillment.status,
       fulfillment.shippingMethodId, fulfillment.trackingNumber, fulfillment.trackingUrl,
       fulfillment.shippedAt, fulfillment.deliveredAt, fulfillment.notes, now, now]
    );
    if (!result) {
      throw new Error('Failed to create order fulfillment');
    }
    
    return result;
  }

  async updateOrderFulfillment(id: string, fulfillment: Partial<Omit<OrderFulfillment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<OrderFulfillment> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(fulfillment).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      const existingFulfillment = await this.findOrderFulfillmentById(id);
      if (!existingFulfillment) {
        throw new Error(`Order fulfillment with ID ${id} not found`);
      }
      return existingFulfillment;
    }

    updates.push(`"updatedAt" = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const result = await queryOne<OrderFulfillment>(
      `UPDATE "public"."order_fulfillment" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update order fulfillment with ID ${id}`);
    }
    
    return result;
  }

  async updateOrderFulfillmentStatus(id: string, status: OrderFulfillment['status'], trackingInfo?: { trackingNumber?: string, trackingUrl?: string }): Promise<OrderFulfillment> {
    const updates = ['"status" = $1', '"updatedAt" = $2'];
    const values: any[] = [status, new Date()];
    let paramCount = 3;
    
    // Add tracking information if provided
    if (trackingInfo?.trackingNumber) {
      updates.push(`"trackingNumber" = $${paramCount++}`);
      values.push(trackingInfo.trackingNumber);
    }
    
    if (trackingInfo?.trackingUrl) {
      updates.push(`"trackingUrl" = $${paramCount++}`);
      values.push(trackingInfo.trackingUrl);
    }
    
    // Update shipping dates based on status
    if (status === 'shipped') {
      updates.push(`"shippedAt" = $${paramCount++}`);
      values.push(new Date());
    } else if (status === 'delivered') {
      updates.push(`"deliveredAt" = $${paramCount++}`);
      values.push(new Date());
    }
    
    values.push(id);
    
    const result = await queryOne<OrderFulfillment>(
      `UPDATE "public"."order_fulfillment" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update order fulfillment status for ID ${id}`);
    }
    
    return result;
  }

  async deleteOrderFulfillment(id: string): Promise<boolean> {
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."order_fulfillment" 
        WHERE "id" = $1 
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [id]
    );
    
    return result ? parseInt(result.count) > 0 : false;
  }
}
