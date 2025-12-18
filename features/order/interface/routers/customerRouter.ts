/**
 * Order Customer Router
 * Defines API routes for customer-facing order operations
 */

import express from 'express';
import * as orderController from '../controllers/OrderCustomerController';
import { isCustomerLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// Apply authentication middleware
router.use('/order', isCustomerLoggedIn);

// ============================================================================
// Customer Order Routes
// ============================================================================

/**
 * Get customer's orders
 * GET /orders
 */
router.get('/order', orderController.getMyOrders);

/**
 * Get order by order number
 * GET /orders/number/:orderNumber
 */
router.get('/order/number/:orderNumber', orderController.getOrderByNumber);

/**
 * Get order by ID
 * GET /orders/:orderId
 */
router.get('/order/:orderId', orderController.getOrder);

/**
 * Create a new order
 * POST /orders
 */
router.post('/order', orderController.createOrder);

/**
 * Cancel an order
 * POST /orders/:orderId/cancel
 */
router.post('/order/:orderId/cancel', orderController.cancelOrder);

export const orderCustomerRouter = router;
