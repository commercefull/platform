/**
 * StoreLookupPort
 *
 * ACL port owned by identity. Provides read-only access to store
 * data needed for user-store assignment validation.
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
