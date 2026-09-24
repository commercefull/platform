/**
 * Promotion Model — record types for the active rule/action-based
 * promotion system (`promotion` / `promotionRule` / `promotionAction` tables).
 *
 * These are the domain types consumed by `PromotionRepository`,
 * `PromotionEvaluator`, and `EvaluatePromotionsUseCase`. Record shapes match
 * the database schema; infrastructure implementations return DB rows that are
 * structurally identical.
 *
 * NOTE: `Promotion` here is the rule-model record — NOT the deprecated
 * `Promotion` aggregate class in `./Promotion.ts` (kept for backward
 * compatibility only). New code should use this model.
 */

export interface Promotion {
  promotionId: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string | null;
  status: string;
  scope: string;
  priority: number;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  isExclusive: boolean;
  stackability: string;
  maxUsage: number | null;
  usageCount: number;
  maxUsagePerCustomer: number | null;
  minOrderAmountCents: number | null;
  maxDiscountAmountCents: number | null;
  organizationId: string | null;
  isGlobal: boolean;
  eligibleCustomerGroups: unknown | null;
  excludedCustomerGroups: unknown | null;
  deletedAt: Date | null;
}

export interface PromotionRule {
  promotionRuleId: string;
  createdAt: Date;
  updatedAt: Date;
  promotionId: string;
  name: string | null;
  description: string | null;
  condition: string;
  operator: string;
  value: unknown;
  isActive: boolean;
  isRequired: boolean;
  ruleGroup: string | null;
  sortOrder: number;
}

export interface PromotionAction {
  promotionActionId: string;
  createdAt: Date;
  updatedAt: Date;
  promotionId: string;
  name: string | null;
  description: string | null;
  actionType: string;
  value: unknown;
  targetType: string | null;
  targetIds: unknown | null;
  sortOrder: number;
}
