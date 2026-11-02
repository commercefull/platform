/**
 * Identity Event Emitter
 *
 * Helper functions to emit identity domain events.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { CustomerLoginEvent, OrganizationLoginEvent, OrganizationRegisteredEvent, TokenRefreshedEvent } from './IdentityEvents';

// ============================================================================
// Customer Events
// ============================================================================

export function emitCustomerLogin(payload: Omit<CustomerLoginEvent, 'timestamp'>): void {
  eventBus.emit('identity.customer.login', {
    ...payload,
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

export function emitOrganizationLogin(payload: Omit<OrganizationLoginEvent, 'timestamp'>): void {
  eventBus.emit('identity.organization.login', {
    ...payload,
    timestamp: new Date(),
  });
}


export function emitOrganizationRegistered(payload: Omit<OrganizationRegisteredEvent, 'timestamp'>): void {
  eventBus.emit('identity.organization.registered', {
    ...payload,
    timestamp: new Date(),
  });
}



export function emitOrganizationTokenRefreshed(payload: Omit<TokenRefreshedEvent, 'timestamp' | 'userType'>): void {
  eventBus.emit('identity.organization.token_refreshed', {
    ...payload,
    userType: 'organization',
    timestamp: new Date(),
  });
}

// ============================================================================
// Session Events
// ============================================================================



// ============================================================================
// Token Events
// ============================================================================



