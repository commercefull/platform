# Authentication Feature

The Authentication Feature is a core component of the CommerceFull platform that provides comprehensive authentication and authorization functionality for customers, merchants, and administrators.

## Overview

This feature enables secure user authentication, token management, password reset, and email verification across all user types. It follows the platform's standardized naming convention to ensure consistency and maintainability.

## Components

### Authentication Repository (`authRepo.ts`)
- Handles authentication credentials validation
- Password hashing and verification
- Password reset token generation and verification
- Token blacklisting and refresh token management
- Email verification
- Follows platform's standardized naming convention

### Authentication Controller (`authController.ts`)
- Login endpoints for customers, merchants, and admins
- Registration endpoints with password handling
- Password reset functionality
- JWT token generation and validation
- Email verification endpoints

### Authentication Middleware (`authMiddleware.ts`)
- Token validation
- Role-based access control (customer, merchant, admin)
- Optional authentication support
- Rate limiting for security

### Customer Router (`router.ts`)
- Customer login and registration
- Merchant login and registration
- Password reset functionality
- Profile access endpoints with proper authentication
- Token refresh and validation endpoints

### Admin Router (`routerAdmin.ts`)
- Admin authentication
- Merchant account management
- Protected admin routes
- User management endpoints

## Naming Convention

This feature follows the platform's standardized naming convention:

1. **Database Columns**: Use `snake_case` (e.g., `user_id`, `expires_at`, `is_used`)
2. **TypeScript Interfaces**: Use `camelCase` (e.g., `userId`, `expiresAt`, `isUsed`)
3. **Repository Methods**: Handle the translation between naming conventions using mapping dictionaries

Field mapping dictionaries in the repository define the mapping between database columns and TypeScript interface properties:

```typescript
const passwordResetFields: Record<string, string> = {
  id: 'id',
  userId: 'user_id',
  token: 'token',
  expiresAt: 'expires_at',
  isUsed: 'is_used',
  createdAt: 'created_at'
};
```

Transformation functions convert between database records and TypeScript objects:

```typescript
function transformDbToTs<T>(dbRecord: any, fieldMap: Record<string, string>): T {
  if (!dbRecord) return null as any;
  
  const result: any = {};
  
  Object.entries(fieldMap).forEach(([tsKey, dbKey]) => {
    if (dbRecord[dbKey] !== undefined) {
      result[tsKey] = dbRecord[dbKey];
    }
  });
  
  return result as T;
}
```

## API Endpoints

### Authentication Endpoints

- `POST /auth/login`: Customer login
- `POST /auth/merchant/login`: Merchant login
- `POST /auth/admin/login`: Admin login
- `POST /auth/register`: Customer registration
- `POST /auth/merchant/register`: Merchant registration
- `POST /auth/refresh`: Refresh access token
- `POST /auth/logout`: Logout (blacklist token)
- `GET /auth/validate`: Validate access token

### Password Management Endpoints

- `POST /auth/forgot-password`: Request password reset
- `GET /auth/reset-password/verify`: Verify password reset token
- `POST /auth/reset-password`: Reset password with token
- `POST /auth/change-password`: Change password (authenticated)

### Email Verification Endpoints

- `POST /auth/request-verification`: Request email verification
- `GET /auth/verify-email`: Verify email with token

### Admin Auth Management Endpoints

- `GET /admin/auth/user/:id`: Get user auth details
- `POST /admin/auth/revoke-tokens`: Revoke all tokens for a user
- `POST /admin/auth/force-reset`: Force reset a user's password
- `POST /admin/auth/cleanup-tokens`: Clean up expired tokens

## Database Schema

The auth feature uses the following tables:

- `customer_password_reset`: Password reset tokens for customers
- `merchant_password_reset`: Password reset tokens for merchants
- `admin_password_reset`: Password reset tokens for admins
- `auth_token_blacklist`: Blacklisted tokens (e.g., from logout)
- `auth_refresh_tokens`: Refresh tokens for maintaining longer sessions
- `customer_email_verification`: Email verification tokens for customers
- `merchant_email_verification`: Email verification tokens for merchants

## Usage Examples

### Authentication

```typescript
// Customer login
const customerAuth = await authRepo.authenticateCustomer({
  email: 'customer@example.com',
  password: 'securePassword123'
});

// Merchant login
const merchantAuth = await authRepo.authenticateMerchant({
  email: 'merchant@example.com',
  password: 'securePassword123'
});

// Admin login
const adminAuth = await authRepo.authenticateAdmin({
  email: 'admin@example.com',
  password: 'securePassword123'
});
```

### Password Reset

```typescript
// Generate password reset token
const resetToken = await authRepo.createPasswordResetToken(
  userId,
  'customer' // or 'merchant' or 'admin'
);

// Verify password reset token
const userId = await authRepo.verifyPasswordResetToken(
  token,
  'customer' // or 'merchant' or 'admin'
);
```

### Token Management

```typescript
// Blacklist a token (on logout)
await authRepo.blacklistToken(token, userId, 'customer', 'logout');

// Check if a token is blacklisted
const isBlacklisted = await authRepo.isTokenBlacklisted(token);

// Create a refresh token
const refreshToken = await authRepo.createRefreshToken(
  userId,
  'customer',
  userAgent,
  ipAddress
);

// Get refresh token
const token = await authRepo.getRefreshToken(refreshTokenString);

// Revoke all refresh tokens for a user
const revokedCount = await authRepo.revokeAllUserRefreshTokens(userId, 'customer');
```

### Email Verification

```typescript
// Create email verification token
const verificationToken = await authRepo.createEmailVerificationToken(
  userId,
  'customer' // or 'merchant'
);

// Verify email
const userId = await authRepo.verifyEmail(
  token,
  'customer' // or 'merchant'
);
```

## Security Considerations

- Passwords are hashed using bcrypt with appropriate salt rounds
- JWT tokens have configurable expiration times
- Refresh tokens can be revoked individually or completely for a user
- Rate limiting is implemented to prevent brute force attacks
- Token blacklisting prevents reuse of logged-out tokens
- Email verification reduces the risk of account hijacking

## Implementation Notes

We've successfully implemented the authentication functionality following the established architecture pattern of the platform. The repository layer now follows the platform's standardized naming convention:

1. Using snake_case for all database columns
2. Using camelCase for all TypeScript interfaces
3. Providing field mapping dictionaries for translation
4. Implementing transformation functions for database records

Additional improvements include:

1. Adding proper imports for crypto and JWT libraries
2. Handling password fields with custom interfaces and type assertions
3. Creating a custom AuthRequest interface to avoid conflicts with Express.Request types
4. Using consistent naming throughout the codebase
5. Adding comprehensive token management functionality
6. Implementing email verification flows

These components allow customers, merchants, and admins to securely authenticate, manage their accounts, reset passwords, and verify emails while ensuring proper data handling and standardization throughout the application.