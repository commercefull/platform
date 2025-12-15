import { query, queryOne } from "../../../libs/db";
import { Table } from "../../../libs/db/types";
import { generateUUID } from "../../../libs/uuid";

// Table name constants
const COUPON_TABLE = Table.PromotionCoupon;
const COUPON_USAGE_TABLE = Table.PromotionCouponUsage;

/**
 * Coupon types supported by the system
 */
export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixedAmount',
  FREE_SHIPPING = 'freeShipping',
  BUY_X_GET_Y = 'buyXGetY',
  FIRST_ORDER = 'firstOrder',
  GIFT_CARD = 'giftCard'
}

/**
 * Coupon generation methods
 */
export enum CouponGenerationMethod {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  PATTERN = 'pattern',
  IMPORTED = 'imported'
}

/**
 * Promotion Coupon entity matching the database schema
 */
export interface PromotionCoupon {
  promotionCouponId: string;
  createdAt: Date;
  updatedAt: Date;
  code: string;
  promotionId?: string;
  name: string;
  description?: string;
  type: CouponType;
  discountAmount?: number;
  currencyCode: string;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  isOneTimeUse: boolean;
  maxUsage?: number;
  usageCount: number;
  maxUsagePerCustomer?: number;
  generationMethod: CouponGenerationMethod;
  isReferral: boolean;
  referrerId?: string;
  isPublic: boolean;
  merchantId?: string;
}

/**
 * Promotion Coupon Usage entity matching the database schema
 */
export interface PromotionCouponUsage {
  promotionCouponUsageId: string;
  createdAt: Date;
  updatedAt: Date;
  promotionCouponId: string;
  orderId?: string;
  customerId?: string;
  discountAmount: number;
  currencyCode: string;
  usedAt: Date;
}

/**
 * Input for creating a new coupon
 */
export interface CreateCouponInput {
  code: string;
  name: string;
  description?: string;
  promotionId?: string;
  type: CouponType;
  discountAmount?: number;
  currencyCode?: string;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  isOneTimeUse?: boolean;
  maxUsage?: number;
  maxUsagePerCustomer?: number;
  generationMethod?: CouponGenerationMethod;
  isReferral?: boolean;
  referrerId?: string;
  isPublic?: boolean;
  merchantId?: string;
}

/**
 * Input for updating an existing coupon
 */
export type UpdateCouponInput = Partial<Omit<CreateCouponInput, 'code'>>;

/**
 * Coupon validation result
 */
export interface CouponValidationResult {
  valid: boolean;
  coupon?: PromotionCoupon;
  message?: string;
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
    
    const coupon = await queryOne<PromotionCoupon>(
      `INSERT INTO "${COUPON_TABLE}" (
        "code", "name", "description", "promotionId", "type", 
        "discountAmount", "currencyCode", "minOrderAmount", "maxDiscountAmount",
        "startDate", "endDate", "isActive", "isOneTimeUse", "maxUsage",
        "usageCount", "maxUsagePerCustomer", "generationMethod", "isReferral",
        "referrerId", "isPublic", "merchantId", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      ) RETURNING *`,
      [
        input.code,
        input.name,
        input.description || null,
        input.promotionId || null,
        input.type,
        input.discountAmount || null,
        input.currencyCode || 'USD',
        input.minOrderAmount || null,
        input.maxDiscountAmount || null,
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
        input.merchantId || null,
        now,
        now
      ]
    );
    
    if (!coupon) {
      throw new Error('Failed to create coupon');
    }
    
