/**
 * SubscriptionStoreContextPort
 *
 * ACL port owned by subscription. Resolves the seller context
 * (organization + origin country) for a store so tax quoting matches
 * one-time checkout.
 */

export interface SubscriptionStoreContext {
  organizationId?: string;
  country?: string;
}

export interface SubscriptionStoreContextPort {
  getStoreContext(storeId: string): Promise<SubscriptionStoreContext | null>;
}
