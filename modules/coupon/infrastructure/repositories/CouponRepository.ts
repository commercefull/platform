/**
 * Coupon Repository Implementation
 * PostgreSQL implementation for coupon management
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { Coupon, CouponUsage, DiscountType } from '../../domain/entities/Coupon';
import { PromotionCoupon, PromotionCouponUsage } from '../../../../libs/db/types';
import { PaginatedResult, PaginationOptions } from 'libs/types/shared';

export interface CouponFilters {
  code?: string;
  isActive?: boolean;
  type?: string;
  usageType?: string;
  status?: string;
  expiresAfter?: Date;
  expiresBefore?: Date;
}

export class CouponRepository {
  async findById(couponId: string): Promise<Coupon | null> {
    const row = await queryOne<PromotionCoupon>('SELECT * FROM "promotionCoupon" WHERE "promotionCouponId" = $1', [couponId]);

    if (!row) return null;
    return this.mapToCoupon(row);
  }

  async findByCode(code: string): Promise<Coupon | null> {
    if (!code) return null;
    const row = await queryOne<PromotionCoupon>(`SELECT * FROM "promotionCoupon" WHERE code = $1 AND "isActive" = true LIMIT 1`, [
      code.toUpperCase(),
    ]);

    if (!row) return null;
    return this.mapToCoupon(row);
  }

  async findAll(filters?: CouponFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Coupon>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const { whereClause, params } = this.buildWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "promotionCoupon" ${whereClause}`, params);
    const total = parseInt(countResult?.count || '0');

    const rows = await query<PromotionCoupon[]>(
      `SELECT * FROM "promotionCoupon" ${whereClause}
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
    const mappedType = coupon.type === 'fixed_amount' ? 'fixedAmount' : (coupon.type === 'free_shipping' ? 'freeShipping' : coupon.type);

    const existing = await queryOne<{ promotionCouponId: string }>(
      'SELECT "promotionCouponId" FROM "promotionCoupon" WHERE "promotionCouponId" = $1',
      [coupon.couponId],
    );

    if (existing) {
      await query(
        `UPDATE "promotionCoupon" SET
          code = $1, name = $2, description = $3, type = $4, "discountAmount" = $5,
          "currencyCode" = $6, "minOrderAmountCents" = $7, "maxDiscountAmountCents" = $8,
          "isOneTimeUse" = $9, "maxUsage" = $10, "usageCount" = $11,
          "maxUsagePerCustomer" = $12, "isActive" = $13,
          "startDate" = $14, "endDate" = $15,
          "updatedAt" = $16
        WHERE "promotionCouponId" = $17`,
        [
          coupon.code,
          coupon.name,
          coupon.description ?? null,
          mappedType,
          String(coupon.value),
          coupon.currency ?? 'USD',
          coupon.minOrderValueCents ?? null,
          coupon.maxDiscountAmountCents ?? null,
          coupon.usageType === 'single_use',
          coupon.usageLimit ?? null,
          coupon.usageCount,
          coupon.customerUsageLimit ?? null,
          coupon.isActive,
          coupon.startsAt?.toISOString() ?? now,
          coupon.expiresAt?.toISOString() ?? null,
          now,
          coupon.couponId,
        ],
      );
    } else {
      await query(
        `INSERT INTO "promotionCoupon" (
          "promotionCouponId", code, name, description, type, "discountAmount",
          "currencyCode", "minOrderAmountCents", "maxDiscountAmountCents",
          "isOneTimeUse", "maxUsage", "usageCount", "maxUsagePerCustomer",
          "isActive", "startDate", "endDate", "generationMethod", "isReferral", "isPublic",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          coupon.couponId,
          coupon.code,
          coupon.name,
          coupon.description ?? null,
          mappedType,
          String(coupon.value),
          coupon.currency ?? 'USD',
          coupon.minOrderValueCents ?? null,
          coupon.maxDiscountAmountCents ?? null,
          coupon.usageType === 'single_use',
          coupon.usageLimit ?? null,
          coupon.usageCount,
          coupon.customerUsageLimit ?? null,
          coupon.isActive,
          coupon.startsAt?.toISOString() ?? now,
          coupon.expiresAt?.toISOString() ?? null,
          'manual',
          false,
          false,
          now,
          now,
        ],
      );
    }

    return coupon;
  }

  async delete(couponId: string): Promise<void> {
    await query('DELETE FROM "promotionCoupon" WHERE "promotionCouponId" = $1', [couponId]);
  }

  // Coupon Usage tracking
  async recordUsage(
    usage: CouponUsage | { couponId: string; basketId?: string; customerId?: string; discountAmountCents: number },
  ): Promise<CouponUsage> {
    const now = new Date().toISOString();
    const fullUsage: CouponUsage = {
      usageId: 'usageId' in usage ? (usage as CouponUsage).usageId : generateUUID(),
      couponId: usage.couponId,
      orderId: 'orderId' in usage ? (usage as CouponUsage).orderId : '',
      customerId: usage.customerId || '',
      discountAmountCents: usage.discountAmountCents,
      usedAt: 'usedAt' in usage ? (usage as CouponUsage).usedAt : new Date(),
    };

    await query(
      `INSERT INTO "promotionCouponUsage" (
        "promotionCouponUsageId", "promotionCouponId", "orderId", "customerId", "discountAmountCents", "currencyCode", "usedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        fullUsage.usageId,
        fullUsage.couponId,
        fullUsage.orderId || null,
        fullUsage.customerId || null,
        fullUsage.discountAmountCents,
        'USD',
        now,
      ],
    );

    // Update coupon usage count
    await query('UPDATE "promotionCoupon" SET "usageCount" = "usageCount" + 1, "updatedAt" = $1 WHERE "promotionCouponId" = $2', [
      now,
      fullUsage.couponId,
    ]);

    return fullUsage;
  }

  async createRedemption(redemption: {
    redemptionId: string;
    couponId: string;
    orderId: string;
    customerId?: string;
    discountAmountCents: number;
    redeemedAt: Date;
  }): Promise<void> {
    await query(
      `INSERT INTO "promotionCouponUsage" (
        "promotionCouponUsageId", "promotionCouponId", "orderId", "customerId", "discountAmountCents", "currencyCode", "usedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        redemption.redemptionId,
        redemption.couponId,
        redemption.orderId,
        redemption.customerId || null,
        redemption.discountAmountCents,
        'USD',
        redemption.redeemedAt.toISOString(),
      ],
    );
  }

  async incrementUsageCount(couponId: string): Promise<void> {
    const now = new Date().toISOString();
    await query('UPDATE "promotionCoupon" SET "usageCount" = "usageCount" + 1, "updatedAt" = $1 WHERE "promotionCouponId" = $2', [
      now,
      couponId,
    ]);
  }

  async getUsageHistory(couponId: string, limit: number = 50): Promise<CouponUsage[]> {
    const rows = await query<PromotionCouponUsage[]>(
      `SELECT * FROM "promotionCouponUsage" WHERE "promotionCouponId" = $1 ORDER BY "usedAt" DESC LIMIT $2`,
      [couponId, limit],
    );

    return (rows || []).map(row => ({
      usageId: row.promotionCouponUsageId,
      couponId: row.promotionCouponId,
      orderId: row.orderId ?? '',
      customerId: row.customerId ?? '',
      discountAmountCents: Number(row.discountAmountCents),
      usedAt: new Date(row.usedAt),
    }));
  }

  async getCustomerUsageCount(couponId: string, customerId: string): Promise<number> {
    const row = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM "promotionCouponUsage" WHERE "promotionCouponId" = $1 AND "customerId" = $2',
      [couponId, customerId],
    );

    return parseInt(row?.count || '0');
  }

  async getActiveCoupons(limit: number = 100): Promise<Coupon[]> {
    const rows = await query<PromotionCoupon[]>(
      `SELECT * FROM "promotionCoupon"
      WHERE "isActive" = true
      AND ("startDate" IS NULL OR "startDate" <= NOW())
      AND ("endDate" IS NULL OR "endDate" > NOW())
      ORDER BY "createdAt" DESC
      LIMIT $1`,
      [limit],
    );

    return (rows || []).map(row => this.mapToCoupon(row));
  }

  async validateCouponCode(
    code: string,
    orderValueCents: number,
    customerId?: string,
  ): Promise<{
    valid: boolean;
    coupon?: Coupon;
    discountAmountCents?: number;
    error?: string;
  }> {
    const coupon = await this.findByCode(code);

    if (!coupon) {
      return { valid: false, error: 'Coupon not found' };
    }

    // All eligibility rules should be enforced by coupon configuration and domain rules

    if (coupon.status !== 'active') {
      return { valid: false, error: `Coupon is ${coupon.status}` };
    }

    if (!coupon.canBeApplied(orderValueCents, customerId)) {
      return { valid: false, error: 'Coupon cannot be applied to this order' };
    }

    // Check customer usage limit
    if (customerId && coupon.customerUsageLimit) {
      const usageCount = await this.getCustomerUsageCount(coupon.couponId, customerId);
      if (usageCount >= coupon.customerUsageLimit) {
        return { valid: false, error: 'Coupon usage limit exceeded for this customer' };
      }
    }

    const discountAmountCents = coupon.calculateDiscount(orderValueCents);

    return {
      valid: true,
      coupon,
      discountAmountCents,
    };
  }

  // Helper methods
  private buildWhereClause(filters?: CouponFilters): { whereClause: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];

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
      conditions.push('"isOneTimeUse" = $' + (params.length + 1));
      params.push(filters.usageType === 'single_use');
    }

    if (filters?.expiresAfter) {
      conditions.push('"endDate" > $' + (params.length + 1));
      params.push(filters.expiresAfter.toISOString());
    }

    if (filters?.expiresBefore) {
      conditions.push('"endDate" < $' + (params.length + 1));
      params.push(filters.expiresBefore.toISOString());
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private mapToCoupon(row: PromotionCoupon): Coupon {
    const type = row.type;
    const mappedType: DiscountType = type === 'fixedAmount' ? 'fixed_amount' : (type as DiscountType);
    return Coupon.reconstitute({
      couponId: row.promotionCouponId,
      code: row.code,
      name: row.name,
      description: row.description ?? undefined,
      type: mappedType,
      value: parseFloat(String(row.discountAmount ?? 0)),
      currency: row.currencyCode ?? undefined,
      minOrderValueCents: row.minOrderAmountCents != null ? Number(row.minOrderAmountCents) : undefined,
      maxDiscountAmountCents: row.maxDiscountAmountCents != null ? Number(row.maxDiscountAmountCents) : undefined,
      usageType: row.isOneTimeUse ? 'single_use' : 'multi_use',
      usageLimit: row.maxUsage ?? undefined,
      usageCount: row.usageCount,
      customerUsageLimit: row.maxUsagePerCustomer ?? undefined,
      conditions: [],
      isActive: Boolean(row.isActive),
      startsAt: row.startDate ? new Date(row.startDate) : undefined,
      expiresAt: row.endDate ? new Date(row.endDate) : undefined,
      applicableProducts: undefined,
      applicableCategories: undefined,
      applicableCustomerGroups: undefined,
      excludedProducts: undefined,
      excludedCategories: undefined,
      createdBy: '',
      metadata: undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}

export default new CouponRepository();
