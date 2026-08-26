import type { Integration, IntegrationStatus } from '../entities/Integration';
import type { IntegrationCredential } from '../entities/IntegrationCredential';
import type { IntegrationEventSubscription } from '../entities/IntegrationEventSubscription';
import type { IntegrationLog, LogStatus } from '../entities/IntegrationLog';

export interface IntegrationFilters {
  organizationId?: string;
  provider?: string;
  status?: IntegrationStatus;
}

export interface IntegrationRepository {
  create(integration: Integration): Promise<Integration>;
  findById(integrationId: string): Promise<Integration | null>;
  findByOrganization(organizationId: string, filters?: IntegrationFilters): Promise<Integration[]>;
  update(integration: Integration): Promise<Integration>;
  delete(integrationId: string): Promise<boolean>;
}

export interface IntegrationCredentialRepository {
  create(credential: IntegrationCredential): Promise<IntegrationCredential>;
  findById(credentialId: string): Promise<IntegrationCredential | null>;
  findByIntegration(integrationId: string): Promise<IntegrationCredential[]>;
  findActiveByIntegration(integrationId: string): Promise<IntegrationCredential[]>;
  update(credential: IntegrationCredential): Promise<IntegrationCredential>;
  delete(credentialId: string): Promise<boolean>;
}

export interface IntegrationSubscriptionRepository {
  create(subscription: IntegrationEventSubscription): Promise<IntegrationEventSubscription>;
  findById(subscriptionId: string): Promise<IntegrationEventSubscription | null>;
  findByIntegration(integrationId: string): Promise<IntegrationEventSubscription[]>;
  findByEventType(eventType: string): Promise<IntegrationEventSubscription[]>;
  update(subscription: IntegrationEventSubscription): Promise<IntegrationEventSubscription>;
  delete(subscriptionId: string): Promise<boolean>;
}

export interface IntegrationLogRepository {
  create(log: IntegrationLog): Promise<IntegrationLog>;
  findById(logId: string): Promise<IntegrationLog | null>;
  findByIntegration(integrationId: string, filters?: { status?: LogStatus; limit?: number; offset?: number }): Promise<{ data: IntegrationLog[]; total: number }>;
  findBySubscription(subscriptionId: string, limit?: number): Promise<IntegrationLog[]>;
  deleteByIntegration(integrationId: string): Promise<boolean>;
}
