import { queryOne, query } from "../../../libs/db";
import { generateUUID } from "../../../libs/uuid";
import {
  PricingRule,
  PricingRuleCreateProps,
  PricingRuleStatus,
  PricingRuleUpdateProps
} from "../domain/pricingRule";

// Define DB column to TS property mapping to follow the platform's conventions
const dbToTsMapping: Record<string, string> = {
  id: 'id',
  name: 'name',
  description: 'description',
  type: 'type',
  scope: 'scope',
  status: 'status',
  priority: 'priority',
  conditions: 'conditions',
  adjustments: 'adjustments',
  product_ids: 'productIds',
  variant_ids: 'variantIds',
  category_ids: 'categoryIds',
  customer_ids: 'customerIds',
  customer_group_ids: 'customerGroupIds',
  start_date: 'startDate',
  end_date: 'endDate',
  minimum_quantity: 'minimumQuantity',
  maximum_quantity: 'maximumQuantity',
  minimum_order_amount: 'minimumOrderAmount',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  merchant_id: 'merchantId',
  metadata: 'metadata'
};

// Define TS property to DB column mapping
const tsToDbMapping = Object.entries(dbToTsMapping).reduce((acc, [dbCol, tsProp]) => {
  acc[tsProp] = dbCol;
  return acc;
}, {} as Record<string, string>);

export class PricingRuleRepo {
  /**
   * Convert snake_case column name to camelCase property name
   */
  private dbToTs(columnName: string): string {
    return dbToTsMapping[columnName] || columnName;
  }

  /**
   * Convert camelCase property name to snake_case column name
   */
  private tsToDb(propertyName: string): string {
    return tsToDbMapping[propertyName] || propertyName;
  }

  /**
   * Generate field mapping for SELECT statements
   */
  private generateSelectFields(fields: string[] = Object.keys(dbToTsMapping)): string {
    return fields.map(field => {
      return `"${field}" AS "${this.dbToTs(field)}"`;
    }).join(', ');
  }

  /**
   * Transform database record to TypeScript object
   */
  private transformDbToTs(dbRecord: Record<string, any>): PricingRule {
    const result: Record<string, any> = {};

    // Handle JSON fields that need parsing
    for (const [key, value] of Object.entries(dbRecord)) {
      if (key === 'conditions' || key === 'adjustments' || key === 'metadata') {
        result[key] = typeof value === 'string' ? JSON.parse(value) : value;
      } else {
        result[key] = value;
      }
    }

    return result as PricingRule;
  }

  /**
   * Transform array of database records to TypeScript objects
   */
  private transformArrayDbToTs(dbRecords: Record<string, any>[]): PricingRule[] {
    return dbRecords.map(record => this.transformDbToTs(record));
  }

  /**
   * Find a pricing rule by ID
   */
  async findById(id: string): Promise<PricingRule | null> {
    const selectFields = this.generateSelectFields();
    const sql = `SELECT ${selectFields} FROM "public"."pricing_rule" WHERE "id" = $1`;
    
    const result = await queryOne<Record<string, any>>(sql, [id]);
    
    if (!result) {
      return null;
    }
    
    return this.transformDbToTs(result);
  }

