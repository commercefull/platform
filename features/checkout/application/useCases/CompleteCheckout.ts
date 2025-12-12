/**
 * Complete Checkout Use Case
 * Completes a checkout session and creates an order
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { eventBus } from '../../../../libs/events/eventBus';
import { generateUUID } from '../../../../libs/uuid';

// ============================================================================
// Command
// ============================================================================

export class CompleteCheckoutCommand {
  constructor(
    public readonly checkoutId: string
  ) {}
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
  constructor(private readonly checkoutRepository: CheckoutRepository) {}

  async execute(command: CompleteCheckoutCommand): Promise<CompleteCheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new Error('Checkout session not found');
    }

    if (!session.isReadyForPayment) {
      throw new Error('Checkout is not ready for completion. Please ensure shipping address and method are set.');
    }

    // TODO: Integrate with order creation service
    // For now, generate a placeholder order ID
    const orderId = generateUUID();

    session.complete();
    await this.checkoutRepository.save(session);

    eventBus.emit('checkout.completed', {
      checkoutId: session.id,
      basketId: session.basketId,
      orderId,
      customerId: session.customerId,
      total: session.total.amount
    });

    return {
      orderId,
      checkoutId: session.id,
      total: session.total.amount,
      currency: session.total.currency,
      status: 'completed'
    };
  }
}
