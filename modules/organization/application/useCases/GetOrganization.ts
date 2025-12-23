/**
 * GetOrganization Use Case
 */

import organizationRepo from '../../repos/organizationRepo';

export interface GetOrganizationInput {
  organizationId?: string;
  slug?: string;
}

export interface GetOrganizationOutput {
  organizationId: string;
  name: string;
  slug: string;
  type: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class GetOrganizationUseCase {
  async execute(input: GetOrganizationInput): Promise<GetOrganizationOutput> {
    if (!input.organizationId && !input.slug) {
      throw new Error('Organization ID or slug is required');
    }

    let organization;
    if (input.organizationId) {
      organization = await organizationRepo.findById(input.organizationId);
    } else if (input.slug) {
      organization = await organizationRepo.findBySlug(input.slug);
    }

    if (!organization) {
      throw new Error('Organization not found');
    }

    return {
      organizationId: organization.organizationId,
      name: organization.name,
      slug: organization.slug,
      type: organization.type,
      settings: organization.settings,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }
}
