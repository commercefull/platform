/**
 * OrganizationLookupPort
 *
 * ACL port owned by store. Provides read-only organization lookups
 * needed for store ownership validation.
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
