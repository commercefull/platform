import { Response } from 'express';
import { TypedRequest } from '../../../../libs/types/express';
import { manageIntegrations, manageSubscriptions, manageIntegrationLogs } from '../../application/useCases/wired';
import type { IntegrationProvider } from '../../domain/entities/Integration';
import type { CredentialType } from '../../domain/entities/IntegrationCredential';

export class IntegrationController {
  async createIntegration(req: TypedRequest, res: Response): Promise<void> {
    const { organizationId } = req.user!;
    if (!organizationId) {
      res.status(401).json({ success: false, error: 'Organization not found' });
      return;
    }
    const { name, provider, description, webhookUrl, config } = req.body as Record<string, unknown>;
    const integration = await manageIntegrations.createIntegration({
      organizationId,
      name: name as string,
      provider: provider as IntegrationProvider,
      description: description as string | undefined,
      webhookUrl: webhookUrl as string | undefined,
      config: config as Record<string, unknown> | undefined,
    });
    res.status(201).json({ success: true, data: integration.toJSON() });
  }

  async getIntegration(req: TypedRequest<{ integrationId: string }>, res: Response): Promise<void> {
    const integration = await manageIntegrations.getIntegration(req.params.integrationId);
    res.json({ success: true, data: integration.toJSON() });
  }

  async listIntegrations(req: TypedRequest, res: Response): Promise<void> {
    const { organizationId } = req.user!;
    if (!organizationId) {
      res.status(401).json({ success: false, error: 'Organization not found' });
      return;
    }
    const { provider, status } = req.query;
    const integrations = await manageIntegrations.listIntegrations(organizationId, {
      provider: provider as string | undefined,
      status: status as string | undefined,
    });
    res.json({ success: true, data: integrations.map(i => i.toJSON()) });
  }

  async updateIntegration(req: TypedRequest<{ integrationId: string }>, res: Response): Promise<void> {
    const { name, description, webhookUrl, config } = req.body as Record<string, unknown>;
    const integration = await manageIntegrations.updateIntegration(req.params.integrationId, {
      name: name as string | undefined,
      description: description as string | null | undefined,
      webhookUrl: webhookUrl as string | null | undefined,
      config: config as Record<string, unknown> | undefined,
    });
    res.json({ success: true, data: integration.toJSON() });
  }

  async activateIntegration(req: TypedRequest<{ integrationId: string }>, res: Response): Promise<void> {
    const integration = await manageIntegrations.activateIntegration(req.params.integrationId);
    res.json({ success: true, data: integration.toJSON() });
  }

  async deactivateIntegration(req: TypedRequest<{ integrationId: string }>, res: Response): Promise<void> {
    const integration = await manageIntegrations.deactivateIntegration(req.params.integrationId);
    res.json({ success: true, data: integration.toJSON() });
  }

  async deleteIntegration(req: TypedRequest<{ integrationId: string }>, res: Response): Promise<void> {
    await manageIntegrations.deleteIntegration(req.params.integrationId);
    res.json({ success: true });
  }

  // Credentials
  async addCredential(req: TypedRequest<{ integrationId: string }>, res: Response): Promise<void> {
    const { type, label, credentials, expiresAt } = req.body as Record<string, unknown>;
    const credential = await manageIntegrations.addCredential({
      integrationId: req.params.integrationId,
      type: type as CredentialType,
      label: label as string,
      credentials: credentials as Record<string, unknown>,
      expiresAt: expiresAt ? new Date(expiresAt as string) : undefined,
    });
    res.status(201).json({ success: true, data: credential.toJSON() });
  }

  async listCredentials(req: TypedRequest<{ integrationId: string }>, res: Response): Promise<void> {
    const credentials = await manageIntegrations.getCredentials(req.params.integrationId);
    res.json({ success: true, data: credentials.map(c => c.toJSON()) });
  }

  async updateCredential(req: TypedRequest<{ integrationId: string; credentialId: string }>, res: Response): Promise<void> {
    const { credentials } = req.body as { credentials: Record<string, unknown> };
    const credential = await manageIntegrations.updateCredential(req.params.credentialId, credentials);
    res.json({ success: true, data: credential.toJSON() });
  }

  async deleteCredential(req: TypedRequest<{ integrationId: string; credentialId: string }>, res: Response): Promise<void> {
    await manageIntegrations.deleteCredential(req.params.credentialId);
    res.json({ success: true });
  }

  // Subscriptions
  async createSubscription(req: TypedRequest<{ integrationId: string }>, res: Response): Promise<void> {
    const { eventType, targetAction, description, payloadMapping, headers } = req.body as Record<string, unknown>;
    const subscription = await manageSubscriptions.createSubscription({
      integrationId: req.params.integrationId,
      eventType: eventType as string,
      targetAction: targetAction as string,
      description: description as string | undefined,
      payloadMapping: payloadMapping as Record<string, unknown> | undefined,
      headers: headers as Record<string, string> | undefined,
    });
    res.status(201).json({ success: true, data: subscription.toJSON() });
  }

  async listSubscriptions(req: TypedRequest<{ integrationId: string }>, res: Response): Promise<void> {
    const subscriptions = await manageSubscriptions.listSubscriptions(req.params.integrationId);
    res.json({ success: true, data: subscriptions.map(s => s.toJSON()) });
  }

  async updateSubscription(req: TypedRequest<{ integrationId: string; subscriptionId: string }>, res: Response): Promise<void> {
    const { targetAction, payloadMapping, headers, isActive } = req.body as Record<string, unknown>;
    const subscription = await manageSubscriptions.updateSubscription(req.params.subscriptionId, {
      targetAction: targetAction as string | undefined,
      payloadMapping: payloadMapping as Record<string, unknown> | undefined,
      headers: headers as Record<string, string> | null | undefined,
      isActive: isActive as boolean | undefined,
    });
    res.json({ success: true, data: subscription.toJSON() });
  }

  async deleteSubscription(req: TypedRequest<{ integrationId: string; subscriptionId: string }>, res: Response): Promise<void> {
    await manageSubscriptions.deleteSubscription(req.params.subscriptionId);
    res.json({ success: true });
  }

  // Logs
  async listLogs(req: TypedRequest<{ integrationId: string }>, res: Response): Promise<void> {
    const { status, limit, offset } = req.query;
    const result = await manageIntegrationLogs.listLogs(req.params.integrationId, {
      status: status as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.json({ success: true, data: result.data.map(l => l.toJSON()), total: result.total });
  }

  async deleteLogs(req: TypedRequest<{ integrationId: string }>, res: Response): Promise<void> {
    await manageIntegrationLogs.deleteLogs(req.params.integrationId);
    res.json({ success: true });
  }
}

export const integrationController = new IntegrationController();
