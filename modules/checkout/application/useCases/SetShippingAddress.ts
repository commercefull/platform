/**
 * Set Shipping Address Use Case
 * Sets the shipping address for a checkout session
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { Address } from '../../domain/valueObjects/Address';
import { Money } from '../../../basket/domain/valueObjects/Money';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class SetShippingAddressCommand {
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
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class SetShippingAddressUseCase {
  constructor(private readonly checkoutRepository: CheckoutRepository) {}

  async execute(command: SetShippingAddressCommand): Promise<CheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new Error('Checkout session not found');
    }

    const validation = await this.checkoutRepository.validateShippingAddress({
      firstName: command.firstName,
      lastName: command.lastName,
      addressLine1: command.addressLine1,
      city: command.city,
      postalCode: command.postalCode,
      country: command.country,
    });

    if (!validation.valid) {
      throw new Error(`Invalid address: ${validation.errors.join(', ')}`);
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

    session.setShippingAddress(address);

    const taxAmount = await this.checkoutRepository.calculateTax(session.subtotal.amount, session.shippingAmount.amount, {
      country: command.country,
      region: command.region,
      postalCode: command.postalCode,
    });
    session.updateAmounts(session.subtotal, Money.create(taxAmount, session.subtotal.currency));

    await this.checkoutRepository.save(session);

    eventBus.emit('checkout.updated', {
      checkoutId: session.id,
      field: 'shippingAddress',
      country: command.country,
      postalCode: command.postalCode,
    });

    return mapCheckoutToResponse(session);
  }
}
