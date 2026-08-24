/**
 * SSO Domain Errors
 *
 * Typed errors for SSO (SAML/OIDC) and SCIM operations.
 */

import { AppError } from '../../../../libs/errors';

// ============================================================================
// SSO Configuration Errors
// ============================================================================

export class SsoProviderNotFoundError extends AppError {
  constructor(providerId: string) {
    super(`SSO provider not found: ${providerId}`, 404, { code: 'identity.sso_provider_not_found' });
  }
}

export class SsoProviderAlreadyExistsError extends AppError {
  constructor(name: string) {
    super(`SSO provider already exists: ${name}`, 409, { code: 'identity.sso_provider_already_exists' });
  }
}

export class SsoValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'identity.sso_validation_error' });
  }
}

// ============================================================================
// SAML Errors
// ============================================================================

export class SamlAssertionError extends AppError {
  constructor(message: string) {
    super(`SAML assertion error: ${message}`, 401, { code: 'identity.saml_assertion_error' });
  }
}

export class SamlMetadataError extends AppError {
  constructor(message: string) {
    super(`SAML metadata error: ${message}`, 400, { code: 'identity.saml_metadata_error' });
  }
}

// ============================================================================
// OIDC Errors
// ============================================================================

export class OidcTokenError extends AppError {
  constructor(message: string) {
    super(`OIDC token error: ${message}`, 401, { code: 'identity.oidc_token_error' });
  }
}

export class OidcDiscoveryError extends AppError {
  constructor(message: string) {
    super(`OIDC discovery error: ${message}`, 502, { code: 'identity.oidc_discovery_error' });
  }
}

// ============================================================================
// SCIM Errors
// ============================================================================

export class ScimResourceNotFoundError extends AppError {
  constructor(resourceType: string, resourceId: string) {
    super(`${resourceType} ${resourceId} not found`, 404, { code: 'identity.scim_resource_not_found' });
  }
}

export class ScimValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'identity.scim_validation_error' });
  }
}

export class ScimConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, { code: 'identity.scim_conflict' });
  }
}

export class ScimAuthenticationError extends AppError {
  constructor() {
    super('Invalid SCIM bearer token', 401, { code: 'identity.scim_auth_error' });
  }
}
