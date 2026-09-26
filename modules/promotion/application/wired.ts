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
  assignGiftCard as assignGiftCardRepo,
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
import * as giftCardRepository from '../infrastructure/repositories/GiftCardRepository';
import { ValidateCouponUseCase } from './useCases/ValidateCoupon';
import { RedeemCouponUseCase } from './useCases/RedeemCoupon';
import { ApplyProductDiscountUseCase } from './useCases/ApplyProductDiscount';
import { CheckGiftCardBalanceUseCase } from './useCases/CheckGiftCardBalance';
import { RedeemGiftCardUseCase } from './useCases/RedeemGiftCard';
import { ManagePromotionsUseCase } from './useCases/ManagePromotions';
import { ManageCouponsUseCase } from './useCases/ManageCoupons';
import { ManageGiftCardsUseCase } from './useCases/ManageGiftCards';
import { EvaluatePromotionsUseCase } from './useCases/EvaluatePromotions';
import { CreateCouponUseCase } from './useCases/CreateCoupon';
import { ValidateCouponCodeUseCase } from './useCases/ValidateCouponCode';
import { CalculateCouponDiscountUseCase } from './useCases/CalculateCouponDiscount';
import { CreatePromotionRecordUseCase } from './useCases/CreatePromotionRecord';
import { ChangePromotionStatusUseCase } from './useCases/ChangePromotionStatus';
import { ManagePromotionTargetsUseCase } from './useCases/ManagePromotionTargets';

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
  assignGiftCardRepo,
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

// ============================================================================
// Wired use-case instances (composition root)
// ============================================================================

export const validateCouponUseCase = new ValidateCouponUseCase(couponDiscountRepository.coupons);
export const redeemCouponUseCase = new RedeemCouponUseCase(couponDiscountRepository.coupons);
export const applyProductDiscountUseCase = new ApplyProductDiscountUseCase(couponDiscountRepository.discounts);
export const checkGiftCardBalanceUseCase = new CheckGiftCardBalanceUseCase(giftCardRepository);
export const redeemGiftCardUseCase = new RedeemGiftCardUseCase(giftCardRepository);
export const managePromotionsUseCase = new ManagePromotionsUseCase(promotionRuleRepository.promotions);
export const manageCouponsUseCase = new ManageCouponsUseCase(couponDiscountRepository.coupons);
export const manageGiftCardsUseCase = new ManageGiftCardsUseCase(giftCardRepository);
export const evaluatePromotionsUseCase = new EvaluatePromotionsUseCase(promotionRuleRepository.promotions);
export const createCouponUseCase = new CreateCouponUseCase(couponDiscountRepository.coupons);
export const validateCouponCodeUseCase = new ValidateCouponCodeUseCase(couponDiscountRepository.coupons);
export const calculateCouponDiscountUseCase = new CalculateCouponDiscountUseCase(couponDiscountRepository.coupons);
export const createPromotionRecordUseCase = new CreatePromotionRecordUseCase(promotionRepo);
export const changePromotionStatusUseCase = new ChangePromotionStatusUseCase(promotionRepo);
export const managePromotionTargetsUseCase = new ManagePromotionTargetsUseCase(
  promotionRuleRepository.carts,
  promotionRuleRepository.categories,
  couponDiscountRepository.discounts,
);
