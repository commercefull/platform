/**
 * Abandon Checkout Use Case
 * Marks a checkout session as abandoned
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class AbandonCheckoutCommand {
  constructor(
    public readonly checkoutId: string
  ) {}
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
  constructor(private readonly checkoutRepository: CheckoutRepository) {}

  async execute(command: AbandonCheckoutCommand): Promise<AbandonCheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    
    if (session) {
      session.abandon();
      await this.checkoutRepository.save(session);

      eventBus.emit('checkout.abandoned', {
        checkoutId: session.id,
        basketId: session.basketId,
        customerId: session.customerId,
        lastStep: session.status,
        totalValue: session.total.amount
      });
    }

    return {
      message: 'Checkout abandoned successfully',
      checkoutId: command.checkoutId
    };
  }
}
