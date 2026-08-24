/**
 * OrganizationLookupAdapter
 *
 * ACL adapter implementing product's OrganizationLookupPort.
 * Translates organization's organizationRepo into product's
 * OrganizationSummary vocabulary.
 *
 * Only this adapter may import from organization's infrastructure.
 */

import { OrganizationLookupPort, OrganizationSummary } from '../../application/ports/OrganizationLookupPort';
import organizationRepo from '../../../organization/infrastructure/repositories/organizationRepo';

export class OrganizationLookupAdapter implements OrganizationLookupPort {
  async findById(id: string): Promise<OrganizationSummary | null> {
    const org = await organizationRepo.findById(id);
    if (!org) return null;
    return {
      id: org.organizationId,
      name: org.name,
      status: org.status ?? 'pending',
    };
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<OrganizationSummary[]> {
    const orgs = await organizationRepo.findAll(limit, offset);
    return orgs.map(org => ({
      id: org.organizationId,
      name: org.name,
      status: org.status ?? 'pending',
    }));
  }
}
