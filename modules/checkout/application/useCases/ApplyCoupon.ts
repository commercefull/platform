/**
 * Apply Coupon Use Case
 * Applies a coupon code to a checkout session
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { DiscountQuotePort } from '../../application/ports/DiscountQuotePort';
import { Money } from '../../../../libs/money';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import { eventBus } from '../../../../libs/events/eventBus';
import { BadRequestError, NotFoundError } from '../../../../libs/errors';

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
  constructor(
    private readonly checkoutRepository: CheckoutRepository,
    private readonly discountQuotePort?: DiscountQuotePort,
  ) {}

  async execute(command: ApplyCouponCommand): Promise<CheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new NotFoundError('Checkout session not found');
    }

    if (!this.discountQuotePort) {
      throw new BadRequestError('Discount service unavailable');
    }

    const validation = await this.discountQuotePort.validateDiscount(command.couponCode, session.subtotal.amount, session.subtotal.currency);

    if (!validation.valid || !validation.discount) {
      throw new BadRequestError(validation.error || `Invalid coupon code: ${command.couponCode}`);
    }

    const discountAmount = Money.create(validation.discount.discountAmount, session.subtotal.currency);

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
