/**
 * Manage Addresses Use Case
 */

import { generateUUID } from '../../../../libs/uuid';
import { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { CustomerAddressNotFoundError, CustomerNotFoundError } from '../../domain/errors/CustomerErrors';
import { CustomerAddress } from '../../../../libs/db/types';
import type { AddressType } from '../../domain/entities/Customer';
export interface AddAddressCommandProps {
  customerId: string;
  addressLine1: string;
  city: string;
  /** Administrative area — optional for countries without states (e.g. BE). */
  state: string | undefined;
  /** Postal code — optional for countries without them (e.g. AE, HK). */
  postalCode: string | undefined;
  country: string;
  countryCode: string;
  addressType: AddressType | undefined;
  addressLine2?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  isDefault?: boolean;
  /** Locality below city level (e.g. Brazilian bairro, JP district). */
  dependentLocality?: string;
  /** Postal sorting code used by some postal systems (e.g. FR cedex). */
  sortingCode?: string;
  /** Canonical multi-line street (country-neutral superset of address1/2). */
  addressLines?: string[];
}

// ============================================================================
// Commands
// ============================================================================

export class AddAddressCommand {
  public readonly customerId: string;
  public readonly addressLine1: string;
  public readonly city: string;
  public readonly state: string | undefined;
  public readonly postalCode: string | undefined;
  public readonly country: string;
  public readonly countryCode: string;
  public readonly addressType: AddressType | undefined;
  public readonly addressLine2?: string;
  public readonly phone?: string;
  public readonly firstName?: string;
  public readonly lastName?: string;
  public readonly company?: string;
  public readonly isDefault?: boolean;
  public readonly dependentLocality?: string;
  public readonly sortingCode?: string;
  public readonly addressLines?: string[];

  constructor(props: AddAddressCommandProps) {
    this.customerId = props.customerId;
    this.addressLine1 = props.addressLine1;
    this.city = props.city;
    this.state = props.state;
    this.postalCode = props.postalCode;
    this.country = props.country;
    this.countryCode = props.countryCode;
    this.addressType = props.addressType;
    this.addressLine2 = props.addressLine2;
    this.phone = props.phone;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.company = props.company;
    this.isDefault = props.isDefault;
    this.dependentLocality = props.dependentLocality;
    this.sortingCode = props.sortingCode;
    this.addressLines = props.addressLines;
  }
}

export class UpdateAddressCommand {
  constructor(
    public readonly customerId: string,
    public readonly addressId: string,
    public readonly updates: Partial<Omit<CustomerAddress, 'customerAddressId' | 'customerId' | 'createdAt' | 'updatedAt'>>,
  ) {}
}

export class DeleteAddressCommand {
  constructor(
    public readonly customerId: string,
    public readonly addressId: string,
  ) {}
}

export class SetDefaultAddressCommand {
  constructor(
    public readonly customerId: string,
    public readonly addressId: string,
    public readonly addressType: 'billing' | 'shipping',
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface AddressResponse {
  addressId: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string;
  addressType: AddressType;
  isDefault: boolean;
  phone?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class ManageAddressesUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async addAddress(command: AddAddressCommand): Promise<AddressResponse> {
    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(command.customerId);
    }

    const address: CustomerAddress = {
      customerAddressId: generateUUID(),
      customerId: command.customerId,
      addressLine1: command.addressLine1,
      addressLine2: command.addressLine2 || null,
      city: command.city,
      state: command.state ?? null,
      postalCode: command.postalCode ?? null,
      dependentLocality: command.dependentLocality ?? null,
      sortingCode: command.sortingCode ?? null,
      addressLines: command.addressLines ?? null,
      country: command.country,
      phone: command.phone || null,
      email: null,
      isDefault: command.isDefault || false,
      isDefaultBilling: false,
      isDefaultShipping: false,
      addressType: command.addressType || 'both',
      isVerified: false,
      verifiedAt: null,
      verificationData: null,
      additionalInfo: null,
      latitude: null,
      longitude: null,
      name: null,
      firstName: command.firstName || null,
      lastName: command.lastName || null,
      company: command.company || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.customerRepository.addAddress(command.customerId, address);

    return this.mapToResponse(address);
  }

  async updateAddress(command: UpdateAddressCommand): Promise<AddressResponse> {
    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(command.customerId);
    }

    await this.assertOwnedAddress(command.customerId, command.addressId);

    const updated = await this.customerRepository.updateAddress(command.addressId, command.updates as Partial<CustomerAddress>);
    return this.mapToResponse(updated);
  }

  async deleteAddress(command: DeleteAddressCommand): Promise<void> {
    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(command.customerId);
    }

    await this.assertOwnedAddress(command.customerId, command.addressId);

    await this.customerRepository.deleteAddress(command.addressId);
  }

  async setDefaultAddress(command: SetDefaultAddressCommand): Promise<void> {
    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(command.customerId);
    }

    await this.assertOwnedAddress(command.customerId, command.addressId);

    await this.customerRepository.setDefaultAddress(command.customerId, command.addressId, command.addressType);
  }

  async getAddresses(customerId: string): Promise<AddressResponse[]> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new CustomerNotFoundError(customerId);
    }

    const addresses = await this.customerRepository.getAddresses(customerId);
    return addresses.map(a => this.mapToResponse(a));
  }

  /**
   * Verifies the address exists and belongs to the customer. Returns the same
   * not-found error for foreign or missing addresses so ownership is never
   * leaked through the API.
   */
  private async assertOwnedAddress(customerId: string, addressId: string): Promise<void> {
    const owned = await this.customerRepository.getAddresses(customerId);
    if (!owned.some(a => a.customerAddressId === addressId)) {
      throw new CustomerAddressNotFoundError(addressId);
    }
  }

  private mapToResponse(address: CustomerAddress): AddressResponse {
    return {
      addressId: address.customerAddressId,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? null,
      city: address.city,
      state: address.state || '',
      postalCode: address.postalCode ?? '',
      country: address.country,
      countryCode: address.country,
      addressType: address.addressType,
      isDefault: address.isDefault,
      phone: address.phone || undefined,
      firstName: address.firstName || undefined,
      lastName: address.lastName || undefined,
      company: address.company || undefined,
    };
  }
}
