/**
 * Webhook Business Router
 *
 * Defines API routes for webhook management (business/admin side).
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  getAvailableEvents,
  getDeliveries,
  getWebhook,
  listWebhooks,
  registerWebhook,
  testWebhook,
  unregisterWebhook,
  updateWebhook,
} from '../controllers/WebhookBusinessController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = createHttpRouter();

router.use(isOrganizationLoggedIn);

/**
 * Get available event types
 * GET /business/webhooks/events
 */
router.get('/webhooks/events', asyncHandler(getAvailableEvents));

/**
 * List webhook endpoints
 * GET /business/webhooks
 */
router.get('/webhooks', asyncHandler(listWebhooks));

/**
 * Register a new webhook endpoint
 * POST /business/webhooks
 */
router.post('/webhooks', asyncHandler(registerWebhook));

/**
 * Get a single webhook endpoint
 * GET /business/webhooks/:webhookEndpointId
 */
router.get('/webhooks/:webhookEndpointId', asyncHandler(getWebhook));

/**
 * Update a webhook endpoint
 * PUT /business/webhooks/:webhookEndpointId
 */
router.put('/webhooks/:webhookEndpointId', asyncHandler(updateWebhook));

/**
 * Delete a webhook endpoint
 * DELETE /business/webhooks/:webhookEndpointId
 */
router.delete('/webhooks/:webhookEndpointId', asyncHandler(unregisterWebhook));

/**
 * Get deliveries for a webhook endpoint
 * GET /business/webhooks/:webhookEndpointId/deliveries
 */
router.get('/webhooks/:webhookEndpointId/deliveries', asyncHandler(getDeliveries));

/**
 * Test a webhook endpoint
 * POST /business/webhooks/:webhookEndpointId/test
 */
router.post('/webhooks/:webhookEndpointId/test', asyncHandler(testWebhook));

export const webhookBusinessRouter = router;
