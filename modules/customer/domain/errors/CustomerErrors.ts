import { AppError } from '../../../../libs/errors';

export class CustomerNotFoundError extends AppError {
  constructor(customerId: string) {
    super(`Customer not found: ${customerId}`, 404, { code: 'customer.not_found' });
  }
}

export class CustomerEmailAlreadyExistsError extends AppError {
  constructor(email: string) {
    super(`Customer with email ${email} already exists`, 409, { code: 'customer.email_already_exists' });
  }
}

export class CustomerNotActiveError extends AppError {
  constructor(customerId: string) {
    super(`Customer ${customerId} is not active`, 403, { code: 'customer.not_active' });
  }
}

export class CustomerAddressNotFoundError extends AppError {
  constructor(addressId: string) {
    super(`Customer address not found: ${addressId}`, 404, { code: 'customer.address_not_found' });
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super('Invalid credentials', 401, { code: 'customer.invalid_credentials' });
  }
}

export class EmailRequiredError extends AppError {
  constructor() {
    super('Email is required', 400, { code: 'customer.email_required' });
  }
}

export class PasswordRequiredError extends AppError {
  constructor() {
    super('Password is required', 400, { code: 'customer.password_required' });
  }
}

export class CustomerAlreadyVerifiedError extends AppError {
  constructor() {
    super('Customer is already verified', 400, { code: 'customer.already_verified' });
  }
}

export class InvalidVerificationTokenError extends AppError {
  constructor() {
    super('Invalid verification token', 400, { code: 'customer.invalid_verification_token' });
  }
}

export class FailedToCreateCustomerError extends AppError {
  constructor(message: string = 'Failed to create customer') {
    super(message, 500, { code: 'customer.creation_failed' });
  }
}

export class CustomerGroupNotFoundError extends AppError {
  constructor(groupId: string) {
    super(`Customer group not found: ${groupId}`, 404, { code: 'customer.group_not_found' });
  }
}

export class CustomerGroupAlreadyExistsError extends AppError {
  constructor(code: string) {
    super(`Customer group with code '${code}' already exists`, 409, { code: 'customer.group_already_exists' });
  }
}

export class CustomerWishlistNotFoundError extends AppError {
  constructor(wishlistId: string) {
    super(`Customer wishlist not found: ${wishlistId}`, 404, { code: 'customer.wishlist_not_found' });
  }
}

export class CustomerValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'customer.validation_error' });
  }
}
