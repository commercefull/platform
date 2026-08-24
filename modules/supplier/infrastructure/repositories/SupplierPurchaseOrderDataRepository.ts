/**
 * Consolidated Supplier Purchase Order Repository
 *
 * Merges purchaseOrderRepo, receivingItemRepo, receivingRecordRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Purchase Order (POs, receiving items, receiving records)
 */

import purchaseOrderRepo from './purchaseOrderRepo';
import receivingItemRepo from './receivingItemRepo';
import receivingRecordRepo from './receivingRecordRepo';

// Re-export types for backward compatibility
export type {
  SupplierPurchaseOrder,
  SupplierPurchaseOrderStatus,
  SupplierPurchaseOrderCreateParams,
  SupplierPurchaseOrderUpdateParams,
  SupplierPurchaseOrderItemCreateParams,
  SupplierPurchaseOrderItemUpdateParams,
} from './purchaseOrderRepo';
export type {
  SupplierReceivingRecord,
  SupplierReceivingStatus,
  SupplierReceivingRecordCreateParams,
  SupplierReceivingRecordUpdateParams,
} from './receivingRecordRepo';
export type {
  SupplierReceivingItem,
  SupplierReceivingItemCreateParams,
  SupplierReceivingItemUpdateParams,
} from './receivingItemRepo';

class SupplierPurchaseOrderDataRepository {
  readonly purchaseOrders = purchaseOrderRepo;
  readonly receivingItems = receivingItemRepo;
  readonly receivingRecords = receivingRecordRepo;
}

export default new SupplierPurchaseOrderDataRepository();
