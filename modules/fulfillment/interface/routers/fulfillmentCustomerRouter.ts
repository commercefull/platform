/**
 * Fulfillment Customer Router
 */

import { Router } from 'express';
import { getFulfillment, getTrackingInfo, listFulfillmentsByOrder } from '../controllers/FulfillmentController';

const router = Router();

// List fulfillments by order (customer view)
router.get('/order/:orderId', listFulfillmentsByOrder);

// Get fulfillment by ID (customer view)
router.get('/:fulfillmentId', getFulfillment);

// Track fulfillment
router.get('/:fulfillmentId/track', getTrackingInfo);

export default router;
