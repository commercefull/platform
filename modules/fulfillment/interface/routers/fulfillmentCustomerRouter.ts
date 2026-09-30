/**
 * Fulfillment Customer Router
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isCustomerLoggedIn } from '../../../../libs/auth';
import { getFulfillment, getTrackingInfo, listFulfillmentsByOrder } from '../controllers/FulfillmentController';

const router = createHttpRouter();

router.use(isCustomerLoggedIn);

// List fulfillments by order (customer view)
router.get('/order/:orderId', asyncHandler(listFulfillmentsByOrder));

// Get fulfillment by ID (customer view)
router.get('/:fulfillmentId', asyncHandler(getFulfillment));

// Track fulfillment
router.get('/:fulfillmentId/track', asyncHandler(getTrackingInfo));

export default router;
