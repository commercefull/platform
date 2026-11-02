/**
 * Promotion rule/action types — shared between promotionRepo and its query helpers.
 */

/**
 * Rule condition types
 */
export type RuleCondition =
  | 'cartTotal'
  | 'itemQuantity'
  | 'productCategory'
  | 'customerGroup'
  | 'firstOrder'
  | 'dateRange'
  | 'timeOfDay'
  | 'dayOfWeek'
  | 'shippingMethod'
  | 'paymentMethod';

/**
 * Action types
 */
export type ActionType = 'discountByPercentage' | 'discountByAmount' | 'discountShipping' | 'freeItem' | 'discountByTier' | 'freeGift';


/**
 * Input for creating a promotion rule
 */
export interface CreateRuleInput {
  name?: string;
  condition: RuleCondition;
  operator: string;
  value: unknown;
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
  metadata?: unknown;
}

