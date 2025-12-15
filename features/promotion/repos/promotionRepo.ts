import { query, queryOne } from "../../../libs/db";
import { Table, Promotion, PromotionRule, PromotionAction, PromotionUsage } from "../../../libs/db/types";
import { generateUUID } from "../../../libs/uuid";

// Table name constants
const PROMOTION_TABLE = Table.Promotion;
const PROMOTION_RULE_TABLE = Table.PromotionRule;
const PROMOTION_ACTION_TABLE = Table.PromotionAction;
const PROMOTION_USAGE_TABLE = Table.PromotionUsage;

/**
 * Promotion status types
 */
export type PromotionStatus = 'active' | 'scheduled' | 'expired' | 'disabled' | 'pendingApproval';

/**
 * Promotion scope types
 */
export type PromotionScope = 'cart' | 'product' | 'category' | 'merchant' | 'shipping' | 'global';

/**
 * Rule condition types
 */
export type RuleCondition = 'cartTotal' | 'itemQuantity' | 'productCategory' | 'customerGroup' | 'firstOrder' | 'dateRange' | 'timeOfDay' | 'dayOfWeek' | 'shippingMethod' | 'paymentMethod';

/**
 * Action types
 */
export type ActionType = 'discountByPercentage' | 'discountByAmount' | 'discountShipping' | 'freeItem';

/**
 * Input for creating a new promotion
 */
export interface CreatePromotionInput {
  name: string;
  description?: string;
  status?: PromotionStatus;
  scope: PromotionScope;
  priority?: number;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  isExclusive?: boolean;
  maxUsage?: number;
  maxUsagePerCustomer?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  merchantId?: string;
  isGlobal?: boolean;
  eligibleCustomerGroups?: string[];
  excludedCustomerGroups?: string[];
  rules?: CreateRuleInput[];
  actions?: CreateActionInput[];
}

/**
 * Input for creating a promotion rule
 */
export interface CreateRuleInput {
  name?: string;
  condition: RuleCondition;
  operator: string;
  value: any;
  isActive?: boolean;
}

/**
 * Input for creating a promotion action
 */
export interface CreateActionInput {
  type: ActionType;
  value: number;
  targetType?: string;
  targetId?: string;
  metadata?: any;
}

/**
 * Input for updating a promotion
 */
export type UpdatePromotionInput = Partial<Omit<CreatePromotionInput, 'rules' | 'actions'>>;

/**
 * Repository for managing promotions
 */
export class PromotionRepo {
  /**
   * Find a promotion by ID
   */
  async findById(id: string): Promise<Promotion | null> {
    return await queryOne<Promotion>(
      `SELECT * FROM "${PROMOTION_TABLE}" WHERE "promotionId" = $1`,
      [id]
    );
  }

