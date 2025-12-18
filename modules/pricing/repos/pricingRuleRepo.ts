import { queryOne, query } from "../../../libs/db";
import { generateUUID } from "../../../libs/uuid";
import { Table } from "../../../libs/db/types";
import {
  PricingRule,
  PricingRuleCreateProps,
  PricingRuleStatus,
  PricingRuleUpdateProps
} from "../domain/pricingRule";

/**
 * Pricing Rule Repository
 * 
 * Uses camelCase for table and column names as per platform convention.
 * Table: pricingRule (from db/types.ts)
 */
export class PricingRuleRepo {
  private readonly tableName = Table.PricingRule;

  /**
   * Find a pricing rule by ID
   */
  async findById(id: string): Promise<PricingRule | null> {
    const sql = `
      SELECT * FROM "${this.tableName}" 
      WHERE "pricingRuleId" = $1
    `;
    
    const result = await queryOne<PricingRule>(sql, [id]);
    return result;
  }

  /**
   * Find all active pricing rules with optional filters
   */
  async findActiveRules(
    productId?: string,
    categoryId?: string,
    customerId?: string,
    customerGroupIds?: string[]
  ): Promise<PricingRule[]> {
    const now = new Date();
    const params: any[] = [now];
    
    let whereConditions = [
      `"isActive" = true`,
      `("startDate" IS NULL OR "startDate" <= $1)`,
      `("endDate" IS NULL OR "endDate" >= $1)`
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
    
    const sql = `
      SELECT * FROM "${this.tableName}"
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY "priority" DESC, "createdAt" ASC
    `;
    
    const results = await query<PricingRule[]>(sql, params);
    return results || [];
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
    
    // Add filter for active rules only
    if (filters.activeOnly) {
      const now = new Date();
      params.push(now);
      conditions.push(`
        "isActive" = true AND
        ("startDate" IS NULL OR "startDate" <= $${params.length}) AND
        ("endDate" IS NULL OR "endDate" >= $${params.length})
      `);
    }
    
    // Add filter for type
    if (filters.type) {
      if (Array.isArray(filters.type)) {
        const placeholders = filters.type.map((_, i) => `$${params.length + i + 1}`).join(', ');
        params.push(...filters.type);
        conditions.push(`"ruleType" IN (${placeholders})`);
      } else {
        params.push(filters.type);
        conditions.push(`"ruleType" = $${params.length}`);
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
    
    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    
    // Add pagination params
    params.push(limit, offset);
    
    const sql = `
      SELECT * FROM "${this.tableName}"
      ${whereClause}
      ORDER BY "${orderBy}" ${direction}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    
    const results = await query<PricingRule[]>(sql, params);
    return results || [];
  }

  /**
   * Count pricing rules with filters
   */
  async countRules(filters: {
    type?: string | string[];
    scope?: string | string[];
    productId?: string;
    categoryId?: string;
    customerId?: string;
    customerGroupId?: string;
    activeOnly?: boolean;
  } = {}): Promise<number> {
    const params: any[] = [];
    const conditions: string[] = [];
    
    // Add filter for active rules only
    if (filters.activeOnly) {
      const now = new Date();
      params.push(now);
      conditions.push(`
        "isActive" = true AND
        ("startDate" IS NULL OR "startDate" <= $${params.length}) AND
        ("endDate" IS NULL OR "endDate" >= $${params.length})
      `);
    }
    
    // Add filter for type
    if (filters.type) {
      if (Array.isArray(filters.type)) {
        const placeholders = filters.type.map((_, i) => `$${params.length + i + 1}`).join(', ');
        params.push(...filters.type);
        conditions.push(`"ruleType" IN (${placeholders})`);
      } else {
        params.push(filters.type);
        conditions.push(`"ruleType" = $${params.length}`);
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
    
    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    
    const sql = `
      SELECT COUNT(*) as count
      FROM "${this.tableName}"
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
    
    const sql = `
      INSERT INTO "${this.tableName}" (
        "name", "description", "ruleType", "scope", 
        "product_ids", "category_ids", "customer_ids", "customer_group_ids",
        "minimum_quantity", "maximum_quantity", "minimum_order_amount",
        "startDate", "endDate", "priority", "isActive",
        "metadata", "currencyCode", "regionCode",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      )
      RETURNING *
    `;
    
    const values = [
      data.name,
      data.description || null,
      data.ruleType || 'percentage',
      data.scope || 'global',
      data.productIds || null,
      data.categoryIds || null,
      data.customerIds || null,
      data.customerGroupIds || null,
      data.minimumQuantity || null,
      data.maximumQuantity || null,
      data.minimumOrderAmount || null,
      data.startDate || null,
      data.endDate || null,
      data.priority || 0,
      data.isActive !== false,
      (data as any).metadata ? JSON.stringify((data as any).metadata) : null,
      (data as any).currencyCode || null,
      (data as any).regionCode || null,
      now,
      now
    ];
    
    const result = await queryOne<PricingRule>(sql, values);
    
    if (!result) {
      throw new Error('Failed to create pricing rule');
    }
    
    return result;
  }

  /**
   * Update a pricing rule
   */
  async update(id: string, data: PricingRuleUpdateProps): Promise<PricingRule> {
    const now = new Date();
    
    const setStatements: string[] = ['"updatedAt" = $2'];
    const values: any[] = [id, now];
    let paramIndex = 3;
    
    const fieldMap: Record<string, string> = {
      name: 'name',
      description: 'description',
      ruleType: 'ruleType',
      scope: 'scope',
      productIds: 'product_ids',
      categoryIds: 'category_ids',
      customerIds: 'customer_ids',
      customerGroupIds: 'customer_group_ids',
      minimumQuantity: 'minimum_quantity',
      maximumQuantity: 'maximum_quantity',
      minimumOrderAmount: 'minimum_order_amount',
      startDate: 'startDate',
      endDate: 'endDate',
      priority: 'priority',
      isActive: 'isActive',
      metadata: 'metadata',
      currencyCode: 'currencyCode',
      regionCode: 'regionCode'
    };
    
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      
      const dbField = fieldMap[key] || key;
      setStatements.push(`"${dbField}" = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
    
    const sql = `
      UPDATE "${this.tableName}"
      SET ${setStatements.join(', ')}
      WHERE "pricingRuleId" = $1
      RETURNING *
    `;
    
    const result = await queryOne<PricingRule>(sql, values);
    
    if (!result) {
      throw new Error('Pricing rule not found or update failed');
    }
    
    return result;
  }

  /**
   * Delete a pricing rule
   */
  async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM "${this.tableName}" WHERE "pricingRuleId" = $1`;
    const result = await query(sql, [id]);
    return result !== null;
  }

  /**
   * Update status of a pricing rule
   */
  async updateStatus(id: string, isActive: boolean): Promise<PricingRule> {
    return this.update(id, { isActive });
  }
}

export default new PricingRuleRepo();
