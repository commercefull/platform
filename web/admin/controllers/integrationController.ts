/**
 * Integration Admin Controller
 * Handles integration management UI for the Admin panel
 */

import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { adminRespond } from '../../respond';
import { manageIntegrations, manageSubscriptions, manageIntegrationLogs } from '../../../modules/integration/application/useCases/wired';
import type { CredentialType } from '../../../modules/integration/domain/entities/IntegrationCredential';
import { getErrorStatusCode, getErrorMessage } from '../../../libs/errors';

// Available providers for the dropdown
const PROVIDERS = [
  { value: 'mailchimp', label: 'Mailchimp' },
  { value: 'klaviyo', label: 'Klaviyo' },
  { value: 'hubspot', label: 'HubSpot' },
  { value: 'sendgrid', label: 'SendGrid' },
  { value: 'quickbooks', label: 'QuickBooks' },
  { value: 'xero', label: 'Xero' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'slack', label: 'Slack' },
  { value: 'zapier', label: 'Zapier' },
  { value: 'custom', label: 'Custom' },
];

// Common platform events for the event subscription dropdown
const PLATFORM_EVENTS = [
  'order.created', 'order.paid', 'order.shipped', 'order.completed', 'order.cancelled', 'order.refunded',
  'product.created', 'product.updated', 'product.deleted', 'product.published',
  'customer.created', 'customer.updated',
  'basket.abandoned', 'basket.converted_to_order',
  'review.created', 'review.approved',
  'subscription.activated', 'subscription.cancelled',
  'membership.tier_changed',
  'loyalty.points_earned',
];

export const listIntegrations = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      adminRespond(req, res, 'error', { pageName: 'Error', error: 'Organization not found' });
      return;
    }
    const integrations = await manageIntegrations.listIntegrations(organizationId);
    adminRespond(req, res, 'settings/integrations/index', {
      pageName: 'Integrations',
      integrations: integrations.map(i => i.toJSON()),
      providers: PROVIDERS,
    });
  } catch (error) {
    adminRespond(req, res, 'error', { pageName: 'Error', error: getErrorMessage(error), statusCode: getErrorStatusCode(error) });
  }
};

export const viewIntegration = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const integration = await manageIntegrations.getIntegration(req.params.integrationId);
    const credentials = await manageIntegrations.getCredentials(req.params.integrationId);
    const subscriptions = await manageSubscriptions.listSubscriptions(req.params.integrationId);
    const logsResult = await manageIntegrationLogs.listLogs(req.params.integrationId, { limit: 20 });

    adminRespond(req, res, 'settings/integrations/detail', {
      pageName: 'Integration Details',
      integration: integration.toJSON(),
      credentials: credentials.map(c => c.toJSON()),
      subscriptions: subscriptions.map(s => s.toJSON()),
      logs: logsResult.data.map(l => l.toJSON()),
      logTotal: logsResult.total,
      providers: PROVIDERS,
      platformEvents: PLATFORM_EVENTS,
    });
  } catch (error) {
    adminRespond(req, res, 'error', { pageName: 'Error', error: getErrorMessage(error), statusCode: getErrorStatusCode(error) });
  }
};

export const createIntegrationForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/integrations/create', {
      pageName: 'Add Integration',
      providers: PROVIDERS,
    });
  } catch (error) {
    adminRespond(req, res, 'error', { pageName: 'Error', error: getErrorMessage(error), statusCode: getErrorStatusCode(error) });
  }
};

export const createIntegration = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      adminRespond(req, res, 'error', { pageName: 'Error', error: 'Organization not found' });
      return;
    }
    const body = req.body as RequestBody;
    const integration = await manageIntegrations.createIntegration({
      organizationId,
      name: body.name as string,
      provider: body.provider as string,
      description: body.description as string | undefined,
      webhookUrl: body.webhookUrl as string | undefined,
      config: body.config ? (typeof body.config === 'string' ? JSON.parse(body.config) : body.config) : undefined,
    });
    res.redirect(`/admin/integrations/${integration.integrationId}`);
  } catch (error) {
    adminRespond(req, res, 'settings/integrations/create', {
      pageName: 'Add Integration',
      providers: PROVIDERS,
      error: getErrorMessage(error),
    });
  }
};

