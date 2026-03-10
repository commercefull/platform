/**
 * Webhook Business Router
 *
 * Defines API routes for webhook management (business/admin side).
 */

import { Router } from 'express';
import * as webhookController from '../controllers/WebhookBusinessController';

const router = Router();

/**
 * Get available event types
 * GET /business/webhooks/events
 */
router.get('/webhooks/events', webhookController.getAvailableEvents);

/**
 * List webhook endpoints
 * GET /business/webhooks
 */
router.get('/webhooks', webhookController.listWebhooks);

/**
 * Register a new webhook endpoint
 * POST /business/webhooks
 */
router.post('/webhooks', webhookController.registerWebhook);

/**
 * Get a single webhook endpoint
 * GET /business/webhooks/:webhookEndpointId
 */
router.get('/webhooks/:webhookEndpointId', webhookController.getWebhook);

/**
 * Update a webhook endpoint
 * PUT /business/webhooks/:webhookEndpointId
 */
router.put('/webhooks/:webhookEndpointId', webhookController.updateWebhook);

/**
 * Delete a webhook endpoint
 * DELETE /business/webhooks/:webhookEndpointId
 */
router.delete('/webhooks/:webhookEndpointId', webhookController.unregisterWebhook);

/**
 * Get deliveries for a webhook endpoint
 * GET /business/webhooks/:webhookEndpointId/deliveries
 */
router.get('/webhooks/:webhookEndpointId/deliveries', webhookController.getDeliveries);

/**
 * Test a webhook endpoint
 * POST /business/webhooks/:webhookEndpointId/test
 */
router.post('/webhooks/:webhookEndpointId/test', webhookController.testWebhook);

export const webhookBusinessRouter = router;
