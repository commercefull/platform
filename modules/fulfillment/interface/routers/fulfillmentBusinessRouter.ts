/**
 * Fulfillment Business Router
 */

import { Router } from 'express';
import {
  createFulfillment,
  getFulfillment,
  processPicking,
  shipOrder,
  markDelivered,
  listFulfillmentsByOrder,
} from '../controllers/FulfillmentController';

const router = Router();

// Create fulfillment
router.post('/', createFulfillment);

// Get fulfillment by ID
router.get('/:fulfillmentId', getFulfillment);

// Process picking
router.post('/:fulfillmentId/pick', processPicking);

// Ship order
router.post('/:fulfillmentId/ship', shipOrder);

// Mark delivered
router.post('/:fulfillmentId/deliver', markDelivered);

// List by order
router.get('/order/:orderId', listFulfillmentsByOrder);

export default router;
