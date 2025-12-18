/**
 * Mark Cart Recovered Use Case
 * Called when an abandoned cart is converted to an order
 */

import * as abandonedCartRepo from '../../../repos/abandonedCartRepo';

export interface MarkCartRecoveredInput {
  abandonedCartId: string;
  orderId: string;
  orderValue: number;
  source?: string;
}

export async function markCartRecovered(input: MarkCartRecoveredInput): Promise<void> {
  // Validate cart exists
  const cart = await abandonedCartRepo.getAbandonedCart(input.abandonedCartId);
  if (!cart) {
    throw new Error('Abandoned cart not found');
  }

  // Check if already recovered
  if (cart.status === 'recovered') {
    throw new Error('Cart is already marked as recovered');
  }

  await abandonedCartRepo.markRecovered(
    input.abandonedCartId,
    input.orderId,
    input.orderValue,
    input.source
  );
}

/**
 * Mark Cart Recovered By Basket ID
 * Alternative method when you have the basket ID instead of abandoned cart ID
 */
export async function markCartRecoveredByBasket(input: {
  basketId: string;
  orderId: string;
  orderValue: number;
  source?: string;
}): Promise<void> {
  const cart = await abandonedCartRepo.getAbandonedCartByBasket(input.basketId);
  if (!cart) {
    // Cart was never tracked as abandoned, nothing to do
    return;
  }

  if (cart.status === 'recovered') {
    return; // Already recovered
  }

  await abandonedCartRepo.markRecovered(
    cart.abandonedCartId,
    input.orderId,
    input.orderValue,
    input.source
  );
}