    return coupon;
  }
  
  /**
   * Update an existing coupon
   */
  async update(id: string, input: UpdateCouponInput): Promise<PromotionCoupon> {
    const updateFields: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    // Build dynamic update query
    const allowedFields = [
      'name', 'description', 'promotionId', 'type', 'discountAmount',
      'currencyCode', 'minOrderAmount', 'maxDiscountAmount', 'startDate',
      'endDate', 'isActive', 'isOneTimeUse', 'maxUsage', 'maxUsagePerCustomer',
      'generationMethod', 'isReferral', 'referrerId', 'isPublic', 'merchantId'
    ];
    
    for (const [key, value] of Object.entries(input)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }
    
    // Always update the updatedAt timestamp
    updateFields.push(`"updatedAt" = $${paramIndex}`);
    params.push(new Date());
    
    if (updateFields.length === 1) {
      throw new Error('No fields to update');
    }
    
    const coupon = await queryOne<PromotionCoupon>(
      `UPDATE "${COUPON_TABLE}" 
       SET ${updateFields.join(', ')} 
       WHERE "promotionCouponId" = $1 
       RETURNING *`,
      params
    );
    
    if (!coupon) {
      throw new Error(`Coupon with ID ${id} not found`);
    }
    
    return coupon;
  }
  
  /**
   * Find a coupon by its ID
   */
  async findById(id: string): Promise<PromotionCoupon | null> {
    return await queryOne<PromotionCoupon>(
      `SELECT * FROM "${COUPON_TABLE}" WHERE "promotionCouponId" = $1`,
      [id]
    );
  }
  
  /**
   * Find a coupon by its code
   */
  async findByCode(code: string, merchantId?: string): Promise<PromotionCoupon | null> {
    let sql = `SELECT * FROM "${COUPON_TABLE}" WHERE "code" = $1`;
    const params: any[] = [code];
    
    if (merchantId) {
      sql += ' AND "merchantId" = $2';
      params.push(merchantId);
    }
    
    return await queryOne<PromotionCoupon>(sql, params);
  }
  
  /**
   * Find all active coupons
   */
  async findActiveCoupons(
    merchantId?: string,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      direction?: 'ASC' | 'DESC';
    } = {}
  ): Promise<PromotionCoupon[]> {
    const { limit = 50, offset = 0, orderBy = 'createdAt', direction = 'DESC' } = options;
    const now = new Date();
    
    let sql = `
      SELECT * FROM "${COUPON_TABLE}" 
      WHERE "isActive" = true 
      AND "startDate" <= $1 
      AND ("endDate" IS NULL OR "endDate" >= $1)
    `;
    
    const params: any[] = [now];
    let paramIndex = 2;
    
    if (merchantId) {
      sql += ` AND "merchantId" = $${paramIndex}`;
      params.push(merchantId);
      paramIndex++;
    }
    
    sql += ` ORDER BY "${orderBy}" ${direction} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    return await query<PromotionCoupon[]>(sql, params) || [];
  }
  
  /**
   * Find all coupons with pagination
   */
  async findAll(
    merchantId?: string,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      direction?: 'ASC' | 'DESC';
      isActive?: boolean;
    } = {}
  ): Promise<PromotionCoupon[]> {
    const { limit = 50, offset = 0, orderBy = 'createdAt', direction = 'DESC', isActive } = options;
    
    let sql = `SELECT * FROM "${COUPON_TABLE}" WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (merchantId) {
      sql += ` AND "merchantId" = $${paramIndex}`;
      params.push(merchantId);
      paramIndex++;
    }
    
    if (isActive !== undefined) {
      sql += ` AND "isActive" = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }
    
    sql += ` ORDER BY "${orderBy}" ${direction} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    return await query<PromotionCoupon[]>(sql, params) || [];
  }
  
  /**
   * Delete a coupon by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ promotionCouponId: string }>(
      `DELETE FROM "${COUPON_TABLE}" WHERE "promotionCouponId" = $1 RETURNING "promotionCouponId"`,
      [id]
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
    discountAmount: number = 0,
    currencyCode: string = 'USD'
  ): Promise<PromotionCouponUsage> {
    const now = new Date();
    
    // Begin transaction
    await query('BEGIN');
    
    try {
      // Insert usage record
      const usage = await queryOne<PromotionCouponUsage>(
        `INSERT INTO "${COUPON_USAGE_TABLE}" (
          "promotionCouponId", "orderId", "customerId",
          "discountAmount", "currencyCode", "usedAt", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *`,
        [
          couponId,
          orderId,
          customerId || null,
          discountAmount,
          currencyCode,
          now,
          now,
          now
        ]
      );
      
      if (!usage) {
        throw new Error('Failed to record coupon usage');
      }
      
      // Increment usage count on coupon
      await query(
        `UPDATE "${COUPON_TABLE}" SET "usageCount" = "usageCount" + 1, "updatedAt" = $2 WHERE "promotionCouponId" = $1`,
        [couponId, now]
      );
      
      // Commit transaction
      await query('COMMIT');
      
      return usage;
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      throw error;
    }
  }
  
  /**
   * Get usage records for a coupon
   */
  async getUsage(couponId: string): Promise<PromotionCouponUsage[]> {
    return await query<PromotionCouponUsage[]>(
      `SELECT * FROM "${COUPON_USAGE_TABLE}" 
       WHERE "promotionCouponId" = $1 
       ORDER BY "usedAt" DESC`,
      [couponId]
    ) || [];
  }
  
  /**
   * Get customer usage count for a specific coupon
   */
  async getCustomerUsageCount(couponId: string, customerId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "${COUPON_USAGE_TABLE}" 
       WHERE "promotionCouponId" = $1 AND "customerId" = $2`,
      [couponId, customerId]
    );
    
    return result ? parseInt(result.count) : 0;
  }
  
  /**
   * Validate a coupon for use
   */
  async validate(
    code: string, 
    orderTotal: number, 
    customerId?: string,
    merchantId?: string
  ): Promise<CouponValidationResult> {
    // Find coupon by code
    const coupon = await this.findByCode(code, merchantId);
    
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
    if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
      return { 
        valid: false, 
        coupon, 
        message: `Order total must be at least ${coupon.minOrderAmount}` 
      };
    }
    
    // Check per customer limit
    if (customerId && coupon.maxUsagePerCustomer) {
      const customerUsageCount = await this.getCustomerUsageCount(coupon.promotionCouponId, customerId);
      if (customerUsageCount >= coupon.maxUsagePerCustomer) {
        return { 
          valid: false, 
          coupon, 
          message: `You have already used this coupon ${customerUsageCount} times` 
        };
      }
    }
    
    // All validations passed
    return { valid: true, coupon };
  }

  /**
   * Calculate the discount amount for a coupon
   */
  calculateDiscount(coupon: PromotionCoupon, orderTotal: number): number {
    let discountAmount = 0;
    
    switch (coupon.type) {
      case CouponType.PERCENTAGE:
        if (coupon.discountAmount) {
          discountAmount = (orderTotal * coupon.discountAmount) / 100;
        }
        break;
        
      case CouponType.FIXED_AMOUNT:
        discountAmount = Math.min(coupon.discountAmount || 0, orderTotal);
        break;
        
      case CouponType.FREE_SHIPPING:
        // This would require shipping cost information
        discountAmount = coupon.discountAmount || 0;
        break;
        
      case CouponType.BUY_X_GET_Y:
      case CouponType.FIRST_ORDER:
      case CouponType.GIFT_CARD:
        discountAmount = Math.min(coupon.discountAmount || 0, orderTotal);
        break;
    }
    
    // Apply maximum discount cap if set
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
    
    return discountAmount;
  }
}

// Export singleton instance
export const couponRepo = new CouponRepo();
export default couponRepo;
