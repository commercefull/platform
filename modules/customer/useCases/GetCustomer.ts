/**
 * Get Customer Use Case
 */

import { Customer } from '../domain/entities/Customer';
import { CustomerRepository } from '../domain/repositories/CustomerRepository';

// ============================================================================
// Command
// ============================================================================

export class GetCustomerCommand {
  constructor(
    public readonly customerId?: string,
    public readonly email?: string
  ) {
    if (!customerId && !email) {
      throw new Error('Either customerId or email must be provided');
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

    return this.mapToResponse(customer);
  }

  private mapToResponse(customer: Customer): CustomerDetailResponse {
    return {
      customerId: customer.customerId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      fullName: customer.fullName,
      phone: customer.phone,
      dateOfBirth: customer.dateOfBirth?.toISOString(),
      status: customer.status,
      isActive: customer.isActive,
      isVerified: customer.isVerified,
      addresses: customer.addresses.map(addr => ({
        addressId: addr.addressId,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
        addressType: addr.addressType,
        isDefault: addr.isDefault,
        phone: addr.phone
      })),
      defaultShippingAddressId: customer.defaultShippingAddressId,
      defaultBillingAddressId: customer.defaultBillingAddressId,
      groupIds: customer.groupIds,
      preferredCurrency: customer.preferredCurrency,
      preferredLanguage: customer.preferredLanguage,
      taxExempt: customer.taxExempt,
      tags: customer.tags,
      lastLoginAt: customer.lastLoginAt?.toISOString(),
      loginCount: customer.loginCount,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString()
    };
  }
}
