import { query, queryOne } from '../../../../libs/db';
import { withTransaction } from '../../../../libs/db';
import { Table, Promotion, PromotionRule, PromotionAction } from '../../../../libs/db/types';
import { FailedToCreatePromotionError, PromotionNotFoundError } from '../../domain/errors/PromotionErrors';
import type { Promotion as DbPromotion } from '../../../../libs/db/types';
import type { PromotionRule as DbPromotionRule } from '../../../../libs/db/types';
import type { PromotionAction as DbPromotionAction } from '../../../../libs/db/types';
import type { PromotionUsage as DbPromotionUsage } from '../../../../libs/db/types';
import {
  createRule as qCreateRule,
  findRulesByPromotionId as qFindRulesByPromotionId,
  deleteRule as qDeleteRule,
  createAction as qCreateAction,
  findActionsByPromotionId as qFindActionsByPromotionId,
  deleteAction as qDeleteAction,
} from './promotionRuleActionQueries';

// Table name constants
const PROMOTION_TABLE = Table.Promotion;
const PROMOTION_RULE_TABLE = Table.PromotionRule;
const PROMOTION_ACTION_TABLE = Table.PromotionAction;
const PROMOTION_USAGE_TABLE = 'promotionUsage';

// Transaction-scoped client passed by withTransaction.
type Tx = { queryOne<T>(text: string, params: Array<unknown>): Promise<T | null> };

/**
 * Promotion status types
 */
export type PromotionStatus = 'active' | 'scheduled' | 'expired' | 'disabled' | 'pendingApproval';

/**
 * Promotion scope types
 */
export type PromotionScope = 'cart' | 'product' | 'category' | 'organization' | 'shipping' | 'global';

export type PromotionUsage = {
  promotionUsageId: string;
  promotionId: string;
  orderId: string | null;
  customerId: string | null;
  discountAmountCents: number;
  currencyCode: string;
  usedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

import type { CreateRuleInput, CreateActionInput } from './promotionRepoTypes';
export { CreateRuleInput, CreateActionInput } from './promotionRepoTypes';
export type { RuleCondition, ActionType } from './promotionRepoTypes';

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
  stackability?: 'none' | 'stackable' | 'exclusive';
  maxUsage?: number;
  maxUsagePerCustomer?: number;
  minOrderAmountCents?: number;
  maxDiscountAmountCents?: number;
  organizationId?: string;
  isGlobal?: boolean;
  eligibleCustomerGroups?: string[];
  excludedCustomerGroups?: string[];
  rules?: CreateRuleInput[];
  actions?: CreateActionInput[];
}

/**
 * Input for updating a promotion
 */
export type UpdatePromotionInput = Partial<Omit<CreatePromotionInput, 'rules' | 'actions'>>;

/**
 * Repository for managing promotions
 */
class PromotionRepo {
  /**
   * Find a promotion by ID
   */
  async findById(id: string): Promise<Promotion | null> {
    return await queryOne<DbPromotion>(`SELECT * FROM "${PROMOTION_TABLE}" WHERE "promotionId" = $1`, [id]);
  }

