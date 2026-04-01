/**
 * Order Business Router
 * Defines API routes for business/admin order operations
 */

import express from 'express';
import * as orderController from '../controllers/OrderBusinessController';
import { isMerchantLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// Apply authentication middleware
router.use(isMerchantLoggedIn);

// ============================================================================
// Business/Admin Order Routes
// ============================================================================

/**
 * Get order statistics
 * GET /business/orders/stats
 */
router.get('/orders/stats', orderController.getOrderStats);

/**
 * Get store sales summary
 * GET /business/orders/store-summary
 */
router.get('/orders/store-summary', orderController.getStoreSalesSummary);

/**
 * List all orders with filters
 * GET /business/orders
 */
router.get('/orders', orderController.listOrders);

/**
 * Get order details
 * GET /business/orders/:orderId
 */
router.get('/orders/:orderId', orderController.getOrder);

/**
 * Get order status history
 * GET /business/orders/:orderId/history
 */
router.get('/orders/:orderId/history', orderController.getOrderHistory);

/**
 * Update order status
 * PUT /business/orders/:orderId/status
 */
router.put('/orders/:orderId/status', orderController.updateOrderStatus);

/**
 * Cancel an order
 * POST /business/orders/:orderId/cancel
 */
router.post('/orders/:orderId/cancel', orderController.cancelOrder);

/**
 * Process refund
 * POST /business/orders/:orderId/refund
 */
router.post('/orders/:orderId/refund', orderController.processRefund);

// ============================================================================
// Order Notes
// ============================================================================

router.get('/orders/:orderId/notes', orderController.listOrderNotes);
router.post('/orders/:orderId/notes', orderController.addOrderNote);
router.delete('/orders/:orderId/notes/:noteId', orderController.deleteOrderNote);

// ============================================================================
// Order Refunds
// ============================================================================

router.get('/orders/:orderId/refunds', orderController.listOrderRefunds);
router.post('/orders/:orderId/refunds', orderController.createOrderRefund);

// ============================================================================
// Fulfillment Packages
// ============================================================================

router.get('/orders/:orderId/packages', orderController.listFulfillmentPackages);
router.post('/orders/:orderId/packages', orderController.createFulfillmentPackage);
router.post('/orders/:orderId/packages/:packageId/tracking', orderController.trackFulfillmentPackage);

export const orderBusinessRouter = router;
