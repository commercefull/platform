/**
 * Set Vat Number Use Case
 * Stores the customer's VAT ID (B2B) on the checkout session and re-quotes
 * tax so intra-EU reverse charge is applied when eligible.
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { SetShippingAddressUseCase, SetShippingAddressCommand } from './SetShippingAddress';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import type { TaxQuotePort } from '../ports/TaxQuotePort';
import { NotFoundError } from '../../../../libs/errors';
import { CheckoutValidationError } from '../../domain/errors/CheckoutErrors';

export class SetVatNumberCommand {
  constructor(
    public readonly checkoutId: string,
    public readonly vatNumber?: string,
  ) {}
}

export class SetVatNumberUseCase {
  constructor(
    private readonly checkoutRepository: CheckoutRepository,
    private readonly setShippingAddress?: SetShippingAddressUseCase,
    private readonly taxQuotePort?: TaxQuotePort,
  ) {}

  async execute(command: SetVatNumberCommand): Promise<CheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new NotFoundError('Checkout session not found');
    }

    const vatNumber = command.vatNumber?.trim() || undefined;
    if (vatNumber && this.taxQuotePort?.validateVatNumber && !this.taxQuotePort.validateVatNumber(vatNumber)) {
      throw new CheckoutValidationError('Invalid VAT number format');
    }
    session.setVatNumber(vatNumber);
    await this.checkoutRepository.save(session);

    // Re-quote tax when a shipping address is known — reverse charge only
    // applies with a destination. The shipping-address path re-validates and
    // re-quotes with the stored VAT number.
    if (this.setShippingAddress && session.shippingAddress) {
      const address = session.shippingAddress;
      return this.setShippingAddress.execute(
        new SetShippingAddressCommand(
          session.id,
          address.firstName,
          address.lastName,
          address.addressLine1,
          address.city,
          address.postalCode,
          address.country,
          address.company,
          address.addressLine2,
          address.region,
          address.phone,
        ),
      );
    }

    return mapCheckoutToResponse(session);
  }
}
