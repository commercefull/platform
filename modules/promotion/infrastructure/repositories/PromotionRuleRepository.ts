/**
 * Consolidated Promotion Rule Repository
 *
 * Merges promotionRepo, cartRepo, and categoryRepo into a single
 * aggregate-aligned repository.
 *
 * Aggregate: Promotion Rule (promotion engine — rules, conditions, actions, cart/category scoping)
 */

import promotionRepo from './promotionRepo';
import { PromotionCartRepo } from './cartRepo';
import { PromotionCategoryRepo } from './categoryRepo';

// Re-export types for backward compatibility
export type {
  PromotionStatus,
  PromotionScope,
  PromotionUsage,
  RuleCondition,
  ActionType,
  CreatePromotionInput,
  CreateRuleInput,
  CreateActionInput,
  UpdatePromotionInput,
} from './promotionRepo';
export type { PromotionCart } from './cartRepo';
export type { PromotionCategory } from './categoryRepo';

const cartRepoInstance = new PromotionCartRepo();
const categoryRepoInstance = new PromotionCategoryRepo();

class PromotionRuleRepository {
  readonly promotions = promotionRepo;
  readonly carts = cartRepoInstance;
  readonly categories = categoryRepoInstance;
}

export default new PromotionRuleRepository();
