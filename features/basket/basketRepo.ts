import { query, queryOne } from '../../libs/db';
import { unixTimestamp } from '../../libs/date';

// Core data models following migration schema
export type BasketStatus = 'active' | 'merged' | 'converted' | 'abandoned' | 'completed';

export interface Basket {
  basketId: string;
  createdAt: string;
  updatedAt: string;
  customerId?: string;
  sessionId?: string;
  status: BasketStatus;
  currency: string;
  itemsCount: number;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  grandTotal: number;
  metadata?: Record<string, any>;
  expiresAt?: string;
  convertedToOrderId?: string;
  lastActivityAt: string;
}

export type BasketCreateParams = Pick<Basket, 'customerId' | 'sessionId' | 'currency'>;
export type BasketUpdateParams = Partial<Pick<Basket, 'itemsCount' | 'subTotal' | 'taxAmount' | 'discountAmount' | 'shippingAmount' | 'grandTotal' | 'metadata' | 'status'>>;

// Field mapping between TypeScript camelCase and database snake_case
const basketFields: Record<string, string> = {
  basketId: 'basket_id',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  customerId: 'customer_id',
  sessionId: 'session_id',
  status: 'status',
  currency: 'currency',
  itemsCount: 'items_count',
  subTotal: 'sub_total',
  taxAmount: 'tax_amount',
  discountAmount: 'discount_amount',
  shippingAmount: 'shipping_amount',
  grandTotal: 'grand_total',
  metadata: 'metadata',
  expiresAt: 'expires_at',
  convertedToOrderId: 'converted_to_order_id',
  lastActivityAt: 'last_activity_at'
};

// Helper functions for transformation
function transformDbToTs(dbRecord: Record<string, any>): Basket {
  if (!dbRecord) return null as any;
  
  return {
    basketId: dbRecord.basket_id,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
    customerId: dbRecord.customer_id || undefined,
    sessionId: dbRecord.session_id || undefined,
    status: dbRecord.status,
    currency: dbRecord.currency,
    itemsCount: Number(dbRecord.items_count),
    subTotal: Number(dbRecord.sub_total),
    taxAmount: Number(dbRecord.tax_amount),
    discountAmount: Number(dbRecord.discount_amount),
    shippingAmount: Number(dbRecord.shipping_amount),
    grandTotal: Number(dbRecord.grand_total),
    metadata: dbRecord.metadata || undefined,
    expiresAt: dbRecord.expires_at || undefined,
    convertedToOrderId: dbRecord.converted_to_order_id || undefined,
    lastActivityAt: dbRecord.last_activity_at
  };
}

function transformArrayDbToTs(dbRecords: Record<string, any>[]): Basket[] {
  if (!dbRecords || !Array.isArray(dbRecords)) return [];
  return dbRecords.map(record => transformDbToTs(record));
}

// Generate SELECT fields with aliases
function generateSelectFields(): string {
  return Object.entries(basketFields)
    .map(([tsKey, dbKey]) => `"${dbKey}" AS "${tsKey}"`)
    .join(', ');
}

