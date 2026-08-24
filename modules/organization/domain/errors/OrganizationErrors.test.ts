import {
  OrganizationNotFoundError, OrganizationCodeAlreadyExistsError, OrganizationEmailAlreadyExistsError,
  OrganizationNotActiveError, OrganizationAddressNotFoundError, InvalidCredentialsError,
  OrganizationPaymentInfoNotFoundError, FailedToCreateOrganizationError, OrganizationValidationError,
  FailedToUpdateOrganizationError, FailedToCreateOrganizationAddressError, FailedToCreateOrganizationPaymentInfoError,
} from './OrganizationErrors';

describe('OrganizationErrors', () => {
  it('OrganizationNotFoundError', () => { expect(new OrganizationNotFoundError('o1').statusCode).toBe(404); });
  it('OrganizationCodeAlreadyExistsError', () => { expect(new OrganizationCodeAlreadyExistsError('code').statusCode).toBe(409); });
  it('OrganizationEmailAlreadyExistsError', () => { expect(new OrganizationEmailAlreadyExistsError('a@b.com').statusCode).toBe(409); });
  it('OrganizationNotActiveError', () => { expect(new OrganizationNotActiveError('o1').statusCode).toBe(403); });
  it('OrganizationAddressNotFoundError', () => { expect(new OrganizationAddressNotFoundError('a1').statusCode).toBe(404); });
  it('InvalidCredentialsError', () => { expect(new InvalidCredentialsError().statusCode).toBe(401); });
  it('OrganizationPaymentInfoNotFoundError', () => { expect(new OrganizationPaymentInfoNotFoundError('p1').statusCode).toBe(404); });
  it('FailedToCreateOrganizationError', () => { expect(new FailedToCreateOrganizationError().statusCode).toBe(500); });
  it('OrganizationValidationError', () => { expect(new OrganizationValidationError('bad').statusCode).toBe(400); });
  it('FailedToUpdateOrganizationError', () => { expect(new FailedToUpdateOrganizationError('o1').statusCode).toBe(500); });
  it('FailedToCreateOrganizationAddressError', () => { expect(new FailedToCreateOrganizationAddressError().statusCode).toBe(500); });
  it('FailedToCreateOrganizationPaymentInfoError', () => { expect(new FailedToCreateOrganizationPaymentInfoError().statusCode).toBe(500); });
});
