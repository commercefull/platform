import { query, queryOne } from "../../../libs/db";
import { generateUUID } from "../../../libs/uuid";

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping',
  BUY_X_GET_Y = 'buy_x_get_y',
  FIRST_TIME = 'first_time'
}

export enum CouponStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  SCHEDULED = 'scheduled'
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: Date;
  endDate?: Date;
  usageLimit?: number;
  usageCount: number;
  perCustomerLimit?: number;
  forNewCustomersOnly: boolean;
  forAutoApply: boolean;
  status: CouponStatus;
  merchantId?: string;
  excludedProductIds?: string[];
  excludedCategoryIds?: string[];
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  orderId: string;
  customerId?: string;
  sessionId?: string;
  discountAmount: number;
  appliedAt: Date;
}

export interface CreateCouponInput {
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: Date;
  endDate?: Date;
  usageLimit?: number;
  perCustomerLimit?: number;
  forNewCustomersOnly?: boolean;
  forAutoApply?: boolean;
  status: CouponStatus;
  merchantId?: string;
  excludedProductIds?: string[];
  excludedCategoryIds?: string[];
  metadata?: any;
}

export type UpdateCouponInput = Partial<CreateCouponInput>;

export class CouponRepo {
  async create(input: CreateCouponInput): Promise<Coupon> {
    const id = generateUUID();
    const now = new Date();
    
    // Process array fields to JSON strings
    const excludedProductIdsJson = input.excludedProductIds ? JSON.stringify(input.excludedProductIds) : null;
    const excludedCategoryIdsJson = input.excludedCategoryIds ? JSON.stringify(input.excludedCategoryIds) : null;
    const metadataJson = input.metadata ? JSON.stringify(input.metadata) : null;
    
    const coupon = await queryOne<Coupon>(
      `INSERT INTO "public"."coupon" (
        "id", "code", "name", "description", "type", "value", 
        "minOrderAmount", "maxDiscountAmount", "startDate", "endDate", 
        "usageLimit", "usageCount", "perCustomerLimit", "forNewCustomersOnly", 
        "forAutoApply", "status", "merchantId", "excludedProductIds", 
        "excludedCategoryIds", "metadata", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING *`,
      [
        id,
        input.code,
        input.name,
        input.description || null,
        input.type,
        input.value,
        input.minOrderAmount || null,
        input.maxDiscountAmount || null,
        input.startDate,
        input.endDate || null,
        input.usageLimit || null,
        0, // Initial usage count
        input.perCustomerLimit || null,
        input.forNewCustomersOnly || false,
        input.forAutoApply || false,
        input.status,
        input.merchantId || null,
        excludedProductIdsJson,
        excludedCategoryIdsJson,
        metadataJson,
        now,
        now
      ]
    );
    
    if (!coupon) {
      throw new Error('Failed to create coupon');
    }
    
    return coupon;
  }
  
