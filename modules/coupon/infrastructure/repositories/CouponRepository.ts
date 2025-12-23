/**
 * Coupon Repository Implementation
 * PostgreSQL implementation for coupon management
 */

import { query, queryOne } from '../../../../libs/db';
import { Coupon, CouponUsage } from '../../domain/entities/Coupon';

export interface CouponFilters {
  code?: string;
  isActive?: boolean;
  type?: string;
  usageType?: string;
  status?: string;
  expiresAfter?: Date;
  expiresBefore?: Date;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  length: number;
}

export class CouponRepository {
  async findById(couponId: string): Promise<Coupon | null> {
    const row = await queryOne<Record<string, any>>('SELECT * FROM coupon WHERE "couponId" = $1', [couponId]);

    if (!row) return null;
    return this.mapToCoupon(row);
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const row = await queryOne<Record<string, any>>('SELECT * FROM coupon WHERE code = $1', [code.toUpperCase()]);

    if (!row) return null;
    return this.mapToCoupon(row);
  }

  async findAll(filters?: CouponFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Coupon>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const { whereClause, params } = this.buildWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM coupon ${whereClause}`, params);
    const total = parseInt(countResult?.count || '0');

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM coupon ${whereClause}
       ORDER BY "${orderBy}" ${orderDir.toUpperCase()}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    const coupons = (rows || []).map(row => this.mapToCoupon(row));

    return {
      data: coupons,
      total,
      limit,
      offset,
      hasMore: offset + coupons.length < total,
      length: total,
    };
  }

  async save(coupon: Coupon): Promise<Coupon> {
    const now = new Date().toISOString();

    const existing = await queryOne<Record<string, any>>('SELECT "couponId" FROM coupon WHERE "couponId" = $1', [coupon.couponId]);

    if (existing) {
      // Update existing coupon
      await query(
        `UPDATE coupon SET
          code = $1, name = $2, description = $3, type = $4, value = $5,
          currency = $6, "minOrderValue" = $7, "maxDiscountAmount" = $8,
          "usageType" = $9, "usageLimit" = $10, "usageCount" = $11,
          "customerUsageLimit" = $12, conditions = $13, "isActive" = $14,
          "startsAt" = $15, "expiresAt" = $16, "applicableProducts" = $17,
          "applicableCategories" = $18, "applicableCustomerGroups" = $19,
          "excludedProducts" = $20, "excludedCategories" = $21,
          metadata = $22, "updatedAt" = $23
        WHERE "couponId" = $24`,
        [
          coupon.code,
          coupon.name,
          coupon.description,
          coupon.type,
          coupon.value,
          coupon.currency,
          coupon.minOrderValue,
          coupon.maxDiscountAmount,
          coupon.usageType,
          coupon.usageLimit,
          coupon.usageCount,
          coupon.customerUsageLimit,
          coupon.conditions.length > 0 ? JSON.stringify(coupon.conditions) : null,
          coupon.isActive,
          coupon.startsAt?.toISOString(),
          coupon.expiresAt?.toISOString(),
          coupon.applicableProducts ? JSON.stringify(coupon.applicableProducts) : null,
          coupon.applicableCategories ? JSON.stringify(coupon.applicableCategories) : null,
          coupon.applicableCustomerGroups ? JSON.stringify(coupon.applicableCustomerGroups) : null,
          coupon.excludedProducts ? JSON.stringify(coupon.excludedProducts) : null,
          coupon.excludedCategories ? JSON.stringify(coupon.excludedCategories) : null,
          coupon.metadata ? JSON.stringify(coupon.metadata) : null,
          now,
          coupon.couponId,
        ],
      );
    } else {
      // Create new coupon
      await query(
        `INSERT INTO coupon (
          "couponId", code, name, description, type, value, currency,
          "minOrderValue", "maxDiscountAmount", "usageType", "usageLimit",
          "usageCount", "customerUsageLimit", conditions, "isActive",
          "startsAt", "expiresAt", "applicableProducts", "applicableCategories",
          "applicableCustomerGroups", "excludedProducts", "excludedCategories",
          "createdBy", metadata, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`,
        [
          coupon.couponId,
          coupon.code,
          coupon.name,
          coupon.description,
          coupon.type,
          coupon.value,
          coupon.currency,
          coupon.minOrderValue,
          coupon.maxDiscountAmount,
          coupon.usageType,
          coupon.usageLimit,
          coupon.usageCount,
          coupon.customerUsageLimit,
          coupon.conditions.length > 0 ? JSON.stringify(coupon.conditions) : null,
          coupon.isActive,
          coupon.startsAt?.toISOString(),
          coupon.expiresAt?.toISOString(),
          coupon.applicableProducts ? JSON.stringify(coupon.applicableProducts) : null,
          coupon.applicableCategories ? JSON.stringify(coupon.applicableCategories) : null,
          coupon.applicableCustomerGroups ? JSON.stringify(coupon.applicableCustomerGroups) : null,
          coupon.excludedProducts ? JSON.stringify(coupon.excludedProducts) : null,
          coupon.excludedCategories ? JSON.stringify(coupon.excludedCategories) : null,
          coupon.createdBy,
          coupon.metadata ? JSON.stringify(coupon.metadata) : null,
          now,
          now,
        ],
      );
    }

    return coupon;
  }

  async delete(couponId: string): Promise<void> {
    await query('DELETE FROM coupon WHERE "couponId" = $1', [couponId]);
  }

  // Coupon Usage tracking
  async recordUsage(usage: CouponUsage): Promise<CouponUsage> {
    const now = new Date().toISOString();

    await query(
      `INSERT INTO "couponUsage" (
        "usageId", "couponId", "orderId", "customerId", "discountAmount", "usedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [usage.usageId, usage.couponId, usage.orderId, usage.customerId, usage.discountAmount, now],
    );

    // Update coupon usage count
    await query('UPDATE coupon SET "usageCount" = "usageCount" + 1, "updatedAt" = $1 WHERE "couponId" = $2', [now, usage.couponId]);

    return usage;
  }

  async getUsageHistory(couponId: string, limit: number = 50): Promise<CouponUsage[]> {
    const rows = await query<Record<string, any>[]>(`SELECT * FROM "couponUsage" WHERE "couponId" = $1 ORDER BY "usedAt" DESC LIMIT $2`, [
      couponId,
      limit,
    ]);

    return (rows || []).map(row => ({
      usageId: row.usageId,
      couponId: row.couponId,
      orderId: row.orderId,
      customerId: row.customerId,
      discountAmount: parseFloat(row.discountAmount),
      usedAt: new Date(row.usedAt),
    }));
  }

  async getCustomerUsageCount(couponId: string, customerId: string): Promise<number> {
    const row = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM "couponUsage" WHERE "couponId" = $1 AND "customerId" = $2',
      [couponId, customerId],
    );

    return parseInt(row?.count || '0');
  }

