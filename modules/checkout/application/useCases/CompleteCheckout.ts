/**
 * Complete Checkout Use Case
 * Idempotent finalization — asserts the linked order is PROCESSING + PAID before completing.
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { OrderRepository } from '../../../order/domain/repositories/OrderRepository';
import { OrderStatus } from '../../../order/domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../../order/domain/valueObjects/PaymentStatus';
import { eventBus } from '../../../../libs/events/eventBus';

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
    private readonly orderRepository?: OrderRepository,
  ) {}

  async execute(command: CompleteCheckoutCommand): Promise<CompleteCheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new Error('Checkout session not found');
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
      throw new Error('Cannot complete checkout: payment has not been confirmed yet');
    }

    // Verify linked order is in the right state
    if (this.orderRepository && session.orderId) {
      const order = await this.orderRepository.findById(session.orderId);
      if (!order) {
        throw new Error('Linked order not found');
      }
      if (order.status !== OrderStatus.PROCESSING || order.paymentStatus !== PaymentStatus.PAID) {
        throw new Error('Cannot complete checkout: payment has not been confirmed yet');
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
