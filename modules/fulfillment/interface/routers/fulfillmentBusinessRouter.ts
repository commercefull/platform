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
} from '../controllers/FulfillmentController';

const router = Router();

// List all fulfillments (with filters/pagination)
router.get('/', listFulfillments);

// Create fulfillment
router.post('/', createFulfillment);

// List by order
router.get('/order/:orderId', listFulfillmentsByOrder);

// Get fulfillment by ID
router.get('/:fulfillmentId', getFulfillment);

// Process picking
router.post('/:fulfillmentId/pick', processPicking);

// Process packing
router.post('/:fulfillmentId/pack', processPacking);

// Ship order
router.post('/:fulfillmentId/ship', shipOrder);

// Mark delivered
router.post('/:fulfillmentId/deliver', markDelivered);

// Cancel fulfillment
router.post('/:fulfillmentId/cancel', cancelFulfillment);

// Update tracking info
router.put('/:fulfillmentId/tracking', updateTracking);

// Initiate return
router.post('/:fulfillmentId/return', initiateReturn);

export const fulfillmentBusinessRouter = router;
export default router;
