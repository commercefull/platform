import supplierDataRepository from '../infrastructure/repositories/SupplierDataRepository';
import supplierPurchaseOrderDataRepository from '../infrastructure/repositories/SupplierPurchaseOrderDataRepository';
import { ManageSuppliersAdminUseCase } from './useCases/ManageSuppliersAdmin';
import type { SupplierRepository } from '../domain/repositories/SupplierRepository';
import type {
  SupplierFilters,
  SupplierStatus,
  SupplierCreateParams,
  SupplierUpdateParams,
  SupplierAddressType,
  SupplierAddressUpdateParams,
  SupplierProductUpdateParams,
} from '../infrastructure/repositories/SupplierDataRepository';
import type {
  SupplierReceivingStatus,
  SupplierReceivingRecordCreateParams,
  SupplierReceivingRecordUpdateParams,
  SupplierReceivingItemCreateParams,
  SupplierReceivingItemUpdateParams,
  SupplierPurchaseOrderStatus,
  SupplierPurchaseOrderCreateParams,
  SupplierPurchaseOrderUpdateParams,
  SupplierPurchaseOrderItemCreateParams,
  SupplierPurchaseOrderItemUpdateParams,
} from '../infrastructure/repositories/SupplierPurchaseOrderDataRepository';

export const manageSuppliersAdminUseCase = new ManageSuppliersAdminUseCase(
  supplierDataRepository.suppliers as unknown as SupplierRepository,
);

export {
  supplierDataRepository,
  supplierPurchaseOrderDataRepository,
  SupplierFilters,
  SupplierStatus,
  SupplierCreateParams,
  SupplierUpdateParams,
  SupplierAddressType,
  SupplierAddressUpdateParams,
  SupplierProductUpdateParams,
  SupplierReceivingStatus,
  SupplierReceivingRecordCreateParams,
  SupplierReceivingRecordUpdateParams,
  SupplierReceivingItemCreateParams,
  SupplierReceivingItemUpdateParams,
  SupplierPurchaseOrderStatus,
  SupplierPurchaseOrderCreateParams,
  SupplierPurchaseOrderUpdateParams,
  SupplierPurchaseOrderItemCreateParams,
  SupplierPurchaseOrderItemUpdateParams,
};
