import { queryOne, query } from "../../../libs/db";
import { generateUUID } from "../../../libs/uuid";
import { TierPrice } from "../domain/pricingRule";

interface FindAllOptions {
  page?: number;
  limit?: number;
  productId?: string;
  variantId?: string;
  customerGroupId?: string;
}

// Define DB column to TS property mapping
const dbToTsMapping: Record<string, string> = {
  id: 'id',
  product_id: 'productId',
  variant_id: 'variantId',
  quantity_min: 'quantityMin',
  quantity_max: 'quantityMax',
  price: 'price',
  customer_group_id: 'customerGroupId',
  start_date: 'startDate',
  end_date: 'endDate',
  created_at: 'createdAt',
  updated_at: 'updatedAt'
};

// Define TS property to DB column mapping
const tsToDbMapping = Object.entries(dbToTsMapping).reduce((acc, [dbCol, tsProp]) => {
  acc[tsProp] = dbCol;
  return acc;
}, {} as Record<string, string>);

export class TierPriceRepo {
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
   * Find tier prices for a product or variant
   */
  async findForProduct(
    productId: string,
    variantId?: string,
    customerGroupId?: string
  ): Promise<TierPrice[]> {
    const selectFields = this.generateSelectFields();
    const now = new Date();
    
    const conditions = [`"product_id" = $1`];
    const params: any[] = [productId];
    
    if (variantId) {
      params.push(variantId);
      conditions.push(`"variant_id" = $${params.length}`);
    }
    
    if (customerGroupId) {
      params.push(customerGroupId);
      conditions.push(`("customer_group_id" = $${params.length} OR "customer_group_id" IS NULL)`);
    } else {
      conditions.push(`"customer_group_id" IS NULL`);
    }
    
    // Only include active tiers (within date range if specified)
    params.push(now);
    conditions.push(`("start_date" IS NULL OR "start_date" <= $${params.length})`);
    
    params.push(now);
    conditions.push(`("end_date" IS NULL OR "end_date" >= $${params.length})`);
    
    const whereClause = conditions.join(' AND ');
    
    const sql = `
      SELECT ${selectFields}
      FROM "public"."tier_price"
      WHERE ${whereClause}
      ORDER BY "quantity_min" ASC
    `;
    
    return await query<TierPrice[]>(sql, params) || [];
  }
  
  /**
   * Find the applicable tier price for a specific quantity
   */
  async findApplicableTier(
    productId: string,
    quantity: number,
    variantId?: string,
    customerGroupId?: string
  ): Promise<TierPrice | null> {
    const selectFields = this.generateSelectFields();
    const now = new Date();
    
    const conditions = [
      `"product_id" = $1`,
      `"quantity_min" <= $2`,
      `("quantity_max" IS NULL OR "quantity_max" >= $2)`
    ];
    
    const params: any[] = [productId, quantity];
    
    if (variantId) {
      params.push(variantId);
      conditions.push(`"variant_id" = $${params.length}`);
    }
    
    if (customerGroupId) {
      params.push(customerGroupId);
      conditions.push(`("customer_group_id" = $${params.length} OR "customer_group_id" IS NULL)`);
    } else {
      conditions.push(`"customer_group_id" IS NULL`);
    }
    
    // Only include active tiers (within date range if specified)
    params.push(now);
    conditions.push(`("start_date" IS NULL OR "start_date" <= $${params.length})`);
    
    params.push(now);
    conditions.push(`("end_date" IS NULL OR "end_date" >= $${params.length})`);
    
    const whereClause = conditions.join(' AND ');
    
    const sql = `
      SELECT ${selectFields}
      FROM "public"."tier_price"
      WHERE ${whereClause}
      ORDER BY "quantity_min" DESC, "customer_group_id" DESC NULLS LAST
      LIMIT 1
    `;
    
    return await queryOne<TierPrice>(sql, params);
  }
  
