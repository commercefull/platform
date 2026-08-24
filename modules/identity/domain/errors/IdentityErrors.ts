/**
 * Identity Domain Errors
 *
 * Typed errors for identity module operations.
 * All errors extend AppError with stable codes and appropriate status codes.
 */

import { AppError } from '../../../../libs/errors';

// ============================================================================
// Authentication Errors
// ============================================================================

export class InvalidCredentialsError extends AppError {
  constructor() {
    super('Invalid credentials', 401, { code: 'identity.invalid_credentials' });
  }
}

export class AccountLockedError extends AppError {
  constructor() {
    super('Account is temporarily locked. Please try again later.', 401, { code: 'identity.account_locked' });
  }
}

export class AccountNotActiveError extends AppError {
  constructor() {
    super('Account is not active', 403, { code: 'identity.account_not_active' });
  }
}

export class InvalidRefreshTokenError extends AppError {
  constructor() {
    super('Invalid refresh token', 401, { code: 'identity.invalid_refresh_token' });
  }
}

export class EmailRequiredError extends AppError {
  constructor() {
    super('Email is required for social login', 400, { code: 'identity.email_required' });
  }
}

export class SocialAccountAlreadyLinkedError extends AppError {
  constructor(provider: string) {
    super(`This ${provider} account is already linked to another user`, 409, { code: 'identity.social_account_already_linked' });
  }
}

export class SocialAccountNotLinkedError extends AppError {
  constructor(provider: string) {
    super(`No ${provider} account linked to this user`, 404, { code: 'identity.social_account_not_linked' });
  }
}

