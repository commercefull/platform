/**
 * Set Fulfillment Method Use Case
 * Sets the fulfillment type (shipping, pickup, local_delivery, digital) for a checkout session
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { FulfillmentType } from '../../domain/entities/CheckoutSession';
import { CheckoutSessionNotFoundError, CheckoutValidationError } from '../../domain/errors/CheckoutErrors';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import { eventBus } from '../../../../libs/events/eventBus';

export class SetFulfillmentMethodCommand {
  constructor(
    public readonly checkoutId: string,
    public readonly fulfillmentType: FulfillmentType,
  ) {}
}

export class SetFulfillmentMethodUseCase {
  constructor(private readonly checkoutRepository: CheckoutRepository) {}

  async execute(command: SetFulfillmentMethodCommand): Promise<CheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new CheckoutSessionNotFoundError(command.checkoutId);
    }

    const validTypes: FulfillmentType[] = ['shipping', 'pickup', 'local_delivery', 'digital'];
    if (!validTypes.includes(command.fulfillmentType)) {
      throw new CheckoutValidationError(`Invalid fulfillment type: ${command.fulfillmentType}`);
    }

    session.setFulfillmentType(command.fulfillmentType);
    await this.checkoutRepository.save(session);

    eventBus.emit('checkout.updated', {
      checkoutId: session.id,
      field: 'fulfillmentType',
      fulfillmentType: command.fulfillmentType,
    });

    return mapCheckoutToResponse(session);
  }
}