  /**
   * Find promotions with filters
   */
  async findAll(
    filters: {
      status?: PromotionStatus | PromotionStatus[];
      scope?: PromotionScope | PromotionScope[];
      organizationId?: string;
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
    } = {},
  ): Promise<Promotion[]> {
    const { status, scope, organizationId, isActive, isGlobal, startBefore, endAfter } = filters;
    const { limit = 50, offset = 0, orderBy = 'priority', direction = 'DESC' } = options;

    let sql = `SELECT * FROM "${PROMOTION_TABLE}" WHERE 1=1`;
    const params: unknown[] = [];
    let paramIndex = 1;

    const nextIndex = () => `$${paramIndex++}`;
    const addScalarOrIn = (column: string, value: string | string[] | undefined) => {
      if (!value) return;
      if (Array.isArray(value)) {
        sql += ` AND ${column} IN (${value.map(() => nextIndex()).join(', ')})`;
        params.push(...value);
      } else {
        sql += ` AND ${column} = ${nextIndex()}`;
        params.push(value);
      }
    };
    const addEquals = (column: string, value: unknown) => {
      if (value === undefined) return;
      sql += ` AND ${column} = ${nextIndex()}`;
      params.push(value);
    };

    addScalarOrIn('"status"', status);
    addScalarOrIn('"scope"', scope);
    addScalarOrIn('"organizationId"', organizationId);
    addEquals('"isActive"', isActive);
    addEquals('"isGlobal"', isGlobal);

    if (startBefore) {
      sql += ` AND "startDate" <= ${nextIndex()}`;
      params.push(startBefore);
    }

    if (endAfter) {
      sql += ` AND ("endDate" IS NULL OR "endDate" >= ${nextIndex()})`;
      params.push(endAfter);
    }

    sql += ` ORDER BY "${orderBy}" ${direction} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    return (await query<DbPromotion[]>(sql, params)) || [];
  }

  /**
   * Find active promotions
   */
  async findActive(scope?: PromotionScope | PromotionScope[], organizationId?: string): Promise<Promotion[]> {
    const now = new Date();

    return this.findAll(
      {
        status: 'active',
        scope,
        organizationId,
        isActive: true,
        startBefore: now,
        endAfter: now,
      },
      {
        orderBy: 'priority',
        direction: 'DESC',
      },
    );
  }

  /**
   * Create a new promotion
   */
  async create(input: CreatePromotionInput): Promise<Promotion> {
    const now = new Date();

    return withTransaction(async tx => {
      const promotion = await this.insertPromotion(tx, input, now);
      await this.insertPromotionRules(tx, promotion.promotionId, input.rules, now);
      await this.insertPromotionActions(tx, promotion.promotionId, input.actions, now);
      return promotion;
    });
  }

  private async insertPromotion(tx: Tx, input: CreatePromotionInput, now: Date): Promise<DbPromotion> {
    const v = this.promotionRowValues(input);
    const promotion = await tx.queryOne<DbPromotion>(
      `INSERT INTO "${PROMOTION_TABLE}" (
          "name", "description", "status", "scope", "priority",
          "startDate", "endDate", "isActive", "isExclusive", "stackability", "maxUsage",
          "usageCount", "maxUsagePerCustomer", "minOrderAmountCents", "maxDiscountAmountCents",
          "organizationId", "isGlobal", "eligibleCustomerGroups", "excludedCustomerGroups",
          "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) RETURNING *`,
      [
        v.name,
        v.description,
        v.status,
        v.scope,
        v.priority,
        v.startDate || now,
        v.endDate,
        v.isActive,
        v.isExclusive,
        v.stackability,
        v.maxUsage,
        0, // Initial usage count
        v.maxUsagePerCustomer,
        v.minOrderAmountCents,
        v.maxDiscountAmountCents,
        v.organizationId,
        v.isGlobal,
        v.eligibleCustomerGroups,
        v.excludedCustomerGroups,
        now,
        now,
      ],
    );

    if (!promotion) {
      throw new FailedToCreatePromotionError();
    }
    return promotion;
  }

  private promotionRowValues(input: CreatePromotionInput) {
    return { ...this.promotionCoreValues(input), ...this.promotionScopeValues(input) };
  }

  private promotionCoreValues(input: CreatePromotionInput) {
    return {
      name: input.name,
      description: input.description || null,
      status: input.status || 'active',
      scope: input.scope,
      priority: input.priority || 0,
      startDate: input.startDate,
      endDate: input.endDate || null,
      isActive: input.isActive !== false,
      isExclusive: input.isExclusive || false,
      stackability: input.stackability || (input.isExclusive ? 'exclusive' : 'stackable'),
    };
  }

