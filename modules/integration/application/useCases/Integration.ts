import { randomUUID } from 'crypto';
import type { IntegrationRepository, IntegrationCredentialRepository, IntegrationSubscriptionRepository, IntegrationLogRepository } from '../../domain/repositories/IntegrationRepository';
import { Integration, type IntegrationProvider } from '../../domain/entities/Integration';
import { IntegrationCredential, type CredentialType } from '../../domain/entities/IntegrationCredential';
import { IntegrationEventSubscription } from '../../domain/entities/IntegrationEventSubscription';
import { IntegrationLog } from '../../domain/entities/IntegrationLog';
import { IntegrationNotFoundError, CredentialNotFoundError, SubscriptionNotFoundError } from '../../domain/errors/IntegrationErrors';
import { encryptCredential, decryptCredential } from '../../domain/services/CredentialCrypto';

export class ManageIntegrationsUseCase {
  constructor(
    private integrationRepo: IntegrationRepository,
    private credentialRepo: IntegrationCredentialRepository,
  ) {}

  async createIntegration(params: {
    organizationId: string;
    name: string;
    provider: IntegrationProvider;
    description?: string;
    webhookUrl?: string;
    config?: Record<string, unknown>;
  }): Promise<Integration> {
    const integration = Integration.create({
      integrationId: randomUUID(),
      organizationId: params.organizationId,
      name: params.name,
      provider: params.provider,
      description: params.description,
      webhookUrl: params.webhookUrl,
      config: params.config,
    });
    return this.integrationRepo.create(integration);
  }

  async getIntegration(integrationId: string): Promise<Integration> {
    const integration = await this.integrationRepo.findById(integrationId);
    if (!integration) throw new IntegrationNotFoundError(integrationId);
    return integration;
  }

  async listIntegrations(organizationId: string, filters?: { provider?: string; status?: string }): Promise<Integration[]> {
    return this.integrationRepo.findByOrganization(organizationId, filters as never);
  }

  async updateIntegration(integrationId: string, updates: {
    name?: string;
    description?: string | null;
    webhookUrl?: string | null;
    config?: Record<string, unknown>;
  }): Promise<Integration> {
    const integration = await this.getIntegration(integrationId);
    if (updates.name !== undefined) integration.updateName(updates.name);
    if (updates.description !== undefined) integration.updateDescription(updates.description);
    if (updates.webhookUrl !== undefined) integration.updateWebhookUrl(updates.webhookUrl);
    if (updates.config !== undefined) integration.updateConfig(updates.config);
    return this.integrationRepo.update(integration);
  }

  async activateIntegration(integrationId: string): Promise<Integration> {
    const integration = await this.getIntegration(integrationId);
    integration.activate();
    return this.integrationRepo.update(integration);
  }

  async deactivateIntegration(integrationId: string): Promise<Integration> {
    const integration = await this.getIntegration(integrationId);
    integration.deactivate();
    return this.integrationRepo.update(integration);
  }

  async deleteIntegration(integrationId: string): Promise<boolean> {
    return this.integrationRepo.delete(integrationId);
  }

  async addCredential(params: {
    integrationId: string;
    type: CredentialType;
    label: string;
    credentials: Record<string, unknown>;
    expiresAt?: Date;
  }): Promise<IntegrationCredential> {
    const encrypted = encryptCredential(params.credentials);
    const credential = IntegrationCredential.create({
      credentialId: randomUUID(),
      integrationId: params.integrationId,
      type: params.type,
      label: params.label,
      encryptedData: encrypted.encryptedData,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      expiresAt: params.expiresAt,
    });
    return this.credentialRepo.create(credential);
  }

  async getCredentials(integrationId: string): Promise<IntegrationCredential[]> {
    return this.credentialRepo.findByIntegration(integrationId);
  }

  async getDecryptedCredential(credentialId: string): Promise<Record<string, unknown>> {
    const credential = await this.credentialRepo.findById(credentialId);
    if (!credential) throw new CredentialNotFoundError(credentialId);
    return decryptCredential(credential.encryptedData, credential.iv, credential.authTag);
  }

