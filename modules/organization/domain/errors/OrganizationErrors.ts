import { AppError } from '../../../../libs/errors';

export class OrganizationNotFoundError extends AppError {
  constructor(organizationId: string) {
    super(`Organization not found: ${organizationId}`, 404, { code: 'organization.not_found' });
  }
}

export class OrganizationCodeAlreadyExistsError extends AppError {
  constructor(code: string) {
    super(`Organization code already exists: ${code}`, 409, { code: 'organization.code_already_exists' });
  }
}

export class OrganizationEmailAlreadyExistsError extends AppError {
  constructor(email: string) {
    super(`Organization email already exists: ${email}`, 409, { code: 'organization.email_already_exists' });
  }
}

export class OrganizationNotActiveError extends AppError {
  constructor(organizationId: string) {
    super(`Organization ${organizationId} is not active`, 403, { code: 'organization.not_active' });
  }
}

export class OrganizationAddressNotFoundError extends AppError {
  constructor(addressId: string) {
    super(`Organization address not found: ${addressId}`, 404, { code: 'organization.address_not_found' });
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super('Invalid credentials', 401, { code: 'organization.invalid_credentials' });
  }
}

export class OrganizationPaymentInfoNotFoundError extends AppError {
  constructor(paymentInfoId: string) {
    super(`Organization payment info not found: ${paymentInfoId}`, 404, { code: 'organization.payment_info_not_found' });
  }
}

export class FailedToCreateOrganizationError extends AppError {
  constructor() {
    super('Failed to create organization', 500, { code: 'organization.creation_failed' });
  }
}

export class OrganizationValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'organization.validation_error' });
  }
}

export class FailedToUpdateOrganizationError extends AppError {
  constructor(organizationId: string) {
    super(`Failed to update organization with ID ${organizationId}`, 500, { code: 'organization.update_failed' });
  }
}

export class FailedToCreateOrganizationAddressError extends AppError {
  constructor() {
    super('Failed to create organization address', 500, { code: 'organization.address_creation_failed' });
  }
}

export class FailedToCreateOrganizationPaymentInfoError extends AppError {
  constructor() {
    super('Failed to create organization payment info', 500, { code: 'organization.payment_info_creation_failed' });
  }
}
