/**
 * Get Abandoned Cart Use Case
 */

import * as abandonedCartRepo from '../../../repos/abandonedCartRepo';

export interface GetAbandonedCartInput {
  abandonedCartId: string;
}

export interface GetAbandonedCartOutput {
  cart: abandonedCartRepo.AbandonedCart;
  emails: abandonedCartRepo.AbandonedCartEmail[];
}

export async function getAbandonedCart(input: GetAbandonedCartInput): Promise<GetAbandonedCartOutput> {
  const cart = await abandonedCartRepo.getAbandonedCart(input.abandonedCartId);
  
  if (!cart) {
    throw new Error('Abandoned cart not found');
  }

  const emails = await abandonedCartRepo.getAbandonedCartEmails(input.abandonedCartId);

  return { cart, emails };
}
