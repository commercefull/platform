/**
 * Manage Addresses Use Case
 */

import { generateUUID } from '../../../libs/uuid';
import { CustomerRepository } from '../domain/repositories/CustomerRepository';
import { CustomerAddress } from '../domain/entities/Customer';

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
    public readonly updates: Partial<Omit<CustomerAddress, 'addressId'>>,
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
      throw new Error('Customer not found');
    }

    const address: CustomerAddress = {
      addressId: generateUUID(),
      addressLine1: command.addressLine1,
      addressLine2: command.addressLine2,
      city: command.city,
      state: command.state,
      postalCode: command.postalCode,
      country: command.country,
      countryCode: command.countryCode,
      addressType: command.addressType,
      isDefault: command.isDefault || false,
      phone: command.phone,
      firstName: command.firstName,
      lastName: command.lastName,
      company: command.company,
    };

    customer.addAddress(address);
    await this.customerRepository.save(customer);

    return this.mapToResponse(address);
  }

  async updateAddress(command: UpdateAddressCommand): Promise<AddressResponse> {
    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const existing = customer.addresses.find(a => a.addressId === command.addressId);
    if (!existing) {
      throw new Error('Address not found');
    }

    const updatedAddress: CustomerAddress = {
      ...existing,
      ...command.updates,
      addressId: command.addressId,
    };

    customer.addAddress(updatedAddress);
    await this.customerRepository.save(customer);

    return this.mapToResponse(updatedAddress);
  }

  async deleteAddress(command: DeleteAddressCommand): Promise<void> {
    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    customer.removeAddress(command.addressId);
    await this.customerRepository.save(customer);
  }

  async setDefaultAddress(command: SetDefaultAddressCommand): Promise<void> {
    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    customer.setDefaultAddress(command.addressId, command.addressType);
    await this.customerRepository.save(customer);
  }

  async getAddresses(customerId: string): Promise<AddressResponse[]> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer.addresses.map(a => this.mapToResponse(a));
  }

  private mapToResponse(address: CustomerAddress): AddressResponse {
    return {
      addressId: address.addressId,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      countryCode: address.countryCode,
      addressType: address.addressType,
      isDefault: address.isDefault,
      phone: address.phone,
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company,
    };
  }
}
