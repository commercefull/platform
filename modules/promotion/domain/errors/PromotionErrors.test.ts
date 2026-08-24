import {
  PromotionNotFoundError, PromotionCodeAlreadyExistsError, PromotionNotActiveError,
  PromotionExpiredError, PromotionUsageLimitReachedError, PromotionRuleNotFoundError,
  PromotionActionNotFoundError, GiftCardNotFoundError, GiftCardNotActiveError,
  GiftCardExpiredError, GiftCardInsufficientBalanceError, FailedToCreatePromotionError,
  CouponNotFoundError, DiscountNotFoundError, GiftCardNotReloadableError, PromotionValidationError,
} from './PromotionErrors';

describe('PromotionErrors', () => {
  it('PromotionNotFoundError', () => { expect(new PromotionNotFoundError('p1').statusCode).toBe(404); });
  it('PromotionCodeAlreadyExistsError', () => { expect(new PromotionCodeAlreadyExistsError('CODE').statusCode).toBe(409); });
  it('PromotionNotActiveError', () => { expect(new PromotionNotActiveError('p1').statusCode).toBe(400); });
  it('PromotionExpiredError', () => { expect(new PromotionExpiredError('p1').statusCode).toBe(400); });
  it('PromotionUsageLimitReachedError', () => { expect(new PromotionUsageLimitReachedError('p1').statusCode).toBe(400); });
  it('PromotionRuleNotFoundError', () => { expect(new PromotionRuleNotFoundError('r1').statusCode).toBe(404); });
  it('PromotionActionNotFoundError', () => { expect(new PromotionActionNotFoundError('a1').statusCode).toBe(404); });
  it('GiftCardNotFoundError', () => { expect(new GiftCardNotFoundError('gc1').statusCode).toBe(404); });
  it('GiftCardNotActiveError', () => { expect(new GiftCardNotActiveError('gc1').statusCode).toBe(400); });
  it('GiftCardExpiredError', () => { expect(new GiftCardExpiredError('gc1').statusCode).toBe(400); });
  it('GiftCardInsufficientBalanceError', () => { expect(new GiftCardInsufficientBalanceError(50).statusCode).toBe(400); });
  it('FailedToCreatePromotionError', () => { expect(new FailedToCreatePromotionError().statusCode).toBe(500); });
  it('CouponNotFoundError', () => { expect(new CouponNotFoundError('c1').statusCode).toBe(404); });
  it('DiscountNotFoundError', () => { expect(new DiscountNotFoundError('d1').statusCode).toBe(404); });
  it('GiftCardNotReloadableError', () => { expect(new GiftCardNotReloadableError('gc1').statusCode).toBe(400); });
  it('PromotionValidationError', () => { expect(new PromotionValidationError('bad').statusCode).toBe(400); });
});