  async getActiveCoupons(limit: number = 100): Promise<Coupon[]> {
    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM coupon
      WHERE "isActive" = true
      AND ("startsAt" IS NULL OR "startsAt" <= NOW())
      AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
      ORDER BY "createdAt" DESC
      LIMIT $1`,
      [limit],
    );

    return (rows || []).map(row => this.mapToCoupon(row));
  }

  async validateCouponCode(
    code: string,
    orderValue: number,
    customerId?: string,
  ): Promise<{
    valid: boolean;
    coupon?: Coupon;
    discountAmount?: number;
    error?: string;
  }> {
    const coupon = await this.findByCode(code);

    if (!coupon) {
      return { valid: false, error: 'Coupon not found' };
    }

    if (coupon.status !== 'active') {
      return { valid: false, error: `Coupon is ${coupon.status}` };
    }

    if (!coupon.canBeApplied(orderValue, customerId)) {
      return { valid: false, error: 'Coupon cannot be applied to this order' };
    }

    // Check customer usage limit
    if (customerId && coupon.customerUsageLimit) {
      const usageCount = await this.getCustomerUsageCount(coupon.couponId, customerId);
      if (usageCount >= coupon.customerUsageLimit) {
        return { valid: false, error: 'Coupon usage limit exceeded for this customer' };
      }
    }

    const discountAmount = coupon.calculateDiscount(orderValue);

    return {
      valid: true,
      coupon,
      discountAmount,
    };
  }

  // Helper methods
  private buildWhereClause(filters?: CouponFilters): { whereClause: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.code) {
      conditions.push('code = $' + (params.length + 1));
      params.push(filters.code.toUpperCase());
    }

    if (filters?.isActive !== undefined) {
      conditions.push('"isActive" = $' + (params.length + 1));
      params.push(filters.isActive);
    }

    if (filters?.type) {
      conditions.push('type = $' + (params.length + 1));
      params.push(filters.type);
    }

    if (filters?.usageType) {
      conditions.push('"usageType" = $' + (params.length + 1));
      params.push(filters.usageType);
    }

    if (filters?.expiresAfter) {
      conditions.push('"expiresAt" > $' + (params.length + 1));
      params.push(filters.expiresAfter.toISOString());
    }

    if (filters?.expiresBefore) {
      conditions.push('"expiresAt" < $' + (params.length + 1));
      params.push(filters.expiresBefore.toISOString());
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private mapToCoupon(row: Record<string, any>): Coupon {
    return Coupon.reconstitute({
      couponId: row.couponId,
      code: row.code,
      name: row.name,
      description: row.description,
      type: row.type,
      value: parseFloat(row.value),
      currency: row.currency,
      minOrderValue: row.minOrderValue ? parseFloat(row.minOrderValue) : undefined,
      maxDiscountAmount: row.maxDiscountAmount ? parseFloat(row.maxDiscountAmount) : undefined,
      usageType: row.usageType,
      usageLimit: row.usageLimit ? parseInt(row.usageLimit) : undefined,
      usageCount: parseInt(row.usageCount || '0'),
      customerUsageLimit: row.customerUsageLimit ? parseInt(row.customerUsageLimit) : undefined,
      conditions: row.conditions ? (typeof row.conditions === 'string' ? JSON.parse(row.conditions) : row.conditions) : [],
      isActive: Boolean(row.isActive),
      startsAt: row.startsAt ? new Date(row.startsAt) : undefined,
      expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
      applicableProducts: row.applicableProducts
        ? typeof row.applicableProducts === 'string'
          ? JSON.parse(row.applicableProducts)
          : row.applicableProducts
        : undefined,
      applicableCategories: row.applicableCategories
        ? typeof row.applicableCategories === 'string'
          ? JSON.parse(row.applicableCategories)
          : row.applicableCategories
        : undefined,
      applicableCustomerGroups: row.applicableCustomerGroups
        ? typeof row.applicableCustomerGroups === 'string'
          ? JSON.parse(row.applicableCustomerGroups)
          : row.applicableCustomerGroups
        : undefined,
      excludedProducts: row.excludedProducts
        ? typeof row.excludedProducts === 'string'
          ? JSON.parse(row.excludedProducts)
          : row.excludedProducts
        : undefined,
      excludedCategories: row.excludedCategories
        ? typeof row.excludedCategories === 'string'
          ? JSON.parse(row.excludedCategories)
          : row.excludedCategories
        : undefined,
      createdBy: row.createdBy,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}

export default new CouponRepository();
