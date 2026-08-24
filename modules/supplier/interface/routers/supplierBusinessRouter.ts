import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import * as supplierController from '../controllers/supplierBusinessController';
import * as purchaseOrderController from '../controllers/purchaseOrderController';
import * as receivingController from '../controllers/receivingController';

const router = express.Router();

router.use(isOrganizationLoggedIn);

// ========== SUPPLIER ROUTES ==========

// Supplier CRUD
router.get('/suppliers', asyncHandler(supplierController.getSuppliers));
router.get('/suppliers/statistics', asyncHandler(supplierController.getSupplierStatistics));
router.get('/suppliers/:id', asyncHandler(supplierController.getSupplierById));
router.get('/suppliers/code/:code', asyncHandler(supplierController.getSupplierByCode));
router.post('/suppliers', asyncHandler(supplierController.createSupplier));
router.put('/suppliers/:id', asyncHandler(supplierController.updateSupplier));
router.delete('/suppliers/:id', asyncHandler(supplierController.deleteSupplier));

// Supplier status management
router.patch('/suppliers/:id/status', asyncHandler(supplierController.updateSupplierStatus));
router.patch('/suppliers/:id/visibility', asyncHandler(supplierController.updateSupplierVisibility));
router.post('/suppliers/:id/approve', asyncHandler(supplierController.approveSupplier));
router.post('/suppliers/:id/suspend', asyncHandler(supplierController.suspendSupplier));

// Supplier addresses
router.get('/suppliers/:id/addresses', asyncHandler(supplierController.getSupplierAddresses));
router.post('/suppliers/:id/addresses', asyncHandler(supplierController.createSupplierAddress));
router.put('/supplier-addresses/:id', asyncHandler(supplierController.updateSupplierAddress));
router.delete('/supplier-addresses/:id', asyncHandler(supplierController.deleteSupplierAddress));

// Supplier products
router.get('/suppliers/:id/products', asyncHandler(supplierController.getSupplierProducts));
router.post('/suppliers/:id/products', asyncHandler(supplierController.addProductToSupplier));
router.put('/supplier-products/:id', asyncHandler(supplierController.updateSupplierProduct));
router.delete('/supplier-products/:id', asyncHandler(supplierController.removeProductFromSupplier));

// ========== PURCHASE ORDER ROUTES ==========

// Purchase order CRUD
router.get('/purchase-orders', asyncHandler(purchaseOrderController.getPurchaseOrders));
router.get('/purchase-orders/:id', asyncHandler(purchaseOrderController.getPurchaseOrderById));
router.get('/suppliers/:id/purchase-orders', asyncHandler(purchaseOrderController.getPurchaseOrdersBySupplierId));
router.post('/purchase-orders', asyncHandler(purchaseOrderController.createPurchaseOrder));
router.put('/purchase-orders/:id', asyncHandler(purchaseOrderController.updatePurchaseOrder));
router.delete('/purchase-orders/:id', asyncHandler(purchaseOrderController.deletePurchaseOrder));

// Purchase order workflow
router.post('/purchase-orders/:id/approve', asyncHandler(purchaseOrderController.approvePurchaseOrder));
router.post('/purchase-orders/:id/cancel', asyncHandler(purchaseOrderController.cancelPurchaseOrder));
router.post('/purchase-orders/:id/send', asyncHandler(purchaseOrderController.sendPurchaseOrder));

// Purchase order items
router.get('/purchase-orders/:id/items', asyncHandler(purchaseOrderController.getPurchaseOrderItems));
router.post('/purchase-orders/:id/items', asyncHandler(purchaseOrderController.addPurchaseOrderItem));
router.put('/purchase-order-items/:id', asyncHandler(purchaseOrderController.updatePurchaseOrderItem));
router.delete('/purchase-order-items/:id', asyncHandler(purchaseOrderController.deletePurchaseOrderItem));

// ========== RECEIVING ROUTES ==========

// Receiving record CRUD
router.get('/receiving', asyncHandler(receivingController.getReceivingRecords));
router.get('/receiving/:id', asyncHandler(receivingController.getReceivingRecordById));
router.get('/purchase-orders/:id/receiving', asyncHandler(receivingController.getReceivingByPurchaseOrder));
router.post('/receiving', asyncHandler(receivingController.createReceivingRecord));
router.put('/receiving/:id', asyncHandler(receivingController.updateReceivingRecord));
router.post('/receiving/:id/complete', asyncHandler(receivingController.completeReceiving));

// Receiving items
router.get('/receiving/:id/items', asyncHandler(receivingController.getReceivingItems));
router.post('/receiving/:id/items', asyncHandler(receivingController.createReceivingItem));
router.put('/receiving-items/:id', asyncHandler(receivingController.updateReceivingItem));
router.post('/receiving-items/:id/accept', asyncHandler(receivingController.acceptReceivingItem));
router.post('/receiving-items/:id/reject', asyncHandler(receivingController.rejectReceivingItem));

export const supplierMerchantRouter = router;
