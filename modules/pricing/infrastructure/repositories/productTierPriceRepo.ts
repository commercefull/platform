import { queryOne, query } from '../../../../libs/db';
import { Table, ProductTierPrice as DbTierPrice } from '../../../../libs/db/types';
import { TierPrice } from '../../domain/pricingRule';
import { FailedToCreatePricingError, PriceNotFoundError } from '../../domain/errors/PricingErrors';

/** pg returns bigint as string — map cents columns to numbers. */
function mapRow(row: DbTierPrice): TierPrice {
  return {
    id: row.tierPriceId,
    tierPriceId: row.tierPriceId,
    productId: row.productId,
    variantId: row.productVariantId ?? undefined,
    productVariantId: row.productVariantId ?? undefined,
    quantityMin: row.quantityMin,
    priceCents: Number(row.priceCents),
    customerGroupId: row.customerGroupId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

interface FindAllOptions {
  page?: number;
  limit?: number;
  productId?: string;
  variantId?: string;
  customerGroupId?: string;
}

/**
 * Tier Price Repository
 *
 * Uses camelCase for table and column names as per platform convention.
 * Table: tierPrice (from db/types.ts)
 */
export class TierPriceRepo {
  private readonly tableName = Table.ProductTierPrice;

  /**
   * Find tier prices for a product or variant
   */
  async findForProduct(productId: string, variantId?: string, customerGroupId?: string): Promise<TierPrice[]> {
    const _now = new Date();

    const conditions = [`"productId" = $1`];
    const params: unknown[] = [productId];

    if (variantId) {
      params.push(variantId);
      conditions.push(`"productVariantId" = $${params.length}`);
    }

    if (customerGroupId) {
      params.push(customerGroupId);
      conditions.push(`("customerGroupId" = $${params.length} OR "customerGroupId" IS NULL)`);
    } else {
      conditions.push(`"customerGroupId" IS NULL`);
    }

    const sql = `
      SELECT * FROM "${this.tableName}"
      WHERE ${conditions.join(' AND ')}
      ORDER BY "quantityMin" ASC
    `;

    return ((await query<DbTierPrice[]>(sql, params)) || []).map(mapRow);
  }

  /**
   * Find the applicable tier price for a specific quantity
   */
  async findApplicableTier(productId: string, quantity: number, variantId?: string, customerGroupId?: string): Promise<TierPrice | null> {
    const conditions = [`"productId" = $1`, `"quantityMin" <= $2`];

    const params: unknown[] = [productId, quantity];

    if (variantId) {
      params.push(variantId);
      conditions.push(`"productVariantId" = $${params.length}`);
    }

    if (customerGroupId) {
      params.push(customerGroupId);
      conditions.push(`("customerGroupId" = $${params.length} OR "customerGroupId" IS NULL)`);
    } else {
      conditions.push(`"customerGroupId" IS NULL`);
    }

    const sql = `
      SELECT * FROM "${this.tableName}"
      WHERE ${conditions.join(' AND ')}
      ORDER BY "quantityMin" DESC, "customerGroupId" DESC NULLS LAST
      LIMIT 1
    `;

    const row = await queryOne<DbTierPrice>(sql, params);
    return row ? mapRow(row) : null;
  }

  /**
   * Create a new tier price
   */
  async create(tierPrice: Omit<TierPrice, 'id' | 'createdAt' | 'updatedAt'>): Promise<TierPrice> {
    const now = new Date();

    const sql = `
      INSERT INTO "${this.tableName}" (
        "productId", "productVariantId", "customerGroupId", "quantityMin", "priceCents",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      tierPrice.productId,
      tierPrice.productVariantId || null,
      tierPrice.customerGroupId || null,
      tierPrice.quantityMin,
      tierPrice.priceCents,
      now,
      now,
    ];

    const result = await queryOne<DbTierPrice>(sql, values);

    if (!result) {
      throw new FailedToCreatePricingError('Failed to create tier price');
    }

    return mapRow(result);
  }

  /**
   * Update a tier price
   */
  async update(id: string, tierPrice: Partial<Omit<TierPrice, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TierPrice> {
    const now = new Date();

    const setStatements: string[] = ['"updatedAt" = $2'];
    const values: unknown[] = [id, now];
    let paramIndex = 3;

    for (const [key, value] of Object.entries(tierPrice)) {
      if (value === undefined) continue;
      setStatements.push(`"${key}" = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    const sql = `
      UPDATE "${this.tableName}"
      SET ${setStatements.join(', ')}
      WHERE "tierPriceId" = $1
      RETURNING *
    `;

    const result = await queryOne<DbTierPrice>(sql, values);

    if (!result) {
      throw new PriceNotFoundError(id);
    }

    return mapRow(result);
  }

  /**
   * Delete a tier price
   */
  async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM "${this.tableName}" WHERE "tierPriceId" = $1`;
    const result = await query(sql, [id]);

    return result !== null;
  }

  /**
   * Delete all tier prices for a product
   */
  async deleteForProduct(productId: string, variantId?: string): Promise<boolean> {
    let sql = `DELETE FROM "${this.tableName}" WHERE "productId" = $1`;
    const params: unknown[] = [productId];

    if (variantId) {
      params.push(variantId);
      sql += ` AND "productVariantId" = $2`;
    }

    const result = await query(sql, params);
    return result !== null;
  }

  /**
   * Find all tier prices with pagination and filtering
   */
  async findAll(options: FindAllOptions = {}) {
    const { page = 1, limit = 20, productId, variantId, customerGroupId } = options;

    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (productId) {
      params.push(productId);
      conditions.push(`"productId" = $${params.length}`);
    }

    if (variantId) {
      params.push(variantId);
      conditions.push(`"productVariantId" = $${params.length}`);
    }

    if (customerGroupId) {
      params.push(customerGroupId);
      conditions.push(`"customerGroupId" = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // First, get total count
    const countSql = `SELECT COUNT(*) as total FROM "${this.tableName}" ${whereClause}`;
    const countResult = await queryOne<{ total: string }>(countSql, params);
    const total = countResult ? parseInt(countResult.total, 10) : 0;

    // Then get paginated results
    params.push(limit, offset);
    const sql = `
      SELECT * FROM "${this.tableName}"
      ${whereClause}
      ORDER BY "quantityMin" ASC, "createdAt" DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const tierPrices = ((await query<DbTierPrice[]>(sql, params)) || []).map(mapRow);

    return {
      tierPrices,
      total,
    };
  }

  /**
   * Find a tier price by ID
   */
  async findById(id: string): Promise<TierPrice | null> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "tierPriceId" = $1`;
    const row = await queryOne<DbTierPrice>(sql, [id]);
    return row ? mapRow(row) : null;
  }
}

export default new TierPriceRepo();
