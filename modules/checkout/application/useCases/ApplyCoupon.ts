/**
 * Apply Coupon Use Case
 * Applies a coupon code to a checkout session
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { DiscountQuotePort, DiscountQuoteContext } from '../../application/ports/DiscountQuotePort';
import { BasketSnapshotPort } from '../../application/ports/BasketSnapshotPort';
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
    private readonly basketSnapshotPort?: BasketSnapshotPort,
  ) {}

  async execute(command: ApplyCouponCommand): Promise<CheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new NotFoundError('Checkout session not found');
    }

    if (!this.discountQuotePort) {
      throw new BadRequestError('Discount service unavailable');
    }

    const { context, subtotalCents, currency } = await this.buildQuoteContext(session);
    const validation = await this.discountQuotePort.validateDiscount(command.couponCode, subtotalCents, currency, context);

    if (!validation.valid || !validation.discount) {
      throw new BadRequestError(validation.error || `Invalid coupon code: ${command.couponCode}`);
    }

    const discountAmount = Money.fromCents(validation.discount.discountAmountCents, session.subtotal.currency);

    session.applyCoupon(command.couponCode, discountAmount);
    await this.checkoutRepository.save(session);

    eventBus.emit('checkout.updated', {
      checkoutId: session.id,
      field: 'coupon',
      couponCode: command.couponCode,
      discountAmountCents: discountAmount.cents,
    });

    return mapCheckoutToResponse(session);
  }

  private async buildQuoteContext(session: {
    basketId: string;
    customerId?: string;
    shippingAddress?: { country: string };
    subtotal: { cents: number; currency: string };
  }): Promise<{ context: DiscountQuoteContext; subtotalCents: number; currency: string }> {
    const context: DiscountQuoteContext = {
      customerId: session.customerId,
      countryCode: session.shippingAddress?.country,
    };
    let subtotalCents = session.subtotal.cents;
    const currency = session.subtotal.currency;

    if (this.basketSnapshotPort) {
      try {
        const basket = await this.basketSnapshotPort.getSnapshot(session.basketId);
        if (basket) {
          context.storeId = basket.storeId;
          context.channelId = basket.channelId;
          context.items = basket.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPriceCents: item.unitPrice?.cents ?? 0,
          }));
          // The session's stored subtotal can be stale — eligibility checks
          // (e.g. minimum cart total) evaluate against the live basket.
          subtotalCents = basket.subtotal.cents;
        }
      } catch {
        // Basket context is best-effort — validation still applies core coupon rules
      }
    }

    return { context, subtotalCents, currency };
  }
}
