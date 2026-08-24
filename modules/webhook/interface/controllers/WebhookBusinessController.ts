/**
 * Webhook Business Controller
 *
 * HTTP interface for managing webhook endpoints (business/admin side).
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import WebhookRepo from '../../infrastructure/repositories/WebhookRepository';
import { RegisterWebhookUseCase } from '../../application/useCases/RegisterWebhook';
import { UnregisterWebhookUseCase } from '../../application/useCases/UnregisterWebhook';
import { ListWebhooksUseCase } from '../../application/useCases/ListWebhooks';
import { SYNC_RELEVANT_EVENTS } from '../../domain/valueObjects/WebhookEventType';
import { DeliveryStatus } from '../../domain/entities/WebhookDelivery';

interface RegisterWebhookBody {
  name: string;
  url: string;
  events: string[];
  organizationId?: string;
  headers?: Record<string, string>;
  retryPolicy?: Record<string, unknown>;
}

interface UpdateWebhookBody {
  name?: string;
  url?: string;
  events?: string[];
  isActive?: boolean;
  headers?: Record<string, string>;
  retryPolicy?: Record<string, unknown>;
}

interface _AddShippingMethodBody {
  method: string;
}

/**
 * Register a new webhook endpoint
 * POST /business/webhooks
 */
export const registerWebhook = async (req: TypedRequest<Record<string, string>, unknown, RegisterWebhookBody>, res: Response): Promise<void> => {
  const useCase = new RegisterWebhookUseCase(WebhookRepo);
  const result = await useCase.execute({
    name: req.body.name,
    url: req.body.url,
    events: req.body.events,
    organizationId: req.body.organizationId || req.user?.organizationId,
    headers: req.body.headers,
    retryPolicy: req.body.retryPolicy,
  });

  res.status(201).json({ success: true, data: result });
  
};

/**
 * Unregister a webhook endpoint
 * DELETE /business/webhooks/:webhookEndpointId
 */
export const unregisterWebhook = async (req: TypedRequest, res: Response): Promise<void> => {
  const { webhookEndpointId } = req.params;
  const useCase = new UnregisterWebhookUseCase(WebhookRepo);
  await useCase.execute(webhookEndpointId);

  res.json({ success: true, message: 'Webhook endpoint removed' });
};

/**
 * List webhook endpoints
 * GET /business/webhooks
 */
export const listWebhooks = async (req: TypedRequest, res: Response): Promise<void> => {
  const { organizationId, isActive, limit, offset } = req.query;
  const useCase = new ListWebhooksUseCase(WebhookRepo);
  const result = await useCase.execute(
    {
      organizationId: organizationId as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    },
    parseInt(limit as string) || 50,
    parseInt(offset as string) || 0,
  );

  res.json({ success: true, data: result.data, total: result.total });
  
};

/**
 * Get a single webhook endpoint
 * GET /business/webhooks/:webhookEndpointId
 */
export const getWebhook = async (req: TypedRequest, res: Response): Promise<void> => {
  const { webhookEndpointId } = req.params;
  const endpoint = await WebhookRepo.findEndpointById(webhookEndpointId);

  if (!endpoint) {
    res.status(404).json({ success: false, error: 'Webhook endpoint not found' });
    return;
  }

  // Strip secret from response for security
  const { secret: _secret, ...safeEndpoint } = endpoint as unknown as Record<string, unknown>;
  res.json({ success: true, data: safeEndpoint });
  
};

/**
 * Update a webhook endpoint
 * PUT /business/webhooks/:webhookEndpointId
 */
export const updateWebhook = async (req: TypedRequest<Record<string, string>, unknown, UpdateWebhookBody>, res: Response): Promise<void> => {
  const { webhookEndpointId } = req.params;
  const updates: Record<string, unknown> = {};

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
  
};

/**
 * Get webhook deliveries for an endpoint
 * GET /business/webhooks/:webhookEndpointId/deliveries
 */
export const getDeliveries = async (req: TypedRequest, res: Response): Promise<void> => {
  const { webhookEndpointId } = req.params;
  const { status, eventType, limit, offset } = req.query;

  const result = await WebhookRepo.findDeliveries(
    {
      webhookEndpointId,
      status: status as DeliveryStatus | undefined,
      eventType: eventType as string,
    },
    {
      limit: parseInt(limit as string) || 50,
      offset: parseInt(offset as string) || 0,
    },
  );

  res.json({ success: true, data: result.data, total: result.total });
  
};

/**
 * Get available event types that can be subscribed to
 * GET /business/webhooks/events
 */
export const getAvailableEvents = async (_req: TypedRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: {
      events: SYNC_RELEVANT_EVENTS,
      wildcards: ['*', 'product.*', 'order.*', 'inventory.*', 'customer.*', 'payment.*', 'fulfillment.*'],
    },
  });
  
};

/**
 * Test a webhook endpoint by sending a test event
 * POST /business/webhooks/:webhookEndpointId/test
 */
export const testWebhook = async (req: TypedRequest, res: Response): Promise<void> => {
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
        ...(typeof endpoint.headers === 'object' && endpoint.headers ? (endpoint.headers as Record<string, string>) : {}),
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
  } catch (fetchError: unknown) {
    clearTimeout(timeout);
    res.json({
      success: false,
      data: {
        error: (fetchError as Error).message,
        durationMs: Date.now() - startTime,
      },
    });
  }
  
};
