/**
 * OrganizationLookupPort
 *
 * ACL port owned by product. Provides read-only organization lookups
 * needed for context-aware product listing (default org in single-store mode).
 */

export interface OrganizationSummary {
  id: string;
  name: string;
  status: string;
}

export interface OrganizationLookupPort {
  findById(id: string): Promise<OrganizationSummary | null>;
  findAll(limit?: number, offset?: number): Promise<OrganizationSummary[]>;
}