export class CannotUnlinkOnlyLoginMethodError extends AppError {
  constructor() {
    super('Cannot unlink the only login method. Please add another login method first.', 400, { code: 'identity.cannot_unlink_only_login_method' });
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

export class EmailAndPasswordRequiredError extends AppError {
  constructor() {
    super('Email and password are required', 400, { code: 'identity.email_password_required' });
  }
}

export class InvalidEmailFormatError extends AppError {
  constructor() {
    super('Invalid email format', 400, { code: 'identity.invalid_email_format' });
  }
}

export class PasswordTooShortError extends AppError {
  constructor(minLength: number = 8) {
    super(`Password must be at least ${minLength} characters`, 400, { code: 'identity.password_too_short' });
  }
}

export class EmailAlreadyRegisteredError extends AppError {
  constructor() {
    super('Email already registered', 409, { code: 'identity.email_already_registered' });
  }
}

// ============================================================================
// Token Errors
// ============================================================================

export class TokenRequiredError extends AppError {
  constructor() {
    super('Token and new password are required', 400, { code: 'identity.token_required' });
  }
}

export class InvalidOrExpiredTokenError extends AppError {
  constructor() {
    super('Invalid or expired reset token', 400, { code: 'identity.invalid_or_expired_token' });
  }
}

export class TokenAlreadyUsedError extends AppError {
  constructor() {
    super('Reset token has already been used', 400, { code: 'identity.token_already_used' });
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super('Reset token has expired', 400, { code: 'identity.token_expired' });
  }
}

export class VerificationTokenRequiredError extends AppError {
  constructor() {
    super('Verification token is required', 400, { code: 'identity.verification_token_required' });
  }
}

export class InvalidVerificationTokenError extends AppError {
  constructor() {
    super('Invalid verification token', 400, { code: 'identity.invalid_verification_token' });
  }
}

export class VerificationTokenAlreadyUsedError extends AppError {
  constructor() {
    super('Token has already been used', 400, { code: 'identity.verification_token_already_used' });
  }
}

export class VerificationTokenExpiredError extends AppError {
  constructor() {
    super('Verification token has expired', 400, { code: 'identity.verification_token_expired' });
  }
}

export class EmailAlreadyVerifiedError extends AppError {
  constructor() {
    super('Email is already verified', 400, { code: 'identity.email_already_verified' });
  }
}

// ============================================================================
// Admin Errors
// ============================================================================

export class AdminFieldsRequiredError extends AppError {
  constructor() {
    super('Email, password, name, and role are required', 400, { code: 'identity.admin_fields_required' });
  }
}

export class OnlySuperAdminCanCreateError extends AppError {
  constructor() {
    super('Only super admins can create admin accounts', 403, { code: 'identity.only_super_admin_can_create' });
  }
}

export class EmailRequiredOnlyError extends AppError {
  constructor() {
    super('Email is required', 400, { code: 'identity.email_required' });
  }
}

export class CustomerIdAndTokenRequiredError extends AppError {
  constructor() {
    super('Customer ID and access token are required', 400, { code: 'identity.customer_id_and_token_required' });
  }
}

// ============================================================================
// Organization Errors
// ============================================================================

export class OrganizationCodeRequiredError extends AppError {
  constructor() {
    super('Organization code is required', 400, { code: 'identity.organization_code_required' });
  }
}

export class OrganizationNotFoundError extends AppError {
  constructor() {
    super('Organization not found', 404, { code: 'identity.organization_not_found' });
  }
}

export class OrganizationNotActiveError extends AppError {
  constructor() {
    super('Organization is not active', 403, { code: 'identity.organization_not_active' });
  }
}

// ============================================================================
// Organization Registration Errors
// ============================================================================

export class OrganizationRegistrationFieldsRequiredError extends AppError {
  constructor() {
    super('Email, password, and business name are required', 400, { code: 'identity.organization_fields_required' });
  }
}

// ============================================================================
// Store Assignment Errors
// ============================================================================

export class UserNotFoundError extends AppError {
  constructor() {
    super('User not found', 404, { code: 'identity.user_not_found' });
  }
}

export class StoreNotFoundError extends AppError {
  constructor() {
    super('Store not found', 404, { code: 'identity.store_not_found' });
  }
}

export class UserAlreadyAssignedToStoreError extends AppError {
  constructor() {
    super('User is already assigned to this store', 409, { code: 'identity.user_already_assigned' });
  }
}

export class UserStoreAssignmentNotFoundError extends AppError {
  constructor() {
    super('User store assignment not found', 404, { code: 'identity.user_store_assignment_not_found' });
  }
}

// ============================================================================
// Token Management Errors
// ============================================================================

export class RefreshTokenRequiredError extends AppError {
  constructor() {
    super('Refresh token is required', 400, { code: 'identity.refresh_token_required' });
  }
}

export class RefreshTokenRevokedError extends AppError {
  constructor() {
    super('Refresh token has been revoked', 401, { code: 'identity.refresh_token_revoked' });
  }
}

export class RefreshTokenExpiredError extends AppError {
  constructor() {
    super('Refresh token has expired', 401, { code: 'identity.refresh_token_expired' });
  }
}

export class InvalidTokenRecordError extends AppError {
  constructor() {
    super('Invalid token record', 400, { code: 'identity.invalid_token_record' });
  }
}

export class TokenRequiredOnlyError extends AppError {
  constructor() {
    super('Token is required', 400, { code: 'identity.token_required_only' });
  }
}

export class UserIdRequiredError extends AppError {
  constructor() {
    super('User ID is required', 400, { code: 'identity.user_id_required' });
  }
}

// ============================================================================
// Infrastructure Errors
// ============================================================================

export class FailedToCreateSessionError extends AppError {
  constructor() {
    super('Failed to create session', 500, { code: 'identity.session_creation_failed' });
  }
}

export class FailedToCreateRefreshTokenError extends AppError {
  constructor() {
    super('Failed to create auth refresh token', 500, { code: 'identity.refresh_token_creation_failed' });
  }
}

export class FailedToCreateBlacklistEntryError extends AppError {
  constructor() {
    super('Failed to create blacklist entry', 500, { code: 'identity.blacklist_creation_failed' });
  }
}

export class FailedToCreateSocialAccountError extends AppError {
  constructor() {
    super('Failed to create social account', 500, { code: 'identity.social_account_creation_failed' });
  }
}

export class NotImplementedError extends AppError {
  constructor(message: string) {
    super(message, 501, { code: 'identity.not_implemented' });
  }
}