  /**
   * Find promotions with filters
   */
  async findAll(
    filters: {
      status?: PromotionStatus | PromotionStatus[];
      scope?: PromotionScope | PromotionScope[];
      merchantId?: string;
      isActive?: boolean;
      isGlobal?: boolean;
      startBefore?: Date;
      endAfter?: Date;
    } = {},
    options: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      direction?: 'ASC' | 'DESC';
    } = {}
  ): Promise<Promotion[]> {
    const { status, scope, merchantId, isActive, isGlobal, startBefore, endAfter } = filters;
    const { limit = 50, offset = 0, orderBy = 'priority', direction = 'DESC' } = options;
    
    let sql = `SELECT * FROM "${PROMOTION_TABLE}" WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;
    
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
    
    if (isActive !== undefined) {
      sql += ` AND "isActive" = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }
    
    if (isGlobal !== undefined) {
      sql += ` AND "isGlobal" = $${paramIndex}`;
      params.push(isGlobal);
      paramIndex++;
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
    
    sql += ` ORDER BY "${orderBy}" ${direction} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    return await query<Promotion[]>(sql, params) || [];
  }
  
  /**
   * Find active promotions
   */
  async findActive(
    scope?: PromotionScope | PromotionScope[],
    merchantId?: string
  ): Promise<Promotion[]> {
    const now = new Date();
    
    return this.findAll(
      {
        status: 'active',
        scope,
        merchantId,
        isActive: true,
        startBefore: now,
        endAfter: now
      },
      {
        orderBy: 'priority',
        direction: 'DESC'
      }
    );
  }
  
  /**
   * Create a new promotion
   */
  async create(input: CreatePromotionInput): Promise<Promotion> {
    const now = new Date();
    
    // Begin transaction
    await query('BEGIN');
    
    try {
      const promotion = await queryOne<Promotion>(
        `INSERT INTO "${PROMOTION_TABLE}" (
          "name", "description", "status", "scope", "priority",
          "startDate", "endDate", "isActive", "isExclusive", "maxUsage",
          "usageCount", "maxUsagePerCustomer", "minOrderAmount", "maxDiscountAmount",
          "merchantId", "isGlobal", "eligibleCustomerGroups", "excludedCustomerGroups",
          "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        ) RETURNING *`,
        [
          input.name,
          input.description || null,
          input.status || 'active',
          input.scope,
          input.priority || 0,
          input.startDate || now,
          input.endDate || null,
          input.isActive !== false,
          input.isExclusive || false,
          input.maxUsage || null,
          0, // Initial usage count
          input.maxUsagePerCustomer || null,
          input.minOrderAmount || null,
          input.maxDiscountAmount || null,
          input.merchantId || null,
          input.isGlobal || false,
          input.eligibleCustomerGroups ? JSON.stringify(input.eligibleCustomerGroups) : null,
          input.excludedCustomerGroups ? JSON.stringify(input.excludedCustomerGroups) : null,
          now,
          now
        ]
      );
      
      if (!promotion) {
        throw new Error('Failed to create promotion');
      }
      
      // Insert rules if provided
      if (input.rules && input.rules.length > 0) {
        for (const rule of input.rules) {
          await this.createRule(promotion.promotionId, rule);
        }
      }
      
      // Insert actions if provided
      if (input.actions && input.actions.length > 0) {
        for (const action of input.actions) {
          await this.createAction(promotion.promotionId, action);
        }
      }
      
      await query('COMMIT');
      return promotion;
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }
  
  /**
   * Update an existing promotion
   */
  async update(id: string, input: UpdatePromotionInput): Promise<Promotion> {
    const updateFields: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    
    const allowedFields = [
      'name', 'description', 'status', 'scope', 'priority',
      'startDate', 'endDate', 'isActive', 'isExclusive', 'maxUsage',
      'maxUsagePerCustomer', 'minOrderAmount', 'maxDiscountAmount',
      'merchantId', 'isGlobal', 'eligibleCustomerGroups', 'excludedCustomerGroups'
    ];
    
    for (const [key, value] of Object.entries(input)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        if (['eligibleCustomerGroups', 'excludedCustomerGroups'].includes(key) && Array.isArray(value)) {
          params.push(JSON.stringify(value));
        } else {
          params.push(value);
        }
        paramIndex++;
      }
    }
    
    updateFields.push(`"updatedAt" = $${paramIndex}`);
    params.push(new Date());
    
    if (updateFields.length === 1) {
      const promotion = await this.findById(id);
      if (!promotion) {
        throw new Error(`Promotion with id ${id} not found`);
      }
      return promotion;
    }
    
    const promotion = await queryOne<Promotion>(
      `UPDATE "${PROMOTION_TABLE}" SET ${updateFields.join(', ')} 
       WHERE "promotionId" = $1 RETURNING *`,
      params
    );
    
    if (!promotion) {
      throw new Error(`Promotion with id ${id} not found`);
    }
    
    return promotion;
  }
  
  /**
   * Delete a promotion
   */
  async delete(id: string): Promise<boolean> {
    await query('BEGIN');
    
    try {
      await query(`DELETE FROM "${PROMOTION_RULE_TABLE}" WHERE "promotionId" = $1`, [id]);
      await query(`DELETE FROM "${PROMOTION_ACTION_TABLE}" WHERE "promotionId" = $1`, [id]);
      await query(`DELETE FROM "${PROMOTION_USAGE_TABLE}" WHERE "promotionId" = $1`, [id]);
      
      const result = await queryOne<{ promotionId: string }>(
        `DELETE FROM "${PROMOTION_TABLE}" WHERE "promotionId" = $1 RETURNING "promotionId"`,
        [id]
      );
      
      await query('COMMIT');
      return !!result;
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }
  
  // RULE METHODS
  
  /**
   * Create a promotion rule
   */
  async createRule(promotionId: string, input: CreateRuleInput): Promise<PromotionRule> {
    const now = new Date();
    
    const rule = await queryOne<PromotionRule>(
      `INSERT INTO "${PROMOTION_RULE_TABLE}" (
        "promotionId", "name", "condition", "operator", "value", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        promotionId,
        input.name || null,
        input.condition,
        input.operator,
        JSON.stringify(input.value),
        input.isActive !== false,
        now,
        now
      ]
    );
    
    if (!rule) {
      throw new Error('Failed to create promotion rule');
    }
    
    return rule;
  }
  
  /**
   * Find rules by promotion ID
   */
  async findRulesByPromotionId(promotionId: string): Promise<PromotionRule[]> {
    return await query<PromotionRule[]>(
      `SELECT * FROM "${PROMOTION_RULE_TABLE}" WHERE "promotionId" = $1`,
      [promotionId]
    ) || [];
  }
  
  /**
   * Delete a rule
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    const result = await queryOne<{ promotionRuleId: string }>(
      `DELETE FROM "${PROMOTION_RULE_TABLE}" WHERE "promotionRuleId" = $1 RETURNING "promotionRuleId"`,
      [ruleId]
    );
    return !!result;
  }
  
  // ACTION METHODS
  
  /**
   * Create a promotion action
   */
  async createAction(promotionId: string, input: CreateActionInput): Promise<PromotionAction> {
    const now = new Date();
    
    const action = await queryOne<PromotionAction>(
      `INSERT INTO "${PROMOTION_ACTION_TABLE}" (
        "promotionId", "type", "value", "targetType", "targetId", "metadata", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        promotionId,
        input.type,
        input.value,
        input.targetType || null,
        input.targetId || null,
        input.metadata ? JSON.stringify(input.metadata) : null,
        now,
        now
      ]
    );
    
    if (!action) {
      throw new Error('Failed to create promotion action');
    }
    
    return action;
  }
  
  /**
   * Find actions by promotion ID
   */
  async findActionsByPromotionId(promotionId: string): Promise<PromotionAction[]> {
    return await query<PromotionAction[]>(
      `SELECT * FROM "${PROMOTION_ACTION_TABLE}" WHERE "promotionId" = $1`,
      [promotionId]
    ) || [];
  }
  
  /**
   * Delete an action
   */
  async deleteAction(actionId: string): Promise<boolean> {
    const result = await queryOne<{ promotionActionId: string }>(
      `DELETE FROM "${PROMOTION_ACTION_TABLE}" WHERE "promotionActionId" = $1 RETURNING "promotionActionId"`,
      [actionId]
    );
    return !!result;
  }
  
  // USAGE METHODS
  
  /**
   * Record promotion usage
   */
  async recordUsage(
    promotionId: string, 
    orderId: string, 
    customerId?: string,
    discountAmount: number = 0,
    currencyCode: string = 'USD'
  ): Promise<PromotionUsage> {
    const now = new Date();
    
    await query('BEGIN');
    
    try {
      const usage = await queryOne<PromotionUsage>(
        `INSERT INTO "${PROMOTION_USAGE_TABLE}" (
          "promotionId", "orderId", "customerId", "discountAmount", "currencyCode", "usedAt", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [promotionId, orderId, customerId || null, discountAmount, currencyCode, now, now, now]
      );
      
      if (!usage) {
        throw new Error('Failed to record promotion usage');
      }
      
      await query(
        `UPDATE "${PROMOTION_TABLE}" SET "usageCount" = "usageCount" + 1, "updatedAt" = $2 WHERE "promotionId" = $1`,
        [promotionId, now]
      );
      
      await query('COMMIT');
      return usage;
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }
  
  /**
   * Get usage records for a promotion
   */
  async getUsage(promotionId: string): Promise<PromotionUsage[]> {
    return await query<PromotionUsage[]>(
      `SELECT * FROM "${PROMOTION_USAGE_TABLE}" WHERE "promotionId" = $1 ORDER BY "usedAt" DESC`,
      [promotionId]
    ) || [];
  }
  
  /**
   * Get usage count for a promotion
   */
  async getUsageCount(promotionId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "${PROMOTION_USAGE_TABLE}" WHERE "promotionId" = $1`,
      [promotionId]
    );
    return result ? parseInt(result.count) : 0;
  }
  
  // COMPOSITE METHODS
  
  /**
   * Get promotion with rules and actions
   */
  async getWithDetails(id: string): Promise<{
    promotion: Promotion;
    rules: PromotionRule[];
    actions: PromotionAction[];
  } | null> {
    const promotion = await this.findById(id);
    
    if (!promotion) {
      return null;
    }
    
    const [rules, actions] = await Promise.all([
      this.findRulesByPromotionId(id),
      this.findActionsByPromotionId(id)
    ]);
    
    return { promotion, rules, actions };
  }
  
  /**
   * Validate if a promotion can be applied
   */
  async isValidForOrder(
    promotionId: string,
    orderTotal: number,
    customerId?: string
  ): Promise<boolean> {
    const details = await this.getWithDetails(promotionId);
    
    if (!details) return false;
    
    const { promotion, rules } = details;
    
    // Check basic validity
    if (!promotion.isActive || promotion.status !== 'active') return false;
    
    const now = new Date();
    if (promotion.startDate > now) return false;
    if (promotion.endDate && promotion.endDate < now) return false;
    
    // Check usage limits
    if (promotion.maxUsage && promotion.usageCount >= promotion.maxUsage) return false;
    
    // Check minimum order amount
    if (promotion.minOrderAmount && orderTotal < Number(promotion.minOrderAmount)) return false;
    
    // Check per-customer limit if applicable
    if (customerId && promotion.maxUsagePerCustomer) {
      const customerUsage = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM "${PROMOTION_USAGE_TABLE}" WHERE "promotionId" = $1 AND "customerId" = $2`,
        [promotionId, customerId]
      );
      if (customerUsage && parseInt(customerUsage.count) >= promotion.maxUsagePerCustomer) {
        return false;
      }
    }
    
    // All basic checks passed
    return true;
  }
}

// Export singleton instance
export const promotionRepo = new PromotionRepo();
export default promotionRepo;
