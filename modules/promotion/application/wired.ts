import promotionRuleRepository, { type PromotionCart, type RuleCondition, type ActionType } from '../infrastructure/repositories/PromotionRuleRepository';
import promotionRepo, {
  CreatePromotionInput,
  PromotionScope,
  PromotionStatus,
  UpdatePromotionInput,
} from '../infrastructure/repositories/promotionRepo';
import {
  getGiftCardByCode,
  getGiftCards,
  redeemGiftCard as redeemGiftCardRepo,
  reloadGiftCard as reloadGiftCardRepo,
  activateGiftCard as activateGiftCardRepo,
  cancelGiftCard as cancelGiftCardRepo,
  createGiftCard as createGiftCardRepo,
  getGiftCard as getGiftCardRepo,
  getGiftCards as getGiftCardsRepo,
  getTransactions,
  refundToGiftCard as refundToGiftCardRepo,
  type GiftCardStatus,
  type GiftCardType,
  type DeliveryMethod,
  type PromotionGiftCardTransaction,
} from '../infrastructure/repositories/GiftCardRepository';
import couponDiscountRepository, {
  type CreateProductDiscountInput,
  type UpdateProductDiscountInput,
  type CreateCouponInput,
  type UpdateCouponInput,
  type PromotionCoupon,
  type PromotionCouponUsage,
} from '../infrastructure/repositories/CouponDiscountRepository';
import { PromotionGiftCard } from '../infrastructure';

export {
  promotionRuleRepository,
  type PromotionCart,
  type RuleCondition,
  type ActionType,
  promotionRepo,
  CreatePromotionInput,
  PromotionScope,
  PromotionStatus,
  UpdatePromotionInput,
  getGiftCardByCode,
  getGiftCards,
  redeemGiftCardRepo,
  reloadGiftCardRepo,
  activateGiftCardRepo,
  cancelGiftCardRepo,
  createGiftCardRepo,
  getGiftCardRepo,
  getGiftCardsRepo,
  getTransactions,
  refundToGiftCardRepo,
  type GiftCardStatus,
  type GiftCardType,
  type DeliveryMethod,
  type PromotionGiftCardTransaction,
  couponDiscountRepository,
  type CreateProductDiscountInput,
  type UpdateProductDiscountInput,
  type CreateCouponInput,
  type UpdateCouponInput,
  type PromotionCoupon,
  type PromotionCouponUsage,
};

export { PromotionGiftCard };

export * as giftCardRepo from '../infrastructure/repositories/GiftCardRepository';
