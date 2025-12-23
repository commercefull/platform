/**
 * GetOrganizationStores Use Case
 */

import organizationRepo from '../../repos/organizationRepo';

export interface GetOrganizationStoresInput {
  organizationId: string;
  limit?: number;
  offset?: number;
}

export interface GetOrganizationStoresOutput {
  stores: Array<{
    storeId: string;
    name: string;
    slug: string;
    status: string;
  }>;
  total: number;
}

export class GetOrganizationStoresUseCase {
  async execute(input: GetOrganizationStoresInput): Promise<GetOrganizationStoresOutput> {
    if (!input.organizationId) {
      throw new Error('Organization ID is required');
    }

    const organization = await organizationRepo.findById(input.organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    const stores = await organizationRepo.getStoresByOrganization(input.organizationId);

    // Apply pagination
    const start = input.offset || 0;
    const end = input.limit ? start + input.limit : undefined;
    const paginated = stores.slice(start, end);

    return {
      stores: paginated.map(store => ({
        storeId: store.storeId,
        name: store.name,
        slug: store.slug,
        status: store.status,
      })),
      total: stores.length,
    };
  }
}
