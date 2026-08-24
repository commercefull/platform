/**
 * Order Business Router
 * Defines API routes for business/admin order operations
 */

import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import * as orderController from '../controllers/OrderBusinessController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// Apply authentication middleware
router.use(isOrganizationLoggedIn);

// ============================================================================
// Business/Admin Order Routes
// ============================================================================

/**
 * Get order statistics
 * GET /business/orders/stats
 */
router.get('/orders/stats', asyncHandler(orderController.getOrderStats));

/**
 * Get store sales summary
 * GET /business/orders/store-summary
 */
router.get('/orders/store-summary', asyncHandler(orderController.getStoreSalesSummary));

/**
 * List all orders with filters
 * GET /business/orders
 */
router.get('/orders', asyncHandler(orderController.listOrders));

/**
 * Get order by order number
 * GET /business/orders/number/:orderNumber
 */
router.get('/orders/number/:orderNumber', asyncHandler(orderController.getOrderByNumber));

/**
 * Get order details
 * GET /business/orders/:orderId
 */
router.get('/orders/:orderId', asyncHandler(orderController.getOrder));

/**
 * Get order status history
 * GET /business/orders/:orderId/history
 */
router.get('/orders/:orderId/history', asyncHandler(orderController.getOrderHistory));

/**
 * Update order status
 * PUT /business/orders/:orderId/status
 */
router.put('/orders/:orderId/status', asyncHandler(orderController.updateOrderStatus));

/**
 * Cancel an order
 * POST /business/orders/:orderId/cancel
 */
router.post('/orders/:orderId/cancel', asyncHandler(orderController.cancelOrder));

/**
 * Process refund
 * POST /business/orders/:orderId/refund
 */
router.post('/orders/:orderId/refund', asyncHandler(orderController.processRefund));

// ============================================================================
// Order Notes
// ============================================================================

router.get('/orders/:orderId/notes', asyncHandler(orderController.listOrderNotes));
router.post('/orders/:orderId/notes', asyncHandler(orderController.addOrderNote));
router.delete('/orders/:orderId/notes/:noteId', asyncHandler(orderController.deleteOrderNote));

// ============================================================================
// Order Refunds
// ============================================================================

router.get('/orders/:orderId/refunds', asyncHandler(orderController.listOrderRefunds));
router.post('/orders/:orderId/refunds', asyncHandler(orderController.createOrderRefund));

// ============================================================================
// Fulfillment Packages
// ============================================================================

router.get('/orders/:orderId/packages', asyncHandler(orderController.listFulfillmentPackages));
router.post('/orders/:orderId/packages', asyncHandler(orderController.createFulfillmentPackage));
router.post('/orders/:orderId/packages/:packageId/tracking', asyncHandler(orderController.trackFulfillmentPackage));

// ============================================================================
// Order Items
// ============================================================================
router.get('/orders/:orderId/items', asyncHandler(orderController.getOrderItems));
router.get('/order-items/:orderItemId', asyncHandler(orderController.getOrderItemById));
router.post('/order-items', asyncHandler(orderController.createOrderItem));
router.put('/order-items/:orderItemId', asyncHandler(orderController.updateOrderItem));
router.delete('/order-items/:orderItemId', asyncHandler(orderController.deleteOrderItem));

// ============================================================================
// Payment & Fulfillment Status
// ============================================================================
router.put('/orders/:orderId/payment-status', asyncHandler(orderController.updatePaymentStatus));
router.put('/orders/:orderId/fulfillment-status', asyncHandler(orderController.updateFulfillmentStatus));

// ============================================================================
// Status History
// ============================================================================
router.get('/orders/:orderId/status-history', asyncHandler(orderController.getStatusHistory));
router.get('/orders/:orderId/payment-history', asyncHandler(orderController.getPaymentHistory));
router.get('/orders/:orderId/fulfillment-history', asyncHandler(orderController.getFulfillmentHistory));

export const orderBusinessRouter = router;