  /**
   * Find all active pricing rules
   */
  async findActiveRules(
    productId?: string,
    categoryId?: string,
    customerId?: string,
    customerGroupIds?: string[]
  ): Promise<PricingRule[]> {
    const now = new Date();
    const selectFields = this.generateSelectFields();
    const params: any[] = [PricingRuleStatus.ACTIVE, now];
    
    let whereConditions = [
      `"status" = $1`,
      `("start_date" IS NULL OR "start_date" <= $2)`,
      `("end_date" IS NULL OR "end_date" >= $2)`
    ];
    
    // Add product-specific filter
    if (productId) {
      params.push(productId);
      whereConditions.push(`(
        "scope" = 'global' OR 
        ("scope" = 'product' AND "product_ids" @> ARRAY[$${params.length}]::uuid[])
      )`);
    }
    
    // Add category-specific filter
    if (categoryId) {
      params.push(categoryId);
      whereConditions.push(`(
        "scope" = 'global' OR 
        "scope" = 'product' OR
        ("scope" = 'category' AND "category_ids" @> ARRAY[$${params.length}]::uuid[])
      )`);
    }
    
    // Add customer-specific filter
    if (customerId) {
      params.push(customerId);
      whereConditions.push(`(
        "scope" = 'global' OR 
        "scope" = 'product' OR 
        "scope" = 'category' OR
        ("scope" = 'customer' AND "customer_ids" @> ARRAY[$${params.length}]::uuid[])
      )`);
    }
    
    // Add customer group filter
    if (customerGroupIds && customerGroupIds.length > 0) {
      const placeholders = customerGroupIds.map((_, index) => `$${params.length + index + 1}`).join(', ');
      params.push(...customerGroupIds);
      whereConditions.push(`(
        "scope" = 'global' OR 
        "scope" = 'product' OR 
        "scope" = 'category' OR
        "scope" = 'customer' OR
        ("scope" = 'customer_group' AND "customer_group_ids" && ARRAY[${placeholders}]::uuid[])
      )`);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const sql = `
      SELECT ${selectFields}
      FROM "public"."pricing_rule"
      WHERE ${whereClause}
      ORDER BY "priority" DESC, "created_at" ASC
    `;
    
    const results = await query<Record<string, any>[]>(sql, params) || [];
    
    return this.transformArrayDbToTs(results);
  }

  /**
   * Find all pricing rules with filtering and pagination
   */
  async findAllRules(
    filters: {
      status?: PricingRuleStatus | PricingRuleStatus[];
      type?: string | string[];
      scope?: string | string[];
      productId?: string;
      categoryId?: string;
      customerId?: string;
      customerGroupId?: string;
      merchantId?: string;
      activeOnly?: boolean;
    } = {},
    pagination: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      direction?: 'ASC' | 'DESC';
    } = {}
  ): Promise<PricingRule[]> {
    const {
      limit = 50,
      offset = 0,
      orderBy = 'priority',
      direction = 'DESC'
    } = pagination;
    
    const params: any[] = [];
    const conditions: string[] = [];
    
    // Add filters for status
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        const placeholders = filters.status.map((_, i) => `$${params.length + i + 1}`).join(', ');
        params.push(...filters.status);
        conditions.push(`"status" IN (${placeholders})`);
      } else {
        params.push(filters.status);
        conditions.push(`"status" = $${params.length}`);
      }
    }
    
    // Add filter for type
    if (filters.type) {
      if (Array.isArray(filters.type)) {
        const placeholders = filters.type.map((_, i) => `$${params.length + i + 1}`).join(', ');
        params.push(...filters.type);
        conditions.push(`"type" IN (${placeholders})`);
      } else {
        params.push(filters.type);
        conditions.push(`"type" = $${params.length}`);
      }
    }
    
    // Add filter for scope
    if (filters.scope) {
      if (Array.isArray(filters.scope)) {
        const placeholders = filters.scope.map((_, i) => `$${params.length + i + 1}`).join(', ');
        params.push(...filters.scope);
        conditions.push(`"scope" IN (${placeholders})`);
      } else {
        params.push(filters.scope);
        conditions.push(`"scope" = $${params.length}`);
      }
    }
    
    // Add filter for product
    if (filters.productId) {
      params.push(filters.productId);
      conditions.push(`"product_ids" @> ARRAY[$${params.length}]::uuid[]`);
    }
    
    // Add filter for category
    if (filters.categoryId) {
      params.push(filters.categoryId);
      conditions.push(`"category_ids" @> ARRAY[$${params.length}]::uuid[]`);
    }
    
    // Add filter for customer
    if (filters.customerId) {
      params.push(filters.customerId);
      conditions.push(`"customer_ids" @> ARRAY[$${params.length}]::uuid[]`);
    }
    
    // Add filter for customer group
    if (filters.customerGroupId) {
      params.push(filters.customerGroupId);
      conditions.push(`"customer_group_ids" @> ARRAY[$${params.length}]::uuid[]`);
    }
    
    // Add filter for merchant
    if (filters.merchantId) {
      params.push(filters.merchantId);
      conditions.push(`"merchant_id" = $${params.length}`);
    }
    
    // Add filter for active rules only
    if (filters.activeOnly) {
      const now = new Date();
      params.push(now);
      conditions.push(`
        "status" = 'active' AND
        ("start_date" IS NULL OR "start_date" <= $${params.length}) AND
        ("end_date" IS NULL OR "end_date" >= $${params.length})
      `);
    }
    
    // Prepare SQL parts
    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    
    const orderByField = this.tsToDb(orderBy);
    
    // Add pagination params
    params.push(limit, offset);
    
    const selectFields = this.generateSelectFields();
    
    const sql = `
      SELECT ${selectFields}
      FROM "public"."pricing_rule"
      ${whereClause}
      ORDER BY "${orderByField}" ${direction}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    
    const results = await query<Record<string, any>[]>(sql, params) || [];
    
    return this.transformArrayDbToTs(results);
  }

  /**
   * Count pricing rules with filters
   */
  async countRules(filters: {
    status?: PricingRuleStatus | PricingRuleStatus[];
    type?: string | string[];
    scope?: string | string[];
    productId?: string;
    categoryId?: string;
    customerId?: string;
    customerGroupId?: string;
    merchantId?: string;
    activeOnly?: boolean;
  } = {}): Promise<number> {
    const params: any[] = [];
    const conditions: string[] = [];
    
    // Add filters for status
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        const placeholders = filters.status.map((_, i) => `$${params.length + i + 1}`).join(', ');
        params.push(...filters.status);
        conditions.push(`"status" IN (${placeholders})`);
      } else {
        params.push(filters.status);
        conditions.push(`"status" = $${params.length}`);
      }
    }
    
    // Add filter for type
    if (filters.type) {
      if (Array.isArray(filters.type)) {
        const placeholders = filters.type.map((_, i) => `$${params.length + i + 1}`).join(', ');
        params.push(...filters.type);
        conditions.push(`"type" IN (${placeholders})`);
      } else {
        params.push(filters.type);
        conditions.push(`"type" = $${params.length}`);
      }
    }
    
    // Add filter for scope
    if (filters.scope) {
      if (Array.isArray(filters.scope)) {
        const placeholders = filters.scope.map((_, i) => `$${params.length + i + 1}`).join(', ');
        params.push(...filters.scope);
        conditions.push(`"scope" IN (${placeholders})`);
      } else {
        params.push(filters.scope);
        conditions.push(`"scope" = $${params.length}`);
      }
    }
    
    // Add filter for product
    if (filters.productId) {
      params.push(filters.productId);
      conditions.push(`"product_ids" @> ARRAY[$${params.length}]::uuid[]`);
    }
    
    // Add filter for category
    if (filters.categoryId) {
      params.push(filters.categoryId);
      conditions.push(`"category_ids" @> ARRAY[$${params.length}]::uuid[]`);
    }
    
    // Add filter for customer
    if (filters.customerId) {
      params.push(filters.customerId);
      conditions.push(`"customer_ids" @> ARRAY[$${params.length}]::uuid[]`);
    }
    
    // Add filter for customer group
    if (filters.customerGroupId) {
      params.push(filters.customerGroupId);
      conditions.push(`"customer_group_ids" @> ARRAY[$${params.length}]::uuid[]`);
    }
    
    // Add filter for merchant
    if (filters.merchantId) {
      params.push(filters.merchantId);
      conditions.push(`"merchant_id" = $${params.length}`);
    }
    
    // Add filter for active rules only
    if (filters.activeOnly) {
      const now = new Date();
      params.push(now);
      conditions.push(`
        "status" = 'active' AND
        ("start_date" IS NULL OR "start_date" <= $${params.length}) AND
        ("end_date" IS NULL OR "end_date" >= $${params.length})
      `);
    }
    
    // Prepare SQL parts
    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    
    const sql = `
      SELECT COUNT(*) as count
      FROM "public"."pricing_rule"
      ${whereClause}
    `;
    
    const result = await queryOne<{ count: string }>(sql, params);
    
    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Create a new pricing rule
   */
  async create(data: PricingRuleCreateProps): Promise<PricingRule> {
    const now = new Date();
    const id = generateUUID();
    
    const dbFields: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [id, now, now];
    
    dbFields.push('id', 'created_at', 'updated_at');
    placeholders.push('$1', '$2', '$3');
    
    // Process each field from the input data
    let placeholderIndex = 4;
    
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      
      const dbField = this.tsToDb(key);
      dbFields.push(dbField);
      placeholders.push(`$${placeholderIndex}`);
      
      // Handle JSON fields
      if (
        key === 'conditions' || 
        key === 'adjustments' || 
        key === 'metadata'
      ) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
      
      placeholderIndex++;
    }
    
    const fieldList = dbFields.map(f => `"${f}"`).join(', ');
    const placeholderList = placeholders.join(', ');
    
    const selectFields = this.generateSelectFields();
    
    const sql = `
      INSERT INTO "public"."pricing_rule" (${fieldList})
      VALUES (${placeholderList})
      RETURNING ${selectFields}
    `;
    
    const result = await queryOne<Record<string, any>>(sql, values);
    
    if (!result) {
      throw new Error('Failed to create pricing rule');
    }
    
    return this.transformDbToTs(result);
  }

  /**
   * Update a pricing rule
   */
  async update(id: string, data: PricingRuleUpdateProps): Promise<PricingRule> {
    const now = new Date();
    
    const setStatements: string[] = [];
    const values: any[] = [id, now]; // Start with ID and updated_at
    
    setStatements.push(`"updated_at" = $2`);
    
    // Process each field from the input data
    let placeholderIndex = 3;
    
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      
      const dbField = this.tsToDb(key);
      setStatements.push(`"${dbField}" = $${placeholderIndex}`);
      
      // Handle JSON fields
      if (
        key === 'conditions' || 
        key === 'adjustments' || 
        key === 'metadata'
      ) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
      
      placeholderIndex++;
    }
    
    const setClause = setStatements.join(', ');
    const selectFields = this.generateSelectFields();
    
    const sql = `
      UPDATE "public"."pricing_rule"
      SET ${setClause}
      WHERE "id" = $1
      RETURNING ${selectFields}
    `;
    
    const result = await queryOne<Record<string, any>>(sql, values);
    
    if (!result) {
      throw new Error('Pricing rule not found or update failed');
    }
    
    return this.transformDbToTs(result);
  }

  /**
   * Delete a pricing rule
   */
  async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM "public"."pricing_rule" WHERE "id" = $1`;
    const result = await query(sql, [id]);
    
    return result !== null;
  }

  /**
   * Update status of a pricing rule
   */
  async updateStatus(id: string, status: PricingRuleStatus): Promise<PricingRule> {
    return this.update(id, { status });
  }
}

export default new PricingRuleRepo();
