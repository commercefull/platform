/**
 * Validate Shipping Address Use Case
 *
 * Validates a shipping address against the destination country's address
 * metadata — administrative area and postal code are required only where
 * that country's postal system uses them (drives UAE/HK postal-code-optional
 * and BE region-optional addresses).
 */

import { getCountryAddressMetadata } from '../../../../libs/address';

export interface ShippingAddressInput {
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  dependentLocality?: string;
  sortingCode?: string;
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
    if (!address.country) messages.push('Country is required');

    if (address.country) {
      const metadata = getCountryAddressMetadata(address.country);
      if (metadata.requiredFields.includes('administrativeArea') && !address.state) {
        messages.push(`${this.adminAreaLabel(metadata.adminAreaLabel)} is required for this country`);
      }
      if (metadata.requiredFields.includes('postalCode') && !address.postalCode) {
        messages.push('Postal code is required for this country');
      }
      if (metadata.postalCodePattern && address.postalCode && !metadata.postalCodePattern.test(address.postalCode)) {
        messages.push(`Postal code format is invalid${metadata.postalCodeHint ? ` (${metadata.postalCodeHint})` : ''}`);
      }
    }

    return {
      valid: messages.length === 0,
      normalizedAddress: messages.length === 0 ? address : undefined,
      messages,
    };
  }

  private adminAreaLabel(label: string): string {
    const labels: Record<string, string> = {
      state: 'State',
      province: 'Province',
      county: 'County',
      prefecture: 'Prefecture',
      region: 'Region',
      emirate: 'Emirate',
      territory: 'Territory',
    };
    return labels[label] ?? 'State/Province';
  }
}
