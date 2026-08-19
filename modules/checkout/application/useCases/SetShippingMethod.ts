/**
 * Set Shipping Method Use Case
 * Sets the shipping method for a checkout session
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { Money } from '../../../basket/domain/valueObjects/Money';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import { BadRequestError, NotFoundError } from '../../../../libs/errors';
import { CalculateShippingRatesUseCase, CalculateShippingRatesCommand } from '../../../shipping/application/useCases/CalculateShippingRates';
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
  constructor(private readonly checkoutRepository: CheckoutRepository) {}

  async execute(command: SetShippingMethodCommand): Promise<CheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new NotFoundError('Checkout session not found');
    }

    if (!session.shippingAddress) {
      throw new BadRequestError('Shipping address must be set first');
    }

    const shippingUseCase = new CalculateShippingRatesUseCase();
    const shippingCommand = new CalculateShippingRatesCommand(
      {
        country: session.shippingAddress.country,
        state: session.shippingAddress.region,
        city: session.shippingAddress.city,
        postalCode: session.shippingAddress.postalCode,
      },
      { subtotal: session.subtotal.amount, itemCount: 0, currency: session.subtotal.currency },
    );
    const result = await shippingUseCase.execute(shippingCommand);

    if (!result.success || result.rates.length === 0) {
      throw new BadRequestError('No shipping methods available for this address');
    }

    const selectedRate = result.rates.find(r => r.shippingMethodId === command.shippingMethodId);
    if (!selectedRate) {
      throw new BadRequestError('Invalid shipping method');
    }

    session.setShippingMethod(selectedRate.shippingMethodId, selectedRate.shippingMethodName, Money.create(selectedRate.amount, selectedRate.currency));

    await this.checkoutRepository.save(session);

    eventBus.emit('checkout.updated', {
      checkoutId: session.id,
      field: 'shippingMethod',
      methodId: selectedRate.shippingMethodId,
      methodName: selectedRate.shippingMethodName,
      amount: selectedRate.amount,
    });

    return mapCheckoutToResponse(session);
  }
}
