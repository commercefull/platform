/**
 * GetAssortment Use Case
 */

import assortmentRepo from '../../repos/assortmentRepo';

export interface GetAssortmentInput {
  assortmentId: string;
}

export class GetAssortmentUseCase {
  async execute(input: GetAssortmentInput) {
    if (!input.assortmentId) {
      throw new Error('Assortment ID is required');
    }

    const assortment = await assortmentRepo.findAssortmentById(input.assortmentId);
    if (!assortment) {
      throw new Error('Assortment not found');
    }

    return assortment;
  }
}
