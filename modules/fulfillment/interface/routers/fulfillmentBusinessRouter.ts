/**
 * Fulfillment Business Router
 */

import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  createFulfillment,
  getFulfillment,
  processPicking,
  processPacking,
  shipOrder,
  markDelivered,
  cancelFulfillment,
  updateTracking,
  initiateReturn,
  listFulfillmentsByOrder,
  listFulfillments,
  assignFulfillment,
} from '../controllers/FulfillmentController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = Router();

router.use(isOrganizationLoggedIn);

// List all fulfillments (with filters/pagination)
router.get('/fulfillments', asyncHandler(listFulfillments));

// Create fulfillment
router.post('/fulfillments', asyncHandler(createFulfillment));

// List by order
router.get('/fulfillments/order/:orderId', asyncHandler(listFulfillmentsByOrder));

// Get fulfillment by ID
router.get('/fulfillments/:fulfillmentId', asyncHandler(getFulfillment));

// Process picking
router.post('/fulfillments/:fulfillmentId/pick', asyncHandler(processPicking));

// Process packing
router.post('/fulfillments/:fulfillmentId/pack', asyncHandler(processPacking));

// Ship order
router.post('/fulfillments/:fulfillmentId/ship', asyncHandler(shipOrder));

// Mark delivered
router.post('/fulfillments/:fulfillmentId/deliver', asyncHandler(markDelivered));

// Cancel fulfillment
router.post('/fulfillments/:fulfillmentId/cancel', asyncHandler(cancelFulfillment));

// Update tracking info
router.put('/fulfillments/:fulfillmentId/tracking', asyncHandler(updateTracking));

// Initiate return
router.post('/fulfillments/:fulfillmentId/return', asyncHandler(initiateReturn));

// Assign fulfillment
router.post('/fulfillments/:fulfillmentId/assign', asyncHandler(assignFulfillment));

export const fulfillmentBusinessRouter = router;
export default router;