  async update(id: string, input: UpdateCouponInput): Promise<Coupon> {
    const updateFields: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    // Build dynamic update query
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        
        // Handle array and object fields
        if (['excludedProductIds', 'excludedCategoryIds', 'metadata'].includes(key) && typeof value === 'object') {
          params.push(JSON.stringify(value));
        } else {
          params.push(value);
        }
        
        paramIndex++;
      }
    });
    
    // Always update the updatedAt timestamp
    updateFields.push(`"updatedAt" = $${paramIndex}`);
    params.push(new Date());
    paramIndex++;
    
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    const coupon = await queryOne<Coupon>(
      `UPDATE "public"."coupon" 
       SET ${updateFields.join(', ')} 
       WHERE "id" = $1 
       RETURNING *`,
      params
    );
    
    if (!coupon) {
      throw new Error(`Coupon with ID ${id} not found`);
    }
    
    return coupon;
  }
  
  async findById(id: string): Promise<Coupon | null> {
    return await queryOne<Coupon>(
      'SELECT * FROM "public"."coupon" WHERE "id" = $1',
      [id]
    );
  }
  
  async findByCode(code: string, merchantId?: string): Promise<Coupon | null> {
    let sql = 'SELECT * FROM "public"."coupon" WHERE "code" = $1';
    const params: any[] = [code];
    
    if (merchantId) {
      sql += ' AND "merchantId" = $2';
      params.push(merchantId);
    }
    
    return await queryOne<Coupon>(sql, params);
  }
  
  async findActiveCoupons(
    merchantId?: string,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      direction?: 'ASC' | 'DESC';
    } = {}
  ): Promise<Coupon[]> {
    const { limit = 50, offset = 0, orderBy = 'createdAt', direction = 'DESC' } = options;
    const now = new Date();
    
    let sql = `
      SELECT * FROM "public"."coupon" 
      WHERE "status" = 'active' 
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
    
    return await query<Coupon[]>(sql, params) || [];
  }
  
  async delete(id: string): Promise<boolean> {
    // Begin transaction
    await query('BEGIN');
    
    try {
      // Delete coupon usage records
      await query('DELETE FROM "public"."coupon_usage" WHERE "couponId" = $1', [id]);
      
      // Delete coupon
      const result = await queryOne<{ id: string }>(
        'DELETE FROM "public"."coupon" WHERE "id" = $1 RETURNING "id"',
        [id]
      );
      
      // Commit transaction
      await query('COMMIT');
      
      return !!result;
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      throw error;
    }
  }
  
  async recordCouponUsage(
    couponId: string, 
    orderId: string, 
    customerId?: string,
    sessionId?: string,
    discountAmount: number = 0
  ): Promise<CouponUsage> {
    const id = generateUUID();
    const now = new Date();
    
    // Begin transaction
    await query('BEGIN');
    
    try {
      // Insert usage record
      const usage = await queryOne<CouponUsage>(
        `INSERT INTO "public"."coupon_usage" (
          "id", "couponId", "orderId", "customerId", "sessionId",
          "discountAmount", "appliedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          id,
          couponId,
          orderId,
          customerId || null,
          sessionId || null,
          discountAmount,
          now
        ]
      );
      
      if (!usage) {
        throw new Error('Failed to record coupon usage');
      }
      
      // Increment usage count on coupon
      await query(
        'UPDATE "public"."coupon" SET "usageCount" = "usageCount" + 1 WHERE "id" = $1',
        [couponId]
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
  
  async getCouponUsage(couponId: string): Promise<CouponUsage[]> {
    return await query<CouponUsage[]>(
      'SELECT * FROM "public"."coupon_usage" WHERE "couponId" = $1 ORDER BY "appliedAt" DESC',
      [couponId]
    ) || [];
  }
  
  async getCustomerCouponUsageCount(couponId: string, customerId: string): Promise<number> {
    const result = await queryOne<{count: string}>(
      'SELECT COUNT(*) as count FROM "public"."coupon_usage" WHERE "couponId" = $1 AND "customerId" = $2',
      [couponId, customerId]
    );
    
    return result ? parseInt(result.count) : 0;
  }
  
  async validateCoupon(
    code: string, 
    orderTotal: number, 
    customerId?: string,
    merchantId?: string
  ): Promise<{ valid: boolean; coupon?: Coupon; message?: string }> {
    // Find coupon by code
    const coupon = await this.findByCode(code, merchantId);
    
    if (!coupon) {
      return { valid: false, message: 'Coupon not found' };
    }
    
    // Check coupon status
    if (coupon.status !== CouponStatus.ACTIVE) {
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
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
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
    
    // Check if customer specific validations are needed
    if (customerId) {
      // Check new customer only restriction
      if (coupon.forNewCustomersOnly) {
        const orderCount = await this.getCustomerOrderCount(customerId);
        if (orderCount > 0) {
          return { valid: false, coupon, message: 'Coupon is for new customers only' };
        }
      }
      
      // Check per customer limit
      if (coupon.perCustomerLimit) {
        const customerUsageCount = await this.getCustomerCouponUsageCount(coupon.id, customerId);
        if (customerUsageCount >= coupon.perCustomerLimit) {
          return { 
            valid: false, 
            coupon, 
            message: `You have already used this coupon ${customerUsageCount} times` 
          };
        }
      }
    }
    
    // All validations passed
    return { valid: true, coupon };
  }
  
  private async getCustomerOrderCount(customerId: string): Promise<number> {
    const result = await queryOne<{count: string}>(
      'SELECT COUNT(*) as count FROM "public"."order" WHERE "customerId" = $1',
      [customerId]
    );
    
    return result ? parseInt(result.count) : 0;
  }

  // Helper method for calculating the discount amount for a coupon
  async calculateCouponDiscount(
    coupon: Coupon, 
    orderTotal: number,
    items?: Array<{ productId: string; categoryId?: string; quantity: number; price: number; }>
  ): Promise<number> {
    if (!coupon) return 0;
    
    // Check excluded products and categories if provided
    if (items && (coupon.excludedProductIds?.length || coupon.excludedCategoryIds?.length)) {
      // Parse excluded arrays from JSON if needed
      const excludedProductIds = typeof coupon.excludedProductIds === 'string' 
        ? JSON.parse(coupon.excludedProductIds) 
        : coupon.excludedProductIds || [];
        
      const excludedCategoryIds = typeof coupon.excludedCategoryIds === 'string'
        ? JSON.parse(coupon.excludedCategoryIds)
        : coupon.excludedCategoryIds || [];
      
      // Calculate eligible subtotal by excluding specified products and categories
      let eligibleTotal = 0;
      
      for (const item of items) {
        if (
          !excludedProductIds.includes(item.productId) && 
          !(item.categoryId && excludedCategoryIds.includes(item.categoryId))
        ) {
          eligibleTotal += item.price * item.quantity;
        }
      }
      
      // Use eligible total instead of order total
      orderTotal = eligibleTotal;
    }
    
    let discountAmount = 0;
    
    switch (coupon.type) {
      case CouponType.PERCENTAGE:
        discountAmount = orderTotal * (coupon.value / 100);
        break;
        
      case CouponType.FIXED_AMOUNT:
        discountAmount = Math.min(coupon.value, orderTotal);
        break;
        
      case CouponType.FREE_SHIPPING:
        // This would be handled in combination with shipping calculation
        // For now, we'll just apply the value as a discount
        discountAmount = coupon.value;
        break;
        
      case CouponType.BUY_X_GET_Y:
        // This requires item-level calculation logic
        // For now, we'll just apply the value as a discount
        discountAmount = coupon.value;
        break;
        
      case CouponType.FIRST_TIME:
        discountAmount = orderTotal * (coupon.value / 100);
        break;
        
      default:
        discountAmount = 0;
    }
    
    // Apply maximum discount cap if specified
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
    
    return discountAmount;
  }
}

export default new CouponRepo();
