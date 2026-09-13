/**
 * Webhook Admin UI Controller
 * Admin views for managing webhook endpoints
 */

import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { RegisterWebhookUseCase } from '../../application/useCases/RegisterWebhook';
import { ListWebhooksUseCase } from '../../application/useCases/ListWebhooks';
import { UnregisterWebhookUseCase } from '../../application/useCases/UnregisterWebhook';
import { WebhookRepo } from '../../application/wired';
import { SYNC_RELEVANT_EVENTS } from '../../domain/valueObjects/WebhookEventType';
import { DeliveryStatus } from '../../domain/entities/WebhookDelivery';
import { adminRespond } from '../../../../libs/adminRespond';

export const listWebhookEndpoints = async (req: TypedRequest, res: Response): Promise<void> => {
  const { organizationId, isActive } = req.query;
  const useCase = new ListWebhooksUseCase(WebhookRepo);
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

export const viewWebhookEndpoint = async (req: TypedRequest, res: Response): Promise<void> => {
  const { webhookEndpointId } = req.params;
  const endpoint = await WebhookRepo.findEndpointById(webhookEndpointId);

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

export const createWebhookForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'webhook/create', {
    pageName: 'Create Webhook Endpoint',
    availableEvents: SYNC_RELEVANT_EVENTS,
  });
};

export const createWebhook = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as RequestBody;
  const useCase = new RegisterWebhookUseCase(WebhookRepo);
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

export const editWebhookForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { webhookEndpointId } = req.params;
  const endpoint = await WebhookRepo.findEndpointById(webhookEndpointId);

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

export const updateWebhook = async (req: TypedRequest, res: Response): Promise<void> => {
  const { webhookEndpointId } = req.params;
  const body = req.body as RequestBody;
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.url !== undefined) updates.url = body.url;
  if (body.events !== undefined) updates.events = body.events;
  if (body.isActive !== undefined) updates.isActive = body.isActive;
  if (body.headers !== undefined) updates.headers = body.headers;

  await WebhookRepo.updateEndpoint(webhookEndpointId, updates);
  res.redirect(`/admin/webhooks/${webhookEndpointId}?success=Webhook updated successfully`);
};

export const deleteWebhook = async (req: TypedRequest, res: Response): Promise<void> => {
  const { webhookEndpointId } = req.params;
  const useCase = new UnregisterWebhookUseCase(WebhookRepo);
  await useCase.execute(webhookEndpointId);
  res.redirect('/admin/webhooks?success=Webhook deleted');
};

export const viewWebhookDeliveries = async (req: TypedRequest, res: Response): Promise<void> => {
  const { webhookEndpointId } = req.params;
  const { status, limit, offset } = req.query;

  const result = await WebhookRepo.findDeliveries(
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
