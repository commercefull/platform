/**
 * Validate Shipping Address Use Case
 *
 * Validates a shipping address and returns a normalized result.
 */

export interface ShippingAddressInput {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface AddressValidationResult {
  valid: boolean;
  normalizedAddress?: ShippingAddressInput;
  messages: string[];
}

export class ValidateShippingAddressUseCase {
  async execute(address: ShippingAddressInput): Promise<AddressValidationResult> {
    const messages: string[] = [];

    if (!address.street1) messages.push('Street address is required');
    if (!address.city) messages.push('City is required');
    if (!address.state) messages.push('State/Province is required');
    if (!address.postalCode) messages.push('Postal code is required');
    if (!address.country) messages.push('Country is required');

    return {
      valid: messages.length === 0,
      normalizedAddress: messages.length === 0 ? address : undefined,
      messages,
    };
  }
}
