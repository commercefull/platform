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

// Products - Merchant can only see their own products
router.get('/products', productController.listProducts);
router.get('/products/create', productController.createProductForm);
router.get('/products/:productId', productController.viewProduct);
router.get('/products/:productId/edit', productController.editProductForm);

// Orders - Merchant can only see orders containing their products
router.get('/orders', orderController.listOrders);
router.get('/orders/:orderId', orderController.viewOrder);

// TODO: Add more routes as needed
// - /inventory - Stock management
// - /finances - Settlements and payouts
// - /settings - Merchant profile settings

export const merchantRouter = router;
