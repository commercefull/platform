/**
 * Set Payment Method Use Case
 * Sets the payment method for a checkout session
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class SetPaymentMethodCommand {
  constructor(
    public readonly checkoutId: string,
    public readonly paymentMethodId: string
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class SetPaymentMethodUseCase {
  constructor(private readonly checkoutRepository: CheckoutRepository) {}

  async execute(command: SetPaymentMethodCommand): Promise<CheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new Error('Checkout session not found');
    }

    const methods = await this.checkoutRepository.getAvailablePaymentMethods();
    const selectedMethod = methods.find(m => m.id === command.paymentMethodId);
    
    if (!selectedMethod) {
      throw new Error('Invalid payment method');
    }

    session.setPaymentMethod(command.paymentMethodId);
    await this.checkoutRepository.save(session);

    eventBus.emit('checkout.updated', {
      checkoutId: session.id,
      field: 'paymentMethod',
      methodId: command.paymentMethodId
    });

    return mapCheckoutToResponse(session);
  }
}
