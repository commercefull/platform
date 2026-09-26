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

// --- CreateSupplierPurchaseOrder / CreateReceivingRecord wiring --------------
import { CreateSupplierPurchaseOrderUseCase } from './useCases/CreateSupplierPurchaseOrder';
import { CreateReceivingRecordUseCase } from './useCases/CreateReceivingRecord';

const supplierLookupAdapter = {
  findById: (id: string) => supplierDataRepository.suppliers.findById(id),
};
const purchaseOrderWriteAdapter = {
  create: (params: Record<string, unknown>) =>
    supplierPurchaseOrderDataRepository.purchaseOrders.create(params as SupplierPurchaseOrderCreateParams),
  createItem: (params: Record<string, unknown>) =>
    supplierPurchaseOrderDataRepository.purchaseOrders.createItem(params as SupplierPurchaseOrderItemCreateParams),
};

export const createSupplierPurchaseOrderUseCase = new CreateSupplierPurchaseOrderUseCase(supplierLookupAdapter, purchaseOrderWriteAdapter);

const receivingRecordWriteAdapter = {
  create: (params: Record<string, unknown>) =>
    supplierPurchaseOrderDataRepository.receivingRecords.create(params as SupplierReceivingRecordCreateParams),
};
const receivingItemWriteAdapter = {
  create: (params: Record<string, unknown>) =>
    supplierPurchaseOrderDataRepository.receivingItems.create(params as SupplierReceivingItemCreateParams),
};

export const createReceivingRecordUseCase = new CreateReceivingRecordUseCase(receivingRecordWriteAdapter, receivingItemWriteAdapter);

// --- ManageSupplierDirectory wiring -------------------------------------------
import { ManageSupplierDirectoryUseCase } from './useCases/ManageSupplierDirectory';
import type { SupplierAddressCreateParams } from '../domain/repositories/SupplierRepository';
import type { SupplierProductCreateParams } from '../infrastructure/repositories/supplierProductRepo';

const supplierDirectoryAdapter = {
  createSupplier: (params: Record<string, unknown>) =>
    supplierDataRepository.suppliers.create(params as SupplierCreateParams),
  createSupplierAddress: (params: Record<string, unknown>) =>
    supplierDataRepository.addresses.create(params as unknown as SupplierAddressCreateParams),
  createSupplierProduct: (params: Record<string, unknown>) =>
    supplierDataRepository.products.create(params as unknown as SupplierProductCreateParams),
  searchSuppliers: (term: string) => supplierDataRepository.suppliers.search(term),
  findSuppliersWithFilters: (filters: Record<string, unknown>, limit: number, offset: number) =>
    supplierDataRepository.suppliers.findWithFilters(filters as SupplierFilters, limit, offset),
  findSupplierById: (id: string) => supplierDataRepository.suppliers.findById(id),
  findSupplierByCode: (code: string) => supplierDataRepository.suppliers.findByCode(code),
  updateSupplier: (id: string, params: Record<string, unknown>) =>
    supplierDataRepository.suppliers.update(id, params as SupplierUpdateParams),
  deleteSupplier: (id: string) => supplierDataRepository.suppliers.delete(id),
  updateSupplierStatus: (id: string, status: string) =>
    supplierDataRepository.suppliers.updateStatus(id, status as SupplierStatus),
  approveSupplier: (id: string) => supplierDataRepository.suppliers.approve(id),
  suspendSupplier: (id: string) => supplierDataRepository.suppliers.suspend(id),
  getSupplierStatistics: () => supplierDataRepository.suppliers.getStatistics(),
  findAddressesBySupplierId: (supplierId: string) => supplierDataRepository.addresses.findBySupplierId(supplierId),
  updateAddress: (id: string, params: Record<string, unknown>) =>
    supplierDataRepository.addresses.update(id, params as SupplierAddressUpdateParams),
  deleteAddress: (id: string) => supplierDataRepository.addresses.delete(id),
  findProductsBySupplierId: (supplierId: string) => supplierDataRepository.products.findBySupplierId(supplierId),
  updateProduct: (id: string, params: Record<string, unknown>) =>
    supplierDataRepository.products.update(id, params as SupplierProductUpdateParams),
  deleteProduct: (id: string) => supplierDataRepository.products.delete(id),
};

export const manageSupplierDirectoryUseCase = new ManageSupplierDirectoryUseCase(supplierDirectoryAdapter);

// --- ManagePurchaseOrders / ManageReceiving wiring ---------------------------
import { ManagePurchaseOrdersUseCase } from './useCases/ManagePurchaseOrders';
import { ManageReceivingUseCase } from './useCases/ManageReceiving';

const purchaseOrdersAdapter = {
  findByStatus: (status: string, limit?: number, offset?: number) =>
    supplierPurchaseOrderDataRepository.purchaseOrders.findByStatus(status as SupplierPurchaseOrderStatus, limit, offset),
  findBySupplierId: (supplierId: string, limit?: number, offset?: number) =>
    supplierPurchaseOrderDataRepository.purchaseOrders.findBySupplierId(supplierId, limit, offset),
  findByWarehouseId: (warehouseId: string, limit?: number, offset?: number) =>
    supplierPurchaseOrderDataRepository.purchaseOrders.findByWarehouseId(warehouseId, limit, offset),
  findAll: (limit?: number, offset?: number) => supplierPurchaseOrderDataRepository.purchaseOrders.findAll(limit, offset),
  findById: (id: string) => supplierPurchaseOrderDataRepository.purchaseOrders.findById(id),
  update: (id: string, params: Record<string, unknown>) =>
    supplierPurchaseOrderDataRepository.purchaseOrders.update(id, params as SupplierPurchaseOrderUpdateParams),
  delete: (id: string) => supplierPurchaseOrderDataRepository.purchaseOrders.delete(id),
  approve: (id: string) => supplierPurchaseOrderDataRepository.purchaseOrders.approve(id),
  cancel: (id: string) => supplierPurchaseOrderDataRepository.purchaseOrders.cancel(id),
  send: (id: string) => supplierPurchaseOrderDataRepository.purchaseOrders.send(id),
  findItemsByOrderId: (orderId: string) => supplierPurchaseOrderDataRepository.purchaseOrders.findItemsByOrderId(orderId),
  createItem: (params: Record<string, unknown>) =>
    supplierPurchaseOrderDataRepository.purchaseOrders.createItem(params as SupplierPurchaseOrderItemCreateParams),
  updateItem: (id: string, params: Record<string, unknown>) =>
    supplierPurchaseOrderDataRepository.purchaseOrders.updateItem(id, params as SupplierPurchaseOrderItemUpdateParams),
  deleteItem: (id: string) => supplierPurchaseOrderDataRepository.purchaseOrders.deleteItem(id),
};

