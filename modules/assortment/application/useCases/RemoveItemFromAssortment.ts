/**
 * RemoveItemFromAssortment Use Case
 */

import assortmentRepo from '../../repos/assortmentRepo';

export interface RemoveItemFromAssortmentInput {
  assortmentId: string;
  productVariantId: string;
}

export class RemoveItemFromAssortmentUseCase {
  async execute(input: RemoveItemFromAssortmentInput) {
    if (!input.assortmentId || !input.productVariantId) {
      throw new Error('Assortment ID and product variant ID are required');
    }

    const removed = await assortmentRepo.removeAssortmentItem(input.assortmentId, input.productVariantId);

    if (!removed) {
      throw new Error('Item not found in assortment');
    }

    return { success: true };
  }
}
