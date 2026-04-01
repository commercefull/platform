/**
 * Merchant Hub Router
 * Routes for the merchant self-service portal
 */

import express from 'express';
import { isMerchantLoggedIn } from '../../libs/auth';

// Controllers
import * as authController from './controllers/authController';
import * as dashboardController from './controllers/dashboardController';
import * as productController from './controllers/productController';
import * as orderController from './controllers/orderController';
import * as inventoryController from './controllers/inventoryController';
import * as fulfillmentController from './controllers/fulfillmentController';
import * as analyticsController from './controllers/analyticsController';
import * as settingsController from './controllers/settingsController';
import * as financialsController from './controllers/financialsController';

const router = express.Router();

// ============================================================================
// Public Routes (no auth required)
// ============================================================================

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.post('/logout', authController.postLogout);

// ============================================================================
// Protected Routes (merchant auth required)
// ============================================================================

router.use(isMerchantLoggedIn);

// Dashboard
router.get('/', dashboardController.getDashboard);

// ============================================================================
// Products
// ============================================================================

router.get('/products', productController.listProducts);
router.get('/products/create', productController.createProductForm);
router.post('/products', productController.createProduct);
router.get('/products/:productId', productController.viewProduct);
router.get('/products/:productId/edit', productController.editProductForm);
router.post('/products/:productId', productController.updateProduct);
router.post('/products/:productId/delete', productController.deleteProduct);

// ============================================================================
// Orders
// ============================================================================

router.get('/orders', orderController.listOrders);
router.get('/orders/:orderId', orderController.viewOrder);

// ============================================================================
// Inventory
// ============================================================================

router.get('/inventory', inventoryController.listInventory);
router.post('/inventory/adjust', inventoryController.adjustStock);
router.get('/inventory/low-stock', inventoryController.lowStockAlerts);

// ============================================================================
// Fulfillments
// ============================================================================

router.get('/fulfillments', fulfillmentController.listFulfillments);
router.get('/fulfillments/:fulfillmentId', fulfillmentController.viewFulfillment);
router.post('/fulfillments/:fulfillmentId/tracking', fulfillmentController.updateTracking);
router.post('/fulfillments/:fulfillmentId/shipped', fulfillmentController.markAsShipped);
router.post('/fulfillments/:fulfillmentId/delivered', fulfillmentController.markAsDelivered);

// ============================================================================
// Analytics
// ============================================================================

router.get('/analytics', analyticsController.salesAnalytics);
router.get('/analytics/sales', analyticsController.salesAnalytics);
router.get('/analytics/products', analyticsController.productPerformance);
router.get('/analytics/customers', analyticsController.customerInsights);

// ============================================================================
// Financials
// ============================================================================

router.get('/financials', financialsController.getFinancialsDashboard);
router.get('/financials/balance', financialsController.getPaymentBalance);
router.get('/financials/reports', financialsController.listPaymentReports);
router.get('/financials/payouts', financialsController.listPayouts);
router.get('/financials/payouts/:payoutId', financialsController.viewPayout);
router.get('/financials/invoices', financialsController.listInvoices);
router.get('/financials/settlements', financialsController.listSettlements);

// ============================================================================
// Settings
// ============================================================================

router.get('/settings/profile', settingsController.getProfile);
router.post('/settings/profile', settingsController.updateProfile);
router.get('/settings/store', settingsController.getStoreSettings);
router.get('/settings/notifications', settingsController.getNotificationSettings);
router.post('/settings/notifications', settingsController.updateNotificationSettings);

export const merchantRouter = router;
