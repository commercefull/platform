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
  | 'identity.organization.login'
  | 'identity.organization.logout'
  | 'identity.organization.registered'
  | 'identity.organization.password_reset_requested'
  | 'identity.organization.password_reset_completed'
  | 'identity.organization.token_refreshed'
  | 'identity.organization.session_created'
  | 'identity.organization.session_invalidated'
  | 'identity.organization.social_login'
  | 'identity.organization.social_account_linked'
  | 'identity.organization.social_account_unlinked'
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
  userType: 'customer' | 'organization';
  email: string;
  resetToken: string;
  expiresAt: Date;
  timestamp: Date;
}

export interface PasswordResetCompletedEvent {
  userId: string;
  userType: 'customer' | 'organization';
  timestamp: Date;
}

export interface TokenRefreshedEvent {
  userId: string;
  userType: 'customer' | 'organization';
  ipAddress?: string;
  timestamp: Date;
}

export interface SessionCreatedEvent {
  sessionId: string;
  userId: string;
  userType: 'customer' | 'organization';
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  timestamp: Date;
}

export interface SessionInvalidatedEvent {
  sessionId: string;
  userId: string;
  userType: 'customer' | 'organization';
  reason: 'logout' | 'expired' | 'revoked' | 'security';
  timestamp: Date;
}

export interface OrganizationLoginEvent {
  organizationId: string;
  email: string;
  name: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface OrganizationLogoutEvent {
  organizationId: string;
  sessionId?: string;
  timestamp: Date;
}

export interface OrganizationRegisteredEvent {
  organizationId: string;
  email: string;
  name: string;
  status: string;
  timestamp: Date;
}

export interface TokenBlacklistedEvent {
  token: string;
  userId: string;
  userType: 'customer' | 'organization';
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
  userType: 'customer' | 'organization';
  email: string;
  provider: string;
  providerUserId: string;
  isNewUser: boolean;
  ipAddress?: string;
  timestamp: Date;
}

export interface SocialAccountLinkedEvent {
  userId: string;
  userType: 'customer' | 'organization';
  provider: string;
  providerUserId: string;
  providerEmail?: string;
  timestamp: Date;
}

export interface SocialAccountUnlinkedEvent {
  userId: string;
  userType: 'customer' | 'organization';
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
  | { type: 'identity.organization.login'; payload: OrganizationLoginEvent }
  | { type: 'identity.organization.logout'; payload: OrganizationLogoutEvent }
  | { type: 'identity.organization.registered'; payload: OrganizationRegisteredEvent }
  | { type: 'identity.organization.password_reset_requested'; payload: PasswordResetRequestedEvent }
  | { type: 'identity.organization.password_reset_completed'; payload: PasswordResetCompletedEvent }
  | { type: 'identity.organization.token_refreshed'; payload: TokenRefreshedEvent }
  | { type: 'identity.organization.session_created'; payload: SessionCreatedEvent }
  | { type: 'identity.organization.session_invalidated'; payload: SessionInvalidatedEvent }
  | { type: 'identity.token.blacklisted'; payload: TokenBlacklistedEvent }
  | { type: 'identity.tokens.cleanup'; payload: TokensCleanupEvent };
