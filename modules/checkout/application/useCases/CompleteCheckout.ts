/**
 * Complete Checkout Use Case
 * Idempotent finalization — asserts the linked order is PROCESSING + PAID before completing.
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { OrderPlacementPort } from '../../application/ports/OrderPlacementPort';
import { eventBus } from '../../../../libs/events/eventBus';
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

    eventBus.emit('checkout.completed', {
      checkoutId: session.id,
      basketId: session.basketId,
      orderId: session.orderId,
      customerId: session.customerId,
      total: session.total.amount,
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
