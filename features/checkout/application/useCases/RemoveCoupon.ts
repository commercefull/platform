/**
 * Remove Coupon Use Case
 * Removes a coupon code from a checkout session
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class RemoveCouponCommand {
  constructor(
    public readonly checkoutId: string
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class RemoveCouponUseCase {
  constructor(private readonly checkoutRepository: CheckoutRepository) {}

  async execute(command: RemoveCouponCommand): Promise<CheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new Error('Checkout session not found');
    }

    const previousCoupon = session.couponCode;
    session.removeCoupon();
    await this.checkoutRepository.save(session);

    eventBus.emit('checkout.updated', {
      checkoutId: session.id,
      field: 'coupon',
      couponCode: null,
      previousCoupon
    });

    return mapCheckoutToResponse(session);
  }
}
