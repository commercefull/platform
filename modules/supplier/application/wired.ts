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

// --- ReceiveGoodsUseCase wiring -------------------------------------------
// Receiving goods touches three modules: supplier (PO + receiving records) and
// inventory (stock adjustment). The ACL adapters keep those boundaries clean.
import { InventoryDataRepository } from '../../inventory/infrastructure';
import { SupplierReceivingAdapter } from '../infrastructure/acl/SupplierReceivingAdapter';
import { SupplierInventoryAdapter } from '../infrastructure/acl/SupplierInventoryAdapter';
import { ReceiveGoodsUseCase } from './useCases/ReceiveGoods';

const receiveGoodsPoAdapter = {
  async findById(id: string) {
    const po = await supplierPurchaseOrderDataRepository.purchaseOrders.findById(id);
    if (!po) return null;
    const items = await supplierPurchaseOrderDataRepository.purchaseOrders.findItemsByOrderId(id);
    return {
      status: po.status,
      items: items.map(i => ({ quantity: i.quantity })),
    };
  },
  async update(id: string, data: Record<string, unknown>) {
    await supplierPurchaseOrderDataRepository.purchaseOrders.update(
      id,
      data as Parameters<typeof supplierPurchaseOrderDataRepository.purchaseOrders.update>[1],
    );
  },
};

const receivingAdapter = new SupplierReceivingAdapter({
  purchaseOrders: supplierPurchaseOrderDataRepository.purchaseOrders,
  receivingRecords: supplierPurchaseOrderDataRepository.receivingRecords,
  receivingItems: supplierPurchaseOrderDataRepository.receivingItems,
});
const supplierInventoryAdapter = new SupplierInventoryAdapter(InventoryDataRepository.stock);

export const receiveGoodsUseCase = new ReceiveGoodsUseCase(receiveGoodsPoAdapter, receivingAdapter, supplierInventoryAdapter);

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
