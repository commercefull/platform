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
        "min_order_amount", "max_discount_amount", "start_date", "end_date", 
        "usage_limit", "usage_count", "per_customer_limit", "for_new_customers_only", 
        "for_auto_apply", "status", "merchantId", "excluded_product_ids", 
        "excluded_category_ids", "metadata", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING 
        id,
        code,
        name,
        description,
        type,
        value,
        min_order_amount AS "minOrderAmount",
        max_discount_amount AS "maxDiscountAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        usage_limit AS "usageLimit",
        usage_count AS "usageCount",
        per_customer_limit AS "perCustomerLimit",
        for_new_customers_only AS "forNewCustomersOnly",
        for_auto_apply AS "forAutoApply",
        status,
        merchant_id AS "merchantId",
        excluded_product_ids AS "excludedProductIds",
        excluded_category_ids AS "excludedCategoryIds",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
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
    
    // Map camelCase property names to snake_case column names
    const fieldMappings: Record<string, string> = {
      minOrderAmount: 'min_order_amount',
      maxDiscountAmount: 'max_discount_amount',
      startDate: 'start_date',
      endDate: 'end_date',
      usageLimit: 'usage_limit',
      usageCount: 'usage_count',
      perCustomerLimit: 'per_customer_limit',
      forNewCustomersOnly: 'for_new_customers_only',
      forAutoApply: 'for_auto_apply',
      merchantId: 'merchant_id',
      excludedProductIds: 'excluded_product_ids',
      excludedCategoryIds: 'excluded_category_ids',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
    
    // Build dynamic update query
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = fieldMappings[key] || key;
        updateFields.push(`"${dbField}" = $${paramIndex}`);
        
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
       RETURNING 
        id,
        code,
        name,
        description,
        type,
        value,
        min_order_amount AS "minOrderAmount",
        max_discount_amount AS "maxDiscountAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        usage_limit AS "usageLimit",
        usage_count AS "usageCount",
        per_customer_limit AS "perCustomerLimit",
        for_new_customers_only AS "forNewCustomersOnly",
        for_auto_apply AS "forAutoApply",
        status,
        merchant_id AS "merchantId",
        excluded_product_ids AS "excludedProductIds",
        excluded_category_ids AS "excludedCategoryIds",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      params
    );
    
    if (!coupon) {
      throw new Error(`Coupon with ID ${id} not found`);
    }
    
    return coupon;
  }
  
  async findById(id: string): Promise<Coupon | null> {
    return await queryOne<Coupon>(
      `SELECT 
        id,
        code,
        name,
        description,
        type,
        value,
        min_order_amount AS "minOrderAmount",
        max_discount_amount AS "maxDiscountAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        usage_limit AS "usageLimit",
        usage_count AS "usageCount",
        per_customer_limit AS "perCustomerLimit",
        for_new_customers_only AS "forNewCustomersOnly",
        for_auto_apply AS "forAutoApply",
        status,
        merchant_id AS "merchantId",
        excluded_product_ids AS "excludedProductIds",
        excluded_category_ids AS "excludedCategoryIds",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM "public"."coupon" WHERE "id" = $1`,
      [id]
    );
  }
  
  async findByCode(code: string, merchantId?: string): Promise<Coupon | null> {
    let sql = `SELECT 
      id,
      code,
      name,
      description,
      type,
      value,
      min_order_amount AS "minOrderAmount",
      max_discount_amount AS "maxDiscountAmount",
      start_date AS "startDate",
      end_date AS "endDate",
      usage_limit AS "usageLimit",
      usage_count AS "usageCount",
      per_customer_limit AS "perCustomerLimit",
      for_new_customers_only AS "forNewCustomersOnly",
      for_auto_apply AS "forAutoApply",
      status,
      merchant_id AS "merchantId",
      excluded_product_ids AS "excludedProductIds",
      excluded_category_ids AS "excludedCategoryIds",
      metadata,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM "public"."coupon" WHERE "code" = $1`;
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
    
    // Map camelCase sorting to snake_case columns
    const dbOrderBy = orderBy === 'createdAt' ? 'created_at' :
                      orderBy === 'updatedAt' ? 'updated_at' :
                      orderBy === 'startDate' ? 'start_date' :
                      orderBy === 'endDate' ? 'end_date' : orderBy;
    
    let sql = `
      SELECT 
        id,
        code,
        name,
        description,
        type,
        value,
        min_order_amount AS "minOrderAmount",
        max_discount_amount AS "maxDiscountAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        usage_limit AS "usageLimit",
        usage_count AS "usageCount",
        per_customer_limit AS "perCustomerLimit",
        for_new_customers_only AS "forNewCustomersOnly",
        for_auto_apply AS "forAutoApply",
        status,
        merchant_id AS "merchantId",
        excluded_product_ids AS "excludedProductIds",
        excluded_category_ids AS "excludedCategoryIds",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM "public"."coupon" 
      WHERE "status" = 'active' 
      AND "start_date" <= $1 
      AND ("end_date" IS NULL OR "end_date" >= $1)
    `;
    
    const params: any[] = [now];
    let paramIndex = 2;
    
    if (merchantId) {
      sql += ` AND "merchantId" = $${paramIndex}`;
      params.push(merchantId);
      paramIndex++;
    }
    
    sql += ` ORDER BY "${dbOrderBy}" ${direction} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    return await query<Coupon[]>(sql, params) || [];
  }
  
  async delete(id: string): Promise<boolean> {
    // Begin transaction
    await query('BEGIN');
    
    try {
      // Delete coupon usage records
      await query('DELETE FROM "public"."coupon_usage" WHERE "coupon_id" = $1', [id]);
      
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
          "id", "coupon_id", "orderId", "customerId", "session_id",
          "discountAmount", "applied_at"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING 
          id,
          coupon_id AS "couponId",
          order_id AS "orderId",
          customer_id AS "customerId",
          session_id AS "sessionId",
          discount_amount AS "discountAmount",
          applied_at AS "appliedAt"`,
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
        'UPDATE "public"."coupon" SET "usage_count" = "usage_count" + 1 WHERE "id" = $1',
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
      `SELECT 
        id,
        coupon_id AS "couponId",
        order_id AS "orderId",
        customer_id AS "customerId",
        session_id AS "sessionId",
        discount_amount AS "discountAmount",
        applied_at AS "appliedAt"
      FROM "public"."coupon_usage" 
      WHERE "coupon_id" = $1 
      ORDER BY "applied_at" DESC`,
      [couponId]
    ) || [];
  }
  
  async getCustomerCouponUsageCount(couponId: string, customerId: string): Promise<number> {
    const result = await queryOne<{count: string}>(
      'SELECT COUNT(*) as count FROM "public"."coupon_usage" WHERE "coupon_id" = $1 AND "customerId" = $2',
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
    // Check if any product or category is excluded
    let eligibleTotal = orderTotal;
    
    if (items && (coupon.excludedProductIds?.length || coupon.excludedCategoryIds?.length)) {
      // Calculate total excluding any excluded products or categories
      eligibleTotal = items.reduce((total, item) => {
        // Skip if product is excluded
        if (coupon.excludedProductIds?.includes(item.productId)) {
          return total;
        }
        
        // Skip if category is excluded
        if (item.categoryId && coupon.excludedCategoryIds?.includes(item.categoryId)) {
          return total;
        }
        
        return total + (item.price * item.quantity);
      }, 0);
    }
    
    let discountAmount = 0;
    
    switch (coupon.type) {
      case CouponType.PERCENTAGE:
        discountAmount = (eligibleTotal * coupon.value) / 100;
        break;
        
      case CouponType.FIXED_AMOUNT:
        discountAmount = Math.min(coupon.value, eligibleTotal);
        break;
        
      case CouponType.FREE_SHIPPING:
        // This would require shipping cost information
        // For now, we'll just use the value as a fixed amount
        discountAmount = coupon.value;
        break;
        
      case CouponType.BUY_X_GET_Y:
      case CouponType.FIRST_TIME:
        // These are more complex discount types
        // For now, we'll just use the value as a fixed amount
        discountAmount = Math.min(coupon.value, eligibleTotal);
        break;
    }
    
    // Apply maximum discount cap if set
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
    
    return discountAmount;
  }
}

export default new CouponRepo();
