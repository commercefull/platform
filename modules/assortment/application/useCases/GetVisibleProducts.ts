/**
 * GetVisibleProducts Use Case
 */

import assortmentRepo from '../../repos/assortmentRepo';

export interface GetVisibleProductsInput {
  storeId: string;
  limit?: number;
  offset?: number;
}

export class GetVisibleProductsUseCase {
  async execute(input: GetVisibleProductsInput) {
    if (!input.storeId) {
      throw new Error('Store ID is required');
    }

    return await assortmentRepo.getVisibleProducts(input.storeId, {
      limit: input.limit,
      offset: input.offset,
    });
  }
}
