/**
 * OrganizationLookupAdapter
 *
 * ACL adapter implementing store's OrganizationLookupPort.
 * Translates organization's organizationRepo into store's
 * OrganizationSummary vocabulary.
 *
 * Only this adapter may import from organization's infrastructure.
 */

import { OrganizationLookupPort, OrganizationSummary } from '../../application/ports/OrganizationLookupPort';
import type organizationRepo from '../../../organization/infrastructure/repositories/organizationRepo';

export class OrganizationLookupAdapter implements OrganizationLookupPort {
  constructor(private readonly orgRepo: Pick<typeof organizationRepo, 'findById' | 'findAll'>) {}

  async findById(id: string): Promise<OrganizationSummary | null> {
    const org = await this.orgRepo.findById(id);
    if (!org) return null;
    return {
      id: org.organizationId,
      name: org.name,
      status: org.status ?? 'pending',
    };
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<OrganizationSummary[]> {
    const orgs = await this.orgRepo.findAll(limit, offset);
    return orgs.map(org => ({
      id: org.organizationId,
      name: org.name,
      status: org.status ?? 'pending',
    }));
  }
}
