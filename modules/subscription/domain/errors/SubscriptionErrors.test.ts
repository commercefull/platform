import {
  SubscriptionNotFoundError, SubscriptionPlanNotFoundError, SubscriptionNotActiveError,
  SubscriptionAlreadyPausedError, SubscriptionNotPausedError, SubscriptionCannotBeCancelledError,
  SubscriptionInvoiceNotFoundError, FailedToRenewSubscriptionError, FailedToProcessRenewalError,
  SubscriptionValidationError,
} from './SubscriptionErrors';

describe('SubscriptionErrors', () => {
  it('SubscriptionNotFoundError', () => { expect(new SubscriptionNotFoundError('s1').statusCode).toBe(404); });
  it('SubscriptionPlanNotFoundError', () => { expect(new SubscriptionPlanNotFoundError('p1').statusCode).toBe(404); });
  it('SubscriptionNotActiveError', () => { expect(new SubscriptionNotActiveError('s1').statusCode).toBe(400); });
  it('SubscriptionAlreadyPausedError', () => { expect(new SubscriptionAlreadyPausedError('s1').statusCode).toBe(400); });
  it('SubscriptionNotPausedError', () => { expect(new SubscriptionNotPausedError('s1').statusCode).toBe(400); });
  it('SubscriptionCannotBeCancelledError', () => { expect(new SubscriptionCannotBeCancelledError('bad').statusCode).toBe(400); });
  it('SubscriptionInvoiceNotFoundError', () => { expect(new SubscriptionInvoiceNotFoundError('i1').statusCode).toBe(404); });
  it('FailedToRenewSubscriptionError', () => { expect(new FailedToRenewSubscriptionError().statusCode).toBe(500); });
  it('FailedToProcessRenewalError', () => { expect(new FailedToProcessRenewalError().statusCode).toBe(500); });
  it('SubscriptionValidationError', () => { expect(new SubscriptionValidationError('bad').statusCode).toBe(400); });
});
