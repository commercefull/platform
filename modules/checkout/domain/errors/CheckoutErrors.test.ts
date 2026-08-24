import {
  CheckoutSessionNotFoundError, CheckoutSessionExpiredError, CheckoutAlreadyCompletedError,
  InvalidCheckoutStateError, PaymentIntentNotFoundError, CheckoutValidationError,
} from './CheckoutErrors';

describe('CheckoutErrors', () => {
  it('CheckoutSessionNotFoundError', () => { expect(new CheckoutSessionNotFoundError('s1').statusCode).toBe(404); });
  it('CheckoutSessionExpiredError', () => { expect(new CheckoutSessionExpiredError('s1').statusCode).toBe(400); });
  it('CheckoutAlreadyCompletedError', () => { expect(new CheckoutAlreadyCompletedError('s1').statusCode).toBe(400); });
  it('InvalidCheckoutStateError', () => { expect(new InvalidCheckoutStateError('bad').statusCode).toBe(400); });
  it('PaymentIntentNotFoundError', () => { expect(new PaymentIntentNotFoundError('i1').statusCode).toBe(404); });
  it('CheckoutValidationError', () => { expect(new CheckoutValidationError('bad').statusCode).toBe(400); });
});
