# Identity Feature

The Identity feature unifies customer and merchant authentication under `features/identity`. It provides login, registration, token lifecycle, and password recovery flows across web and headless channels while enforcing business rules like merchant status checks and refresh token governance.

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-IDT-001 | Customer Login | Customer | Authenticate a customer with email/password and return an access token for the storefront session |
| UC-IDT-002 | Customer Register | Customer | Create a new active customer profile and return an access token for immediate checkout |
| UC-IDT-003 | Customer Token (Headless) | Customer | Issue access and refresh tokens for API-driven or mobile access with device metadata |
| UC-IDT-004 | Customer Token Refresh | Customer | Validate an unrevoked refresh token and return a fresh access token |
| UC-IDT-005 | Customer Token Validate | API Consumer | Confirm a customer access token's authenticity and return identity details |
| UC-IDT-006 | Customer Password Reset Request | Customer | Generate a password reset token and send instructions without revealing whether the email exists |
| UC-IDT-007 | Customer Password Reset | Customer | Verify a reset token and update the customer's stored password |
| UC-IDT-008 | Merchant Login | Merchant | Authenticate an active merchant with email/password and return an access token with identity and status |
| UC-IDT-009 | Merchant Register | Merchant | Create a merchant account in pending status requiring approval before access |
| UC-IDT-010 | Merchant Token (Headless) | Merchant | Issue access and refresh tokens for programmatic merchant access with device metadata |
| UC-IDT-011 | Merchant Token Refresh | Merchant | Verify a refresh token, confirm merchant is still active, and return a new access token |
| UC-IDT-012 | Merchant Password Reset Request | Merchant | Generate a password reset token and acknowledge the request without revealing merchant existence |
| UC-IDT-013 | Merchant Password Reset | Merchant | Verify a reset token and update the merchant's stored password |
| UC-IDT-014 | SAML SSO Login | Organization User | Initiate SAML SSO redirect to IdP, then handle ACS callback to authenticate and issue JWT |
| UC-IDT-015 | OIDC SSO Login | Organization User | Initiate OIDC authorization code flow, exchange code for tokens, fetch userinfo, and issue JWT |
| UC-IDT-016 | Manage SAML Provider | Admin | Create, update, activate/deactivate, or delete a SAML IdP configuration for an organization |
| UC-IDT-017 | Manage OIDC Provider | Admin | Create, update, activate/deactivate, or delete an OIDC provider configuration for an organization |
| UC-IDT-018 | List SSO Providers | Admin | List all SAML and OIDC providers configured for an organization |
| UC-IDT-019 | SCIM User Provisioning | SCIM Client | Create, read, update, patch, or deprovision users via SCIM 2.0 /Users endpoints |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-IDT-001 | POST | `/identity/customer/login` |
| UC-IDT-002 | POST | `/identity/customer/register` |
| UC-IDT-003 | POST | `/identity/customer/token` |
| UC-IDT-004 | POST | `/identity/customer/token/refresh` |
| UC-IDT-005 | POST | `/identity/customer/token/validate` |
| UC-IDT-006 | POST | `/identity/customer/password-reset/request` |
| UC-IDT-007 | POST | `/identity/customer/password-reset/reset` |
| UC-IDT-008 | POST | `/identity/merchant/login` |
| UC-IDT-009 | POST | `/identity/merchant/register` |
| UC-IDT-010 | POST | `/identity/merchant/token` |
| UC-IDT-011 | POST | `/identity/merchant/token/refresh` |
| UC-IDT-012 | POST | `/identity/merchant/password-reset/request` |
| UC-IDT-013 | POST | `/identity/merchant/password-reset/reset` |
| UC-IDT-014 | POST | `/business/sso/saml/login/:providerId`, `/business/sso/saml/callback/:providerId` |
| UC-IDT-015 | POST | `/business/sso/oidc/login/:providerId`, `/business/sso/oidc/callback/:providerId` |
| UC-IDT-016 | POST/PUT/DELETE | `/business/sso/saml/providers`, `/business/sso/saml/providers/:providerId` |
| UC-IDT-017 | POST/PUT/DELETE | `/business/sso/oidc/providers`, `/business/sso/oidc/providers/:providerId` |
| UC-IDT-018 | GET | `/business/sso/providers` |
| UC-IDT-019 | GET/POST/PUT/PATCH/DELETE | `/business/scim/v2/Users`, `/business/scim/v2/Users/:id` |


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/auth/stores/:storeId/users` | `listStoreUsers` | — |
| POST | `/auth/users/:userId/stores` | `assignUserToStore` | — |
| GET | `/auth/users/:userId/stores` | `getUserStores` | — |
| DELETE | `/auth/users/:userId/stores/:storeId` | `removeUserFromStore` | — |
| POST | `/business/auth/cleanup-tokens` | `cleanupExpiredTokens` | — |
| POST | `/business/auth/force-reset` | `forceResetPassword` | — |
| POST | `/business/auth/forgot-password` | `requestPasswordReset` | Password reset flow |
| POST | `/business/auth/login` | `loginOrganization` | Simple login (returns access token only) |
| POST | `/business/auth/refresh` | `renewAccessToken` | Refresh access token |
| POST | `/business/auth/register` | `registerOrganization` | Register new merchant account |
| POST | `/business/auth/reset-password` | `resetPassword` | — |
| POST | `/business/auth/revoke-tokens` | `revokeUserTokens` | — |
| POST | `/business/auth/token` | `issueTokenPair` | Token-based auth (returns access + refresh tokens) |
| GET | `/business/auth/user/:userId` | `getUserAuthDetails` | — |
| POST | `/business/auth/validate` | `checkTokenValidity` | Validate token |
| GET | `/customer/identity/2fa/status` | `isCustomerLoggedIn` | 2FA status (requires auth) |
| POST | `/customer/identity/forgot-password` | `requestPasswordReset` | Password reset flow |
| POST | `/customer/identity/login` | `loginCustomer` | Simple login (returns access token only) |
| POST | `/customer/identity/logout` | `isCustomerLoggedIn` | Logout (requires auth to blacklist token) |
| POST | `/customer/identity/refresh` | `renewAccessToken` | Refresh access token |
| POST | `/customer/identity/register` | `registerCustomer` | Register new customer account |
| POST | `/customer/identity/reset-password` | `resetPassword` | — |
| POST | `/customer/identity/token` | `issueTokenPair` | Token-based auth (returns access + refresh tokens) |
| POST | `/customer/identity/validate` | `checkTokenValidity` | Validate token |
| GET | `/identity/:provider/config` | `getOAuthConfig` | GET /identity/social/:provider/config
Get OAuth configuration for a provider (client ID, auth URL, scopes) |
| POST | `/identity/:provider/customer` | `customerSocialLogin` | POST /identity/social/:provider/customer
Authenticate or register a customer via social login
Body: { accessToken, idToken?, profile: { id, email, name?, ... } } |
| POST | `/identity/:provider/customer/link` | `linkCustomerSocialAccount` | POST /identity/social/:provider/customer/link
Link a social account to an existing customer (requires auth)
Body: { accessToken, profile: { id, email?, ... } } |
| DELETE | `/identity/:provider/customer/unlink` | `unlinkCustomerSocialAccount` | DELETE /identity/social/:provider/customer/unlink
Unlink a social account from a customer (requires auth) |
| POST | `/identity/:provider/merchant` | `merchantSocialLogin` | POST /identity/social/:provider/merchant
Authenticate or register a merchant via social login
Body: { accessToken, idToken?, profile: { id, email, name?, ... } } |
| POST | `/identity/:provider/organization` | `merchantSocialLogin` | — |
| GET | `/identity/customer/accounts` | `getCustomerLinkedAccounts` | GET /identity/social/customer/accounts
Get all linked social accounts for a customer (requires auth) |
| GET | `/identity/merchant/accounts` | `getOrganizationLinkedAccounts` | GET /identity/social/merchant/accounts
Get all linked social accounts for a merchant (requires auth) |
| GET | `/identity/organization/accounts` | `getOrganizationLinkedAccounts` | — |
| POST | `/business/sso/saml/login/:providerId` | `ssoController.initiateSamlLogin` | Initiate SAML SSO redirect (public) |
| POST | `/business/sso/saml/callback/:providerId` | `ssoController.samlCallback` | Handle SAML ACS callback (public) |
| POST | `/business/sso/oidc/login/:providerId` | `ssoController.initiateOidcLogin` | Initiate OIDC authorization code flow (public) |
| POST | `/business/sso/oidc/callback/:providerId` | `ssoController.oidcCallback` | Handle OIDC callback with code exchange (public) |
| GET | `/business/sso/providers` | `ssoController.listProviders` | List all SSO providers (requires org auth) |
| POST | `/business/sso/saml/providers` | `ssoController.createSamlProvider` | Create SAML provider config (requires org auth) |
| GET | `/business/sso/saml/providers/:providerId` | `ssoController.getSamlProvider` | Get SAML provider config (requires org auth) |
| PUT | `/business/sso/saml/providers/:providerId` | `ssoController.updateSamlProvider` | Update SAML provider config (requires org auth) |
| DELETE | `/business/sso/saml/providers/:providerId` | `ssoController.deleteSamlProvider` | Delete SAML provider config (requires org auth) |
| POST | `/business/sso/saml/providers/:providerId/activate` | `ssoController.activateSamlProvider` | Activate SAML provider (requires org auth) |
| POST | `/business/sso/saml/providers/:providerId/deactivate` | `ssoController.deactivateSamlProvider` | Deactivate SAML provider (requires org auth) |
| POST | `/business/sso/oidc/providers` | `ssoController.createOidcProvider` | Create OIDC provider config (requires org auth) |
| GET | `/business/sso/oidc/providers/:providerId` | `ssoController.getOidcProvider` | Get OIDC provider config (requires org auth) |
| PUT | `/business/sso/oidc/providers/:providerId` | `ssoController.updateOidcProvider` | Update OIDC provider config (requires org auth) |
| DELETE | `/business/sso/oidc/providers/:providerId` | `ssoController.deleteOidcProvider` | Delete OIDC provider config (requires org auth) |
| POST | `/business/sso/oidc/providers/:providerId/activate` | `ssoController.activateOidcProvider` | Activate OIDC provider (requires org auth) |
| POST | `/business/sso/oidc/providers/:providerId/deactivate` | `ssoController.deactivateOidcProvider` | Deactivate OIDC provider (requires org auth) |
| GET | `/business/scim/v2/Users` | `scimController.listUsers` | SCIM 2.0 list users (SCIM bearer token auth) |
| GET | `/business/scim/v2/Users/:id` | `scimController.getUser` | SCIM 2.0 get user (SCIM bearer token auth) |
| POST | `/business/scim/v2/Users` | `scimController.createUser` | SCIM 2.0 provision user (SCIM bearer token auth) |
| PUT | `/business/scim/v2/Users/:id` | `scimController.replaceUser` | SCIM 2.0 replace user (SCIM bearer token auth) |
| PATCH | `/business/scim/v2/Users/:id` | `scimController.patchUser` | SCIM 2.0 patch user (SCIM bearer token auth) |
| DELETE | `/business/scim/v2/Users/:id` | `scimController.deleteUser` | SCIM 2.0 deprovision user (SCIM bearer token auth) |

<!-- GENERATED:ENDPOINTS:END -->

---

## Domain Errors

All errors extend `AppError` and are defined in `modules/identity/domain/errors/IdentityErrors.ts`.

### Authentication Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `InvalidCredentialsError` | `identity.invalid_credentials` | 401 | Email/password combination is invalid |
| `AccountLockedError` | `identity.account_locked` | 401 | Account is temporarily locked |
| `AccountNotActiveError` | `identity.account_not_active` | 403 | Account is not in active status |
| `InvalidRefreshTokenError` | `identity.invalid_refresh_token` | 401 | Refresh token is invalid or revoked |
| `EmailRequiredError` | `identity.email_required` | 400 | Email is required for social login |
| `SocialAccountAlreadyLinkedError` | `identity.social_account_already_linked` | 409 | Social account is linked to another user |
| `SocialAccountNotLinkedError` | `identity.social_account_not_linked` | 404 | No social account linked to this user |
| `CannotUnlinkOnlyLoginMethodError` | `identity.cannot_unlink_only_login_method` | 400 | Cannot unlink the only login method |

### Validation Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `EmailAndPasswordRequiredError` | `identity.email_password_required` | 400 | Email and password are required |
| `InvalidEmailFormatError` | `identity.invalid_email_format` | 400 | Email format is invalid |
| `PasswordTooShortError` | `identity.password_too_short` | 400 | Password does not meet minimum length |
| `EmailAlreadyRegisteredError` | `identity.email_already_registered` | 409 | Email is already registered |

### Token Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `TokenRequiredError` | `identity.token_required` | 400 | Token and new password are required |
| `InvalidOrExpiredTokenError` | `identity.invalid_or_expired_token` | 400 | Reset token is invalid or expired |
| `TokenAlreadyUsedError` | `identity.token_already_used` | 400 | Reset token has already been used |
| `TokenExpiredError` | `identity.token_expired` | 400 | Reset token has expired |
| `VerificationTokenRequiredError` | `identity.verification_token_required` | 400 | Verification token is required |
| `InvalidVerificationTokenError` | `identity.invalid_verification_token` | 400 | Verification token is invalid |
| `VerificationTokenAlreadyUsedError` | `identity.verification_token_already_used` | 400 | Verification token has already been used |
| `VerificationTokenExpiredError` | `identity.verification_token_expired` | 400 | Verification token has expired |
| `EmailAlreadyVerifiedError` | `identity.email_already_verified` | 400 | Email is already verified |

### Admin Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `AdminFieldsRequiredError` | `identity.admin_fields_required` | 400 | Email, password, name, and role are required |
| `OnlySuperAdminCanCreateError` | `identity.only_super_admin_can_create` | 403 | Only super admins can create admin accounts |
| `EmailRequiredOnlyError` | `identity.email_required` | 400 | Email is required |
| `CustomerIdAndTokenRequiredError` | `identity.customer_id_and_token_required` | 400 | Customer ID and access token are required |

### Organization Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `OrganizationCodeRequiredError` | `identity.organization_code_required` | 400 | Organization code is required |
| `OrganizationNotFoundError` | `identity.organization_not_found` | 404 | Organization not found |
| `OrganizationNotActiveError` | `identity.organization_not_active` | 403 | Organization is not active |
| `OrganizationRegistrationFieldsRequiredError` | `identity.organization_fields_required` | 400 | Email, password, and business name are required |

### Store Assignment Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `UserNotFoundError` | `identity.user_not_found` | 404 | User not found |
| `StoreNotFoundError` | `identity.store_not_found` | 404 | Store not found |
| `UserAlreadyAssignedToStoreError` | `identity.user_already_assigned` | 409 | User is already assigned to this store |
| `UserStoreAssignmentNotFoundError` | `identity.user_store_assignment_not_found` | 404 | User store assignment not found |

### Token Management Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `RefreshTokenRequiredError` | `identity.refresh_token_required` | 400 | Refresh token is required |
| `RefreshTokenRevokedError` | `identity.refresh_token_revoked` | 401 | Refresh token has been revoked |
| `RefreshTokenExpiredError` | `identity.refresh_token_expired` | 401 | Refresh token has expired |

### Infrastructure Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `FailedToCreateSessionError` | `identity.session_creation_failed` | 500 | Failed to create session |
| `FailedToCreateRefreshTokenError` | `identity.refresh_token_creation_failed` | 500 | Failed to create refresh token |
| `FailedToBlacklistTokenError` | `identity.token_blacklist_failed` | 500 | Failed to blacklist token |
| `FailedToCreateSocialAccountError` | `identity.social_account_creation_failed` | 500 | Failed to create social account |

### SSO Errors

All SSO/SCIM errors are defined in `modules/identity/domain/errors/SsoErrors.ts`.

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `SsoProviderNotFoundError` | `identity.sso_provider_not_found` | 404 | SSO provider not found |
| `SsoProviderAlreadyExistsError` | `identity.sso_provider_already_exists` | 409 | SSO provider already exists |
| `SsoValidationError` | `identity.sso_validation_error` | 400 | SSO configuration validation error |
| `SamlAssertionError` | `identity.saml_assertion_error` | 401 | SAML assertion parsing or verification error |
| `SamlMetadataError` | `identity.saml_metadata_error` | 400 | SAML metadata error |
| `OidcTokenError` | `identity.oidc_token_error` | 401 | OIDC token exchange or userinfo error |
| `OidcDiscoveryError` | `identity.oidc_discovery_error` | 502 | OIDC discovery document fetch error |
| `ScimResourceNotFoundError` | `identity.scim_resource_not_found` | 404 | SCIM resource not found |
| `ScimValidationError` | `identity.scim_validation_error` | 400 | SCIM request validation error |
| `ScimConflictError` | `identity.scim_conflict` | 409 | SCIM resource conflict (e.g. duplicate user) |
| `ScimAuthenticationError` | `identity.scim_auth_error` | 401 | Invalid SCIM bearer token |

---

## Enterprise SSO (SAML / OIDC)

The identity module supports enterprise single sign-on via SAML 2.0 and OpenID Connect (OIDC). Each organization can configure multiple SSO providers, and users are automatically provisioned on first login via the `CredentialSubjectPort` ACL pattern.

### SAML 2.0

**Entity**: `SamlProvider` (`modules/identity/domain/entities/SamlProvider.ts`)

Per-organization SAML IdP configuration:
- IdP entity ID, SSO URL, SLO URL, X.509 certificate
- SP entity ID, ACS URL, binding (redirect/post), NameID format
- AuthnRequest signing (optional SP private key + certificate)
- Attribute mapping (email, firstName, lastName, displayName + extras)

**Assertion Parser**: `SamlAssertionParser` (`modules/identity/domain/services/SamlAssertionParser.ts`)
- Parses base64-encoded SAML responses
- Extracts NameID, attributes, issuer, time validity, session index
- Generates AuthnRequest XML and redirect URLs
- Verifies issuer match and time window

**Login Flow**:
1. `POST /business/sso/saml/login/:providerId` → returns redirect URL to IdP
2. User authenticates at IdP
3. IdP POSTs SAMLResponse to `POST /business/sso/saml/callback/:providerId`
4. Parser extracts assertion → maps attributes → find-or-create user → issue JWT

### OpenID Connect

**Entity**: `OidcProvider` (`modules/identity/domain/entities/OidcProvider.ts`)

Per-organization OIDC provider configuration:
- Issuer URL, client ID, client secret
- Scopes (default: openid, email, profile)
- Redirect URI, PKCE support
- Discovery document support (or manual endpoints)
- Claim mapping (email, firstName, lastName, displayName + extras)

**Token Exchange**: `OidcTokenExchange` (`modules/identity/domain/services/OidcTokenExchange.ts`)
- Builds authorization URL with PKCE challenge
- Exchanges authorization code for access/id/refresh tokens
- Fetches userinfo from IdP
- Caches discovery documents (1-hour TTL)

**Login Flow**:
1. `POST /business/sso/oidc/login/:providerId` → returns auth URL + state + PKCE verifier
2. User authenticates at IdP and is redirected back with code
3. `POST /business/sso/oidc/callback/:providerId` with code + codeVerifier → exchange code → fetch userinfo → find-or-create user → issue JWT

### SSO Configuration Management

All config routes require `isOrganizationLoggedIn` middleware:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/business/sso/providers` | List all SAML + OIDC providers |
| POST | `/business/sso/saml/providers` | Create SAML provider |
| PUT | `/business/sso/saml/providers/:providerId` | Update SAML provider |
| DELETE | `/business/sso/saml/providers/:providerId` | Delete SAML provider |
| POST | `/business/sso/saml/providers/:providerId/activate` | Activate SAML provider |
| POST | `/business/sso/saml/providers/:providerId/deactivate` | Deactivate SAML provider |
| POST | `/business/sso/oidc/providers` | Create OIDC provider |
| PUT | `/business/sso/oidc/providers/:providerId` | Update OIDC provider |
| DELETE | `/business/sso/oidc/providers/:providerId` | Delete OIDC provider |
| POST | `/business/sso/oidc/providers/:providerId/activate` | Activate OIDC provider |
| POST | `/business/sso/oidc/providers/:providerId/deactivate` | Deactivate OIDC provider |

