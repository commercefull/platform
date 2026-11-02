/**
 * Identity Domain Events
 *
 * Events emitted by the identity subdomain for authentication and authorization operations.
 */

// ============================================================================
// Event Types
// ============================================================================


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





export interface TokenRefreshedEvent {
  userId: string;
  userType: 'customer' | 'organization';
  ipAddress?: string;
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


export interface OrganizationRegisteredEvent {
  organizationId: string;
  email: string;
  name: string;
  status: string;
  timestamp: Date;
}






// ============================================================================
// Event Union Type
// ============================================================================



