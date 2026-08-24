/**
 * Webhook Business Router
 *
 * Defines API routes for webhook management (business/admin side).
 */

import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import * as webhookController from '../controllers/WebhookBusinessController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = Router();

router.use(isOrganizationLoggedIn);

/**
 * Get available event types
 * GET /business/webhooks/events
 */
router.get('/webhooks/events', asyncHandler(webhookController.getAvailableEvents));

/**
 * List webhook endpoints
 * GET /business/webhooks
 */
router.get('/webhooks', asyncHandler(webhookController.listWebhooks));

/**
 * Register a new webhook endpoint
 * POST /business/webhooks
 */
router.post('/webhooks', asyncHandler(webhookController.registerWebhook));

/**
 * Get a single webhook endpoint
 * GET /business/webhooks/:webhookEndpointId
 */
router.get('/webhooks/:webhookEndpointId', asyncHandler(webhookController.getWebhook));

/**
 * Update a webhook endpoint
 * PUT /business/webhooks/:webhookEndpointId
 */
router.put('/webhooks/:webhookEndpointId', asyncHandler(webhookController.updateWebhook));

/**
 * Delete a webhook endpoint
 * DELETE /business/webhooks/:webhookEndpointId
 */
router.delete('/webhooks/:webhookEndpointId', asyncHandler(webhookController.unregisterWebhook));

/**
 * Get deliveries for a webhook endpoint
 * GET /business/webhooks/:webhookEndpointId/deliveries
 */
router.get('/webhooks/:webhookEndpointId/deliveries', asyncHandler(webhookController.getDeliveries));

/**
 * Test a webhook endpoint
 * POST /business/webhooks/:webhookEndpointId/test
 */
router.post('/webhooks/:webhookEndpointId/test', asyncHandler(webhookController.testWebhook));

export const webhookBusinessRouter = router;
