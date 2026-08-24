/**
 * Manage Addresses Use Case
 */

import { generateUUID } from '../../../../libs/uuid';
import { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { CustomerNotFoundError } from '../../domain/errors/CustomerErrors';
import { CustomerAddress } from '../../../../libs/db/types';

// ============================================================================
// Commands
// ============================================================================

export class AddAddressCommand {
  constructor(
    public readonly customerId: string,
    public readonly addressLine1: string,
    public readonly city: string,
    public readonly state: string,
    public readonly postalCode: string,
    public readonly country: string,
    public readonly countryCode: string,
    public readonly addressType: 'billing' | 'shipping',
    public readonly addressLine2?: string,
    public readonly phone?: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly company?: string,
    public readonly isDefault?: boolean,
  ) {}
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
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string;
  addressType: string;
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
      state: command.state,
      postalCode: command.postalCode,
      country: command.country,
      phone: command.phone || null,
      email: null,
      isDefault: command.isDefault || false,
      isDefaultBilling: false,
      isDefaultShipping: false,
      addressType: command.addressType,
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

    const updated = await this.customerRepository.updateAddress(command.addressId, command.updates as Partial<CustomerAddress>);
    return this.mapToResponse(updated);
  }

  async deleteAddress(command: DeleteAddressCommand): Promise<void> {
    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(command.customerId);
    }

    await this.customerRepository.deleteAddress(command.addressId);
  }

  async setDefaultAddress(command: SetDefaultAddressCommand): Promise<void> {
    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(command.customerId);
    }

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

  private mapToResponse(address: CustomerAddress): AddressResponse {
    return {
      addressId: address.customerAddressId,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || undefined,
      city: address.city,
      state: address.state || '',
      postalCode: address.postalCode,
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
