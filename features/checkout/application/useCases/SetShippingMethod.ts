/**
 * Set Shipping Method Use Case
 * Sets the shipping method for a checkout session
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { Money } from '../../../basket/domain/valueObjects/Money';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class SetShippingMethodCommand {
  constructor(
    public readonly checkoutId: string,
    public readonly shippingMethodId: string
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class SetShippingMethodUseCase {
  constructor(private readonly checkoutRepository: CheckoutRepository) {}

  async execute(command: SetShippingMethodCommand): Promise<CheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new Error('Checkout session not found');
    }

    if (!session.shippingAddress) {
      throw new Error('Shipping address must be set first');
    }

    const methods = await this.checkoutRepository.getAvailableShippingMethods(
      session.shippingAddress.country,
      session.shippingAddress.postalCode
    );

    const selectedMethod = methods.find(m => m.id === command.shippingMethodId);
    if (!selectedMethod) {
      throw new Error('Invalid shipping method');
    }

    session.setShippingMethod(
      selectedMethod.id,
      selectedMethod.name,
      Money.create(selectedMethod.price, selectedMethod.currency)
    );

    await this.checkoutRepository.save(session);

    eventBus.emit('checkout.updated', {
      checkoutId: session.id,
      field: 'shippingMethod',
      methodId: selectedMethod.id,
      methodName: selectedMethod.name,
      amount: selectedMethod.price
    });

    return mapCheckoutToResponse(session);
  }
}
