/**
 * Order Customer Router
 * Defines API routes for customer-facing order operations
 */

import express from 'express';
import * as orderController from '../controllers/OrderCustomerController';
import { isCustomerLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// Apply authentication middleware
router.use(isCustomerLoggedIn);

// ============================================================================
// Customer Order Routes
// ============================================================================

/**
 * Get customer's orders
 * GET /api/orders
 */
router.get('/', orderController.getMyOrders);

/**
 * Get order by order number
 * GET /api/orders/number/:orderNumber
 */
router.get('/number/:orderNumber', orderController.getOrderByNumber);

/**
 * Get order by ID
 * GET /api/orders/:orderId
 */
router.get('/:orderId', orderController.getOrder);

/**
 * Create a new order
 * POST /api/orders
 */
router.post('/', orderController.createOrder);

/**
 * Cancel an order
 * POST /api/orders/:orderId/cancel
 */
router.post('/:orderId/cancel', orderController.cancelOrder);

export const orderCustomerRouter = router;
export default router;
