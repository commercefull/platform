import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import {
  addProductToSupplier,
  approveSupplier,
  createSupplier,
  createSupplierAddress,
  deleteSupplier,
  deleteSupplierAddress,
  getSupplierAddresses,
  getSupplierByCode,
  getSupplierById,
  getSupplierProducts,
  getSupplierStatistics,
  getSuppliers,
  removeProductFromSupplier,
  suspendSupplier,
  updateSupplier,
  updateSupplierAddress,
  updateSupplierProduct,
  updateSupplierStatus,
  updateSupplierVisibility,
} from '../controllers/supplierBusinessController';
import {
  addPurchaseOrderItem,
  approvePurchaseOrder,
  cancelPurchaseOrder,
  createPurchaseOrder,
  deletePurchaseOrder,
  deletePurchaseOrderItem,
  getPurchaseOrderById,
  getPurchaseOrderItems,
  getPurchaseOrders,
  getPurchaseOrdersBySupplierId,
  sendPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderItem,
} from '../controllers/purchaseOrderController';
import {
  acceptReceivingItem,
  completeReceiving,
  createReceivingItem,
  createReceivingRecord,
  getReceivingByPurchaseOrder,
  getReceivingItems,
  getReceivingRecordById,
  getReceivingRecords,
  rejectReceivingItem,
  updateReceivingItem,
  updateReceivingRecord,
} from '../controllers/receivingController';
const router = createHttpRouter();

router.use(isOrganizationLoggedIn);

// ========== SUPPLIER ROUTES ==========

// Supplier CRUD
router.get('/suppliers', asyncHandler(getSuppliers));
router.get('/suppliers/statistics', asyncHandler(getSupplierStatistics));
router.get('/suppliers/:id', asyncHandler(getSupplierById));
router.get('/suppliers/code/:code', asyncHandler(getSupplierByCode));
router.post('/suppliers', asyncHandler(createSupplier));
router.put('/suppliers/:id', asyncHandler(updateSupplier));
router.delete('/suppliers/:id', asyncHandler(deleteSupplier));

// Supplier status management
router.patch('/suppliers/:id/status', asyncHandler(updateSupplierStatus));
router.patch('/suppliers/:id/visibility', asyncHandler(updateSupplierVisibility));
router.post('/suppliers/:id/approve', asyncHandler(approveSupplier));
router.post('/suppliers/:id/suspend', asyncHandler(suspendSupplier));

// Supplier addresses
router.get('/suppliers/:id/addresses', asyncHandler(getSupplierAddresses));
router.post('/suppliers/:id/addresses', asyncHandler(createSupplierAddress));
router.put('/supplier-addresses/:id', asyncHandler(updateSupplierAddress));
router.delete('/supplier-addresses/:id', asyncHandler(deleteSupplierAddress));

// Supplier products
router.get('/suppliers/:id/products', asyncHandler(getSupplierProducts));
router.post('/suppliers/:id/products', asyncHandler(addProductToSupplier));
router.put('/supplier-products/:id', asyncHandler(updateSupplierProduct));
router.delete('/supplier-products/:id', asyncHandler(removeProductFromSupplier));

// ========== PURCHASE ORDER ROUTES ==========

// Purchase order CRUD
router.get('/purchase-orders', asyncHandler(getPurchaseOrders));
router.get('/purchase-orders/:id', asyncHandler(getPurchaseOrderById));
router.get('/suppliers/:id/purchase-orders', asyncHandler(getPurchaseOrdersBySupplierId));
router.post('/purchase-orders', asyncHandler(createPurchaseOrder));
router.put('/purchase-orders/:id', asyncHandler(updatePurchaseOrder));
router.delete('/purchase-orders/:id', asyncHandler(deletePurchaseOrder));

// Purchase order workflow
router.post('/purchase-orders/:id/approve', asyncHandler(approvePurchaseOrder));
router.post('/purchase-orders/:id/cancel', asyncHandler(cancelPurchaseOrder));
router.post('/purchase-orders/:id/send', asyncHandler(sendPurchaseOrder));

// Purchase order items
router.get('/purchase-orders/:id/items', asyncHandler(getPurchaseOrderItems));
router.post('/purchase-orders/:id/items', asyncHandler(addPurchaseOrderItem));
router.put('/purchase-order-items/:id', asyncHandler(updatePurchaseOrderItem));
router.delete('/purchase-order-items/:id', asyncHandler(deletePurchaseOrderItem));

// ========== RECEIVING ROUTES ==========

// Receiving record CRUD
router.get('/receiving', asyncHandler(getReceivingRecords));
router.get('/receiving/:id', asyncHandler(getReceivingRecordById));
router.get('/purchase-orders/:id/receiving', asyncHandler(getReceivingByPurchaseOrder));
router.post('/receiving', asyncHandler(createReceivingRecord));
router.put('/receiving/:id', asyncHandler(updateReceivingRecord));
router.post('/receiving/:id/complete', asyncHandler(completeReceiving));

// Receiving items
router.get('/receiving/:id/items', asyncHandler(getReceivingItems));
router.post('/receiving/:id/items', asyncHandler(createReceivingItem));
router.put('/receiving-items/:id', asyncHandler(updateReceivingItem));
router.post('/receiving-items/:id/accept', asyncHandler(acceptReceivingItem));
router.post('/receiving-items/:id/reject', asyncHandler(rejectReceivingItem));

export const supplierMerchantRouter = router;
