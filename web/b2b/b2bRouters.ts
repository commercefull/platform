/**
 * B2B Portal Router
 * Routes for the B2B vendor self-service portal
 */

import express from 'express';
import { isB2BLoggedIn } from '../../libs/auth';

// Controllers
import * as authController from './controllers/authController';
import * as dashboardController from './controllers/dashboardController';
import * as quoteController from './controllers/quoteController';
import * as orderController from './controllers/orderController';
import * as approvalController from './controllers/approvalController';
import * as catalogController from './controllers/catalogController';
import * as companyController from './controllers/companyController';
import * as invoiceController from './controllers/invoiceController';
import * as creditController from './controllers/creditController';
import * as priceListController from './controllers/priceListController';
import * as purchaseOrderController from './controllers/purchaseOrderController';

const router = express.Router();

// ============================================================================
// Public Routes (no auth required)
// ============================================================================

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.post('/logout', authController.postLogout);

// ============================================================================
// Protected Routes (B2B auth required)
// ============================================================================

router.use(isB2BLoggedIn);

// Dashboard
router.get('/', dashboardController.getDashboard);

// ============================================================================
// Catalog - Browse products with B2B pricing
// ============================================================================

router.get('/catalog', catalogController.listProducts);
router.get('/catalog/:productId', catalogController.viewProduct);

// ============================================================================
// Quotes - Company-scoped
// ============================================================================

router.get('/quotes', quoteController.listQuotes);
router.get('/quotes/create', quoteController.createQuoteForm);
router.post('/quotes', quoteController.createQuote);
router.get('/quotes/:quoteId', quoteController.viewQuote);
router.post('/quotes/:quoteId', quoteController.updateQuote);

// ============================================================================
// Orders - Company-scoped
// ============================================================================

router.get('/orders', orderController.listOrders);
router.get('/orders/:orderId', orderController.viewOrder);
router.get('/orders/:orderId/reorder', orderController.reorderForm);
router.post('/orders/:orderId/reorder', orderController.submitReorder);

// ============================================================================
// Invoices - Company-scoped
// ============================================================================

router.get('/invoices', invoiceController.listInvoices);
router.get('/invoices/:orderId', invoiceController.viewInvoice);

// ============================================================================
// Approvals - Company-scoped, role-restricted
// ============================================================================

router.get('/approvals', approvalController.listPendingApprovals);
router.get('/approvals/history', approvalController.listApprovalHistory);
router.get('/approvals/:approvalId', approvalController.viewApproval);
router.post('/approvals/:approvalId/approve', approvalController.approveRequest);
router.post('/approvals/:approvalId/reject', approvalController.rejectRequest);

// ============================================================================
// Credit
// ============================================================================

router.get('/credit', creditController.getCreditDashboard);
router.get('/credit/transactions', creditController.getCreditTransactions);

// ============================================================================
// Price Lists
// ============================================================================

router.get('/price-lists', priceListController.listPriceLists);
router.get('/price-lists/:priceListId', priceListController.viewPriceList);

// ============================================================================
// Purchase Orders
// ============================================================================

router.get('/purchase-orders', purchaseOrderController.listPurchaseOrders);
router.get('/purchase-orders/create', purchaseOrderController.createPurchaseOrderForm);
router.post('/purchase-orders', purchaseOrderController.createPurchaseOrder);
router.get('/purchase-orders/:purchaseOrderId', purchaseOrderController.viewPurchaseOrder);

// ============================================================================
// Company Management
// ============================================================================

router.get('/company', companyController.getCompanyProfile);
router.post('/company', companyController.updateCompanyProfile);
router.get('/company/users', companyController.listUsers);
router.post('/company/users/invite', companyController.inviteUser);
router.get('/company/addresses', companyController.listAddresses);
router.post('/company/addresses', companyController.addAddress);

export const b2bPortalRouter = router;
