/**
 * SystemConfigPort
 *
 * ACL port owned by store. Provides read-only access to system
 * configuration needed for store creation validation.
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
