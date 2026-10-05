/**
 * SubscriptionAddressPort
 *
 * ACL port owned by subscription. Resolves a customer address into the
 * destination shape the tax port needs.
 */

export interface SubscriptionDestination {
  country: string;
  region?: string;
  postalCode?: string;
  city?: string;
}

export interface SubscriptionAddressPort {
  resolveDestination(customerAddressId: string): Promise<SubscriptionDestination | null>;
}
