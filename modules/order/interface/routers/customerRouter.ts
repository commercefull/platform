/**
 * Order Customer Router
 * Defines API routes for customer-facing order operations
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  cancelOrder,
  createOrder,
  getMyOrders,
  getOrder,
  getOrderByNumber,
} from '../controllers/OrderCustomerController';
import { isCustomerLoggedIn } from '../../../../libs/auth';

const router = createHttpRouter();

// Apply authentication middleware
router.use('/order', isCustomerLoggedIn);

// ============================================================================
// Customer Order Routes
// ============================================================================

/**
 * Get customer's orders
 * GET /orders
 */
router.get('/order', asyncHandler(getMyOrders));

/**
 * Get order by order number
 * GET /orders/number/:orderNumber
 */
router.get('/order/number/:orderNumber', asyncHandler(getOrderByNumber));

/**
 * Get order by ID
 * GET /orders/:orderId
 */
router.get('/order/:orderId', asyncHandler(getOrder));

/**
 * Create a new order
 * POST /orders
 */
router.post('/order', asyncHandler(createOrder));

/**
 * Cancel an order
 * POST /orders/:orderId/cancel
 */
router.post('/order/:orderId/cancel', asyncHandler(cancelOrder));

export const orderCustomerRouter = router;
