import {
  CustomerNotFoundError, CustomerEmailAlreadyExistsError, CustomerNotActiveError,
  CustomerAddressNotFoundError, InvalidCredentialsError, EmailRequiredError,
  PasswordRequiredError, CustomerAlreadyVerifiedError, InvalidVerificationTokenError,
  FailedToCreateCustomerError, CustomerGroupNotFoundError, CustomerGroupAlreadyExistsError,
  CustomerWishlistNotFoundError, CustomerValidationError,
} from './CustomerErrors';

describe('CustomerErrors', () => {
  it('CustomerNotFoundError', () => { expect(new CustomerNotFoundError('c1').statusCode).toBe(404); });
  it('CustomerEmailAlreadyExistsError', () => { expect(new CustomerEmailAlreadyExistsError('a@b.com').statusCode).toBe(409); });
  it('CustomerNotActiveError', () => { expect(new CustomerNotActiveError('c1').statusCode).toBe(403); });
  it('CustomerAddressNotFoundError', () => { expect(new CustomerAddressNotFoundError('a1').statusCode).toBe(404); });
  it('InvalidCredentialsError', () => { expect(new InvalidCredentialsError().statusCode).toBe(401); });
  it('EmailRequiredError', () => { expect(new EmailRequiredError().statusCode).toBe(400); });
  it('PasswordRequiredError', () => { expect(new PasswordRequiredError().statusCode).toBe(400); });
  it('CustomerAlreadyVerifiedError', () => { expect(new CustomerAlreadyVerifiedError().statusCode).toBe(400); });
  it('InvalidVerificationTokenError', () => { expect(new InvalidVerificationTokenError().statusCode).toBe(400); });
  it('FailedToCreateCustomerError', () => { expect(new FailedToCreateCustomerError().statusCode).toBe(500); });
  it('CustomerGroupNotFoundError', () => { expect(new CustomerGroupNotFoundError('g1').statusCode).toBe(404); });
  it('CustomerGroupAlreadyExistsError', () => { expect(new CustomerGroupAlreadyExistsError('code').statusCode).toBe(409); });
  it('CustomerWishlistNotFoundError', () => { expect(new CustomerWishlistNotFoundError('w1').statusCode).toBe(404); });
  it('CustomerValidationError', () => { expect(new CustomerValidationError('bad').statusCode).toBe(400); });
});
