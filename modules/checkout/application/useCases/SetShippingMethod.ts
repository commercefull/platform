/**
 * Set Shipping Method Use Case
 * Sets the shipping method for a checkout session
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { ShippingQuotePort } from '../../application/ports/ShippingQuotePort';
import { Money } from '../../../../libs/money';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import { BadRequestError, NotFoundError } from '../../../../libs/errors';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class SetShippingMethodCommand {
  constructor(
    public readonly checkoutId: string,
    public readonly shippingMethodId: string,
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class SetShippingMethodUseCase {
  constructor(
    private readonly checkoutRepository: CheckoutRepository,
    private readonly shippingQuotePort?: ShippingQuotePort,
  ) {}

  async execute(command: SetShippingMethodCommand): Promise<CheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new NotFoundError('Checkout session not found');
    }

    if (!session.shippingAddress) {
      throw new BadRequestError('Shipping address must be set first');
    }

    if (!this.shippingQuotePort) {
      throw new BadRequestError('Shipping service unavailable');
    }

    const shippingOptions = await this.shippingQuotePort.getShippingOptions({
      basketId: session.basketId,
      shippingAddress: {
        country: session.shippingAddress.country,
        region: session.shippingAddress.region,
        city: session.shippingAddress.city,
        postalCode: session.shippingAddress.postalCode,
      },
      totalValue: session.subtotal.amount,
    });

    if (shippingOptions.length === 0) {
      throw new BadRequestError('No shipping methods available for this address');
    }

    const selectedRate = shippingOptions.find(r => r.methodId === command.shippingMethodId);
    if (!selectedRate) {
      throw new BadRequestError('Invalid shipping method');
    }

    session.setShippingMethod(selectedRate.methodId, selectedRate.methodName, Money.create(selectedRate.amount, selectedRate.currency));

    await this.checkoutRepository.save(session);

    eventBus.emit('checkout.updated', {
      checkoutId: session.id,
      field: 'shippingMethod',
      methodId: selectedRate.methodId,
      methodName: selectedRate.methodName,
      amount: selectedRate.amount,
    });

    return mapCheckoutToResponse(session);
  }
}
