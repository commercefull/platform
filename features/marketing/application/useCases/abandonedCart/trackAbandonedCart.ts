/**
 * Track Abandoned Cart Use Case
 * Called when a cart is detected as abandoned
 */

import * as abandonedCartRepo from '../../../repos/abandonedCartRepo';

export interface TrackAbandonedCartInput {
  basketId: string;
  customerId?: string;
  email?: string;
  firstName?: string;
  cartValue: number;
  currency?: string;
  itemCount: number;
  cartSnapshot?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  country?: string;
}

export interface TrackAbandonedCartOutput {
  cart: abandonedCartRepo.AbandonedCart;
  isNew: boolean;
}

export async function trackAbandonedCart(input: TrackAbandonedCartInput): Promise<TrackAbandonedCartOutput> {
  // Check if cart already tracked
  const existing = await abandonedCartRepo.getAbandonedCartByBasket(input.basketId);
  
  if (existing) {
    // Update existing cart
    const cart = await abandonedCartRepo.saveAbandonedCart({
      abandonedCartId: existing.abandonedCartId,
      basketId: input.basketId,
      email: input.email ?? existing.email,
      firstName: input.firstName ?? existing.firstName,
      cartValue: input.cartValue,
      currency: input.currency ?? existing.currency,
      itemCount: input.itemCount,
      cartSnapshot: input.cartSnapshot ?? existing.cartSnapshot
    });
    return { cart, isNew: false };
  }

  // Create new abandoned cart record
  const cart = await abandonedCartRepo.saveAbandonedCart({
    basketId: input.basketId,
    customerId: input.customerId,
    email: input.email,
    firstName: input.firstName,
    cartValue: input.cartValue,
    currency: input.currency || 'USD',
    itemCount: input.itemCount,
    cartSnapshot: input.cartSnapshot,
    abandonedAt: new Date(),
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    deviceType: input.deviceType,
    country: input.country
  });

  return { cart, isNew: true };
}
