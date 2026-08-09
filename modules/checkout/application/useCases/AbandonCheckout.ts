/**
 * Abandon Checkout Use Case
 * Marks a checkout session as abandoned and cancels any linked PAYMENT_PENDING order.
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { OrderRepository } from '../../../order/domain/repositories/OrderRepository';
import { CancelOrderUseCase, CancelOrderCommand } from '../../../order/application/useCases/CancelOrder';
import { eventBus } from '../../../../libs/events/eventBus';
import { logger } from '../../../../libs/logger';

// ============================================================================
// Command
// ============================================================================

export class AbandonCheckoutCommand {
  constructor(public readonly checkoutId: string) {}
}

// ============================================================================
// Response
// ============================================================================

export interface AbandonCheckoutResponse {
  message: string;
  checkoutId: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class AbandonCheckoutUseCase {
  constructor(
    private readonly checkoutRepository: CheckoutRepository,
    private readonly orderRepository?: OrderRepository,
  ) {}

  async execute(command: AbandonCheckoutCommand): Promise<AbandonCheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);

    if (session) {
      // Cancel linked PAYMENT_PENDING order if present
      if (session.status === 'pending_payment' && session.orderId && this.orderRepository) {
        try {
          const cancelUseCase = new CancelOrderUseCase(this.orderRepository);
          await cancelUseCase.execute(new CancelOrderCommand(session.orderId, 'Checkout abandoned by customer'));
        } catch (err: unknown) {
          // Log but don't fail — order may already be cancelled
          logger.warn(`AbandonCheckout: could not cancel order ${session.orderId}: ${(err as Error).message}`);
        }
      }

      session.abandon();
      await this.checkoutRepository.save(session);

      eventBus.emit('checkout.abandoned', {
        checkoutId: session.id,
        basketId: session.basketId,
        customerId: session.customerId,
      });
    }

    return {
      message: 'Checkout abandoned successfully',
      checkoutId: command.checkoutId,
    };
  }
}