export class BasketRepo {
  /**
   * Create a new basket
   */
  async create(params: BasketCreateParams): Promise<Basket> {
    const now = unixTimestamp();
    const expiresAt = now + (7 * 24 * 60 * 60); // 7 days from now
    
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "public"."basket" (
        "customerId", "session_id", "currency", "items_count", 
        "sub_total", "taxAmount", "discountAmount", "shippingAmount", "grand_total",
        "expiresAt", "last_activity_at", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING ${generateSelectFields()}`,
      [
        params.customerId || null,
        params.sessionId || null,
        params.currency || 'USD',
        0, // items_count
        0, // sub_total
        0, // tax_amount
        0, // discount_amount
        0, // shipping_amount
        0, // grand_total
        expiresAt,
        now, // last_activity_at
        now, // created_at
        now  // updated_at
      ]
    );

    if (!result) {
      throw new Error('Failed to create basket');
    }

    return transformDbToTs(result);
  }

  /**
   * Find basket by ID
   */
  async findById(basketId: string): Promise<Basket | null> {
    const result = await queryOne<Record<string, any>>(
      `SELECT ${generateSelectFields()} 
       FROM "public"."basket" 
       WHERE "basketId" = $1`,
      [basketId]
    );

    return result ? transformDbToTs(result) : null;
  }

  /**
   * Find active basket by customer ID
   */
  async findByCustomerId(customerId: string): Promise<Basket | null> {
    const result = await queryOne<Record<string, any>>(
      `SELECT ${generateSelectFields()} 
       FROM "public"."basket" 
       WHERE "customerId" = $1 AND "status" = 'active'
       ORDER BY "createdAt" DESC
       LIMIT 1`,
      [customerId]
    );

    return result ? transformDbToTs(result) : null;
  }

  /**
   * Find active basket by session ID
   */
  async findBySessionId(sessionId: string): Promise<Basket | null> {
    const result = await queryOne<Record<string, any>>(
      `SELECT ${generateSelectFields()} 
       FROM "public"."basket" 
       WHERE "session_id" = $1 AND "status" = 'active'
       ORDER BY "createdAt" DESC
       LIMIT 1`,
      [sessionId]
    );

    return result ? transformDbToTs(result) : null;
  }

  /**
   * Update basket
   */
  async update(basketId: string, params: BasketUpdateParams): Promise<Basket | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic UPDATE statement
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && basketFields[key]) {
        const dbField = basketFields[key];
        updateFields.push(`"${dbField}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    // Always update updated_at and last_activity_at
    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    updateFields.push(`"last_activity_at" = $${paramIndex++}`);
    values.push(unixTimestamp(), unixTimestamp());

    // Add basketId for WHERE clause
    values.push(basketId);

    const result = await queryOne<Record<string, any>>(
      `UPDATE "public"."basket" 
       SET ${updateFields.join(', ')}
       WHERE "basketId" = $${paramIndex}
       RETURNING ${generateSelectFields()}`,
      values
    );

    return result ? transformDbToTs(result) : null;
  }

  /**
   * Update basket status
   */
  async updateStatus(basketId: string, status: BasketStatus): Promise<Basket | null> {
    return this.update(basketId, { status });
  }

  /**
   * Update basket totals
   */
  async updateTotals(
    basketId: string,
    totals: {
      itemsCount?: number;
      subTotal?: number;
      taxAmount?: number;
      discountAmount?: number;
      shippingAmount?: number;
      grandTotal?: number;
    }
  ): Promise<Basket | null> {
    return this.update(basketId, totals);
  }

  /**
   * Merge session basket into customer basket
   */
  async mergeBaskets(customerBasketId: string, sessionBasketId: string): Promise<boolean> {
    // Mark session basket as merged
    await this.updateStatus(sessionBasketId, 'merged');
    return true;
  }

  /**
   * Convert basket to order
   */
  async convertToOrder(basketId: string, orderId: string): Promise<Basket | null> {
    const result = await queryOne<Record<string, any>>(
      `UPDATE "public"."basket" 
       SET "status" = 'converted', 
           "converted_to_order_id" = $1,
           "updatedAt" = $2,
           "last_activity_at" = $3
       WHERE "basketId" = $4
       RETURNING ${generateSelectFields()}`,
      [orderId, unixTimestamp(), unixTimestamp(), basketId]
    );

    return result ? transformDbToTs(result) : null;
  }

  /**
   * Delete basket
   */
  async delete(basketId: string): Promise<boolean> {
    const result = await queryOne<{ basket_id: string }>(
      `DELETE FROM "public"."basket" WHERE "basketId" = $1 RETURNING "basketId"`,
      [basketId]
    );

    return !!result;
  }

  /**
   * Find expired baskets
   */
  async findExpired(): Promise<Basket[]> {
    const now = unixTimestamp();
    const results = await query<Record<string, any>[]>(
      `SELECT ${generateSelectFields()} 
       FROM "public"."basket" 
       WHERE "status" = 'active' AND "expiresAt" < $1`,
      [now]
    );

    return results ? transformArrayDbToTs(results) : [];
  }

  /**
   * Mark expired baskets as abandoned
   */
  async abandonExpired(): Promise<number> {
    const now = unixTimestamp();
    const result = await queryOne<{ count: string }>(
      `UPDATE "public"."basket" 
       SET "status" = 'abandoned', "updatedAt" = $1
       WHERE "status" = 'active' AND "expiresAt" < $2
       RETURNING COUNT(*) as count`,
      [now, now]
    );

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Find baskets with pagination and filters
   */
  async findAll(options: {
    limit?: number;
    offset?: number;
    status?: BasketStatus;
    customerId?: string;
  } = {}): Promise<Basket[]> {
    const { limit = 50, offset = 0, status, customerId } = options;
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND "status" = $${paramIndex++}`;
      params.push(status);
    }

    if (customerId) {
      whereClause += ` AND "customerId" = $${paramIndex++}`;
      params.push(customerId);
    }

    params.push(limit, offset);

    const results = await query<Record<string, any>[]>(
      `SELECT ${generateSelectFields()} 
       FROM "public"."basket" 
       ${whereClause}
       ORDER BY "createdAt" DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    return results ? transformArrayDbToTs(results) : [];
  }

  /**
   * Count baskets
   */
  async count(filters: {
    status?: BasketStatus;
    customerId?: string;
  } = {}): Promise<number> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      whereClause += ` AND "status" = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.customerId) {
      whereClause += ` AND "customerId" = $${paramIndex++}`;
      params.push(filters.customerId);
    }

    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "public"."basket" ${whereClause}`,
      params
    );

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Get average basket value
   */
  async getAverageValue(): Promise<number> {
    const result = await queryOne<{ avg: string }>(
      `SELECT AVG("grand_total") as avg 
       FROM "public"."basket" 
       WHERE "grand_total" > 0 AND "status" = 'active'`
    );

    return result && result.avg ? parseFloat(result.avg) : 0;
  }

  /**
   * Get basket statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    converted: number;
    abandoned: number;
    averageValue: number;
  }> {
    const total = await this.count();
    const active = await this.count({ status: 'active' });
    const converted = await this.count({ status: 'converted' });
    const abandoned = await this.count({ status: 'abandoned' });
    const averageValue = await this.getAverageValue();

    return {
      total,
      active,
      converted,
      abandoned,
      averageValue
    };
  }
}

export default new BasketRepo();
