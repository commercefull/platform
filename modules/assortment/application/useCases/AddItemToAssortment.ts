/**
 * AddItemToAssortment Use Case
 */

import assortmentRepo from '../../repos/assortmentRepo';

export interface AddItemToAssortmentInput {
  assortmentId: string;
  productVariantId: string;
  visibility?: 'listed' | 'hidden';
  buyable?: boolean;
  minQty?: number;
  maxQty?: number;
}

export class AddItemToAssortmentUseCase {
  async execute(input: AddItemToAssortmentInput) {
    if (!input.assortmentId || !input.productVariantId) {
      throw new Error('Assortment ID and product variant ID are required');
    }

    const assortment = await assortmentRepo.findAssortmentById(input.assortmentId);
    if (!assortment) {
      throw new Error('Assortment not found');
    }

    return await assortmentRepo.addAssortmentItem(input);
  }
}
