/**
 * CreateOrganization Use Case
 */

import organizationRepo from '../../repos/organizationRepo';

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  type?: 'single' | 'multi_store' | 'marketplace' | 'b2b';
  settings?: Record<string, unknown>;
}

export interface CreateOrganizationOutput {
  organizationId: string;
  name: string;
  slug: string;
  type: string;
}

export class CreateOrganizationUseCase {
  async execute(input: CreateOrganizationInput): Promise<CreateOrganizationOutput> {
    if (!input.name || !input.slug) {
      throw new Error('Name and slug are required');
    }

    // Check slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(input.slug)) {
      throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
    }

    // Check if slug exists
    const existing = await organizationRepo.findBySlug(input.slug);
    if (existing) {
      throw new Error('Organization with this slug already exists');
    }

    const organization = await organizationRepo.create({
      name: input.name,
      slug: input.slug,
      type: input.type,
      settings: input.settings,
    });

    return {
      organizationId: organization.organizationId,
      name: organization.name,
      slug: organization.slug,
      type: organization.type,
    };
  }
}