### SSO Events

| Event Type | Description |
|---|---|
| `identity.sso.login` | Emitted on successful SSO login (SAML or OIDC) |
| `identity.sso.config_created` | Emitted when a new SSO provider is created |
| `identity.sso.config_updated` | Emitted when an SSO provider config is updated |
| `identity.sso.config_deleted` | Emitted when an SSO provider is deleted |
| `identity.sso.provider_activated` | Emitted when an SSO provider is activated |
| `identity.sso.provider_deactivated` | Emitted when an SSO provider is deactivated |

### Database Tables

| Table | Description |
|---|---|
| `samlProvider` | SAML IdP configurations (JSONB for attribute mappings) |
| `oidcProvider` | OIDC provider configurations (JSONB for scopes, claim mappings) |
| `scimProvisioningRecord` | SCIM provisioning records linking SCIM users to platform users |

---

## SCIM 2.0 User Provisioning

The identity module implements the SCIM 2.0 protocol for automated user provisioning from identity providers (Okta, Azure AD, etc.).

**Controller**: `ScimController` (`modules/identity/interface/controllers/scimController.ts`)

**Authentication**: SCIM bearer token (env `SCIM_BEARER_TOKEN`), separate from JWT auth.

### SCIM Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/business/scim/v2/Users` | List provisioned users (requires `organizationId` query param) |
| GET | `/business/scim/v2/Users/:id` | Get a single provisioned user by SCIM ID |
| POST | `/business/scim/v2/Users` | Provision a new user (find-or-create by email) |
| PUT | `/business/scim/v2/Users/:id` | Replace a user's attributes |
| PATCH | `/business/scim/v2/Users/:id` | Patch user attributes (SCIM PATCH operations) |
| DELETE | `/business/scim/v2/Users/:id` | Deprovision a user (sets isActive=false) |

### SCIM Events

| Event Type | Description |
|---|---|
| `identity.scim.user_provisioned` | Emitted when a user is provisioned via SCIM |
| `identity.scim.user_deprovisioned` | Emitted when a user is deprovisioned via SCIM |
| `identity.scim.user_updated` | Emitted when a provisioned user is updated via SCIM |

### Environment Variables

| Variable | Description |
|---|---|
| `SCIM_BEARER_TOKEN` | Bearer token for SCIM 2.0 API authentication |
| `ORGANIZATION_JWT_SECRET` | JWT secret for organization tokens (used by SSO login) |
| `JWT_EXPIRES_IN` | JWT token expiration duration (default: 7d) |
