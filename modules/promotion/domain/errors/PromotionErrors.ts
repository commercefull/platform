import { AppError } from '../../../../libs/errors';

export class PromotionNotFoundError extends AppError {
  constructor(promotionId: string) {
    super(`Promotion not found: ${promotionId}`, 404, { code: 'promotion.not_found' });
  }
}

export class PromotionCodeAlreadyExistsError extends AppError {
  constructor(code: string) {
    super(`Promotion code already exists: ${code}`, 409, { code: 'promotion.code_already_exists' });
  }
}

export class PromotionNotActiveError extends AppError {
  constructor(promotionId: string) {
    super(`Promotion ${promotionId} is not active`, 400, { code: 'promotion.not_active' });
  }
}

export class PromotionExpiredError extends AppError {
  constructor(promotionId: string) {
    super(`Promotion ${promotionId} has expired`, 400, { code: 'promotion.expired' });
  }
}

export class PromotionUsageLimitReachedError extends AppError {
  constructor(promotionId: string) {
    super(`Promotion ${promotionId} usage limit has been reached`, 400, { code: 'promotion.usage_limit_reached' });
  }
}

export class PromotionRuleNotFoundError extends AppError {
  constructor(ruleId: string) {
    super(`Promotion rule not found: ${ruleId}`, 404, { code: 'promotion.rule_not_found' });
  }
}

export class PromotionActionNotFoundError extends AppError {
  constructor(actionId: string) {
    super(`Promotion action not found: ${actionId}`, 404, { code: 'promotion.action_not_found' });
  }
}

export class GiftCardNotFoundError extends AppError {
  constructor(code: string) {
    super(`Gift card not found: ${code}`, 404, { code: 'promotion.gift_card_not_found' });
  }
}

export class GiftCardNotActiveError extends AppError {
  constructor(giftCardId: string) {
    super(`Gift card ${giftCardId} is not active`, 400, { code: 'promotion.gift_card_not_active' });
  }
}

export class GiftCardExpiredError extends AppError {
  constructor(giftCardId: string) {
    super(`Gift card ${giftCardId} has expired`, 400, { code: 'promotion.gift_card_expired' });
  }
}

export class GiftCardInsufficientBalanceError extends AppError {
  constructor(available: number) {
    super(`Insufficient balance. Available: ${available}`, 400, { code: 'promotion.gift_card_insufficient_balance' });
  }
}

export class FailedToCreatePromotionError extends AppError {
  constructor(message: string = 'Failed to create promotion') {
    super(message, 500, { code: 'promotion.creation_failed' });
  }
}

export class CouponNotFoundError extends AppError {
  constructor(couponId: string) {
    super(`Coupon not found: ${couponId}`, 404, { code: 'promotion.coupon_not_found' });
  }
}

export class DiscountNotFoundError extends AppError {
  constructor(discountId: string) {
    super(`Product discount not found: ${discountId}`, 404, { code: 'promotion.discount_not_found' });
  }
}

export class GiftCardNotReloadableError extends AppError {
  constructor(giftCardId: string) {
    super(`Gift card ${giftCardId} is not reloadable`, 400, { code: 'promotion.gift_card_not_reloadable' });
  }
}

export class PromotionValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'promotion.validation_error' });
  }
}
