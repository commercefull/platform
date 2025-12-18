/**
 * Apply Coupon Use Case
 * Applies a coupon code to a checkout session
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { Money } from '../../../basket/domain/valueObjects/Money';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class ApplyCouponCommand {
  constructor(
    public readonly checkoutId: string,
    public readonly couponCode: string
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class ApplyCouponUseCase {
  constructor(private readonly checkoutRepository: CheckoutRepository) {}

  async execute(command: ApplyCouponCommand): Promise<CheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new Error('Checkout session not found');
    }

    // TODO: Validate coupon code against coupon service
    // For now, apply a 10% discount as placeholder
    const discountAmount = Money.create(
      session.subtotal.amount * 0.1,
      session.subtotal.currency
    );

    session.applyCoupon(command.couponCode, discountAmount);
    await this.checkoutRepository.save(session);

    eventBus.emit('checkout.updated', {
      checkoutId: session.id,
      field: 'coupon',
      couponCode: command.couponCode,
      discountAmount: discountAmount.amount
    });

    return mapCheckoutToResponse(session);
  }
}
