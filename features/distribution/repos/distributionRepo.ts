import { query, queryOne } from '../../../libs/db';

// Field mapping dictionaries
const distributionCenterFields = {
  id: 'id',
  name: 'name',
  code: 'code',
  address: 'address',
  city: 'city',
  state: 'state',
  postalCode: 'postal_code',
  country: 'country',
  contactPhone: 'contact_phone',
  contactEmail: 'contact_email',
  isActive: 'is_active',
  capacity: 'capacity',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const shippingZoneFields = {
  id: 'id',
  name: 'name',
  countries: 'countries',
  regions: 'regions',
  postalCodes: 'postal_codes',
  isActive: 'is_active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const shippingMethodFields = {
  id: 'id',
  name: 'name',
  code: 'code',
  carrier: 'carrier',
  estimatedDeliveryDays: 'estimated_delivery_days',
  isActive: 'is_active',
  basePrice: 'base_price',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const fulfillmentPartnerFields = {
  id: 'id',
  name: 'name',
  code: 'code',
  apiKey: 'api_key',
  apiEndpoint: 'api_endpoint',
  isActive: 'is_active',
  contactName: 'contact_name',
  contactEmail: 'contact_email',
  contactPhone: 'contact_phone',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const distributionRuleFields = {
  id: 'id',
  name: 'name',
  priority: 'priority',
  distributionCenterId: 'distribution_center_id',
  shippingZoneId: 'shipping_zone_id',
  shippingMethodId: 'shipping_method_id',
  fulfillmentPartnerId: 'fulfillment_partner_id',
  isDefault: 'is_default',
  isActive: 'is_active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const orderFulfillmentFields = {
  id: 'id',
  orderId: 'order_id',
  distributionCenterId: 'distribution_center_id',
  ruleId: 'rule_id',
  status: 'status',
  shippingMethodId: 'shipping_method_id',
  trackingNumber: 'tracking_number',
  trackingUrl: 'tracking_url',
  shippedAt: 'shipped_at',
  deliveredAt: 'delivered_at',
  notes: 'notes',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

// Transformation functions
function transformDbToTs<T>(dbRecord: any, fieldMap: Record<string, string>): T {
  if (!dbRecord) return null as any;
  
  const result: any = {};
  
  Object.entries(fieldMap).forEach(([tsKey, dbKey]) => {
    result[tsKey] = dbRecord[dbKey];
  });
  
  return result as T;
}

function transformArrayDbToTs<T>(dbRecords: any[], fieldMap: Record<string, string>): T[] {
  if (!dbRecords) return [];
  
  return dbRecords.map(record => transformDbToTs<T>(record, fieldMap));
}

// Helper for building dynamic WHERE clauses
function buildWhereClause(conditions: Record<string, any>, fieldMap: Record<string, string>): {
  whereClause: string;
  values: any[];
} {
  const clauses: string[] = [];
  const values: any[] = [];
  
  Object.entries(conditions).forEach(([tsKey, value], index) => {
    const dbKey = fieldMap[tsKey];
    
    if (dbKey && value !== undefined) {
      clauses.push(`"${dbKey}" = $${index + 1}`);
      values.push(value);
    }
  });
  
  return {
    whereClause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    values
  };
}

// Helper for building SET clause for updates
function buildSetClause(updates: Record<string, any>, fieldMap: Record<string, string>): {
  setClause: string;
  values: any[];
} {
  const clauses: string[] = [];
  const values: any[] = [];
  
  Object.entries(updates).forEach(([tsKey, value], index) => {
    const dbKey = fieldMap[tsKey];
    
    if (dbKey && value !== undefined) {
      clauses.push(`"${dbKey}" = $${index + 1}`);
      values.push(value);
    }
  });
  
  return {
    setClause: clauses.join(', '),
    values
  };
}

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
    const centers = await query<any[]>('SELECT * FROM "public"."distribution_center" ORDER BY "name" ASC');
    return transformArrayDbToTs<DistributionCenter>(centers || [], distributionCenterFields);
  }

  async findDistributionCenterById(id: string): Promise<DistributionCenter | null> {
    const center = await queryOne<any>('SELECT * FROM "public"."distribution_center" WHERE "id" = $1', [id]);
    return transformDbToTs<DistributionCenter>(center, distributionCenterFields);
  }

  async findDistributionCenterByCode(code: string): Promise<DistributionCenter | null> {
    const center = await queryOne<any>('SELECT * FROM "public"."distribution_center" WHERE "code" = $1', [code]);
    return transformDbToTs<DistributionCenter>(center, distributionCenterFields);
  }

  async findActiveDistributionCenters(): Promise<DistributionCenter[]> {
    const centers = await query<any[]>('SELECT * FROM "public"."distribution_center" WHERE "isActive" = true ORDER BY "name" ASC');
    return transformArrayDbToTs<DistributionCenter>(centers || [], distributionCenterFields);
  }

  async createDistributionCenter(center: Omit<DistributionCenter, 'id' | 'createdAt' | 'updatedAt'>): Promise<DistributionCenter> {
    const now = new Date();
    const result = await queryOne<any>(
      `INSERT INTO "public"."distribution_center" 
      ("name", "code", "address", "city", "state", "postalCode", "country", "contact_phone", "contact_email", "isActive", "capacity", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING *`,
      [center.name, center.code, center.address, center.city, center.state, center.postalCode, center.country, 
       center.contactPhone, center.contactEmail, center.isActive, center.capacity, now, now]
    );
    
    if (!result) {
      throw new Error('Failed to create distribution center');
    }

    return transformDbToTs<DistributionCenter>(result, distributionCenterFields);
  }

  async updateDistributionCenter(id: string, center: Partial<Omit<DistributionCenter, 'id' | 'createdAt' | 'updatedAt'>>): Promise<DistributionCenter> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic update query based on provided fields
    Object.entries(center).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = distributionCenterFields[key as keyof typeof distributionCenterFields];
        updates.push(`"${dbField}" = $${paramCount}`);
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

    const result = await queryOne<any>(
      `UPDATE "public"."distribution_center" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update distribution center with ID ${id}`);
    }
    
    return transformDbToTs<DistributionCenter>(result, distributionCenterFields);
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
    const zones = await query<any[]>('SELECT * FROM "public"."shipping_zone" ORDER BY "name" ASC');
    return transformArrayDbToTs<ShippingZone>(zones || [], shippingZoneFields);
  }

  async findShippingZoneById(id: string): Promise<ShippingZone | null> {
    const zone = await queryOne<any>('SELECT * FROM "public"."shipping_zone" WHERE "id" = $1', [id]);
    return transformDbToTs<ShippingZone>(zone, shippingZoneFields);
  }

  async findActiveShippingZones(): Promise<ShippingZone[]> {
    const zones = await query<any[]>('SELECT * FROM "public"."shipping_zone" WHERE "isActive" = true ORDER BY "name" ASC');
    return transformArrayDbToTs<ShippingZone>(zones || [], shippingZoneFields);
  }

  async createShippingZone(zone: Omit<ShippingZone, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShippingZone> {
    const now = new Date();
    const result = await queryOne<any>(
      `INSERT INTO "public"."shipping_zone" 
      ("name", "countries", "regions", "postal_codes", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [zone.name, zone.countries, zone.regions, zone.postalCodes, zone.isActive, now, now]
    );

    return transformDbToTs<ShippingZone>(result!, shippingZoneFields);
  }

  async updateShippingZone(id: string, zone: Partial<Omit<ShippingZone, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ShippingZone> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(zone).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = shippingZoneFields[key as keyof typeof shippingZoneFields];
        updates.push(`"${dbField}" = $${paramCount}`);
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

    const result = await queryOne<any>(
      `UPDATE "public"."shipping_zone" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update shipping zone with ID ${id}`);
    }
    
    return transformDbToTs<ShippingZone>(result, shippingZoneFields);
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
    const methods = await query<any[]>('SELECT * FROM "public"."shipping_method" ORDER BY "name" ASC');
    return transformArrayDbToTs<ShippingMethod>(methods || [], shippingMethodFields);
  }

  async findShippingMethodById(id: string): Promise<ShippingMethod | null> {
    const method = await queryOne<any>('SELECT * FROM "public"."shipping_method" WHERE "id" = $1', [id]);
    return transformDbToTs<ShippingMethod>(method, shippingMethodFields);
  }

  async findShippingMethodsByCarrier(carrier: string): Promise<ShippingMethod[]> {
    const methods = await query<any[]>('SELECT * FROM "public"."shipping_method" WHERE "carrier" = $1 ORDER BY "name" ASC', [carrier]);
    return transformArrayDbToTs<ShippingMethod>(methods || [], shippingMethodFields);
  }

  async findActiveShippingMethods(): Promise<ShippingMethod[]> {
    const methods = await query<any[]>('SELECT * FROM "public"."shipping_method" WHERE "isActive" = true ORDER BY "name" ASC');
    return transformArrayDbToTs<ShippingMethod>(methods || [], shippingMethodFields);
  }

  async createShippingMethod(method: Omit<ShippingMethod, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShippingMethod> {
    const now = new Date();
    const result = await queryOne<any>(
      `INSERT INTO "public"."shipping_method" 
      ("name", "code", "carrier", "estimated_delivery_days", "isActive", "base_price", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [method.name, method.code, method.carrier, method.estimatedDeliveryDays, method.isActive, method.basePrice, now, now]
    );

    return transformDbToTs<ShippingMethod>(result!, shippingMethodFields);
  }

  async updateShippingMethod(id: string, method: Partial<Omit<ShippingMethod, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ShippingMethod> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(method).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = shippingMethodFields[key as keyof typeof shippingMethodFields];
        updates.push(`"${dbField}" = $${paramCount}`);
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

    const result = await queryOne<any>(
      `UPDATE "public"."shipping_method" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update shipping method with ID ${id}`);
    }
    
    return transformDbToTs<ShippingMethod>(result, shippingMethodFields);
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
    const partners = await query<any[]>('SELECT * FROM "public"."fulfillment_partner" ORDER BY "name" ASC');
    return transformArrayDbToTs<FulfillmentPartner>(partners || [], fulfillmentPartnerFields);
  }

  async findFulfillmentPartnerById(id: string): Promise<FulfillmentPartner | null> {
    const partner = await queryOne<any>('SELECT * FROM "public"."fulfillment_partner" WHERE "id" = $1', [id]);
    return transformDbToTs<FulfillmentPartner>(partner, fulfillmentPartnerFields);
  }

  async findFulfillmentPartnerByCode(code: string): Promise<FulfillmentPartner | null> {
    const partner = await queryOne<any>('SELECT * FROM "public"."fulfillment_partner" WHERE "code" = $1', [code]);
    return transformDbToTs<FulfillmentPartner>(partner, fulfillmentPartnerFields);
  }

  async findActiveFulfillmentPartners(): Promise<FulfillmentPartner[]> {
    const partners = await query<any[]>('SELECT * FROM "public"."fulfillment_partner" WHERE "isActive" = true ORDER BY "name" ASC');
    return transformArrayDbToTs<FulfillmentPartner>(partners || [], fulfillmentPartnerFields);
  }

  async createFulfillmentPartner(partner: Omit<FulfillmentPartner, 'id' | 'createdAt' | 'updatedAt'>): Promise<FulfillmentPartner> {
    const now = new Date();
    const result = await queryOne<any>(
      `INSERT INTO "public"."fulfillment_partner" 
      ("name", "code", "api_key", "api_endpoint", "isActive", "contact_name", "contact_email", "contact_phone", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [partner.name, partner.code, partner.apiKey, partner.apiEndpoint, partner.isActive,
       partner.contactName, partner.contactEmail, partner.contactPhone, now, now]
    );

    return transformDbToTs<FulfillmentPartner>(result!, fulfillmentPartnerFields);
  }

  async updateFulfillmentPartner(id: string, partner: Partial<Omit<FulfillmentPartner, 'id' | 'createdAt' | 'updatedAt'>>): Promise<FulfillmentPartner> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(partner).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = fulfillmentPartnerFields[key as keyof typeof fulfillmentPartnerFields];
        updates.push(`"${dbField}" = $${paramCount}`);
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

    const result = await queryOne<any>(
      `UPDATE "public"."fulfillment_partner" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update fulfillment partner with ID ${id}`);
    }
    
    return transformDbToTs<FulfillmentPartner>(result, fulfillmentPartnerFields);
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
    const rules = await query<any[]>('SELECT * FROM "public"."distribution_rule" ORDER BY "priority" ASC');
    return transformArrayDbToTs<DistributionRule>(rules || [], distributionRuleFields);
  }

  async findDistributionRuleById(id: string): Promise<DistributionRule | null> {
    const rule = await queryOne<any>('SELECT * FROM "public"."distribution_rule" WHERE "id" = $1', [id]);
    return transformDbToTs<DistributionRule>(rule, distributionRuleFields);
  }

  async findActiveDistributionRules(): Promise<DistributionRule[]> {
    const rules = await query<any[]>('SELECT * FROM "public"."distribution_rule" WHERE "isActive" = true ORDER BY "priority" ASC');
    return transformArrayDbToTs<DistributionRule>(rules || [], distributionRuleFields);
  }

  async findDistributionRulesByZone(zoneId: string): Promise<DistributionRule[]> {
    const rules = await query<any[]>(
      'SELECT * FROM "public"."distribution_rule" WHERE "shipping_zone_id" = $1 AND "isActive" = true ORDER BY "priority" ASC',
      [zoneId]
    );
    return transformArrayDbToTs<DistributionRule>(rules || [], distributionRuleFields);
  }

  async findDefaultDistributionRule(): Promise<DistributionRule | null> {
    const rule = await queryOne<any>('SELECT * FROM "public"."distribution_rule" WHERE "isDefault" = true AND "isActive" = true LIMIT 1');
    return transformDbToTs<DistributionRule>(rule, distributionRuleFields);
  }

  async createDistributionRule(rule: Omit<DistributionRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<DistributionRule> {
    const now = new Date();
    
    // If this is a default rule, clear any existing defaults
    if (rule.isDefault) {
      await query('UPDATE "public"."distribution_rule" SET "isDefault" = false WHERE "isDefault" = true');
    }
    
    const result = await queryOne<any>(
      `INSERT INTO "public"."distribution_rule" 
      ("name", "priority", "distribution_center_id", "shipping_zone_id", "shippingMethodId", "fulfillment_partner_id", "isDefault", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [rule.name, rule.priority, rule.distributionCenterId, rule.shippingZoneId,
        rule.shippingMethodId, rule.fulfillmentPartnerId, rule.isDefault, rule.isActive, now, now]
    );

    return transformDbToTs<DistributionRule>(result!, distributionRuleFields);
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
        const dbField = distributionRuleFields[key as keyof typeof distributionRuleFields];
        updates.push(`"${dbField}" = $${paramCount}`);
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

    const result = await queryOne<any>(
      `UPDATE "public"."distribution_rule" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update distribution rule with ID ${id}`);
    }
    
    return transformDbToTs<DistributionRule>(result, distributionRuleFields);
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
    const fulfillments = await query<any[]>('SELECT * FROM "public"."order_fulfillment" ORDER BY "createdAt" DESC');
    return transformArrayDbToTs<OrderFulfillment>(fulfillments || [], orderFulfillmentFields);
  }

  async findOrderFulfillmentById(id: string): Promise<OrderFulfillment | null> {
    const fulfillment = await queryOne<any>('SELECT * FROM "public"."order_fulfillment" WHERE "id" = $1', [id]);
    return transformDbToTs<OrderFulfillment>(fulfillment, orderFulfillmentFields);
  }

  async findOrderFulfillmentsByOrderId(orderId: string): Promise<OrderFulfillment[]> {
    const fulfillments = await query<any[]>(
      'SELECT * FROM "public"."order_fulfillment" WHERE "orderId" = $1 ORDER BY "createdAt" DESC',
      [orderId]
    );
    return transformArrayDbToTs<OrderFulfillment>(fulfillments || [], orderFulfillmentFields);
  }

  async findOrderFulfillmentsByStatus(status: OrderFulfillment['status']): Promise<OrderFulfillment[]> {
    const fulfillments = await query<any[]>(
      'SELECT * FROM "public"."order_fulfillment" WHERE "status" = $1 ORDER BY "createdAt" DESC',
      [status]
    );
    return transformArrayDbToTs<OrderFulfillment>(fulfillments || [], orderFulfillmentFields);
  }

  async findOrderFulfillmentsByDistributionCenter(centerId: string): Promise<OrderFulfillment[]> {
    const fulfillments = await query<any[]>(
      'SELECT * FROM "public"."order_fulfillment" WHERE "distribution_center_id" = $1 ORDER BY "createdAt" DESC',
      [centerId]
    );
    return transformArrayDbToTs<OrderFulfillment>(fulfillments || [], orderFulfillmentFields);
  }

  async createOrderFulfillment(fulfillment: Omit<OrderFulfillment, 'id' | 'createdAt' | 'updatedAt'>): Promise<OrderFulfillment> {
    const now = new Date();
    const result = await queryOne<any>(
      `INSERT INTO "public"."order_fulfillment" 
      ("orderId", "distribution_center_id", "rule_id", "status", "shippingMethodId", "tracking_number", "tracking_url", "shipped_at", "delivered_at", "notes", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [fulfillment.orderId, fulfillment.distributionCenterId, fulfillment.ruleId, fulfillment.status,
        fulfillment.shippingMethodId, fulfillment.trackingNumber, fulfillment.trackingUrl, 
        fulfillment.shippedAt, fulfillment.deliveredAt, fulfillment.notes, now, now]
    );

    return transformDbToTs<OrderFulfillment>(result!, orderFulfillmentFields);
  }

  async updateOrderFulfillment(id: string, fulfillment: Partial<Omit<OrderFulfillment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<OrderFulfillment> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(fulfillment).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = orderFulfillmentFields[key as keyof typeof orderFulfillmentFields];
        updates.push(`"${dbField}" = $${paramCount}`);
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

    const result = await queryOne<any>(
      `UPDATE "public"."order_fulfillment" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update order fulfillment with ID ${id}`);
    }
    
    return transformDbToTs<OrderFulfillment>(result, orderFulfillmentFields);
  }

  async updateOrderFulfillmentStatus(id: string, status: OrderFulfillment['status'], trackingInfo?: { trackingNumber?: string, trackingUrl?: string }): Promise<OrderFulfillment> {
    const updates = ['"status" = $1', '"updatedAt" = $2'];
    const values: any[] = [status, new Date()];
    let paramCount = 3;
    
    // Add tracking info if provided
    if (trackingInfo?.trackingNumber) {
      updates.push(`"tracking_number" = $${paramCount++}`);
      values.push(trackingInfo.trackingNumber);
    }
    
    if (trackingInfo?.trackingUrl) {
      updates.push(`"tracking_url" = $${paramCount++}`);
      values.push(trackingInfo.trackingUrl);
    }
    
    // Update timestamp based on status
    if (status === 'shipped') {
      updates.push(`"shipped_at" = $${paramCount++}`);
      values.push(new Date());
    } else if (status === 'delivered') {
      updates.push(`"delivered_at" = $${paramCount++}`);
      values.push(new Date());
    }
    
    values.push(id);
    
    const result = await queryOne<any>(
      `UPDATE "public"."order_fulfillment" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update status for order fulfillment with ID ${id}`);
    }
    
    return transformDbToTs<OrderFulfillment>(result, orderFulfillmentFields);
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
