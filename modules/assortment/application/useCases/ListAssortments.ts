/**
 * ListAssortments Use Case
 */

import assortmentRepo from '../../infrastructure/repositories/assortmentRepo';

export interface ListAssortmentsInput {
  organizationId: string;
}

export class ListAssortmentsUseCase {
  async execute(input: ListAssortmentsInput) {
    if (!input.organizationId) {
      throw new Error('Organization ID is required');
    }

    return await assortmentRepo.findAssortmentsByOrganization(input.organizationId);
  }
}
