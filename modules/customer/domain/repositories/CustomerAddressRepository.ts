/**
 * Customer Address Repository Interface
 * Defines the contract for customer address persistence operations
 */

import { CustomerAddressRecord as CustomerAddress } from '../entities/CustomerModel';

export type CustomerAddressCreateParams = Omit<CustomerAddress, 'customerAddressId' | 'createdAt' | 'updatedAt'>;
export type CustomerAddressUpdateParams = Partial<Omit<CustomerAddress, 'customerAddressId' | 'customerId' | 'createdAt' | 'updatedAt'>>;

export interface CustomerAddressRepository {
  findById(id: string): Promise<CustomerAddress | null>;
  findByCustomerId(customerId: string): Promise<CustomerAddress[]>;
  create(params: CustomerAddressCreateParams): Promise<CustomerAddress>;
  update(id: string, params: CustomerAddressUpdateParams): Promise<CustomerAddress | null>;
  softDelete(id: string, customerId: string): Promise<boolean>;
  findActiveByCustomerId(customerId: string): Promise<CustomerAddress[]>;
  findActiveById(id: string, customerId: string): Promise<CustomerAddress | null>;
  unsetDefaultsExcept(customerId: string, exceptId: string): Promise<void>;
}
