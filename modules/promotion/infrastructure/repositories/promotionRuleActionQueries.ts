/**
 * Promotion rule / action CRUD — extracted from promotionRepo.
 */

import { query, queryOne } from '../../../../libs/db';
import { Table, PromotionRule, PromotionAction } from '../../../../libs/db/types';
import { FailedToCreatePromotionError } from '../../domain/errors/PromotionErrors';
import type { PromotionRule as DbPromotionRule } from '../../../../libs/db/types';
import type { PromotionAction as DbPromotionAction } from '../../../../libs/db/types';
import type { CreateRuleInput, CreateActionInput } from './promotionRepoTypes';

const PROMOTION_RULE_TABLE = Table.PromotionRule;
const PROMOTION_ACTION_TABLE = Table.PromotionAction;

/**
 * Create a promotion rule
 */
export async function createRule(promotionId: string, input: CreateRuleInput): Promise<PromotionRule> {
  const now = new Date();

  const rule = await queryOne<DbPromotionRule>(
    `INSERT INTO "${PROMOTION_RULE_TABLE}" (
      "promotionId", "name", "condition", "operator", "value", "isActive", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [promotionId, input.name || null, input.condition, input.operator, JSON.stringify(input.value), input.isActive !== false, now, now],
  );

  if (!rule) {
    throw new FailedToCreatePromotionError('Failed to create promotion rule');
  }

  return rule;
}

/**
 * Find rules by promotion ID
 */
export async function findRulesByPromotionId(promotionId: string): Promise<PromotionRule[]> {
  return (await query<DbPromotionRule[]>(`SELECT * FROM "${PROMOTION_RULE_TABLE}" WHERE "promotionId" = $1`, [promotionId])) || [];
}

/**
 * Delete a rule
 */
export async function deleteRule(ruleId: string): Promise<boolean> {
  const result = await queryOne<{ promotionRuleId: string }>(
    `DELETE FROM "${PROMOTION_RULE_TABLE}" WHERE "promotionRuleId" = $1 RETURNING "promotionRuleId"`,
    [ruleId],
  );
  return !!result;
}

/**
 * Create a promotion action
 */
export async function createAction(promotionId: string, input: CreateActionInput): Promise<PromotionAction> {
  const now = new Date();

  const action = await queryOne<DbPromotionAction>(
    `INSERT INTO "${PROMOTION_ACTION_TABLE}" (
      "promotionId", "actionType", "value", "targetType", "targetIds", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      promotionId,
      input.type,
      JSON.stringify(input.value),
      input.targetType || null,
      input.targetId ? JSON.stringify([input.targetId]) : null,
      now,
      now,
    ],
  );

  if (!action) {
    throw new FailedToCreatePromotionError('Failed to create promotion action');
  }

  return action;
}

/**
 * Find actions by promotion ID
 */
export async function findActionsByPromotionId(promotionId: string): Promise<PromotionAction[]> {
  return (await query<DbPromotionAction[]>(`SELECT * FROM "${PROMOTION_ACTION_TABLE}" WHERE "promotionId" = $1`, [promotionId])) || [];
}

/**
 * Delete an action
 */
export async function deleteAction(actionId: string): Promise<boolean> {
  const result = await queryOne<{ promotionActionId: string }>(
    `DELETE FROM "${PROMOTION_ACTION_TABLE}" WHERE "promotionActionId" = $1 RETURNING "promotionActionId"`,
    [actionId],
  );
  return !!result;
}

