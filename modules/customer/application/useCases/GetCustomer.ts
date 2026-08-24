/**
 * Get Customer Use Case
 */

import { Customer, CustomerAddress } from '../../../../libs/db/types';
import { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { CustomerValidationError } from '../../domain/errors/CustomerErrors';

// ============================================================================
// Command
// ============================================================================

export class GetCustomerCommand {
  constructor(
    public readonly customerId?: string,
    public readonly email?: string,
  ) {
    if (!customerId && !email) {
      throw new CustomerValidationError('Either customerId or email must be provided');
    }
  }
}

// ============================================================================
// Response
// ============================================================================

export interface CustomerAddressResponse {
  addressId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: string;
  isDefault: boolean;
  phone?: string;
}

export interface CustomerDetailResponse {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  status: string;
  isActive: boolean;
  isVerified: boolean;
  addresses: CustomerAddressResponse[];
  defaultShippingAddressId?: string;
  defaultBillingAddressId?: string;
  groupIds: string[];
  preferredCurrency?: string;
  preferredLanguage?: string;
  taxExempt: boolean;
  tags: string[];
  lastLoginAt?: string;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class GetCustomerUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(command: GetCustomerCommand): Promise<CustomerDetailResponse | null> {
    let customer: Customer | null = null;

    if (command.customerId) {
      customer = await this.customerRepository.findById(command.customerId);
    } else if (command.email) {
      customer = await this.customerRepository.findByEmail(command.email);
    }

    if (!customer) {
      return null;
    }

    const addresses = await this.customerRepository.getAddresses(customer.customerId);
    const groupIds = await this.customerRepository.getCustomerGroupIds(customer.customerId);

    return this.mapToResponse(customer, addresses, groupIds);
  }

  private mapToResponse(customer: Customer, addresses: CustomerAddress[], groupIds: string[]): CustomerDetailResponse {
    const firstName = customer.firstName || '';
    const lastName = customer.lastName || '';
    return {
      customerId: customer.customerId,
      email: customer.email,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      phone: customer.phone || undefined,
      dateOfBirth: customer.dateOfBirth ? new Date(customer.dateOfBirth).toISOString() : undefined,
      status: customer.isActive ? 'active' : 'inactive',
      isActive: customer.isActive,
      isVerified: customer.isVerified,
      addresses: addresses.map(addr => ({
        addressId: addr.customerAddressId,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 || undefined,
        city: addr.city,
        state: addr.state || '',
        postalCode: addr.postalCode,
        country: addr.country,
        addressType: addr.addressType,
        isDefault: addr.isDefault,
        phone: addr.phone || undefined,
      })),
      defaultShippingAddressId: undefined,
      defaultBillingAddressId: undefined,
      groupIds,
      preferredCurrency: undefined,
      preferredLanguage: customer.timezone || undefined,
      taxExempt: customer.taxExempt,
      tags: customer.tags || [],
      lastLoginAt: customer.lastLoginAt ? new Date(customer.lastLoginAt).toISOString() : undefined,
      loginCount: customer.failedLoginAttempts,
      createdAt: new Date(customer.createdAt).toISOString(),
      updatedAt: new Date(customer.updatedAt).toISOString(),
    };
  }
}
