/**
 * Identity Event Emitter
 *
 * Helper functions to emit identity domain events.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import {
  CustomerLoginEvent,
  CustomerLogoutEvent,
  CustomerRegisteredEvent,
  MerchantLoginEvent,
  MerchantLogoutEvent,
  MerchantRegisteredEvent,
  PasswordResetRequestedEvent,
  PasswordResetCompletedEvent,
  TokenRefreshedEvent,
  SessionCreatedEvent,
  SessionInvalidatedEvent,
  TokenBlacklistedEvent,
  TokensCleanupEvent,
} from './IdentityEvents';

// ============================================================================
// Customer Events
// ============================================================================

export function emitCustomerLogin(payload: Omit<CustomerLoginEvent, 'timestamp'>): void {
  eventBus.emit('identity.customer.login', {
    ...payload,
    timestamp: new Date(),
  });
}

export function emitCustomerLogout(payload: Omit<CustomerLogoutEvent, 'timestamp'>): void {
  eventBus.emit('identity.customer.logout', {
    ...payload,
    timestamp: new Date(),
  });
}

export function emitCustomerRegistered(payload: Omit<CustomerRegisteredEvent, 'timestamp'>): void {
  eventBus.emit('identity.customer.registered', {
    ...payload,
    timestamp: new Date(),
  });
}

export function emitCustomerPasswordResetRequested(payload: Omit<PasswordResetRequestedEvent, 'timestamp' | 'userType'>): void {
  eventBus.emit('identity.customer.password_reset_requested', {
    ...payload,
    userType: 'customer',
    timestamp: new Date(),
  });
}

export function emitCustomerPasswordResetCompleted(payload: Omit<PasswordResetCompletedEvent, 'timestamp' | 'userType'>): void {
  eventBus.emit('identity.customer.password_reset_completed', {
    ...payload,
    userType: 'customer',
    timestamp: new Date(),
  });
}

export function emitCustomerTokenRefreshed(payload: Omit<TokenRefreshedEvent, 'timestamp' | 'userType'>): void {
  eventBus.emit('identity.customer.token_refreshed', {
    ...payload,
    userType: 'customer',
    timestamp: new Date(),
  });
}

// ============================================================================
// Merchant Events
// ============================================================================

export function emitMerchantLogin(payload: Omit<MerchantLoginEvent, 'timestamp'>): void {
  eventBus.emit('identity.merchant.login', {
    ...payload,
    timestamp: new Date(),
  });
}

export function emitMerchantLogout(payload: Omit<MerchantLogoutEvent, 'timestamp'>): void {
  eventBus.emit('identity.merchant.logout', {
    ...payload,
    timestamp: new Date(),
  });
}

export function emitMerchantRegistered(payload: Omit<MerchantRegisteredEvent, 'timestamp'>): void {
  eventBus.emit('identity.merchant.registered', {
    ...payload,
    timestamp: new Date(),
  });
}

export function emitMerchantPasswordResetRequested(payload: Omit<PasswordResetRequestedEvent, 'timestamp' | 'userType'>): void {
  eventBus.emit('identity.merchant.password_reset_requested', {
    ...payload,
    userType: 'merchant',
    timestamp: new Date(),
  });
}

export function emitMerchantPasswordResetCompleted(payload: Omit<PasswordResetCompletedEvent, 'timestamp' | 'userType'>): void {
  eventBus.emit('identity.merchant.password_reset_completed', {
    ...payload,
    userType: 'merchant',
    timestamp: new Date(),
  });
}

export function emitMerchantTokenRefreshed(payload: Omit<TokenRefreshedEvent, 'timestamp' | 'userType'>): void {
  eventBus.emit('identity.merchant.token_refreshed', {
    ...payload,
    userType: 'merchant',
    timestamp: new Date(),
  });
}

// ============================================================================
// Session Events
// ============================================================================

export function emitSessionCreated(payload: Omit<SessionCreatedEvent, 'timestamp'>): void {
  const eventType = payload.userType === 'customer' ? 'identity.customer.session_created' : 'identity.merchant.session_created';

  eventBus.emit(eventType, {
    ...payload,
    timestamp: new Date(),
  });
}

export function emitSessionInvalidated(payload: Omit<SessionInvalidatedEvent, 'timestamp'>): void {
  const eventType = payload.userType === 'customer' ? 'identity.customer.session_invalidated' : 'identity.merchant.session_invalidated';

  eventBus.emit(eventType, {
    ...payload,
    timestamp: new Date(),
  });
}

// ============================================================================
// Token Events
// ============================================================================

export function emitTokenBlacklisted(payload: Omit<TokenBlacklistedEvent, 'timestamp'>): void {
  eventBus.emit('identity.token.blacklisted', {
    ...payload,
    timestamp: new Date(),
  });
}

export function emitTokensCleanup(payload: Omit<TokensCleanupEvent, 'timestamp'>): void {
  eventBus.emit('identity.tokens.cleanup', {
    ...payload,
    timestamp: new Date(),
  });
}
