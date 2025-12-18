/**
 * Customer Repository Interface
 * Defines the contract for customer persistence operations
 */

import { Customer, CustomerAddress } from '../entities/Customer';

export interface CustomerFilters {
  status?: 'active' | 'inactive' | 'suspended';
  isVerified?: boolean;
  groupId?: string;
  tags?: string[];
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  length: number;
}

export interface CustomerRepository {
  // Customer CRUD
  findById(customerId: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  findAll(filters?: CustomerFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Customer>>;
  save(customer: Customer): Promise<Customer>;
  delete(customerId: string): Promise<void>;
  count(filters?: CustomerFilters): Promise<number>;

  // Customer queries
  findByGroup(groupId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Customer>>;
  findByTag(tag: string, pagination?: PaginationOptions): Promise<PaginatedResult<Customer>>;
  search(query: string, pagination?: PaginationOptions): Promise<PaginatedResult<Customer>>;

  // Addresses
  getAddresses(customerId: string): Promise<CustomerAddress[]>;
  addAddress(customerId: string, address: CustomerAddress): Promise<CustomerAddress>;
  updateAddress(addressId: string, updates: Partial<CustomerAddress>): Promise<CustomerAddress>;
  deleteAddress(addressId: string): Promise<void>;
  setDefaultAddress(customerId: string, addressId: string, type: 'billing' | 'shipping'): Promise<void>;

  // Groups
  getCustomerGroups(customerId: string): Promise<Array<{ groupId: string; name: string }>>;
  addToGroup(customerId: string, groupId: string): Promise<void>;
  removeFromGroup(customerId: string, groupId: string): Promise<void>;

  // Authentication helpers
  getPasswordHash(customerId: string): Promise<string | null>;
  updatePassword(customerId: string, passwordHash: string): Promise<void>;
  recordLogin(customerId: string): Promise<void>;

  // Verification
  verifyEmail(customerId: string): Promise<void>;
  verifyPhone(customerId: string): Promise<void>;
}
