/**
 * Fulfillment Business Router
 */

import { Router } from 'express';
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
router.get('/fulfillments', listFulfillments);

// Create fulfillment
router.post('/fulfillments', createFulfillment);

// List by order
router.get('/fulfillments/order/:orderId', listFulfillmentsByOrder);

// Get fulfillment by ID
router.get('/fulfillments/:fulfillmentId', getFulfillment);

// Process picking
router.post('/fulfillments/:fulfillmentId/pick', processPicking);

// Process packing
router.post('/fulfillments/:fulfillmentId/pack', processPacking);

// Ship order
router.post('/fulfillments/:fulfillmentId/ship', shipOrder);

// Mark delivered
router.post('/fulfillments/:fulfillmentId/deliver', markDelivered);

// Cancel fulfillment
router.post('/fulfillments/:fulfillmentId/cancel', cancelFulfillment);

// Update tracking info
router.put('/fulfillments/:fulfillmentId/tracking', updateTracking);

// Initiate return
router.post('/fulfillments/:fulfillmentId/return', initiateReturn);

// Assign fulfillment
router.post('/fulfillments/:fulfillmentId/assign', assignFulfillment);

export const fulfillmentBusinessRouter = router;
export default router;
