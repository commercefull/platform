/**
 * StoreLookupPort
 *
 * ACL port owned by product. Provides read-only access to store
 * data needed for context-aware product listing.
 *
 * Only the adapter may import from store's domain.
 */

export interface StoreSummary {
  storeId: string;
  organizationId?: string;
}

export interface StoreLookupPort {
  findById(storeId: string): Promise<StoreSummary | null>;
}
