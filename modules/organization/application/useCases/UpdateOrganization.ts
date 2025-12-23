/**
 * UpdateOrganization Use Case
 */

import organizationRepo from '../../repos/organizationRepo';

export interface UpdateOrganizationInput {
  organizationId: string;
  name?: string;
  slug?: string;
  type?: 'single' | 'multi_store' | 'marketplace' | 'b2b';
  settings?: Record<string, unknown>;
}

export interface UpdateOrganizationOutput {
  organizationId: string;
  name: string;
  slug: string;
  type: string;
  updatedAt: Date;
}

export class UpdateOrganizationUseCase {
  async execute(input: UpdateOrganizationInput): Promise<UpdateOrganizationOutput> {
    if (!input.organizationId) {
      throw new Error('Organization ID is required');
    }

    const existing = await organizationRepo.findById(input.organizationId);
    if (!existing) {
      throw new Error('Organization not found');
    }

    // Check slug if being updated
    if (input.slug && input.slug !== existing.slug) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(input.slug)) {
        throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
      }
      const slugExists = await organizationRepo.findBySlug(input.slug);
      if (slugExists) {
        throw new Error('Organization with this slug already exists');
      }
    }

    const updated = await organizationRepo.update(input.organizationId, {
      name: input.name,
      slug: input.slug,
      type: input.type,
      settings: input.settings,
    });

    if (!updated) {
      throw new Error('Failed to update organization');
    }

    return {
      organizationId: updated.organizationId,
      name: updated.name,
      slug: updated.slug,
      type: updated.type,
      updatedAt: updated.updatedAt,
    };
  }
}
