/**
 * CreateAssortment Use Case
 */

import assortmentRepo from '../../repos/assortmentRepo';

export interface CreateAssortmentInput {
  organizationId: string;
  name: string;
  description?: string;
  scopeType: 'store' | 'seller' | 'account' | 'channel';
  isDefault?: boolean;
}

export class CreateAssortmentUseCase {
  async execute(input: CreateAssortmentInput) {
    if (!input.organizationId || !input.name || !input.scopeType) {
      throw new Error('Organization ID, name, and scope type are required');
    }

    return await assortmentRepo.createAssortment(input);
  }
}
