/**
 * Consolidated Customer Data Repository
 *
 * Merges CustomerRepository, customerRepo, customerAddressRepo,
 * storefrontWishlistRepo into a single aggregate-aligned repository.
 *
 * Aggregate: Customer (core data, addresses, wishlist, legacy repo)
 */

import customerRepository from './CustomerRepository';
import { CustomerRepo } from './customerRepo';
import customerAddressRepo from './customerAddressRepo';
import storefrontWishlistRepo from './storefrontWishlistRepo';

// Re-export types for backward compatibility
export type { Customer, CustomerAddress, CustomerGroup, CustomerGroupMembership, CustomerWishlist } from './customerRepo';
export type { CustomerAddressCreateParams, CustomerAddressUpdateParams } from './customerAddressRepo';

const customerRepoInstance = new CustomerRepo();

class CustomerDataRepository {
  readonly customers = customerRepository;
  readonly legacy = customerRepoInstance;
  readonly addresses = customerAddressRepo;
  readonly wishlist = storefrontWishlistRepo;
}

export default new CustomerDataRepository();
