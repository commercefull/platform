/**
 * Apply Coupon Use Case
 * Applies a coupon code to a checkout session
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { Money } from '../../../basket/domain/valueObjects/Money';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import { eventBus } from '../../../../libs/events/eventBus';
import { CouponRepository } from '../../../coupon/infrastructure/repositories/CouponRepository';

// ============================================================================
// Command
// ============================================================================

export class ApplyCouponCommand {
  constructor(
    public readonly checkoutId: string,
    public readonly couponCode: string,
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

    // Validate coupon code against coupon repository
    const couponRepo = new CouponRepository();
    const validation = await couponRepo.validateCouponCode(command.couponCode, session.subtotal.amount);

    if (!validation.valid || !validation.coupon) {
      throw new Error(validation.error || `Invalid coupon code: ${command.couponCode}`);
    }

    const discountAmount = Money.create(validation.discountAmount || 0, session.subtotal.currency);

    session.applyCoupon(command.couponCode, discountAmount);
    await this.checkoutRepository.save(session);

    eventBus.emit('checkout.updated', {
      checkoutId: session.id,
      field: 'coupon',
      couponCode: command.couponCode,
      discountAmount: discountAmount.amount,
    });

    return mapCheckoutToResponse(session);
  }
}
