import { query, queryOne } from "../../../libs/db";
import { generateUUID } from "../../../libs/uuid";

// Enums for promotion-related types
export type PromotionStatus = 'active' | 'scheduled' | 'expired' | 'disabled';
export type PromotionScope = 'cart' | 'product' | 'category' | 'customer';
export type DiscountType = 'percentage' | 'fixed_amount' | 'free_item' | 'buy_x_get_y';
export type RuleCondition = 'cart_total' | 'item_quantity' | 'product_category' | 'customer_group' | 'first_order' | 'date_range' | 'time_of_day' | 'day_of_week' | 'shipping_method' | 'payment_method';
export type ActionType = 'discount_by_percentage' | 'discount_by_amount' | 'discount_shipping' | 'free_item';

// Core promotion interfaces
export interface Promotion {
  id: string;
  name: string;
  description?: string;
  status: PromotionStatus;
  scope: PromotionScope;
  priority: number;
  startDate: Date;
  endDate?: Date;
  usageLimit?: number;
  usageCount: number;
  discountType?: DiscountType;
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  couponId?: string;
  exclusive: boolean;
  merchantId?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromotionRule {
  id: string;
  promotionId: string;
  name?: string;
  condition: RuleCondition;
  operator: string;
  value: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromotionAction {
  id: string;
  promotionId: string;
  type: ActionType;
  value: number;
  targetType?: string;
  targetId?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromotionUsage {
  id: string;
  promotionId: string;
  orderId: string;
  customerId?: string;
  sessionId?: string;
  discountAmount: number;
  appliedAt: Date;
  metadata?: any;
}

// Input types for creating and updating
export interface CreatePromotionInput {
  name: string;
  description?: string;
  status: PromotionStatus;
  scope: PromotionScope;
  priority: number;
  startDate: Date;
  endDate?: Date;
  usageLimit?: number;
  discountType?: DiscountType;
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  couponId?: string;
  exclusive: boolean;
  merchantId?: string;
  metadata?: any;
  rules?: Array<{
    name?: string;
    condition: RuleCondition;
    operator: string;
    value: any;
  }>;
  actions?: Array<{
    type: ActionType;
    value: number;
    targetType?: string;
    targetId?: string;
    metadata?: any;
  }>;
}

export type UpdatePromotionInput = Partial<CreatePromotionInput>;

export class PromotionRepo {
  // PROMOTION METHODS
  
  async findPromotionById(id: string): Promise<Promotion | null> {
    return await queryOne<Promotion>(
      `SELECT 
        id,
        name,
        description,
        status,
        scope,
        priority,
        start_date AS "startDate",
        end_date AS "endDate",
        usage_limit AS "usageLimit",
        usage_count AS "usageCount",
        discount_type AS "discountType",
        discount_value AS "discountValue",
        min_order_amount AS "minOrderAmount",
        max_discount_amount AS "maxDiscountAmount",
        coupon_id AS "couponId",
        is_exclusive AS "exclusive",
        merchant_id AS "merchantId",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM "public"."promotion" WHERE "id" = $1`,
      [id]
    );
  }

  async findPromotions(
    filters: {
      status?: PromotionStatus | PromotionStatus[];
      scope?: PromotionScope | PromotionScope[];
      merchantId?: string;
      withCoupon?: boolean;
      startBefore?: Date;
      endAfter?: Date;
    },
    options: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      direction?: 'ASC' | 'DESC';
    } = {}
  ): Promise<Promotion[]> {
    const { status, scope, merchantId, withCoupon, startBefore, endAfter } = filters;
    const { limit = 50, offset = 0, orderBy = 'priority', direction = 'DESC' } = options;
    
    let sql = `SELECT 
      id,
      name,
      description,
      status,
      scope,
      priority,
      start_date AS "startDate",
      end_date AS "endDate",
      usage_limit AS "usageLimit",
      usage_count AS "usageCount",
      discount_type AS "discountType",
      discount_value AS "discountValue",
      min_order_amount AS "minOrderAmount",
      max_discount_amount AS "maxDiscountAmount",
      coupon_id AS "couponId",
      is_exclusive AS "exclusive",
      merchant_id AS "merchantId",
      metadata,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM "public"."promotion" WHERE 1=1`;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    // Add filters
    if (status) {
      if (Array.isArray(status)) {
        sql += ` AND "status" IN (${status.map((_, i) => `$${paramIndex + i}`).join(', ')})`;
        params.push(...status);
        paramIndex += status.length;
      } else {
        sql += ` AND "status" = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
    }
    
    if (scope) {
      if (Array.isArray(scope)) {
        sql += ` AND "scope" IN (${scope.map((_, i) => `$${paramIndex + i}`).join(', ')})`;
        params.push(...scope);
        paramIndex += scope.length;
      } else {
        sql += ` AND "scope" = $${paramIndex}`;
        params.push(scope);
        paramIndex++;
      }
    }
    
    if (merchantId) {
      sql += ` AND "merchantId" = $${paramIndex}`;
      params.push(merchantId);
      paramIndex++;
    }
    
    if (withCoupon !== undefined) {
      if (withCoupon) {
        sql += ` AND "coupon_id" IS NOT NULL`;
      } else {
        sql += ` AND "coupon_id" IS NULL`;
      }
    }
    
    if (startBefore) {
      sql += ` AND "start_date" <= $${paramIndex}`;
      params.push(startBefore);
      paramIndex++;
    }
    
    if (endAfter) {
      sql += ` AND ("end_date" IS NULL OR "end_date" >= $${paramIndex})`;
      params.push(endAfter);
      paramIndex++;
    }
    
    // Add ordering and pagination
    const dbOrderBy = orderBy === 'priority' ? 'priority' : 
                      orderBy === 'startDate' ? 'start_date' :
                      orderBy === 'endDate' ? 'end_date' :
                      orderBy === 'createdAt' ? 'created_at' : orderBy;
    
    sql += ` ORDER BY "${dbOrderBy}" ${direction}`;
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    return await query<Promotion[]>(sql, params) || [];
  }
  
  async findActivePromotions(
    scope?: PromotionScope | PromotionScope[],
    merchantId?: string
  ): Promise<Promotion[]> {
    const now = new Date();
    
    return this.findPromotions(
      {
        status: 'active',
        scope,
        merchantId,
        startBefore: now,
        endAfter: now
      },
      {
        orderBy: 'priority',
        direction: 'DESC'
      }
    );
  }
  
  async createPromotion(input: CreatePromotionInput): Promise<Promotion> {
    const {
      name,
      description,
      status,
      scope,
      priority,
      startDate,
      endDate,
      usageLimit,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      couponId,
      exclusive,
      merchantId,
      metadata,
      rules,
      actions
    } = input;
    
    const id = generateUUID();
    const now = new Date();
    
    // Begin transaction
    await query('BEGIN');
    
    try {
      // Insert promotion
      const promotion = await queryOne<Promotion>(
        `INSERT INTO "public"."promotion" (
          "id", "name", "description", "status", "scope", "priority",
          "start_date", "end_date", "usage_limit", "usage_count",
          "discount_type", "discount_value", "min_order_amount", "max_discount_amount",
          "coupon_id", "is_exclusive", "merchantId", "metadata", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        ) RETURNING 
          id,
          name,
          description,
          status,
          scope,
          priority,
          start_date AS "startDate",
          end_date AS "endDate",
          usage_limit AS "usageLimit",
          usage_count AS "usageCount",
          discount_type AS "discountType",
          discount_value AS "discountValue",
          min_order_amount AS "minOrderAmount",
          max_discount_amount AS "maxDiscountAmount",
          coupon_id AS "couponId",
          is_exclusive AS "exclusive",
          merchant_id AS "merchantId",
          metadata,
          created_at AS "createdAt",
          updated_at AS "updatedAt"`,
        [
          id,
          name,
          description || null,
          status,
          scope,
          priority,
          startDate,
          endDate || null,
          usageLimit || 0, // Default to 0 if null
          0, // Initial usage count
          discountType || null,
          discountValue || null,
          minOrderAmount || null,
          maxDiscountAmount || null,
          couponId || null,
          exclusive,
          merchantId || null,
          metadata ? JSON.stringify(metadata) : null,
          now,
          now
        ]
      );
      
      if (!promotion) {
        throw new Error('Failed to create promotion');
      }
      
      // Insert rules if provided
      if (rules && rules.length > 0) {
        for (const rule of rules) {
          await queryOne(
            `INSERT INTO "public"."promotion_rule" (
              "id", "promotion_id", "name", "condition", "operator", "value",
              "isActive", "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              generateUUID(),
              id,
              rule.name || null,
              rule.condition,
              rule.operator,
              JSON.stringify(rule.value),
              true,
              now,
              now
            ]
          );
        }
      }
      
      // Insert actions if provided
      if (actions && actions.length > 0) {
        for (const action of actions) {
          await queryOne(
            `INSERT INTO "public"."promotion_action" (
              "id", "promotion_id", "type", "value", "target_type", "target_id",
              "metadata", "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              generateUUID(),
              id,
              action.type,
              action.value,
              action.targetType || null,
              action.targetId || null,
              action.metadata ? JSON.stringify(action.metadata) : null,
              now,
              now
            ]
          );
        }
      }
      
      // Commit transaction
      await query('COMMIT');
      
      return promotion;
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      throw error;
    }
  }
  
  async updatePromotion(id: string, input: UpdatePromotionInput): Promise<Promotion> {
    const fieldsToUpdate = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    // Build the update query based on input fields
    if (input.name !== undefined) {
      fieldsToUpdate.push(`"name" = $${paramIndex++}`);
      params.push(input.name);
    }
    
    if (input.description !== undefined) {
      fieldsToUpdate.push(`"description" = $${paramIndex++}`);
      params.push(input.description || null);
    }
    
    if (input.status !== undefined) {
      fieldsToUpdate.push(`"status" = $${paramIndex++}`);
      params.push(input.status);
    }
    
    if (input.scope !== undefined) {
      fieldsToUpdate.push(`"scope" = $${paramIndex++}`);
      params.push(input.scope);
    }
    
    if (input.priority !== undefined) {
      fieldsToUpdate.push(`"priority" = $${paramIndex++}`);
      params.push(input.priority);
    }
    
    if (input.startDate !== undefined) {
      fieldsToUpdate.push(`"start_date" = $${paramIndex++}`);
      params.push(input.startDate);
    }
    
    if (input.endDate !== undefined) {
      fieldsToUpdate.push(`"end_date" = $${paramIndex++}`);
      params.push(input.endDate || null);
    }
    
    if (input.usageLimit !== undefined) {
      fieldsToUpdate.push(`"usage_limit" = $${paramIndex++}`);
      params.push(input.usageLimit || 0);
    }
    
    if (input.discountType !== undefined) {
      fieldsToUpdate.push(`"discount_type" = $${paramIndex++}`);
      params.push(input.discountType || null);
    }
    
    if (input.discountValue !== undefined) {
      fieldsToUpdate.push(`"discount_value" = $${paramIndex++}`);
      params.push(input.discountValue || null);
    }
    
    if (input.minOrderAmount !== undefined) {
      fieldsToUpdate.push(`"min_order_amount" = $${paramIndex++}`);
      params.push(input.minOrderAmount || null);
    }
    
    if (input.maxDiscountAmount !== undefined) {
      fieldsToUpdate.push(`"max_discount_amount" = $${paramIndex++}`);
      params.push(input.maxDiscountAmount || null);
    }
    
    if (input.couponId !== undefined) {
      fieldsToUpdate.push(`"coupon_id" = $${paramIndex++}`);
      params.push(input.couponId || null);
    }
    
    if (input.exclusive !== undefined) {
      fieldsToUpdate.push(`"is_exclusive" = $${paramIndex++}`);
      params.push(input.exclusive);
    }
    
    if (input.merchantId !== undefined) {
      fieldsToUpdate.push(`"merchantId" = $${paramIndex++}`);
      params.push(input.merchantId || null);
    }
    
    if (input.metadata !== undefined) {
      fieldsToUpdate.push(`"metadata" = $${paramIndex++}`);
      params.push(input.metadata ? JSON.stringify(input.metadata) : null);
    }
    
    // Add updated_at timestamp
    fieldsToUpdate.push(`"updatedAt" = $${paramIndex++}`);
    params.push(new Date());
    
    // No fields to update
    if (fieldsToUpdate.length === 0) {
      const promotion = await this.findPromotionById(id);
      if (!promotion) {
        throw new Error(`Promotion with id ${id} not found`);
      }
      return promotion;
    }
    
    // Update the promotion
    const updatedPromotion = await queryOne<Promotion>(
      `UPDATE "public"."promotion" SET ${fieldsToUpdate.join(', ')} 
      WHERE "id" = $1 
      RETURNING 
        id,
        name,
        description,
        status,
        scope,
        priority,
        start_date AS "startDate",
        end_date AS "endDate",
        usage_limit AS "usageLimit",
        usage_count AS "usageCount",
        discount_type AS "discountType",
        discount_value AS "discountValue",
        min_order_amount AS "minOrderAmount",
        max_discount_amount AS "maxDiscountAmount",
        coupon_id AS "couponId",
        is_exclusive AS "exclusive",
        merchant_id AS "merchantId",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      params
    );
    
    if (!updatedPromotion) {
      throw new Error('Failed to update promotion');
    }
    
    return updatedPromotion;
  }
  
  async deletePromotion(id: string): Promise<boolean> {
    // Begin transaction
    await query('BEGIN');
    
    try {
      // Delete related rules first
      await query('DELETE FROM "public"."promotion_rule" WHERE "promotion_id" = $1', [id]);
      
      // Delete related actions
      await query('DELETE FROM "public"."promotion_action" WHERE "promotion_id" = $1', [id]);
      
      // Delete promotion last
      const result = await query('DELETE FROM "public"."promotion" WHERE "id" = $1', [id]);
      
      // Commit transaction
      await query('COMMIT');
      
      return result !== null;
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      throw error;
    }
  }
  
  // RULE METHODS
  
  async findRulesByPromotionId(promotionId: string): Promise<PromotionRule[]> {
    return await query<PromotionRule[]>(
      `SELECT 
        id,
        promotion_id AS "promotionId",
        name,
        condition,
        operator,
        value,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM "public"."promotion_rule" 
      WHERE "promotion_id" = $1`,
      [promotionId]
    ) || [];
  }
  
  // ACTION METHODS
  
  async findActionsByPromotionId(promotionId: string): Promise<PromotionAction[]> {
    return await query<PromotionAction[]>(
      `SELECT 
        id,
        promotion_id AS "promotionId",
        type,
        value,
        target_type AS "targetType",
        target_id AS "targetId",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM "public"."promotion_action" 
      WHERE "promotion_id" = $1`,
      [promotionId]
    ) || [];
  }
  
  // USAGE METHODS
  
  async recordPromotionUsage(
    promotionId: string, 
    orderId: string, 
    customerId?: string,
    sessionId?: string,
    discountAmount: number = 0
  ): Promise<PromotionUsage> {
    // Begin transaction
    await query('BEGIN');
    
    try {
      // Insert usage record
      const usageRecord = await queryOne<PromotionUsage>(
        `INSERT INTO "public"."promotion_usage" (
          "id", "promotion_id", "orderId", "customerId", "session_id", 
          "discountAmount", "applied_at"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING 
          id,
          promotion_id AS "promotionId",
          order_id AS "orderId",
          customer_id AS "customerId",
          session_id AS "sessionId",
          discount_amount AS "discountAmount",
          applied_at AS "appliedAt",
          metadata`,
        [
          generateUUID(),
          promotionId,
          orderId,
          customerId || null,
          sessionId || null,
          discountAmount,
          new Date()
        ]
      );
      
      if (!usageRecord) {
        throw new Error('Failed to create promotion usage record');
      }
      
      // Update usage count on the promotion
      await query(
        `UPDATE "public"."promotion" 
        SET "usage_count" = "usage_count" + 1, "updatedAt" = $2 
        WHERE "id" = $1`,
        [promotionId, new Date()]
      );
      
      // Commit transaction
      await query('COMMIT');
      
      return usageRecord;
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      throw error;
    }
  }
  
  async getPromotionUsageCount(promotionId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM "public"."promotion_usage" WHERE "promotion_id" = $1',
      [promotionId]
    );
    
    return result ? parseInt(result.count) : 0;
  }
  
  // COMPOSITE METHODS
  
  async getPromotionWithDetails(id: string): Promise<{
    promotion: Promotion;
    rules: PromotionRule[];
    actions: PromotionAction[];
  } | null> {
    const promotion = await this.findPromotionById(id);
    
    if (!promotion) {
      return null;
    }
    
    const rules = await this.findRulesByPromotionId(id);
    const actions = await this.findActionsByPromotionId(id);
    
    return {
      promotion,
      rules,
      actions
    };
  }
  
  // BUSINESS LOGIC METHODS
  
  async isPromotionValidForOrder(
    promotionId: string,
    orderTotal: number,
    customerId?: string,
    items?: Array<{ productId: string; categoryId?: string; quantity: number; price: number; }>
  ): Promise<boolean> {
    const promotionDetails = await this.getPromotionWithDetails(promotionId);
    
    if (!promotionDetails) {
      return false;
    }
    
    const { promotion, rules } = promotionDetails;
    
    // Check if promotion is active
    if (promotion.status !== 'active') {
      return false;
    }
    
    // Check date range
    const now = new Date();
    if (promotion.startDate > now) {
      return false;
    }
    
    if (promotion.endDate && promotion.endDate < now) {
      return false;
    }
    
    // Check usage limit
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return false;
    }
    
    // Check minimum order amount
    if (promotion.minOrderAmount && orderTotal < promotion.minOrderAmount) {
      return false;
    }
    
    // If there are no rules, the promotion is valid
    if (!rules || rules.length === 0) {
      return true;
    }
    
    // Check each rule
    for (const rule of rules) {
      let ruleValid = false;
      
      switch (rule.condition) {
        case 'cart_total':
          ruleValid = this.evaluateCartTotalRule(rule, orderTotal);
          break;
          
        case 'item_quantity':
          if (items) {
            ruleValid = this.evaluateItemQuantityRule(rule, items);
          }
          break;
          
        case 'product_category':
          if (items) {
            ruleValid = this.evaluateProductCategoryRule(rule, items);
          }
          break;
          
        case 'customer_group':
          if (customerId) {
            ruleValid = await this.evaluateCustomerGroupRule(rule, customerId);
          }
          break;
          
        case 'first_order':
          if (customerId) {
            ruleValid = await this.evaluateFirstOrderRule(rule, customerId);
          }
          break;
          
        // Add other rule types as needed
        
        default:
          // If we don't recognize the rule type, consider it valid
          ruleValid = true;
      }
      
      // If any rule is invalid, the promotion is invalid
      if (!ruleValid) {
        return false;
      }
    }
    
    // All rules passed, the promotion is valid
    return true;
  }
  
  // Rule evaluation helpers
  evaluateCartTotalRule(rule: PromotionRule, cartTotal: number): boolean {
    const value = typeof rule.value === 'string' ? parseFloat(rule.value) : rule.value;
    
    switch (rule.operator) {
      case 'eq': return cartTotal === value;
      case 'neq': return cartTotal !== value;
      case 'gt': return cartTotal > value;
      case 'lt': return cartTotal < value;
      case 'gte': return cartTotal >= value;
      case 'lte': return cartTotal <= value;
      default: return false;
    }
  }
  
  evaluateItemQuantityRule(
    rule: PromotionRule, 
    items: Array<{ productId: string; quantity: number; }>
  ): boolean {
    const ruleValue = rule.value;
    const productId = ruleValue.productId;
    const quantity = typeof ruleValue.quantity === 'string' ? parseInt(ruleValue.quantity) : ruleValue.quantity;
    
    // If productId is specified, check quantity for that product
    if (productId) {
      const item = items.find(i => i.productId === productId);
      if (!item) return false;
      
      switch (rule.operator) {
        case 'eq': return item.quantity === quantity;
        case 'neq': return item.quantity !== quantity;
        case 'gt': return item.quantity > quantity;
        case 'lt': return item.quantity < quantity;
        case 'gte': return item.quantity >= quantity;
        case 'lte': return item.quantity <= quantity;
        default: return false;
      }
    }
    
    // Otherwise, sum up quantities of all items
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    
    switch (rule.operator) {
      case 'eq': return totalQuantity === quantity;
      case 'neq': return totalQuantity !== quantity;
      case 'gt': return totalQuantity > quantity;
      case 'lt': return totalQuantity < quantity;
      case 'gte': return totalQuantity >= quantity;
      case 'lte': return totalQuantity <= quantity;
      default: return false;
    }
  }
  
  evaluateProductCategoryRule(
    rule: PromotionRule, 
    items: Array<{ productId: string; categoryId?: string; }>
  ): boolean {
    const ruleValue = rule.value;
    const categoryId = ruleValue.categoryId;
    
    // Check if any item belongs to the specified category
    return items.some(item => item.categoryId === categoryId);
  }
  
  async evaluateCustomerGroupRule(rule: PromotionRule, customerId: string): Promise<boolean> {
    const ruleValue = rule.value;
    const groupId = ruleValue.groupId;
    
    // This would require a lookup to check if the customer belongs to a specific group
    // For now, we'll just return true as a placeholder
    // TODO: Implement actual customer group validation
    return true;
  }
  
  async evaluateFirstOrderRule(rule: PromotionRule, customerId: string): Promise<boolean> {
    // This would require a lookup to check if this is the customer's first order
    // For now, we'll just return true as a placeholder
    // TODO: Implement actual first order validation
    return true;
  }
}

export default new PromotionRepo();