  private promotionScopeValues(input: CreatePromotionInput) {
    return {
      maxUsage: input.maxUsage || null,
      maxUsagePerCustomer: input.maxUsagePerCustomer || null,
      minOrderAmountCents: input.minOrderAmountCents || null,
      maxDiscountAmountCents: input.maxDiscountAmountCents || null,
      organizationId: input.organizationId || null,
      isGlobal: input.isGlobal || false,
      eligibleCustomerGroups: input.eligibleCustomerGroups ? JSON.stringify(input.eligibleCustomerGroups) : null,
      excludedCustomerGroups: input.excludedCustomerGroups ? JSON.stringify(input.excludedCustomerGroups) : null,
    };
  }

  // Insert rules if provided
  private async insertPromotionRules(tx: Tx, promotionId: string, rules: CreatePromotionInput['rules'], now: Date): Promise<void> {
    if (!rules || rules.length === 0) return;
    for (const rule of rules) {
      await tx.queryOne<DbPromotionRule>(
        `INSERT INTO "${PROMOTION_RULE_TABLE}" (
              "promotionId", "name", "condition", "operator", "value", "isActive", "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [promotionId, rule.name || null, rule.condition, rule.operator, JSON.stringify(rule.value), rule.isActive !== false, now, now],
      );
    }
  }

  // Insert actions if provided
  private async insertPromotionActions(tx: Tx, promotionId: string, actions: CreatePromotionInput['actions'], now: Date): Promise<void> {
    if (!actions || actions.length === 0) return;
    for (const action of actions) {
      await tx.queryOne<DbPromotionAction>(
        `INSERT INTO "${PROMOTION_ACTION_TABLE}" (
              "promotionId", "actionType", "value", "targetType", "targetIds", "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          promotionId,
          action.type,
          JSON.stringify(action.value),
          action.targetType || null,
          action.targetId ? JSON.stringify([action.targetId]) : null,
          now,
          now,
        ],
      );
    }
  }

  /**
   * Update an existing promotion
   */
  async update(id: string, input: UpdatePromotionInput): Promise<Promotion> {
    const updateFields: string[] = [];
    const params: unknown[] = [id];
    let paramIndex = 2;

    const allowedFields = [
      'name',
      'description',
      'status',
      'scope',
      'priority',
      'startDate',
      'endDate',
      'isActive',
      'isExclusive',
      'stackability',
      'maxUsage',
      'maxUsagePerCustomer',
      'minOrderAmountCents',
      'maxDiscountAmountCents',
      'organizationId',
      'isGlobal',
      'eligibleCustomerGroups',
      'excludedCustomerGroups',
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
        throw new PromotionNotFoundError(id);
      }
      return promotion;
    }

    const promotion = await queryOne<DbPromotion>(
      `UPDATE "${PROMOTION_TABLE}" SET ${updateFields.join(', ')} 
       WHERE "promotionId" = $1 RETURNING *`,
      params,
    );

    if (!promotion) {
      throw new PromotionNotFoundError(id);
    }

