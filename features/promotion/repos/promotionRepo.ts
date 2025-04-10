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
      'SELECT * FROM "public"."promotion" WHERE "id" = $1',
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
    
    let sql = 'SELECT * FROM "public"."promotion" WHERE 1=1';
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
        sql += ` AND "couponId" IS NOT NULL`;
      } else {
        sql += ` AND "couponId" IS NULL`;
      }
    }
    
    if (startBefore) {
      sql += ` AND "startDate" <= $${paramIndex}`;
      params.push(startBefore);
      paramIndex++;
    }
    
    if (endAfter) {
      sql += ` AND ("endDate" IS NULL OR "endDate" >= $${paramIndex})`;
      params.push(endAfter);
      paramIndex++;
    }
    
    // Add ordering and pagination
    sql += ` ORDER BY "${orderBy}" ${direction} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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
          "startDate", "endDate", "usageLimit", "usageCount",
          "discountType", "discountValue", "minOrderAmount", "maxDiscountAmount",
          "couponId", "exclusive", "merchantId", "metadata", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        ) RETURNING *`,
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
              "id", "promotionId", "name", "condition", "operator", "value",
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
              "id", "promotionId", "type", "value", "targetType", "targetId",
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
    const updateFields: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    // Build dynamic update query
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined && !['rules', 'actions'].includes(key)) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        
        // Handle JSON metadata
        if (key === 'metadata' && typeof value === 'object') {
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
    
    // Begin transaction
    await query('BEGIN');
    
    try {
      // Update promotion
      const promotion = await queryOne<Promotion>(
        `UPDATE "public"."promotion" 
         SET ${updateFields.join(', ')} 
         WHERE "id" = $1 
         RETURNING *`,
        params
      );
      
      if (!promotion) {
        throw new Error(`Promotion with ID ${id} not found`);
      }
      
      // Update rules if provided
      if (input.rules) {
        // First, delete existing rules for this promotion
        await query('DELETE FROM "public"."promotion_rule" WHERE "promotionId" = $1', [id]);
        
        // Then insert new rules
        for (const rule of input.rules) {
          await queryOne(
            `INSERT INTO "public"."promotion_rule" (
              "id", "promotionId", "name", "condition", "operator", "value",
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
              new Date(),
              new Date()
            ]
          );
        }
      }
      
      // Update actions if provided
      if (input.actions) {
        // First, delete existing actions for this promotion
        await query('DELETE FROM "public"."promotion_action" WHERE "promotionId" = $1', [id]);
        
        // Then insert new actions
        for (const action of input.actions) {
          await queryOne(
            `INSERT INTO "public"."promotion_action" (
              "id", "promotionId", "type", "value", "targetType", "targetId",
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
              new Date(),
              new Date()
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
  
  async deletePromotion(id: string): Promise<boolean> {
    // Begin transaction
    await query('BEGIN');
    
    try {
      // Delete related rules
      await query('DELETE FROM "public"."promotion_rule" WHERE "promotionId" = $1', [id]);
      
      // Delete related actions
      await query('DELETE FROM "public"."promotion_action" WHERE "promotionId" = $1', [id]);
      
      // Delete promotion usage records
      await query('DELETE FROM "public"."promotion_usage" WHERE "promotionId" = $1', [id]);
      
      // Delete promotion
      const result = await queryOne<{ id: string }>(
        'DELETE FROM "public"."promotion" WHERE "id" = $1 RETURNING "id"',
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
  
  // PROMOTION RULES METHODS
  
  async findRulesByPromotionId(promotionId: string): Promise<PromotionRule[]> {
    return await query<PromotionRule[]>(
      'SELECT * FROM "public"."promotion_rule" WHERE "promotionId" = $1',
      [promotionId]
    ) || [];
  }
  
  // PROMOTION ACTIONS METHODS
  
  async findActionsByPromotionId(promotionId: string): Promise<PromotionAction[]> {
    return await query<PromotionAction[]>(
      'SELECT * FROM "public"."promotion_action" WHERE "promotionId" = $1',
      [promotionId]
    ) || [];
  }
  
  // PROMOTION USAGE METHODS
  
  async recordPromotionUsage(
    promotionId: string, 
    orderId: string, 
    customerId?: string,
    sessionId?: string,
    discountAmount: number = 0
  ): Promise<PromotionUsage> {
    const id = generateUUID();
    const now = new Date();
    
    // Begin transaction
    await query('BEGIN');
    
    try {
      // Insert usage record
      const usage = await queryOne<PromotionUsage>(
        `INSERT INTO "public"."promotion_usage" (
          "id", "promotionId", "orderId", "customerId", "sessionId",
          "discountAmount", "appliedAt", "metadata"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          id,
          promotionId,
          orderId,
          customerId || null,
          sessionId || null,
          discountAmount,
          now,
          null
        ]
      );
      
      if (!usage) {
        throw new Error('Failed to record promotion usage');
      }
      
      // Increment usage count on promotion
      await query(
        'UPDATE "public"."promotion" SET "usageCount" = "usageCount" + 1 WHERE "id" = $1',
        [promotionId]
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
  
  async getPromotionUsageCount(promotionId: string): Promise<number> {
    const result = await queryOne<{count: string}>(
      'SELECT COUNT(*) as count FROM "public"."promotion_usage" WHERE "promotionId" = $1',
      [promotionId]
    );
    
    return result ? parseInt(result.count) : 0;
  }
  
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
  
  // HELPER METHODS
  
  async isPromotionValidForOrder(
    promotionId: string,
    orderTotal: number,
    customerId?: string,
    items?: Array<{ productId: string; categoryId?: string; quantity: number; price: number; }>
  ): Promise<boolean> {
    // Get promotion with rules
    const promotionData = await this.getPromotionWithDetails(promotionId);
    
    if (!promotionData) {
      return false;
    }
    
    const { promotion, rules } = promotionData;
    
    // Check basic validity
    const now = new Date();
    
    // Check dates
    if (now < promotion.startDate || (promotion.endDate && now > promotion.endDate)) {
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
    
    // Check rules if they exist
    if (rules.length > 0) {
      // All rules must be satisfied
      for (const rule of rules) {
        if (!rule.isActive) continue;
        
        // Evaluate each rule based on condition
        switch (rule.condition) {
          case 'cart_total':
            if (!this.evaluateCartTotalRule(rule, orderTotal)) {
              return false;
            }
            break;
            
          case 'item_quantity':
            if (!items || !this.evaluateItemQuantityRule(rule, items)) {
              return false;
            }
            break;
            
          case 'product_category':
            if (!items || !this.evaluateProductCategoryRule(rule, items)) {
              return false;
            }
            break;
            
          case 'customer_group':
            if (!customerId || !await this.evaluateCustomerGroupRule(rule, customerId)) {
              return false;
            }
            break;
            
          case 'first_order':
            if (!customerId || !await this.evaluateFirstOrderRule(rule, customerId)) {
              return false;
            }
            break;
            
          // Additional rule evaluations would go here
          
          default:
            // Unknown rule type, consider it not satisfied
            return false;
        }
      }
    }
    
    // All checks passed
    return true;
  }
  
  // Rule evaluation helpers
  private evaluateCartTotalRule(rule: PromotionRule, cartTotal: number): boolean {
    const value = typeof rule.value === 'string' ? JSON.parse(rule.value) : rule.value;
    
    switch (rule.operator) {
      case 'eq': return cartTotal === value;
      case 'gt': return cartTotal > value;
      case 'gte': return cartTotal >= value;
      case 'lt': return cartTotal < value;
      case 'lte': return cartTotal <= value;
      default: return false;
    }
  }
  
  private evaluateItemQuantityRule(
    rule: PromotionRule, 
    items: Array<{ productId: string; quantity: number; }>
  ): boolean {
    const value = typeof rule.value === 'string' ? JSON.parse(rule.value) : rule.value;
    
    // If value contains a productId, check quantity for that specific product
    if (value.productId) {
      const item = items.find(i => i.productId === value.productId);
      if (!item) return false;
      
      switch (rule.operator) {
        case 'eq': return item.quantity === value.quantity;
        case 'gt': return item.quantity > value.quantity;
        case 'gte': return item.quantity >= value.quantity;
        case 'lt': return item.quantity < value.quantity;
        case 'lte': return item.quantity <= value.quantity;
        default: return false;
      }
    } else {
      // Check total quantity across all items
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      
      switch (rule.operator) {
        case 'eq': return totalQuantity === value.quantity;
        case 'gt': return totalQuantity > value.quantity;
        case 'gte': return totalQuantity >= value.quantity;
        case 'lt': return totalQuantity < value.quantity;
        case 'lte': return totalQuantity <= value.quantity;
        default: return false;
      }
    }
  }
  
  private evaluateProductCategoryRule(
    rule: PromotionRule, 
    items: Array<{ productId: string; categoryId?: string; }>
  ): boolean {
    const value = typeof rule.value === 'string' ? JSON.parse(rule.value) : rule.value;
    const categoryId = value.categoryId;
    
    if (!categoryId) return false;
    
    // Check if any item is in the specified category
    return items.some(item => item.categoryId === categoryId);
  }
  
  private async evaluateCustomerGroupRule(rule: PromotionRule, customerId: string): Promise<boolean> {
    const value = typeof rule.value === 'string' ? JSON.parse(rule.value) : rule.value;
    const groupId = value.customerGroupId;
    
    if (!groupId) return false;
    
    // Check if customer belongs to the specified group
    const result = await queryOne<{exists: boolean}>(
      'SELECT EXISTS(SELECT 1 FROM "public"."customer_group_member" WHERE "customerId" = $1 AND "groupId" = $2) as exists',
      [customerId, groupId]
    );
    
    return result ? result.exists : false;
  }
  
  private async evaluateFirstOrderRule(rule: PromotionRule, customerId: string): Promise<boolean> {
    // Check if customer has any previous orders
    const result = await queryOne<{count: string}>(
      'SELECT COUNT(*) as count FROM "public"."order" WHERE "customerId" = $1',
      [customerId]
    );
    
    const orderCount = result ? parseInt(result.count) : 0;
    
    // Rule is satisfied if this is the first order
    return orderCount === 0;
  }
}

export default new PromotionRepo();