  /**
   * Create a new tier price
   */
  async create(tierPrice: Omit<TierPrice, 'id' | 'createdAt' | 'updatedAt'>): Promise<TierPrice> {
    const now = new Date();
    const id = generateUUID();
    
    const dbFields: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [id, now, now];
    
    dbFields.push('id', 'created_at', 'updated_at');
    placeholders.push('$1', '$2', '$3');
    
    // Process each field from the input data
    let placeholderIndex = 4;
    
    for (const [key, value] of Object.entries(tierPrice)) {
      if (value === undefined) continue;
      
      const dbField = this.tsToDb(key);
      dbFields.push(dbField);
      placeholders.push(`$${placeholderIndex}`);
      values.push(value);
      
      placeholderIndex++;
    }
    
    const fieldList = dbFields.map(f => `"${f}"`).join(', ');
    const placeholderList = placeholders.join(', ');
    
    const selectFields = this.generateSelectFields();
    
    const sql = `
      INSERT INTO "public"."tier_price" (${fieldList})
      VALUES (${placeholderList})
      RETURNING ${selectFields}
    `;
    
    const result = await queryOne<TierPrice>(sql, values);
    
    if (!result) {
      throw new Error('Failed to create tier price');
    }
    
    return result;
  }
  
  /**
   * Update a tier price
   */
  async update(id: string, tierPrice: Partial<Omit<TierPrice, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TierPrice> {
    const now = new Date();
    
    const setStatements: string[] = [];
    const values: any[] = [id, now];
    
    setStatements.push(`"updated_at" = $2`);
    
    // Process each field from the input data
    let placeholderIndex = 3;
    
    for (const [key, value] of Object.entries(tierPrice)) {
      if (value === undefined) continue;
      
      const dbField = this.tsToDb(key);
      setStatements.push(`"${dbField}" = $${placeholderIndex}`);
      values.push(value);
      
      placeholderIndex++;
    }
    
    const setClause = setStatements.join(', ');
    const selectFields = this.generateSelectFields();
    
    const sql = `
      UPDATE "public"."tier_price"
      SET ${setClause}
      WHERE "id" = $1
      RETURNING ${selectFields}
    `;
    
    const result = await queryOne<TierPrice>(sql, values);
    
    if (!result) {
      throw new Error('Tier price not found or update failed');
    }
    
    return result;
  }
  
  /**
   * Delete a tier price
   */
  async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM "public"."tier_price" WHERE "id" = $1`;
    const result = await query(sql, [id]);
    
    return result !== null;
  }
  
  /**
   * Delete all tier prices for a product
   */
  async deleteForProduct(productId: string, variantId?: string): Promise<boolean> {
    let sql = `DELETE FROM "public"."tier_price" WHERE "product_id" = $1`;
    const params: any[] = [productId];
    
    if (variantId) {
      params.push(variantId);
      sql += ` AND "variant_id" = $2`;
    }
    
    const result = await query(sql, params);
    
    return result !== null;
  }

  /**
   * Find all tier prices with pagination and filtering
   */
  async findAll(options: FindAllOptions = {}) {
    const {
      page = 1,
      limit = 20,
      productId,
      variantId,
      customerGroupId
    } = options;

    const offset = (page - 1) * limit;
    const selectFields = this.generateSelectFields();
    
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (productId) {
      params.push(productId);
      conditions.push(`"product_id" = $${params.length}`);
    }
    
    if (variantId) {
      params.push(variantId);
      conditions.push(`"variant_id" = $${params.length}`);
    }
    
    if (customerGroupId) {
      params.push(customerGroupId);
      conditions.push(`"customer_group_id" = $${params.length}`);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // First, get total count
    const countSql = `SELECT COUNT(*) as total FROM "public"."tier_price" ${whereClause}`;
    const countResult = await queryOne<{total: string}>(countSql, params);
    const total = countResult ? parseInt(countResult.total, 10) : 0;
    
    // Then get paginated results
    params.push(limit, offset);
    const sql = `
      SELECT ${selectFields}
      FROM "public"."tier_price"
      ${whereClause}
      ORDER BY "quantity_min" ASC, "created_at" DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    
    const tierPrices = await query<TierPrice[]>(sql, params) || [];
    
    return {
      tierPrices,
      total
    };
  }

  /**
   * Find a tier price by ID
   */
  async findById(id: string): Promise<TierPrice | null> {
    const selectFields = this.generateSelectFields();
    const sql = `
      SELECT ${selectFields}
      FROM "public"."tier_price"
      WHERE "id" = $1
    `;
    
    return await queryOne<TierPrice>(sql, [id]);
  }
}

export default new TierPriceRepo();