    return promotion;
  }

  /**
   * Delete a promotion
   */
  async delete(id: string): Promise<boolean> {
    return withTransaction(async tx => {
      await tx.query(`DELETE FROM "${PROMOTION_RULE_TABLE}" WHERE "promotionId" = $1`, [id]);
      await tx.query(`DELETE FROM "${PROMOTION_ACTION_TABLE}" WHERE "promotionId" = $1`, [id]);
      await tx.query(`DELETE FROM "${PROMOTION_USAGE_TABLE}" WHERE "promotionId" = $1`, [id]);

      const result = await tx.queryOne<{ promotionId: string }>(
        `DELETE FROM "${PROMOTION_TABLE}" WHERE "promotionId" = $1 RETURNING "promotionId"`,
        [id],
      );

      return !!result;
    });
  }

  // RULE METHODS

  /**
   * Create a promotion rule
   */
  async createRule(promotionId: string, input: CreateRuleInput): Promise<PromotionRule> {
    return qCreateRule(promotionId, input);
  }

  /**
   * Find rules by promotion ID
   */
  async findRulesByPromotionId(promotionId: string): Promise<PromotionRule[]> {
    return qFindRulesByPromotionId(promotionId);
  }

  /**
   * Delete a rule
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    return qDeleteRule(ruleId);
  }

  /**
   * Create a promotion action
   */
  async createAction(promotionId: string, input: CreateActionInput): Promise<PromotionAction> {
    return qCreateAction(promotionId, input);
  }

  /**
   * Find actions by promotion ID
   */
  async findActionsByPromotionId(promotionId: string): Promise<PromotionAction[]> {
    return qFindActionsByPromotionId(promotionId);
  }

  /**
   * Delete an action
   */
  async deleteAction(actionId: string): Promise<boolean> {
    return qDeleteAction(actionId);
  }

  // USAGE METHODS

  /**
   * Record promotion usage
   */
  async recordUsage(
    promotionId: string,
    orderId: string,
    customerId?: string,
    discountAmountCents: number = 0,
    currencyCode: string = 'USD',
  ): Promise<PromotionUsage> {
    const now = new Date();

    return withTransaction(async tx => {
      const usage = await tx.queryOne<DbPromotionUsage>(
        `INSERT INTO "${PROMOTION_USAGE_TABLE}" (
          "promotionId", "orderId", "customerId", "discountAmountCents", "currencyCode", "usedAt", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [promotionId, orderId, customerId || null, discountAmountCents, currencyCode, now, now, now],
      );

      if (!usage) {
        throw new FailedToCreatePromotionError('Failed to record promotion usage');
      }

      await tx.query(`UPDATE "${PROMOTION_TABLE}" SET "usageCount" = "usageCount" + 1, "updatedAt" = $2 WHERE "promotionId" = $1`, [
        promotionId,
        now,
      ]);

      return usage;
    });
  }

  /**
   * Get usage records for a promotion
   */
  async getUsage(promotionId: string): Promise<PromotionUsage[]> {
    return (
      (await query<DbPromotionUsage[]>(`SELECT * FROM "${PROMOTION_USAGE_TABLE}" WHERE "promotionId" = $1 ORDER BY "usedAt" DESC`, [
        promotionId,
      ])) || []
    );
  }

  /**
   * Get usage count for a promotion
   */
  async getUsageCount(promotionId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "${PROMOTION_USAGE_TABLE}" WHERE "promotionId" = $1`, [
      promotionId,
    ]);
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

    const [rules, actions] = await Promise.all([this.findRulesByPromotionId(id), this.findActionsByPromotionId(id)]);

    return { promotion, rules, actions };
  }

  /**
   * Validate if a promotion can be applied
   */
  async isValidForOrder(promotionId: string, orderTotalCents: number, customerId?: string): Promise<boolean> {
    const details = await this.getWithDetails(promotionId);

    if (!details) return false;

    const { promotion, rules: _rules } = details;

    // Check basic validity
    if (!promotion.isActive || promotion.status !== 'active') return false;

    const now = new Date();
    if (promotion.startDate > now) return false;
    if (promotion.endDate && promotion.endDate < now) return false;

    // Check usage limits
    if (promotion.maxUsage && promotion.usageCount >= promotion.maxUsage) return false;

    // Check minimum order amount
    if (promotion.minOrderAmountCents && orderTotalCents < Number(promotion.minOrderAmountCents)) return false;

    // Check per-customer limit if applicable
    if (customerId && promotion.maxUsagePerCustomer) {
      const customerUsage = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM "${PROMOTION_USAGE_TABLE}" WHERE "promotionId" = $1 AND "customerId" = $2`,
        [promotionId, customerId],
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
export default new PromotionRepo();