export const updateIntegration = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    await manageIntegrations.updateIntegration(req.params.integrationId, {
      name: body.name as string,
      description: body.description as string | null,
      webhookUrl: body.webhookUrl as string | null,
    });
    res.redirect(`/admin/integrations/${req.params.integrationId}`);
  } catch (error) {
    res.redirect(`/admin/integrations/${req.params.integrationId}?error=${encodeURIComponent(getErrorMessage(error))}`);
  }
};

export const activateIntegration = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await manageIntegrations.activateIntegration(req.params.integrationId);
    res.redirect(`/admin/integrations/${req.params.integrationId}`);
  } catch (error) {
    res.redirect(`/admin/integrations/${req.params.integrationId}?error=${encodeURIComponent(getErrorMessage(error))}`);
  }
};

export const deactivateIntegration = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await manageIntegrations.deactivateIntegration(req.params.integrationId);
    res.redirect(`/admin/integrations/${req.params.integrationId}`);
  } catch (error) {
    res.redirect(`/admin/integrations/${req.params.integrationId}?error=${encodeURIComponent(getErrorMessage(error))}`);
  }
};

export const deleteIntegration = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await manageIntegrations.deleteIntegration(req.params.integrationId);
    res.redirect('/admin/integrations');
  } catch (error) {
    res.redirect(`/admin/integrations/${req.params.integrationId}?error=${encodeURIComponent(getErrorMessage(error))}`);
  }
};

export const addCredential = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const credentials: Record<string, unknown> = {};
    if (body.apiKey) credentials.apiKey = body.apiKey;
    if (body.token) credentials.token = body.token;
    if (body.username) credentials.username = body.username;
    if (body.password) credentials.password = body.password;
    if (body.headerName) credentials.headerName = body.headerName;
    if (body.headerValue) credentials.headerValue = body.headerValue;

    await manageIntegrations.addCredential({
      integrationId: req.params.integrationId,
      type: body.type as CredentialType,
      label: body.label as string,
      credentials,
      expiresAt: body.expiresAt ? new Date(body.expiresAt as string) : undefined,
    });
    res.redirect(`/admin/integrations/${req.params.integrationId}`);
  } catch (error) {
    res.redirect(`/admin/integrations/${req.params.integrationId}?error=${encodeURIComponent(getErrorMessage(error))}`);
  }
};

export const deleteCredential = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await manageIntegrations.deleteCredential(req.params.credentialId);
    res.redirect(`/admin/integrations/${req.params.integrationId}`);
  } catch (error) {
    res.redirect(`/admin/integrations/${req.params.integrationId}?error=${encodeURIComponent(getErrorMessage(error))}`);
  }
};

export const createSubscription = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    await manageSubscriptions.createSubscription({
      integrationId: req.params.integrationId,
      eventType: body.eventType as string,
      targetAction: body.targetAction as string,
      description: body.description as string | undefined,
      payloadMapping: body.payloadMapping ? JSON.parse(body.payloadMapping as string) : undefined,
    });
    res.redirect(`/admin/integrations/${req.params.integrationId}`);
  } catch (error) {
    res.redirect(`/admin/integrations/${req.params.integrationId}?error=${encodeURIComponent(getErrorMessage(error))}`);
  }
};

export const updateSubscription = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    await manageSubscriptions.updateSubscription(req.params.subscriptionId, {
      targetAction: body.targetAction as string,
      isActive: body.isActive === 'true',
    });
    res.redirect(`/admin/integrations/${req.params.integrationId}`);
  } catch (error) {
    res.redirect(`/admin/integrations/${req.params.integrationId}?error=${encodeURIComponent(getErrorMessage(error))}`);
  }
};

export const deleteSubscription = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await manageSubscriptions.deleteSubscription(req.params.subscriptionId);
    res.redirect(`/admin/integrations/${req.params.integrationId}`);
  } catch (error) {
    res.redirect(`/admin/integrations/${req.params.integrationId}?error=${encodeURIComponent(getErrorMessage(error))}`);
  }
};
