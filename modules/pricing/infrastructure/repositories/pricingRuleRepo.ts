import { queryOne, query } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';
import { PricingRule, PricingRuleCreateProps, PricingRuleScope, PricingRuleStatus, PricingRuleUpdateProps } from '../../domain/pricingRule';
import { FailedToCreatePricingError, PricingRuleNotFoundError } from '../../domain/errors/PricingErrors';
import type { PricingRule as DbPricingRule } from '../../../../libs/db/types';

function resolveRuleStatus(row: DbPricingRule, now: Date): PricingRuleStatus {
  if (!row.isActive) return PricingRuleStatus.INACTIVE;
  if (row.startDate && row.startDate > now) return PricingRuleStatus.SCHEDULED;
  if (row.endDate && row.endDate < now) return PricingRuleStatus.EXPIRED;
  return PricingRuleStatus.ACTIVE;
}

function rowToPricingRule(row: DbPricingRule): PricingRule {
  const status = resolveRuleStatus(row, new Date());
  return {
    id: row.pricingRuleId,
    pricingRuleId: row.pricingRuleId,
    name: row.name,
    description: row.description ?? undefined,
    ruleType: row.ruleType,
    scope: row.scope as PricingRuleScope,
    status,
    isActive: row.isActive,
    priority: row.priority ?? 0,
    conditions: [],
    adjustments: [],
    ...optionalRuleFields(row),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

interface RuleFilterSet {
  type?: string | string[];
  scope?: string | string[];
  productId?: string;
  categoryId?: string;
  customerId?: string;
  customerGroupId?: string;
  activeOnly?: boolean;
}

function addInFilter(conditions: string[], params: unknown[], column: string, value: string | string[]): void {
  if (Array.isArray(value)) {
    const placeholders = value.map((_, i) => `$${params.length + i + 1}`).join(', ');
    params.push(...value);
    conditions.push(`"${column}" IN (${placeholders})`);
  } else {
    params.push(value);
    conditions.push(`"${column}" = $${params.length}`);
  }
}

function addArrayContainsFilter(conditions: string[], params: unknown[], column: string, value: string | undefined): void {
  if (value) {
    params.push(value);
    conditions.push(`"${column}" @> ARRAY[$${params.length}]::uuid[]`);
  }
}

function buildRuleConditions(filters: RuleFilterSet, includeMembership: boolean): { conditions: string[]; params: unknown[] } {
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (filters.activeOnly) {
    params.push(new Date());
    conditions.push(`
      "isActive" = true AND
      ("startDate" IS NULL OR "startDate" <= $${params.length}) AND
      ("endDate" IS NULL OR "endDate" >= $${params.length})
    `);
  }

  if (filters.type) addInFilter(conditions, params, 'ruleType', filters.type);
  if (filters.scope) addInFilter(conditions, params, 'scope', filters.scope);

  if (includeMembership) {
    addArrayContainsFilter(conditions, params, 'productIds', filters.productId);
    addArrayContainsFilter(conditions, params, 'categoryIds', filters.categoryId);
    addArrayContainsFilter(conditions, params, 'customerIds', filters.customerId);
    addArrayContainsFilter(conditions, params, 'customerGroupIds', filters.customerGroupId);
  }

  return { conditions, params };
}

/** Falsy → fallback (nullable column default). */
const nullable = (value: unknown, fallback: unknown = null): unknown => value || fallback;

function buildCreateValues(data: PricingRuleCreateProps, now: Date): unknown[] {
  const extra = data as PricingRuleCreateProps & {
    metadata?: Record<string, unknown>;
    currencyCode?: string;
    regionCode?: string;
  };
  return [
    data.name,
    nullable(data.description),
    data.ruleType || 'percentage',
    data.scope || 'global',
    nullable(data.productIds),
    nullable(data.categoryIds),
    nullable(data.customerIds),
    nullable(data.customerGroupIds),
    nullable(data.minimumQuantity),
    nullable(data.maximumQuantity),
    nullable(data.minimumOrderAmountCents),
    nullable(data.startDate),
    nullable(data.endDate),
    data.priority || 0,
    data.isActive !== false,
    extra.metadata ? JSON.stringify(extra.metadata) : null,
    nullable(extra.currencyCode),
    nullable(extra.regionCode),
    now,
    now,
  ];
}

function optionalRuleFields(row: DbPricingRule) {
  return {
    productIds: row.productIds ?? undefined,
    categoryIds: row.categoryIds ?? undefined,
    customerIds: row.customerIds ?? undefined,
    customerGroupIds: row.customerGroupIds ?? undefined,
    startDate: row.startDate ?? undefined,
    endDate: row.endDate ?? undefined,
    minimumQuantity: row.minimumQuantity ?? undefined,
    maximumQuantity: row.maximumQuantity ?? undefined,
    minimumOrderAmountCents: row.minimumOrderAmountCents ?? undefined,
    metadata: (row.metadata as PricingRule['metadata']) ?? undefined,
  };
}

/**
 * Pricing Rule Repository
 *
 * Uses camelCase for table and column names as per platform convention.
 * Table: pricingRule (from db/types.ts)
 */
class PricingRuleRepo {
  private readonly tableName = Table.PricingRule;

  /**
   * Find a pricing rule by ID
   */
  async findById(id: string): Promise<PricingRule | null> {
    const sql = `
      SELECT * FROM "${this.tableName}" 
      WHERE "pricingRuleId" = $1
    `;

    const result = await queryOne<DbPricingRule>(sql, [id]);
    return result ? rowToPricingRule(result) : null;
  }

  /**
   * Find all active pricing rules with optional filters
   */
  async findActiveRules(productId?: string, categoryId?: string, customerId?: string, customerGroupIds?: string[]): Promise<PricingRule[]> {
    const now = new Date();
    const params: unknown[] = [now];

    let whereConditions = [`"isActive" = true`, `("startDate" IS NULL OR "startDate" <= $1)`, `("endDate" IS NULL OR "endDate" >= $1)`];

    // Add product-specific filter
    if (productId) {
      params.push(productId);
      whereConditions.push(`(
        "scope" = 'global' OR 
        ("scope" = 'product' AND "productIds" @> ARRAY[$${params.length}]::uuid[])
      )`);
    }

    // Add category-specific filter
    if (categoryId) {
      params.push(categoryId);
      whereConditions.push(`(
        "scope" = 'global' OR 
        "scope" = 'product' OR
        ("scope" = 'category' AND "categoryIds" @> ARRAY[$${params.length}]::uuid[])
      )`);
    }

    // Add customer-specific filter
    if (customerId) {
      params.push(customerId);
      whereConditions.push(`(
        "scope" = 'global' OR 
        "scope" = 'product' OR 
        "scope" = 'category' OR
        ("scope" = 'customer' AND "customerIds" @> ARRAY[$${params.length}]::uuid[])
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
        ("scope" = 'customer_group' AND "customerGroupIds" && ARRAY[${placeholders}]::uuid[])
      )`);
    }

    const sql = `
      SELECT * FROM "${this.tableName}"
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY "priority" DESC, "createdAt" ASC
    `;

    const results = await query<DbPricingRule[]>(sql, params);
    return (results || []).map(rowToPricingRule);
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
      organizationId?: string;
      activeOnly?: boolean;
    } = {},
    pagination: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      direction?: 'ASC' | 'DESC';
    } = {},
  ): Promise<PricingRule[]> {
    const { limit = 50, offset = 0, orderBy = 'priority', direction = 'DESC' } = pagination;

    const { conditions, params } = buildRuleConditions(filters, true);

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Add pagination params
    params.push(limit, offset);

    const sql = `
      SELECT * FROM "${this.tableName}"
      ${whereClause}
      ORDER BY "${orderBy}" ${direction}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const results = await query<DbPricingRule[]>(sql, params);
    return (results || []).map(rowToPricingRule);
  }

  /**
   * Count pricing rules with filters
   */
  async countRules(
    filters: {
      type?: string | string[];
      scope?: string | string[];
      productId?: string;
      categoryId?: string;
      customerId?: string;
      customerGroupId?: string;
      activeOnly?: boolean;
    } = {},
  ): Promise<number> {
    const { conditions, params } = buildRuleConditions(filters, false);

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

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
        "productIds", "categoryIds", "customerIds", "customerGroupIds",
        "minimumQuantity", "maximumQuantity", "minimumOrderAmountCents",
        "startDate", "endDate", "priority", "isActive",
        "metadata", "currencyCode", "regionCode",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      )
      RETURNING *
    `;

    const values = buildCreateValues(data, now);

    const result = await queryOne<DbPricingRule>(sql, values);

    if (!result) {
      throw new FailedToCreatePricingError('Failed to create pricing rule');
    }

    return rowToPricingRule(result);
  }

  /**
   * Update a pricing rule
   */
  async update(id: string, data: PricingRuleUpdateProps): Promise<PricingRule> {
    const now = new Date();

    const setStatements: string[] = ['"updatedAt" = $2'];
    const values: unknown[] = [id, now];
    let paramIndex = 3;

    const fieldMap: Record<string, string> = {
      name: 'name',
      description: 'description',
      ruleType: 'ruleType',
      scope: 'scope',
      productIds: 'productIds',
      categoryIds: 'categoryIds',
      customerIds: 'customerIds',
      customerGroupIds: 'customerGroupIds',
      minimumQuantity: 'minimumQuantity',
      maximumQuantity: 'maximumQuantity',
      minimumOrderAmountCents: 'minimumOrderAmountCents',
      startDate: 'startDate',
      endDate: 'endDate',
      priority: 'priority',
      isActive: 'isActive',
      metadata: 'metadata',
      currencyCode: 'currencyCode',
      regionCode: 'regionCode',
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

    const result = await queryOne<DbPricingRule>(sql, values);

    if (!result) {
      throw new PricingRuleNotFoundError(id);
    }

    return rowToPricingRule(result);
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
