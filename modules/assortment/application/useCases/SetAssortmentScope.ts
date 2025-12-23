/**
 * SetAssortmentScope Use Case
 */

import assortmentRepo from '../../repos/assortmentRepo';

export interface SetAssortmentScopeInput {
  assortmentId: string;
  storeId?: string;
  sellerId?: string;
  accountId?: string;
  channelId?: string;
}

export class SetAssortmentScopeUseCase {
  async execute(input: SetAssortmentScopeInput) {
    if (!input.assortmentId) {
      throw new Error('Assortment ID is required');
    }

    if (!input.storeId && !input.sellerId && !input.accountId && !input.channelId) {
      throw new Error('At least one scope identifier is required');
    }

    const assortment = await assortmentRepo.findAssortmentById(input.assortmentId);
    if (!assortment) {
      throw new Error('Assortment not found');
    }

    return await assortmentRepo.createAssortmentScope(input);
  }
}
