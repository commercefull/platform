/**
 * SystemConfigPort
 *
 * ACL port owned by product. Provides read-only access to system
 * configuration needed for context-aware product listing.
 *
 * Only the adapter may import from configuration's domain.
 */

export interface SystemConfigSummary {
  isMarketplace: boolean;
  isMultiStore: boolean;
  isSingleStore: boolean;
}

export interface SystemConfigPort {
  findActive(): Promise<SystemConfigSummary | null>;
}
