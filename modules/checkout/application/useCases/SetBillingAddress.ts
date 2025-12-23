/**
 * Set Billing Address Use Case
 * Sets the billing address for a checkout session
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { Address } from '../../domain/valueObjects/Address';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class SetBillingAddressCommand {
  constructor(
    public readonly checkoutId: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly addressLine1: string,
    public readonly city: string,
    public readonly postalCode: string,
    public readonly country: string,
    public readonly company?: string,
    public readonly addressLine2?: string,
    public readonly region?: string,
    public readonly phone?: string,
    public readonly sameAsShipping: boolean = false,
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class SetBillingAddressUseCase {
  constructor(private readonly checkoutRepository: CheckoutRepository) {}

  async execute(command: SetBillingAddressCommand): Promise<CheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new Error('Checkout session not found');
    }

    const address = Address.create({
      firstName: command.firstName,
      lastName: command.lastName,
      company: command.company,
      addressLine1: command.addressLine1,
      addressLine2: command.addressLine2,
      city: command.city,
      region: command.region,
      postalCode: command.postalCode,
      country: command.country,
      phone: command.phone,
    });

    session.setBillingAddress(address, command.sameAsShipping);
    await this.checkoutRepository.save(session);

    eventBus.emit('checkout.updated', {
      checkoutId: session.id,
      field: 'billingAddress',
      country: command.country,
    });

    return mapCheckoutToResponse(session);
  }
}
