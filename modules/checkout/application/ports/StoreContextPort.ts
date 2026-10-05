/**
 * StoreContextPort
 *
 * ACL port owned by checkout. Resolves seller context for a store —
 * organization identity and origin country — for tax quoting
 * (nexus coverage, VAT registration, cross-border detection).
 */

export interface StoreContext {
  organizationId?: string;
  country?: string;
}

export interface StoreContextPort {
  getStoreContext(storeId: string): Promise<StoreContext | null>;
}
