import { query, queryOne } from '../../../../libs/db';
import { withTransaction } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';
import { FailedToCreatePromotionError, CouponNotFoundError, PromotionValidationError } from '../../domain/errors/PromotionErrors';
import {
  CouponType,
  CouponGenerationMethod,
  type PromotionCoupon,
  type PromotionCouponUsage,
  type CreateCouponInput,
  type UpdateCouponInput,
  type CouponValidationResult,
} from '../../domain/repositories/CouponRepository';

// Re-export domain types for backward compatibility
export {
  CouponType,
  CouponGenerationMethod,
  type PromotionCoupon,
  type PromotionCouponUsage,
  type CreateCouponInput,
  type UpdateCouponInput,
  type CouponValidationResult,
};

// Table name constants
const COUPON_TABLE = Table.PromotionCoupon;
const COUPON_USAGE_TABLE = Table.PromotionCouponUsage;

type PromotionCouponRow = Omit<PromotionCoupon, 'discountAmountCents' | 'minOrderAmountCents' | 'maxDiscountAmountCents'> & {
  discountAmount: string | null;
  minOrderAmountCents: string | null;
  maxDiscountAmountCents: string | null;
};

type PromotionCouponUsageRow = Omit<PromotionCouponUsage, 'discountAmountCents'> & {
  discountAmountCents: string;
};

function mapCoupon(row: PromotionCouponRow): PromotionCoupon {
  const { discountAmount, minOrderAmountCents, maxDiscountAmountCents, ...rest } = row;
  return {
    ...rest,
    discountAmountCents: discountAmount == null ? undefined : Number(discountAmount),
    minOrderAmountCents: minOrderAmountCents == null ? undefined : Number(minOrderAmountCents),
    maxDiscountAmountCents: maxDiscountAmountCents == null ? undefined : Number(maxDiscountAmountCents),
  };
}

function mapUsage(row: PromotionCouponUsageRow): PromotionCouponUsage {
  return { ...row, discountAmountCents: Number(row.discountAmountCents) };
}

/**
 * Repository for managing promotion coupons
 */
export class CouponRepo {
  /**
   * Create a new coupon
   */
  async create(input: CreateCouponInput): Promise<PromotionCoupon> {
    const now = new Date();

    const coupon = await queryOne<PromotionCouponRow>(
      `INSERT INTO "${COUPON_TABLE}" (
        "code", "name", "description", "promotionId", "type", 
        "discountAmount", "currencyCode", "minOrderAmountCents", "maxDiscountAmountCents",
        "startDate", "endDate", "isActive", "isOneTimeUse", "maxUsage",
        "usageCount", "maxUsagePerCustomer", "generationMethod", "isReferral",
        "referrerId", "isPublic", "organizationId", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      ) RETURNING *`,
      [
        input.code,
        input.name,
        input.description || null,
        input.promotionId || null,
        input.type,
        input.discountAmountCents || null,
        input.currencyCode || 'USD',
        input.minOrderAmountCents || null,
        input.maxDiscountAmountCents || null,
        input.startDate || now,
        input.endDate || null,
        input.isActive !== false,
        input.isOneTimeUse || false,
        input.maxUsage || null,
        0, // Initial usage count
        input.maxUsagePerCustomer || 1,
        input.generationMethod || CouponGenerationMethod.MANUAL,
        input.isReferral || false,
        input.referrerId || null,
        input.isPublic || false,
        input.organizationId || null,
        now,
        now,
      ],
    );

    if (!coupon) {
      throw new FailedToCreatePromotionError('Failed to create coupon');
    }

    return mapCoupon(coupon);
  }

