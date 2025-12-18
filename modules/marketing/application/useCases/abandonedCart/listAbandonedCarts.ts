/**
 * List Abandoned Carts Use Case
 */

import * as abandonedCartRepo from '../../../repos/abandonedCartRepo';

export interface ListAbandonedCartsInput {
  status?: 'abandoned' | 'reminded' | 'recovered' | 'opted_out' | 'expired';
  customerId?: string;
  email?: string;
  minValue?: number;
  abandonedAfter?: Date;
  abandonedBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface ListAbandonedCartsOutput {
  data: abandonedCartRepo.AbandonedCart[];
  total: number;
}

export async function listAbandonedCarts(input: ListAbandonedCartsInput): Promise<ListAbandonedCartsOutput> {
  const result = await abandonedCartRepo.getAbandonedCarts(
    {
      status: input.status,
      customerId: input.customerId,
      email: input.email,
      minValue: input.minValue,
      abandonedAfter: input.abandonedAfter,
      abandonedBefore: input.abandonedBefore
    },
    { 
      limit: input.limit || 20, 
      offset: input.offset || 0 
    }
  );

  return result;
}
