/**
 * Webhook Business Controller
 *
 * HTTP interface for managing webhook endpoints (business/admin side).
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { logger } from '../../../../libs/logger';
import WebhookRepo from '../../infrastructure/repositories/WebhookRepository';
import { RegisterWebhookUseCase } from '../../application/useCases/RegisterWebhook';
import { UnregisterWebhookUseCase } from '../../application/useCases/UnregisterWebhook';
import { ListWebhooksUseCase } from '../../application/useCases/ListWebhooks';
import { SYNC_RELEVANT_EVENTS } from '../../domain/valueObjects/WebhookEventType';

/**
 * Register a new webhook endpoint
 * POST /business/webhooks
 */
export const registerWebhook = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new RegisterWebhookUseCase(WebhookRepo);
    const result = await useCase.execute({
      name: req.body.name,
      url: req.body.url,
      events: req.body.events,
      merchantId: req.body.merchantId || req.user?.merchantId,
      headers: req.body.headers,
      retryPolicy: req.body.retryPolicy,
    });

    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error registering webhook:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Unregister a webhook endpoint
 * DELETE /business/webhooks/:webhookEndpointId
 */
export const unregisterWebhook = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { webhookEndpointId } = req.params;
    const useCase = new UnregisterWebhookUseCase(WebhookRepo);
    await useCase.execute(webhookEndpointId);

    res.json({ success: true, message: 'Webhook endpoint removed' });
  } catch (error: any) {
    logger.error('Error unregistering webhook:', error);
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
};

/**
 * List webhook endpoints
 * GET /business/webhooks
 */
export const listWebhooks = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId, isActive, limit, offset } = req.query;
    const useCase = new ListWebhooksUseCase(WebhookRepo);
    const result = await useCase.execute(
      {
        merchantId: merchantId as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      },
      parseInt(limit as string) || 50,
      parseInt(offset as string) || 0,
    );

    res.json({ success: true, data: result.data, total: result.total });
  } catch (error: any) {
    logger.error('Error listing webhooks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get a single webhook endpoint
 * GET /business/webhooks/:webhookEndpointId
 */
export const getWebhook = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { webhookEndpointId } = req.params;
    const endpoint = await WebhookRepo.findEndpointById(webhookEndpointId);

    if (!endpoint) {
      res.status(404).json({ success: false, error: 'Webhook endpoint not found' });
      return;
    }

    res.json({ success: true, data: endpoint });
  } catch (error: any) {
    logger.error('Error getting webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update a webhook endpoint
 * PUT /business/webhooks/:webhookEndpointId
 */
export const updateWebhook = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { webhookEndpointId } = req.params;
    const updates: Record<string, any> = {};

    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.url !== undefined) updates.url = req.body.url;
    if (req.body.events !== undefined) updates.events = req.body.events;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    if (req.body.headers !== undefined) updates.headers = req.body.headers;
    if (req.body.retryPolicy !== undefined) updates.retryPolicy = req.body.retryPolicy;

    const result = await WebhookRepo.updateEndpoint(webhookEndpointId, updates);

    if (!result) {
      res.status(404).json({ success: false, error: 'Webhook endpoint not found' });
      return;
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error updating webhook:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get webhook deliveries for an endpoint
 * GET /business/webhooks/:webhookEndpointId/deliveries
 */
export const getDeliveries = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { webhookEndpointId } = req.params;
    const { status, eventType, limit, offset } = req.query;

    const result = await WebhookRepo.findDeliveries(
      {
        webhookEndpointId,
        status: status as any,
        eventType: eventType as string,
      },
      {
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0,
      },
    );

    res.json({ success: true, data: result.data, total: result.total });
  } catch (error: any) {
    logger.error('Error getting deliveries:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get available event types that can be subscribed to
 * GET /business/webhooks/events
 */
export const getAvailableEvents = async (_req: TypedRequest, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      data: {
        events: SYNC_RELEVANT_EVENTS,
        wildcards: ['*', 'product.*', 'order.*', 'inventory.*', 'customer.*', 'payment.*', 'fulfillment.*'],
      },
    });
  } catch (error: any) {
    logger.error('Error getting available events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Test a webhook endpoint by sending a test event
 * POST /business/webhooks/:webhookEndpointId/test
 */
export const testWebhook = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { webhookEndpointId } = req.params;
    const endpoint = await WebhookRepo.findEndpointById(webhookEndpointId);

    if (!endpoint) {
      res.status(404).json({ success: false, error: 'Webhook endpoint not found' });
      return;
    }

    // Send a test event to the endpoint
    const { createHmac } = await import('crypto');
    const testPayload = JSON.stringify({
      event: 'webhook.test',
      data: { message: 'This is a test webhook delivery', timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
      deliveryId: 'test',
    });

    const signature = createHmac('sha256', endpoint.secret).update(testPayload).digest('hex');
    const startTime = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': 'webhook.test',
          'X-Webhook-Delivery-Id': 'test',
          ...(typeof endpoint.headers === 'object' && endpoint.headers ? endpoint.headers as Record<string, string> : {}),
        },
        body: testPayload,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const durationMs = Date.now() - startTime;
      const responseBody = await response.text();

      res.json({
        success: response.ok,
        data: {
          statusCode: response.status,
          durationMs,
          responseBody: responseBody.substring(0, 1024),
        },
      });
    } catch (fetchError: any) {
      clearTimeout(timeout);
      res.json({
        success: false,
        data: {
          error: fetchError.message,
          durationMs: Date.now() - startTime,
        },
      });
    }
  } catch (error: any) {
    logger.error('Error testing webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
