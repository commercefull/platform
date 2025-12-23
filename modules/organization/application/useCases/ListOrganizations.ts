/**
 * ListOrganizations Use Case
 */

import organizationRepo from '../../repos/organizationRepo';

export interface ListOrganizationsInput {
  limit?: number;
  offset?: number;
}

export interface ListOrganizationsOutput {
  organizations: Array<{
    organizationId: string;
    name: string;
    slug: string;
    type: string;
    createdAt: Date;
  }>;
  total: number;
}

export class ListOrganizationsUseCase {
  async execute(input: ListOrganizationsInput = {}): Promise<ListOrganizationsOutput> {
    const organizations = await organizationRepo.findAll();

    // Apply pagination
    const start = input.offset || 0;
    const end = input.limit ? start + input.limit : undefined;
    const paginated = organizations.slice(start, end);

    return {
      organizations: paginated.map(org => ({
        organizationId: org.organizationId,
        name: org.name,
        slug: org.slug,
        type: org.type,
        createdAt: org.createdAt,
      })),
      total: organizations.length,
    };
  }
}
