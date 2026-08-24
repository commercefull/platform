import {
  CouponNotFoundError, CouponCodeNotFoundError, CouponNotActiveError, CouponExpiredError,
  CouponUsageLimitReachedError, CouponMinOrderNotMetError, CouponMaxUsagePerCustomerReachedError,
  CouponCodeAlreadyExistsError, CouponValidationError, FailedToRecordCouponUsageError,
} from './CouponErrors';

describe('CouponErrors', () => {
  it('CouponNotFoundError', () => { expect(new CouponNotFoundError('c1').statusCode).toBe(404); });
  it('CouponCodeNotFoundError', () => { expect(new CouponCodeNotFoundError('code').statusCode).toBe(404); });
  it('CouponNotActiveError', () => { expect(new CouponNotActiveError('c1').statusCode).toBe(400); });
  it('CouponExpiredError', () => { expect(new CouponExpiredError('c1').statusCode).toBe(400); });
  it('CouponUsageLimitReachedError', () => { expect(new CouponUsageLimitReachedError('c1').statusCode).toBe(400); });
  it('CouponMinOrderNotMetError', () => { expect(new CouponMinOrderNotMetError(100).statusCode).toBe(400); });
  it('CouponMaxUsagePerCustomerReachedError', () => { expect(new CouponMaxUsagePerCustomerReachedError(5).statusCode).toBe(400); });
  it('CouponCodeAlreadyExistsError', () => { expect(new CouponCodeAlreadyExistsError('code').statusCode).toBe(409); });
  it('CouponValidationError', () => { expect(new CouponValidationError('bad').statusCode).toBe(400); });
  it('FailedToRecordCouponUsageError', () => { expect(new FailedToRecordCouponUsageError().statusCode).toBe(500); });
});
