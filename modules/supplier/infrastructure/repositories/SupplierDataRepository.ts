/**
 * Consolidated Supplier Data Repository
 *
 * Merges supplierRepo, supplierAddressRepo, supplierProductRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Supplier (core supplier data, addresses, products)
 */

import supplierRepo from './supplierRepo';
import supplierAddressRepo from './supplierAddressRepo';
import supplierProductRepo from './supplierProductRepo';

// Re-export types for backward compatibility
export type { SupplierFilters, SupplierStatus, SupplierCreateParams, SupplierUpdateParams } from './supplierRepo';
export type { SupplierAddressType, SupplierAddressUpdateParams } from './supplierAddressRepo';
export type { SupplierProductUpdateParams } from './supplierProductRepo';

class SupplierDataRepository {
  readonly suppliers = supplierRepo;
  readonly addresses = supplierAddressRepo;
  readonly products = supplierProductRepo;
}

export default new SupplierDataRepository();