  async getDecryptedCredentialsByIntegration(integrationId: string): Promise<Record<string, unknown> | null> {
    const creds = await this.credentialRepo.findActiveByIntegration(integrationId);
    if (creds.length === 0) return null;
    const cred = creds[0];
    return decryptCredential(cred.encryptedData, cred.iv, cred.authTag);
  }

  async updateCredential(credentialId: string, credentials: Record<string, unknown>): Promise<IntegrationCredential> {
    const credential = await this.credentialRepo.findById(credentialId);
    if (!credential) throw new CredentialNotFoundError(credentialId);
    const encrypted = encryptCredential(credentials);
    credential.updateEncryptedData(encrypted.encryptedData, encrypted.iv, encrypted.authTag);
    return this.credentialRepo.update(credential);
  }

  async deleteCredential(credentialId: string): Promise<boolean> {
    return this.credentialRepo.delete(credentialId);
  }
}

export class ManageSubscriptionsUseCase {
  constructor(
    private subscriptionRepo: IntegrationSubscriptionRepository,
    private integrationRepo: IntegrationRepository,
  ) {}

  async createSubscription(params: {
    integrationId: string;
    eventType: string;
    targetAction: string;
    description?: string;
    payloadMapping?: Record<string, unknown>;
    headers?: Record<string, string>;
  }): Promise<IntegrationEventSubscription> {
    const integration = await this.integrationRepo.findById(params.integrationId);
    if (!integration) throw new IntegrationNotFoundError(params.integrationId);
    const subscription = IntegrationEventSubscription.create({
      subscriptionId: randomUUID(),
      integrationId: params.integrationId,
      eventType: params.eventType,
      targetAction: params.targetAction,
      description: params.description,
      payloadMapping: params.payloadMapping,
      headers: params.headers,
    });
    return this.subscriptionRepo.create(subscription);
  }

  async getSubscription(subscriptionId: string): Promise<IntegrationEventSubscription> {
    const sub = await this.subscriptionRepo.findById(subscriptionId);
    if (!sub) throw new SubscriptionNotFoundError(subscriptionId);
    return sub;
  }

  async listSubscriptions(integrationId: string): Promise<IntegrationEventSubscription[]> {
    return this.subscriptionRepo.findByIntegration(integrationId);
  }

  async updateSubscription(subscriptionId: string, updates: {
    targetAction?: string;
    payloadMapping?: Record<string, unknown>;
    headers?: Record<string, string> | null;
    isActive?: boolean;
  }): Promise<IntegrationEventSubscription> {
    const sub = await this.getSubscription(subscriptionId);
    if (updates.targetAction !== undefined) sub.updateTargetAction(updates.targetAction);
    if (updates.payloadMapping !== undefined) sub.updatePayloadMapping(updates.payloadMapping);
    if (updates.headers !== undefined) sub.updateHeaders(updates.headers);
    if (updates.isActive === true) sub.activate();
    if (updates.isActive === false) sub.deactivate();
    return this.subscriptionRepo.update(sub);
  }

  async deleteSubscription(subscriptionId: string): Promise<boolean> {
    return this.subscriptionRepo.delete(subscriptionId);
  }

  async findByEventType(eventType: string): Promise<IntegrationEventSubscription[]> {
    return this.subscriptionRepo.findByEventType(eventType);
  }
}

export class ManageIntegrationLogsUseCase {
  constructor(private logRepo: IntegrationLogRepository) {}

  async listLogs(integrationId: string, filters?: { status?: string; limit?: number; offset?: number }): Promise<{ data: IntegrationLog[]; total: number }> {
    return this.logRepo.findByIntegration(integrationId, filters as never);
  }

  async getLog(logId: string): Promise<IntegrationLog | null> {
    return this.logRepo.findById(logId);
  }

  async deleteLogs(integrationId: string): Promise<boolean> {
    return this.logRepo.deleteByIntegration(integrationId);
  }
}
