/**
 * Identity Domain Events
 * 
 * Events emitted by the identity subdomain for authentication and authorization operations.
 */

// ============================================================================
// Event Types
// ============================================================================

export type IdentityEventType =
  | 'identity.customer.login'
  | 'identity.customer.logout'
  | 'identity.customer.registered'
  | 'identity.customer.password_reset_requested'
  | 'identity.customer.password_reset_completed'
  | 'identity.customer.token_refreshed'
  | 'identity.customer.session_created'
  | 'identity.customer.session_invalidated'
  | 'identity.customer.social_login'
  | 'identity.customer.social_account_linked'
  | 'identity.customer.social_account_unlinked'
  | 'identity.merchant.login'
  | 'identity.merchant.logout'
  | 'identity.merchant.registered'
  | 'identity.merchant.password_reset_requested'
  | 'identity.merchant.password_reset_completed'
  | 'identity.merchant.token_refreshed'
  | 'identity.merchant.session_created'
  | 'identity.merchant.session_invalidated'
  | 'identity.merchant.social_login'
  | 'identity.merchant.social_account_linked'
  | 'identity.merchant.social_account_unlinked'
  | 'identity.token.blacklisted'
  | 'identity.tokens.cleanup';

// ============================================================================
// Event Payloads
// ============================================================================

export interface CustomerLoginEvent {
  customerId: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface CustomerLogoutEvent {
  customerId: string;
  sessionId?: string;
  timestamp: Date;
}

export interface CustomerRegisteredEvent {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  timestamp: Date;
}

export interface PasswordResetRequestedEvent {
  userId: string;
  userType: 'customer' | 'merchant';
  email: string;
  resetToken: string;
  expiresAt: Date;
  timestamp: Date;
}

export interface PasswordResetCompletedEvent {
  userId: string;
  userType: 'customer' | 'merchant';
  timestamp: Date;
}

export interface TokenRefreshedEvent {
  userId: string;
  userType: 'customer' | 'merchant';
  ipAddress?: string;
  timestamp: Date;
}

export interface SessionCreatedEvent {
  sessionId: string;
  userId: string;
  userType: 'customer' | 'merchant';
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  timestamp: Date;
}

export interface SessionInvalidatedEvent {
  sessionId: string;
  userId: string;
  userType: 'customer' | 'merchant';
  reason: 'logout' | 'expired' | 'revoked' | 'security';
  timestamp: Date;
}

export interface MerchantLoginEvent {
  merchantId: string;
  email: string;
  name: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface MerchantLogoutEvent {
  merchantId: string;
  sessionId?: string;
  timestamp: Date;
}

export interface MerchantRegisteredEvent {
  merchantId: string;
  email: string;
  name: string;
  status: string;
  timestamp: Date;
}

export interface TokenBlacklistedEvent {
  token: string;
  userId: string;
  userType: 'customer' | 'merchant';
  reason: string;
  timestamp: Date;
}

export interface TokensCleanupEvent {
  expiredRefreshTokens: number;
  expiredBlacklistEntries: number;
  expiredSessions: number;
  timestamp: Date;
}

export interface SocialLoginEvent {
  userId: string;
  userType: 'customer' | 'merchant';
  email: string;
  provider: string;
  providerUserId: string;
  isNewUser: boolean;
  ipAddress?: string;
  timestamp: Date;
}

export interface SocialAccountLinkedEvent {
  userId: string;
  userType: 'customer' | 'merchant';
  provider: string;
  providerUserId: string;
  providerEmail?: string;
  timestamp: Date;
}

export interface SocialAccountUnlinkedEvent {
  userId: string;
  userType: 'customer' | 'merchant';
  provider: string;
  timestamp: Date;
}

// ============================================================================
// Event Union Type
// ============================================================================

export type IdentityEvent =
  | { type: 'identity.customer.login'; payload: CustomerLoginEvent }
  | { type: 'identity.customer.logout'; payload: CustomerLogoutEvent }
  | { type: 'identity.customer.registered'; payload: CustomerRegisteredEvent }
  | { type: 'identity.customer.password_reset_requested'; payload: PasswordResetRequestedEvent }
  | { type: 'identity.customer.password_reset_completed'; payload: PasswordResetCompletedEvent }
  | { type: 'identity.customer.token_refreshed'; payload: TokenRefreshedEvent }
  | { type: 'identity.customer.session_created'; payload: SessionCreatedEvent }
  | { type: 'identity.customer.session_invalidated'; payload: SessionInvalidatedEvent }
  | { type: 'identity.merchant.login'; payload: MerchantLoginEvent }
  | { type: 'identity.merchant.logout'; payload: MerchantLogoutEvent }
  | { type: 'identity.merchant.registered'; payload: MerchantRegisteredEvent }
  | { type: 'identity.merchant.password_reset_requested'; payload: PasswordResetRequestedEvent }
  | { type: 'identity.merchant.password_reset_completed'; payload: PasswordResetCompletedEvent }
  | { type: 'identity.merchant.token_refreshed'; payload: TokenRefreshedEvent }
  | { type: 'identity.merchant.session_created'; payload: SessionCreatedEvent }
  | { type: 'identity.merchant.session_invalidated'; payload: SessionInvalidatedEvent }
  | { type: 'identity.token.blacklisted'; payload: TokenBlacklistedEvent }
  | { type: 'identity.tokens.cleanup'; payload: TokensCleanupEvent };
