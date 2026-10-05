/**
 * Complete Checkout Use Case
 * Idempotent finalization — asserts the linked order is PROCESSING + PAID before completing.
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { OrderPlacementPort } from '../../application/ports/OrderPlacementPort';
import { CouponRedemptionPort } from '../../application/ports/CouponRedemptionPort';
import { InventoryReservationPort } from '../../application/ports/InventoryReservationPort';
import { eventBus } from '../../../../libs/events/eventBus';
import { logger } from '../../../../libs/logger';
import { BadRequestError, NotFoundError } from '../../../../libs/errors';

// ============================================================================
// Command
// ============================================================================

export class CompleteCheckoutCommand {
  constructor(public readonly checkoutId: string) {}
}

// ============================================================================
// Response
// ============================================================================

export interface CompleteCheckoutResponse {
  orderId: string;
  checkoutId: string;
  total: number;
  currency: string;
  status: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class CompleteCheckoutUseCase {
  constructor(
    private readonly checkoutRepository: CheckoutRepository,
    private readonly orderPlacementPort?: OrderPlacementPort,
    private readonly couponRedemptionPort?: CouponRedemptionPort,
    private readonly inventoryReservationPort?: InventoryReservationPort,
  ) {}

  async execute(command: CompleteCheckoutCommand): Promise<CompleteCheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new NotFoundError('Checkout session not found');
    }

    // Idempotency: already completed
    if (session.status === 'completed') {
      return {
        orderId: session.orderId || '',
        checkoutId: session.id,
        total: session.total.amount,
        currency: session.total.currency,
        status: 'completed',
      };
    }

    if (session.status !== 'processing') {
      throw new BadRequestError('Cannot complete checkout: payment has not been confirmed yet');
    }

    // Verify linked order is in the right state
    if (this.orderPlacementPort && session.orderId) {
      const order = await this.orderPlacementPort.findOrder(session.orderId);
      if (!order) {
        throw new NotFoundError('Linked order not found');
      }
      if (order.status !== 'processing' || order.paymentStatus !== 'paid') {
        throw new BadRequestError('Cannot complete checkout: payment has not been confirmed yet');
      }
    }

    session.complete();
    await this.checkoutRepository.save(session);

    // Payment is confirmed — convert the pending stock reservation into a
    // confirmed allocation for fulfillment.
    if (this.inventoryReservationPort && session.orderId) {
      await this.inventoryReservationPort.confirmForOrder(session.orderId);
    }

    // Finalize coupon usage so limited/one-time coupons deplete.
    // 'AUTO_PROMOTION' is a synthetic marker for auto-applied promotions,
    // not a redeemable coupon code.
    if (this.couponRedemptionPort && session.couponCode && session.couponCode !== 'AUTO_PROMOTION' && session.orderId) {
      try {
        await this.couponRedemptionPort.redeemCoupon({
          couponCode: session.couponCode,
          orderId: session.orderId,
          customerId: session.customerId,
          discountAmountCents: session.discountAmount.cents,
          currencyCode: session.discountAmount.currency,
        });
      } catch (error: unknown) {
        logger.warn('Coupon redemption failed after checkout completion', {
          checkoutId: session.id,
          orderId: session.orderId,
          couponCode: session.couponCode,
          error: (error as Error).message,
        });
      }
    }

    eventBus.emit('checkout.completed', {
      checkoutId: session.id,
      basketId: session.basketId,
      orderId: session.orderId,
      customerId: session.customerId,
      storeId: session.metadata?.storeId as string | undefined,
      channelId: session.metadata?.channelId as string | undefined,
      totalCents: session.total.cents,
    });

    return {
      orderId: session.orderId || '',
      checkoutId: session.id,
      total: session.total.amount,
      currency: session.total.currency,
      status: 'completed',
    };
  }
}