  /**
   * Update an existing coupon
   */
  async update(id: string, input: UpdateCouponInput): Promise<PromotionCoupon> {
    const updateFields: string[] = [];
    const params: unknown[] = [id];
    let paramIndex = 2;

    // Build dynamic update query
    // discountAmountCents maps to the polymorphic "discountAmount" column
    // (percent for percentage coupons, cents for money-typed coupons)
    const columnByField: Record<string, string> = { discountAmountCents: 'discountAmount' };
    const allowedFields = [
      'name',
      'description',
      'promotionId',
      'type',
      'discountAmountCents',
      'currencyCode',
      'minOrderAmountCents',
      'maxDiscountAmountCents',
      'startDate',
      'endDate',
      'isActive',
      'isOneTimeUse',
      'maxUsage',
      'maxUsagePerCustomer',
      'generationMethod',
      'isReferral',
      'referrerId',
      'isPublic',
      'organizationId',
    ];

    for (const [key, value] of Object.entries(input)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`"${columnByField[key] ?? key}" = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    // Always update the updatedAt timestamp
    updateFields.push(`"updatedAt" = $${paramIndex}`);
    params.push(new Date());

    if (updateFields.length === 1) {
      throw new PromotionValidationError('No fields to update');
    }

    const coupon = await queryOne<PromotionCouponRow>(
      `UPDATE "${COUPON_TABLE}" 
       SET ${updateFields.join(', ')} 
       WHERE "promotionCouponId" = $1 
       RETURNING *`,
      params,
    );

    if (!coupon) {
      throw new CouponNotFoundError(id);
    }

    return mapCoupon(coupon);
  }

  /**
   * Find a coupon by its ID
   */
  async findById(id: string): Promise<PromotionCoupon | null> {
    const row = await queryOne<PromotionCouponRow>(`SELECT * FROM "${COUPON_TABLE}" WHERE "promotionCouponId" = $1`, [id]);
    return row ? mapCoupon(row) : null;
  }

  /**
   * Find a coupon by its code
   */
  async findByCode(code: string, organizationId?: string): Promise<PromotionCoupon | null> {
    let sql = `SELECT * FROM "${COUPON_TABLE}" WHERE "code" = $1`;
    const params: unknown[] = [code];

    if (organizationId) {
      sql += ' AND "organizationId" = $2';
      params.push(organizationId);
    }

    const row = await queryOne<PromotionCouponRow>(sql, params);
    return row ? mapCoupon(row) : null;
  }

  /**
   * Find all active coupons
   */
  async findActiveCoupons(
    organizationId?: string,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      direction?: 'ASC' | 'DESC';
    } = {},
  ): Promise<PromotionCoupon[]> {
    const { limit = 50, offset = 0, orderBy = 'createdAt', direction = 'DESC' } = options;
    const now = new Date();

    let sql = `
      SELECT * FROM "${COUPON_TABLE}" 
      WHERE "isActive" = true 
      AND "startDate" <= $1 
      AND ("endDate" IS NULL OR "endDate" >= $1)
    `;

    const params: unknown[] = [now];
    let paramIndex = 2;

    if (organizationId) {
      sql += ` AND "organizationId" = $${paramIndex}`;
      params.push(organizationId);
      paramIndex++;
    }

    sql += ` ORDER BY "${orderBy}" ${direction} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    return ((await query<PromotionCouponRow[]>(sql, params)) || []).map(mapCoupon);
  }

  /**
   * Find all coupons with pagination
   */
  async findAll(
    organizationId?: string,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      direction?: 'ASC' | 'DESC';
      isActive?: boolean;
    } = {},
  ): Promise<PromotionCoupon[]> {
    const { limit = 50, offset = 0, orderBy = 'createdAt', direction = 'DESC', isActive } = options;

    let sql = `SELECT * FROM "${COUPON_TABLE}" WHERE 1=1`;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (organizationId) {
      sql += ` AND "organizationId" = $${paramIndex}`;
      params.push(organizationId);
      paramIndex++;
    }

    if (isActive !== undefined) {
      sql += ` AND "isActive" = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    sql += ` ORDER BY "${orderBy}" ${direction} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    return ((await query<PromotionCouponRow[]>(sql, params)) || []).map(mapCoupon);
  }

  /**
   * Delete a coupon by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ promotionCouponId: string }>(
      `DELETE FROM "${COUPON_TABLE}" WHERE "promotionCouponId" = $1 RETURNING "promotionCouponId"`,
      [id],
    );

    return !!result;
  }

  /**
   * Record coupon usage
   */
  async recordUsage(
    couponId: string,
    orderId: string,
    customerId?: string,
    discountAmountCents: number = 0,
    currencyCode: string = 'USD',
  ): Promise<PromotionCouponUsage> {
    const now = new Date();

    return withTransaction(async tx => {
      // Insert usage record
      const usage = await tx.queryOne<PromotionCouponUsageRow>(
        `INSERT INTO "${COUPON_USAGE_TABLE}" (
          "promotionCouponId", "orderId", "customerId",
          "discountAmountCents", "currencyCode", "usedAt", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *`,
        [couponId, orderId, customerId || null, discountAmountCents, currencyCode, now, now, now],
      );

      if (!usage) {
        throw new FailedToCreatePromotionError('Failed to record coupon usage');
      }

      // Increment usage count on coupon
      await tx.query(`UPDATE "${COUPON_TABLE}" SET "usageCount" = "usageCount" + 1, "updatedAt" = $2 WHERE "promotionCouponId" = $1`, [
        couponId,
        now,
      ]);

      return mapUsage(usage);
    });
  }

  /**
   * Get usage records for a coupon
   */
  async getUsage(couponId: string): Promise<PromotionCouponUsage[]> {
    return (
      ((await query<PromotionCouponUsageRow[]>(
        `SELECT * FROM "${COUPON_USAGE_TABLE}" 
       WHERE "promotionCouponId" = $1 
       ORDER BY "usedAt" DESC`,
        [couponId],
      )) || []) as PromotionCouponUsageRow[]
    ).map(mapUsage);
  }

  /**
   * Get customer usage count for a specific coupon
   */
  async getCustomerUsageCount(couponId: string, customerId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "${COUPON_USAGE_TABLE}" 
       WHERE "promotionCouponId" = $1 AND "customerId" = $2`,
      [couponId, customerId],
    );

    return result ? parseInt(result.count) : 0;
  }

  /**
   * Validate a coupon for use
   */
  async validate(code: string, orderTotalCents: number, customerId?: string, organizationId?: string): Promise<CouponValidationResult> {
    // Find coupon by code
    const coupon = await this.findByCode(code, organizationId);

    if (!coupon) {
      return { valid: false, message: 'Coupon not found' };
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return { valid: false, coupon, message: 'Coupon is not active' };
    }

    // Check date validity
    const now = new Date();
    if (now < coupon.startDate) {
      return { valid: false, coupon, message: 'Coupon is not yet active' };
    }

    if (coupon.endDate && now > coupon.endDate) {
      return { valid: false, coupon, message: 'Coupon has expired' };
    }

    // Check usage limits
    if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
      return { valid: false, coupon, message: 'Coupon usage limit has been reached' };
    }

    // Check minimum order amount
    if (coupon.minOrderAmountCents && orderTotalCents < coupon.minOrderAmountCents) {
      return {
        valid: false,
        coupon,
        message: `Order total must be at least ${coupon.minOrderAmountCents} cents`,
      };
    }

    // Check per customer limit
    if (customerId && coupon.maxUsagePerCustomer) {
      const customerUsageCount = await this.getCustomerUsageCount(coupon.promotionCouponId, customerId);
      if (customerUsageCount >= coupon.maxUsagePerCustomer) {
        return {
          valid: false,
          coupon,
          message: `You have already used this coupon ${customerUsageCount} times`,
        };
      }
    }

    // All validations passed
    return { valid: true, coupon };
  }

  /**
   * Calculate the discount amount for a coupon
   */
  calculateDiscount(coupon: PromotionCoupon, orderTotalCents: number): number {
    let discountAmount = 0;

    switch (coupon.type) {
      case CouponType.PERCENTAGE:
        if (coupon.discountAmountCents) {
          discountAmount = Math.round((orderTotalCents * coupon.discountAmountCents) / 100);
        }
        break;

      case CouponType.FIXED_AMOUNT:
        // discountAmountCents holds the fixed discount in integer cents
        discountAmount = Math.min(coupon.discountAmountCents || 0, orderTotalCents);
        break;

      case CouponType.FREE_SHIPPING:
        // This would require shipping cost information
        discountAmount = coupon.discountAmountCents || 0;
        break;

      case CouponType.BUY_X_GET_Y:
      case CouponType.FIRST_ORDER:
      case CouponType.GIFT_CARD:
        discountAmount = Math.min(coupon.discountAmountCents || 0, orderTotalCents);
        break;
    }

    // Apply maximum discount cap if set
    if (coupon.maxDiscountAmountCents && discountAmount > coupon.maxDiscountAmountCents) {
      discountAmount = coupon.maxDiscountAmountCents;
    }

    return discountAmount;
  }
}

// Export singleton instance
export default new CouponRepo();