export const managePurchaseOrdersUseCase = new ManagePurchaseOrdersUseCase(purchaseOrdersAdapter);

const receivingRecordsAdapter = {
  findByStatus: (status: string, limit?: number) =>
    supplierPurchaseOrderDataRepository.receivingRecords.findByStatus(status as SupplierReceivingStatus, limit),
  findByWarehouseId: (warehouseId: string, limit?: number) =>
    supplierPurchaseOrderDataRepository.receivingRecords.findByWarehouseId(warehouseId, limit),
  findBySupplierId: (supplierId: string, limit?: number) =>
    supplierPurchaseOrderDataRepository.receivingRecords.findBySupplierId(supplierId, limit),
  findAll: (limit?: number) => supplierPurchaseOrderDataRepository.receivingRecords.findAll(limit),
  findById: (id: string) => supplierPurchaseOrderDataRepository.receivingRecords.findById(id),
  findByPurchaseOrderId: (poId: string) => supplierPurchaseOrderDataRepository.receivingRecords.findByPurchaseOrderId(poId),
  update: (id: string, params: Record<string, unknown>) =>
    supplierPurchaseOrderDataRepository.receivingRecords.update(id, params as SupplierReceivingRecordUpdateParams),
  complete: (id: string) => supplierPurchaseOrderDataRepository.receivingRecords.complete(id),
};

const receivingItemsAdapter = {
  findByReceivingRecordId: (recordId: string) =>
    supplierPurchaseOrderDataRepository.receivingItems.findByReceivingRecordId(recordId),
  create: (params: Record<string, unknown>) =>
    supplierPurchaseOrderDataRepository.receivingItems.create(params as SupplierReceivingItemCreateParams),
  update: (id: string, params: Record<string, unknown>) =>
    supplierPurchaseOrderDataRepository.receivingItems.update(id, params as SupplierReceivingItemUpdateParams),
  accept: (id: string, processedBy?: string) => supplierPurchaseOrderDataRepository.receivingItems.accept(id, processedBy),
  reject: (id: string, reason: string, processedBy?: string) =>
    supplierPurchaseOrderDataRepository.receivingItems.reject(id, reason, processedBy),
};

export const manageReceivingUseCase = new ManageReceivingUseCase(receivingRecordsAdapter, receivingItemsAdapter);

// --- GraphQL resolver adapters -------------------------------------------------
// Bridge the repositories to the ports expected by CreateSupplier /
// CreatePurchaseOrder use cases.
import { CreateSupplierUseCase } from './useCases/CreateSupplier';
import { CreatePurchaseOrderUseCase } from './useCases/CreatePurchaseOrder';

const supplierRecordAdapter = {
  async findByEmail(_email: string) {
    // Supplier repository has no email lookup; return null to allow creation
    return null;
  },
  async findById(id: string) {
    const supplier = await supplierDataRepository.suppliers.findById(id);
    if (!supplier) return null;
    return {
      status: supplier.status,
      isActive: supplier.isActive,
      minimumOrderValue: supplier.minOrderValueCents,
      leadTimeDays: supplier.leadTime,
    };
  },
  async create(data: Record<string, unknown>) {
    const result = await supplierDataRepository.suppliers.create(data as SupplierCreateParams);
    return {
      supplierId: result.supplierId,
      name: result.name,
      status: result.status,
      createdAt: new Date(result.createdAt),
    };
  },
};

const purchaseOrderRecordAdapter = {
  async findById(id: string) {
    const po = await supplierPurchaseOrderDataRepository.purchaseOrders.findById(id);
    if (!po) return null;
    const items = await supplierPurchaseOrderDataRepository.purchaseOrders.findItemsByOrderId(id);
    return {
      status: po.status,
      items: items.map(i => ({ quantity: i.quantity })),
    };
  },
  async create(data: Record<string, unknown>) {
    const result = await supplierPurchaseOrderDataRepository.purchaseOrders.create(
      data as SupplierPurchaseOrderCreateParams,
    );
    return {
      purchaseOrderId: result.supplierPurchaseOrderId,
      poNumber: result.poNumber,
      supplierId: result.supplierId,
      totalAmountCents: result.totalCents,
      status: result.status,
      createdAt: new Date(result.createdAt),
    };
  },
  async update(id: string, data: Record<string, unknown>) {
    await supplierPurchaseOrderDataRepository.purchaseOrders.update(id, data as SupplierPurchaseOrderUpdateParams);
  },
};

export const createSupplierUseCase = new CreateSupplierUseCase(supplierRecordAdapter);
export const createPurchaseOrderUseCase = new CreatePurchaseOrderUseCase(
  supplierRecordAdapter,
  purchaseOrderRecordAdapter,
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
