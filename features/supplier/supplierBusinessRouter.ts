import express from 'express';
import { isMerchantLoggedIn } from '../../libs/auth';
import * as supplierController from './controllers/supplierBusinessController';
import * as purchaseOrderController from './controllers/purchaseOrderController';
import * as receivingController from './controllers/receivingController';

const router = express.Router();

router.use(isMerchantLoggedIn);

// ========== SUPPLIER ROUTES ==========

// Supplier CRUD
router.get('/suppliers', supplierController.getSuppliers);
router.get('/suppliers/statistics', supplierController.getSupplierStatistics);
router.get('/suppliers/:id', supplierController.getSupplierById);
router.get('/suppliers/code/:code', supplierController.getSupplierByCode);
router.post('/suppliers', supplierController.createSupplier);
router.put('/suppliers/:id', supplierController.updateSupplier);
router.delete('/suppliers/:id', supplierController.deleteSupplier);

// Supplier status management
router.patch('/suppliers/:id/status', supplierController.updateSupplierStatus);
router.patch('/suppliers/:id/visibility', supplierController.updateSupplierVisibility);
router.post('/suppliers/:id/approve', supplierController.approveSupplier);
router.post('/suppliers/:id/suspend', supplierController.suspendSupplier);

// Supplier addresses
router.get('/suppliers/:id/addresses', supplierController.getSupplierAddresses);
router.post('/suppliers/:id/addresses', supplierController.createSupplierAddress);
router.put('/supplier-addresses/:id', supplierController.updateSupplierAddress);
router.delete('/supplier-addresses/:id', supplierController.deleteSupplierAddress);

// Supplier products
router.get('/suppliers/:id/products', supplierController.getSupplierProducts);
router.post('/suppliers/:id/products', supplierController.addProductToSupplier);
router.put('/supplier-products/:id', supplierController.updateSupplierProduct);
router.delete('/supplier-products/:id', supplierController.removeProductFromSupplier);

// ========== PURCHASE ORDER ROUTES ==========

// Purchase order CRUD
router.get('/purchase-orders', purchaseOrderController.getPurchaseOrders);
router.get('/purchase-orders/:id', purchaseOrderController.getPurchaseOrderById);
router.get('/suppliers/:id/purchase-orders', purchaseOrderController.getPurchaseOrdersBySupplierId);
router.post('/purchase-orders', purchaseOrderController.createPurchaseOrder);
router.put('/purchase-orders/:id', purchaseOrderController.updatePurchaseOrder);
router.delete('/purchase-orders/:id', purchaseOrderController.deletePurchaseOrder);

// Purchase order workflow
router.post('/purchase-orders/:id/approve', purchaseOrderController.approvePurchaseOrder);
router.post('/purchase-orders/:id/cancel', purchaseOrderController.cancelPurchaseOrder);
router.post('/purchase-orders/:id/send', purchaseOrderController.sendPurchaseOrder);

// Purchase order items
router.get('/purchase-orders/:id/items', purchaseOrderController.getPurchaseOrderItems);
router.post('/purchase-orders/:id/items', purchaseOrderController.addPurchaseOrderItem);
router.put('/purchase-order-items/:id', purchaseOrderController.updatePurchaseOrderItem);
router.delete('/purchase-order-items/:id', purchaseOrderController.deletePurchaseOrderItem);

// ========== RECEIVING ROUTES ==========

// Receiving record CRUD
router.get('/receiving', receivingController.getReceivingRecords);
router.get('/receiving/:id', receivingController.getReceivingRecordById);
router.get('/purchase-orders/:id/receiving', receivingController.getReceivingByPurchaseOrder);
router.post('/receiving', receivingController.createReceivingRecord);
router.put('/receiving/:id', receivingController.updateReceivingRecord);
router.post('/receiving/:id/complete', receivingController.completeReceiving);

// Receiving items
router.get('/receiving/:id/items', receivingController.getReceivingItems);
router.post('/receiving/:id/items', receivingController.createReceivingItem);
router.put('/receiving-items/:id', receivingController.updateReceivingItem);
router.post('/receiving-items/:id/accept', receivingController.acceptReceivingItem);
router.post('/receiving-items/:id/reject', receivingController.rejectReceivingItem);

export const supplierMerchantRouter = router;
