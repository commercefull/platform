import { randomUUID } from 'crypto';
import type {
  IntegrationRepository, IntegrationCredentialRepository,
} from '../../domain/repositories/IntegrationRepository';
import { Integration, type IntegrationProvider } from '../../domain/entities/Integration';
import { IntegrationCredential, type CredentialType } from '../../domain/entities/IntegrationCredential';
import { IntegrationNotFoundError, CredentialNotFoundError } from '../../domain/errors/IntegrationErrors';
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

  async updateIntegration(
    integrationId: string,
    updates: {
      name?: string;
      description?: string | null;
      webhookUrl?: string | null;
      config?: Record<string, unknown>;
    },
  ): Promise<Integration> {
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

