/**
 * Webhook Admin UI Controller
 * Admin views for managing webhook endpoints
 */

import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import {
  listWebhooksUseCase,
  registerWebhookUseCase,
  unregisterWebhookUseCase,
  manageWebhooksUseCase,
} from '../../application/wired';
import { SYNC_RELEVANT_EVENTS } from '../../domain/valueObjects/WebhookEventType';
import { DeliveryStatus } from '../../domain/entities/WebhookDelivery';
import { adminRespond } from '../../../../libs/adminRespond';

export const listWebhookEndpoints = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { organizationId, isActive } = req.query;
  const useCase = listWebhooksUseCase;
  const result = await useCase.execute(
    {
      organizationId: organizationId as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    },
    100,
    0,
  );

  adminRespond(req, res, 'webhook/index', {
    pageName: 'Webhook Endpoints',
    endpoints: result.data,
    total: result.total,
    availableEvents: SYNC_RELEVANT_EVENTS,
    success: req.query.success || null,
  });
};

export const viewWebhookEndpoint = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { webhookEndpointId } = req.params;
  const endpoint = await manageWebhooksUseCase.findEndpointById(webhookEndpointId);

  if (!endpoint) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Webhook endpoint not found' });
    return;
  }

  const { secret: _secret, ...safeEndpoint } = endpoint as unknown as Record<string, unknown>;

  adminRespond(req, res, 'webhook/view', {
    pageName: 'Webhook Endpoint',
    endpoint: safeEndpoint,
    availableEvents: SYNC_RELEVANT_EVENTS,
    success: req.query.success || null,
  });
};

export const createWebhookForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'webhook/create', {
    pageName: 'Create Webhook Endpoint',
    availableEvents: SYNC_RELEVANT_EVENTS,
  });
};

export const createWebhook = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as HttpRequestBody;
  const useCase = registerWebhookUseCase;
  const result = await useCase.execute({
    name: body.name as string,
    url: body.url as string,
    events: (body.events as string[] | undefined) ?? [],
    organizationId: (body.organizationId as string | undefined) || req.user?.organizationId,
    headers: body.headers as Record<string, string> | undefined,
    retryPolicy: body.retryPolicy as Record<string, unknown> | undefined,
  });

  res.redirect(`/admin/webhooks/${result.webhookEndpointId}?success=Webhook created successfully`);
};

export const editWebhookForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { webhookEndpointId } = req.params;
  const endpoint = await manageWebhooksUseCase.findEndpointById(webhookEndpointId);

  if (!endpoint) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Webhook endpoint not found' });
    return;
  }

  const { secret: _secret, ...safeEndpoint } = endpoint as unknown as Record<string, unknown>;

  adminRespond(req, res, 'webhook/edit', {
    pageName: 'Edit Webhook Endpoint',
    endpoint: safeEndpoint,
    availableEvents: SYNC_RELEVANT_EVENTS,
  });
};

export const updateWebhook = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { webhookEndpointId } = req.params;
  const body = req.body as HttpRequestBody;
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.url !== undefined) updates.url = body.url;
  if (body.events !== undefined) updates.events = body.events;
  if (body.isActive !== undefined) updates.isActive = body.isActive;
  if (body.headers !== undefined) updates.headers = body.headers;

  await manageWebhooksUseCase.updateEndpoint(webhookEndpointId, updates);
  res.redirect(`/admin/webhooks/${webhookEndpointId}?success=Webhook updated successfully`);
};

export const deleteWebhook = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { webhookEndpointId } = req.params;
  const useCase = unregisterWebhookUseCase;
  await useCase.execute(webhookEndpointId);
  res.redirect('/admin/webhooks?success=Webhook deleted');
};

export const viewWebhookDeliveries = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { webhookEndpointId } = req.params;
  const { status, limit, offset } = req.query;

  const result = await manageWebhooksUseCase.findDeliveries(
    {
      webhookEndpointId,
      status: status as DeliveryStatus | undefined,
    },
    {
      limit: parseInt(limit as string) || 50,
      offset: parseInt(offset as string) || 0,
    },
  );

  adminRespond(req, res, 'webhook/deliveries', {
    pageName: 'Webhook Deliveries',
    deliveries: result.data,
    total: result.total,
    webhookEndpointId,
  });
};
