import {
  BasketNotFoundError, BasketItemNotFoundError, BasketNotActiveError, BasketExpiredError,
  InvalidExpirationDaysError, BasketValidationError, BasketAlreadyAssignedError,
  CouponAlreadyAppliedError, NoCouponAppliedError, BasketItemQuantityError, BasketItemDiscountError,
} from './BasketErrors';

describe('BasketErrors', () => {
  it('BasketNotFoundError', () => { expect(new BasketNotFoundError('b1').statusCode).toBe(404); });
  it('BasketItemNotFoundError', () => { expect(new BasketItemNotFoundError('i1').statusCode).toBe(404); });
  it('BasketNotActiveError', () => { expect(new BasketNotActiveError('b1').statusCode).toBe(400); });
  it('BasketExpiredError', () => { expect(new BasketExpiredError('b1').statusCode).toBe(400); });
  it('InvalidExpirationDaysError', () => { expect(new InvalidExpirationDaysError(0).statusCode).toBe(400); });
  it('BasketValidationError', () => { expect(new BasketValidationError('bad').statusCode).toBe(400); });
  it('BasketAlreadyAssignedError', () => { expect(new BasketAlreadyAssignedError().statusCode).toBe(400); });
  it('CouponAlreadyAppliedError', () => { expect(new CouponAlreadyAppliedError().statusCode).toBe(400); });
  it('NoCouponAppliedError', () => { expect(new NoCouponAppliedError().statusCode).toBe(400); });
  it('BasketItemQuantityError', () => { expect(new BasketItemQuantityError('bad').statusCode).toBe(400); });
  it('BasketItemDiscountError', () => { expect(new BasketItemDiscountError('bad').statusCode).toBe(400); });
});
