# Identity Feature

The Identity feature unifies session-based and token-based authentication for customers, merchants ("business" users), and administrators. It consolidates legacy `auth` and `admin` flows into a single module under `features/identity`.

## Overview

- **Session-based access** for customer/merchant web apps
- **JWT-based access** for headless/mobile clients
- **Token lifecycle** support (refresh tokens + blacklist)
- **Password reset & email verification** flows
- **Role-aware identity service** encapsulating all auth logic

## Repositories

- `authRepo.ts`: password verification, password reset, email verification, fallback JWT support
- `authRefreshTokenRepo.ts`: CRUD & lifecycle operations for `authRefreshTokens`
- `authTokenBlacklistRepo.ts`: blacklist management for compromised tokens
- `customerSessionRepo.ts`: device-aware customer sessions
- `merchantSessionRepo.ts`: merchant sessions with last activity tracking

## Services & Controllers

- `IdentityService`: orchestrates authentication, session management, token issuance, password resets
- `authCustomerController.ts`: REST endpoints for customer login/register/token/password flows
- `authBusinessController.ts`: REST endpoints for merchant flows

## Routers

- `authCustomerRouter.ts`: routes customer auth endpoints (session + JWT)
- `authBusinessRouter.ts`: routes merchant auth endpoints

## Templates (Email/SMS)

Located in `templates/merchant/auth/*` for merchant-specific communication flows (e.g., password reset, email verification).

## Given/When/Then Scenarios

### Customer Session Authentication

- **Given** a customer provides valid email/password credentials
- **When** the client calls `POST /identity/customer/login`
- **Then** `IdentityService.authenticateCustomer` issues a session token saved via `customerSessionRepo`

### Customer JWT Authentication

- **Given** a customer provides valid credentials
- **When** the client invokes `POST /identity/customer/token`
- **Then** the controller returns both access & refresh JWT tokens after storing refresh token via `authRefreshTokenRepo`

### Refresh Token Rotation (Customer)

- **Given** a customer possesses a valid refresh token entry in `authRefreshTokens`
- **When** they hit `POST /identity/customer/token/refresh`
- **Then** `IdentityService.refreshToken` validates via `authRefreshTokenRepo` and issues a rotated token pair, updating `lastUsedAt`

### Token Blacklist (Logout)

- **Given** a user logs out or a token is compromised
- **When** an API endpoint triggers blacklist logic
- **Then** `authTokenBlacklistRepo.create` records the token and `IdentityService.validateToken` rejects future requests referencing it

### Password Reset Flow

- **Given** a user requests password reset
- **When** controller calls `IdentityService.requestPasswordReset`
- **Then** `authRepo.createPasswordResetToken` stores hashed token
- **And** email template `templates/merchant/auth/recoverpw.html` is used to notify user

- **Given** a user submits the reset token
- **When** `IdentityService.resetPassword` is invoked
- **Then** `authRepo.verifyPasswordResetToken` validates token and `authRepo.changePassword` persists the new password

### Email Verification

- **Given** a newly registered user needs verification
- **When** `authRepo.createEmailVerificationToken` is invoked
- **Then** a token is stored in the appropriate table (`customerEmailVerification` or `merchantEmailVerification`)
- **And** the corresponding email template (e.g., `templates/merchant/auth/confirm-mail.html`) is triggered externally
- **When** the user verifies
- **Then** `authRepo.verifyEmail` marks the token as used and flips the `emailVerified` flag

### Business/Merchant Session Authentication

- **Given** a merchant (business user) signs in
- **When** the client invokes `POST /identity/business/login`
- **Then** `authBusinessController` delegates to `IdentityService.authenticateMerchant` which creates a merchant session via `merchantSessionRepo`

### Business JWT Authentication

- **Given** a merchant uses mobile/headless login
- **When** they hit `POST /identity/business/token`
- **Then** they receive access + refresh tokens, stored via `authRefreshTokenRepo` with metadata (user agent, IP)

### Session Invalidation

- **Given** an active session token (customer or merchant)
- **When** the client calls `POST /identity/{role}/session/invalidate`
- **Then** `IdentityService.invalidateSession` targets the appropriate repo to deactivate the session (customer → `customerSessionRepo`, merchant → `merchantSessionRepo`)

### Refresh Token Revocation

- **Given** a user loses their device or wants to rebuild trust
- **When** `IdentityService.revokeRefreshToken(s)` is invoked via controllers
- **Then** `authRefreshTokenRepo.revoke` marks tokens revoked, and `authTokenBlacklistRepo` guards access for previously-issued JWTs

## Implementation Notes

- All database schemas use camelCase for columns, matching repo queries
- Repos leverage utility `transformDbToTs` to map DB records into camelCase TypeScript models
- Identity service centralizes config (session TTL, JWT secrets, expiry) via environment variables
- Templates remain optional but illustrate how email notifications use tokens generated by the identity system

---

This documentation should help integrate the Identity feature across session/JWT flows and ensure consistency between migrations, repositories, controllers, routers, and templates.
