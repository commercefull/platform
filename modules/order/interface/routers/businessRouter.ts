/**
 * Order Business Router
 * Defines API routes for business/admin order operations
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  addOrderNote,
  cancelOrder,
  createFulfillmentPackage,
  createOrder,
  createOrderItem,
  createOrderRefund,
  deleteOrderItem,
  deleteOrderNote,
  getFulfillmentHistory,
  getOrder,
  getOrderByNumber,
  getOrderDecisions,
  getOrderHistory,
  getOrderItemById,
  getOrderItems,
  getOrderStats,
  getPaymentHistory,
  getStatusHistory,
  getStoreSalesSummary,
  listFulfillmentPackages,
  listOrderNotes,
  listOrderRefunds,
  listOrders,
  processRefund,
  trackFulfillmentPackage,
  updateFulfillmentStatus,
  updateOrderItem,
  updateOrderStatus,
  updatePaymentStatus,
} from '../controllers/OrderBusinessController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = createHttpRouter();

// Apply authentication middleware
router.use(isOrganizationLoggedIn);

// ============================================================================
// Business/Admin Order Routes
// ============================================================================

/**
 * Get order statistics
 * GET /business/orders/stats
 */
router.get('/orders/stats', asyncHandler(getOrderStats));

/**
 * Get store sales summary
 * GET /business/orders/store-summary
 */
router.get('/orders/store-summary', asyncHandler(getStoreSalesSummary));

/**
 * List all orders with filters
 * GET /business/orders
 */
router.get('/orders', asyncHandler(listOrders));

/**
 * Create an order on behalf of the organization (POS / manual orders)
 * POST /business/orders
 */
router.post('/orders', asyncHandler(createOrder));

/**
 * Get order by order number
 * GET /business/orders/number/:orderNumber
 */
router.get('/orders/number/:orderNumber', asyncHandler(getOrderByNumber));

/**
 * Get order explainability — market context, version snapshot, decision log
 * GET /business/orders/:orderId/decisions
 */
router.get('/orders/:orderId/decisions', asyncHandler(getOrderDecisions));

/**
 * Get order details
 * GET /business/orders/:orderId
 */
router.get('/orders/:orderId', asyncHandler(getOrder));

/**
 * Get order status history
 * GET /business/orders/:orderId/history
 */
router.get('/orders/:orderId/history', asyncHandler(getOrderHistory));

/**
 * Update order status
 * PUT /business/orders/:orderId/status
 */
router.put('/orders/:orderId/status', asyncHandler(updateOrderStatus));

/**
 * Cancel an order
 * POST /business/orders/:orderId/cancel
 */
router.post('/orders/:orderId/cancel', asyncHandler(cancelOrder));

/**
 * Process refund
 * POST /business/orders/:orderId/refund
 */
router.post('/orders/:orderId/refund', asyncHandler(processRefund));

// ============================================================================
// Order Notes
// ============================================================================

router.get('/orders/:orderId/notes', asyncHandler(listOrderNotes));
router.post('/orders/:orderId/notes', asyncHandler(addOrderNote));
router.delete('/orders/:orderId/notes/:noteId', asyncHandler(deleteOrderNote));

// ============================================================================
// Order Refunds
// ============================================================================

router.get('/orders/:orderId/refunds', asyncHandler(listOrderRefunds));
router.post('/orders/:orderId/refunds', asyncHandler(createOrderRefund));

// ============================================================================
// Fulfillment Packages
// ============================================================================

router.get('/orders/:orderId/packages', asyncHandler(listFulfillmentPackages));
router.post('/orders/:orderId/packages', asyncHandler(createFulfillmentPackage));
router.post('/orders/:orderId/packages/:packageId/tracking', asyncHandler(trackFulfillmentPackage));

// ============================================================================
// Order Items
// ============================================================================
router.get('/orders/:orderId/items', asyncHandler(getOrderItems));
router.get('/order-items/:orderItemId', asyncHandler(getOrderItemById));
router.post('/order-items', asyncHandler(createOrderItem));
router.put('/order-items/:orderItemId', asyncHandler(updateOrderItem));
router.delete('/order-items/:orderItemId', asyncHandler(deleteOrderItem));

// ============================================================================
// Payment & Fulfillment Status
// ============================================================================
router.put('/orders/:orderId/payment-status', asyncHandler(updatePaymentStatus));
router.put('/orders/:orderId/fulfillment-status', asyncHandler(updateFulfillmentStatus));

// ============================================================================
// Status History
// ============================================================================
router.get('/orders/:orderId/status-history', asyncHandler(getStatusHistory));
router.get('/orders/:orderId/payment-history', asyncHandler(getPaymentHistory));
router.get('/orders/:orderId/fulfillment-history', asyncHandler(getFulfillmentHistory));

export const orderBusinessRouter = router;
