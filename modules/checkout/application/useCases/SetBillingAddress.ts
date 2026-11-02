/**
 * Set Billing Address Use Case
 * Sets the billing address for a checkout session
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { Address } from '../../domain/valueObjects/Address';
import { CheckoutSessionNotFoundError } from '../../domain/errors/CheckoutErrors';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import { eventBus } from '../../../../libs/events/eventBus';
export interface SetBillingAddressCommandProps {
  checkoutId: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
  company?: string;
  addressLine2?: string;
  region?: string;
  phone?: string;
  sameAsShipping?: boolean;
}

// ============================================================================
// Command
// ============================================================================

export class SetBillingAddressCommand {
  public readonly checkoutId: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly addressLine1: string;
  public readonly city: string;
  public readonly postalCode: string;
  public readonly country: string;
  public readonly company?: string;
  public readonly addressLine2?: string;
  public readonly region?: string;
  public readonly phone?: string;
  public readonly sameAsShipping: boolean;

  constructor(props: SetBillingAddressCommandProps) {
    this.checkoutId = props.checkoutId;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.addressLine1 = props.addressLine1;
    this.city = props.city;
    this.postalCode = props.postalCode;
    this.country = props.country;
    this.company = props.company;
    this.addressLine2 = props.addressLine2;
    this.region = props.region;
    this.phone = props.phone;
    this.sameAsShipping = props.sameAsShipping ?? false;
  }
}

// ============================================================================
// Use Case
// ============================================================================

export class SetBillingAddressUseCase {
  constructor(private readonly checkoutRepository: CheckoutRepository) {}

  async execute(command: SetBillingAddressCommand): Promise<CheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new CheckoutSessionNotFoundError(command.checkoutId);
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
