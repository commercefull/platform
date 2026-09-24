/**
 * Shared test helpers for the promotion module.
 * Typed `jest.Mocked` port factories + domain record factories.
 */

import type { PromotionRepository, Promotion, PromotionRule, PromotionAction } from '../domain/repositories/PromotionRepository';
import type { CouponRepository, PromotionCoupon, PromotionCouponUsage } from '../domain/repositories/CouponRepository';
import { CouponType, CouponGenerationMethod } from '../domain/repositories/CouponRepository';
import type { GiftCardRepository, PromotionGiftCard, PromotionGiftCardTransaction } from '../domain/repositories/GiftCardRepository';
import type { ProductDiscountRepository, PromotionProductDiscount } from '../domain/repositories/ProductDiscountRepository';
import type { CheckGiftCardBalanceUseCase } from '../application/useCases/CheckGiftCardBalance';
import type { RedeemGiftCardUseCase } from '../application/useCases/RedeemGiftCard';
import type { ValidateCouponUseCase } from '../application/useCases/ValidateCoupon';

/**
 * A lazily-created `jest.Mocked<T>`: every accessed method is a `jest.fn`,
 * so tests configure only the methods they exercise.
 */
export function lazyMock<T>(): jest.Mocked<T> {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_target, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<T>;
}

export function createPromotionRepository(): jest.Mocked<PromotionRepository> {
  return lazyMock();
}

export function createCouponRepository(): jest.Mocked<CouponRepository> {
  return lazyMock();
}

export function createValidateCouponRepository(): jest.Mocked<ConstructorParameters<typeof ValidateCouponUseCase>[0]> {
  return lazyMock();
}

export function createDiscountRepository(): jest.Mocked<ProductDiscountRepository> {
  return lazyMock();
}

export function createGiftCardRepository(): jest.Mocked<GiftCardRepository> {
  return lazyMock();
}

export function createCheckGiftCardRepository(): jest.Mocked<ConstructorParameters<typeof CheckGiftCardBalanceUseCase>[0]> {
  return lazyMock();
}

export function createRedeemGiftCardRepository(): jest.Mocked<ConstructorParameters<typeof RedeemGiftCardUseCase>[0]> {
  return lazyMock();
}

// ---------------------------------------------------------------------------
// Record factories
// ---------------------------------------------------------------------------

export function createPromotion(overrides: Partial<Promotion> = {}): Promotion {
  return {
    promotionId: 'promo-1',
    name: 'Summer Sale',
    description: null,
    status: 'active',
    scope: 'cart',
    priority: 0,
    startDate: new Date('2024-01-01'),
    endDate: null,
    isActive: true,
    isExclusive: false,
    stackability: 'none',
    maxUsage: null,
    usageCount: 0,
    maxUsagePerCustomer: null,
    minOrderAmountCents: null,
    maxDiscountAmountCents: null,
    organizationId: null,
    isGlobal: false,
    eligibleCustomerGroups: null,
    excludedCustomerGroups: null,
    deletedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createPromotionRule(overrides: Partial<PromotionRule> = {}): PromotionRule {
  return {
    promotionRuleId: 'rule-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    promotionId: 'promo-1',
    name: null,
    description: null,
    condition: 'cartTotal',
    operator: '>=',
    value: 100,
    isActive: true,
    isRequired: true,
    ruleGroup: null,
    sortOrder: 0,
    ...overrides,
  };
}

export function createPromotionAction(overrides: Partial<PromotionAction> = {}): PromotionAction {
  return {
    promotionActionId: 'action-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    promotionId: 'promo-1',
    name: null,
    description: null,
    actionType: 'discountByPercentage',
    value: 10,
    targetType: null,
    targetIds: null,
    sortOrder: 0,
    ...overrides,
  };
}

export function createPromotionCoupon(overrides: Partial<PromotionCoupon> = {}): PromotionCoupon {
  return {
    promotionCouponId: 'coupon-1',
    code: 'SAVE10',
    name: 'Save 10%',
    type: CouponType.PERCENTAGE,
    discountAmountCents: 10,
    currencyCode: 'USD',
    startDate: new Date('2020-01-01'),
    isActive: true,
    isOneTimeUse: false,
    usageCount: 0,
    generationMethod: CouponGenerationMethod.MANUAL,
    isReferral: false,
    isPublic: true,
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2020-01-01'),
    ...overrides,
  };
}

export function createPromotionCouponUsage(overrides: Partial<PromotionCouponUsage> = {}): PromotionCouponUsage {
  return {
    promotionCouponUsageId: 'usage-1',
    promotionCouponId: 'coupon-1',
    discountAmountCents: 10,
    currencyCode: 'USD',
    usedAt: new Date('2024-06-01'),
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
    ...overrides,
  };
}

export function createGiftCard(overrides: Partial<PromotionGiftCard> = {}): PromotionGiftCard {
  return {
    promotionGiftCardId: 'gc-1',
    code: 'GIFT1234',
    type: 'standard',
    initialBalanceCents: 100,
    currentBalanceCents: 100,
    currency: 'USD',
    status: 'active',
    isDelivered: false,
    deliveryMethod: 'email',
    usageCount: 0,
    totalRedeemedCents: 0,
    isReloadable: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createGiftCardTransaction(
  overrides: Partial<PromotionGiftCardTransaction> = {},
): PromotionGiftCardTransaction {
  return {
    promotionGiftCardTransactionId: 'txn-1',
    promotionGiftCardId: 'gc-1',
    type: 'redemption',
    amountCents: 25,
    balanceBeforeCents: 100,
    balanceAfterCents: 75,
    currency: 'USD',
    createdAt: new Date('2024-06-01'),
    ...overrides,
  };
}

export function createProductDiscount(overrides: Partial<PromotionProductDiscount> = {}): PromotionProductDiscount {
  return {
    promotionProductDiscountId: 'disc-1',
    promotionId: null,
    name: 'Product Discount',
    description: null,
    discountType: 'percentage',
    discountValue: '10',
    currencyCode: null,
    startDate: new Date('2020-01-01'),
    endDate: null,
    isActive: true,
    priority: 0,
    appliesTo: 'all_products',
    minimumQuantity: null,
    maximumQuantity: null,
    minimumAmountCents: null,
    maximumDiscountAmountCents: null,
    stackable: false,
    displayOnProductPage: false,
    displayInListing: false,
    badgeText: null,
    badgeStyle: null,
    organizationId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}
