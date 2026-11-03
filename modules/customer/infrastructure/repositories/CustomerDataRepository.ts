/**
 * Consolidated Customer Data Repository
 *
 * Merges CustomerRepository, CustomerCredentialRepository, customerAddressRepo,
 * storefrontWishlistRepo into a single aggregate-aligned repository.
 *
 * Aggregate: Customer (core data, credentials, addresses, wishlist)
 */

import customerRepository from './CustomerRepository';
import customerCredentialRepo from './CustomerCredentialRepositoryImpl';
import customerAddressRepo from './customerAddressRepo';
import storefrontWishlistRepo from './storefrontWishlistRepo';

export type { CustomerAddressCreateParams, CustomerAddressUpdateParams } from './customerAddressRepo';

class CustomerDataRepository {
  readonly customers = customerRepository;
  readonly credentials = customerCredentialRepo;
  readonly addresses = customerAddressRepo;
  readonly wishlist = storefrontWishlistRepo;
}

export default new CustomerDataRepository();
