/**
 * Integration Event Dispatcher
 *
 * Listens to platform events and dispatches to matching integration subscriptions.
 * For each matching subscription, it:
 * 1. Decrypts the integration's credentials
 * 2. Transforms the event payload using the subscription's payload mapping
 * 3. POSTs the transformed data to the integration's webhook URL or provider endpoint
 * 4. Logs the result
 */

import { randomUUID } from 'crypto';
import { logger } from '../../../../libs/logger';
import { eventBus, type EventPayload } from '../../../../libs/events/eventBus';
import type { IntegrationRepository, IntegrationCredentialRepository, IntegrationSubscriptionRepository, IntegrationLogRepository } from '../../domain/repositories/IntegrationRepository';
import { IntegrationLog } from '../../domain/entities/IntegrationLog';
import { decryptCredential } from '../../domain/services/CredentialCrypto';

export class IntegrationEventDispatcher {
  constructor(
    private bus: typeof eventBus,
    private integrationRepo: IntegrationRepository,
    private credentialRepo: IntegrationCredentialRepository,
    private subscriptionRepo: IntegrationSubscriptionRepository,
    private logRepo: IntegrationLogRepository,
  ) {}

  register(): void {
    this.bus.on('*', (payload: EventPayload) => {
      this.dispatch(payload).catch((err: unknown) => {
        logger.error('Integration dispatcher error', { error: (err as Error).message, eventType: payload.type });
      });
    });
  }

  private async dispatch(payload: EventPayload): Promise<void> {
    const subscriptions = await this.subscriptionRepo.findByEventType(payload.type);
    if (subscriptions.length === 0) return;

    for (const sub of subscriptions) {
      if (!sub.isActive) continue;

      const integration = await this.integrationRepo.findById(sub.integrationId);
      if (!integration || integration.status !== 'active') continue;

      const startTime = Date.now();
      const log = IntegrationLog.create({
        logId: randomUUID(),
        integrationId: integration.integrationId,
        subscriptionId: sub.subscriptionId,
        eventType: payload.type,
        targetAction: sub.targetAction,
        requestPayload: payload.data as Record<string, unknown>,
      });

      try {
        const transformedPayload = this.transformPayload(payload.data, sub.payloadMapping);
        const credentials = await this.getDecryptedCredentials(integration.integrationId);

        const url = integration.webhookUrl ?? this.resolveProviderEndpoint(integration.provider, sub.targetAction);
        if (!url) {
          throw new Error(`No URL configured for integration ${integration.integrationId}`);
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Integration-Provider': integration.provider,
          'X-Event-Type': payload.type,
          'X-Correlation-Id': payload.correlationId ?? '',
          ...(sub.headers ?? {}),
        };

        if (credentials) {
          const authHeader = this.buildAuthHeader(credentials, integration.provider);
          if (authHeader) {
            headers['Authorization'] = authHeader;
          }
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(transformedPayload),
        });

        const responseBody = await response.text();
        const durationMs = Date.now() - startTime;

        if (response.ok) {
          log.markSuccess(response.status, responseBody, durationMs);
          integration.markSynced();
          await this.integrationRepo.update(integration);
        } else {
          log.markFailed(`HTTP ${response.status}: ${responseBody}`, response.status, responseBody, durationMs);
          integration.markError(`Dispatch failed: HTTP ${response.status}`);
          await this.integrationRepo.update(integration);
        }
      } catch (err: unknown) {
        const durationMs = Date.now() - startTime;
        const message = (err as Error).message;
        log.markFailed(message, null, null, durationMs);
        integration.markError(message);
        await this.integrationRepo.update(integration);
      }

      await this.logRepo.create(log);
    }
  }

  private transformPayload(data: unknown, mapping: Record<string, unknown>): Record<string, unknown> {
    if (!data || typeof data !== 'object') return { data };
    if (Object.keys(mapping).length === 0) return data as Record<string, unknown>;

    const source = data as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [targetKey, sourcePath] of Object.entries(mapping)) {
      if (typeof sourcePath === 'string') {
        const value = this.getNestedValue(source, sourcePath);
        if (value !== undefined) result[targetKey] = value;
      } else {
        result[targetKey] = sourcePath;
      }
    }

    return result;
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return current;
  }

  private async getDecryptedCredentials(integrationId: string): Promise<Record<string, unknown> | null> {
    const creds = await this.credentialRepo.findActiveByIntegration(integrationId);
    if (creds.length === 0) return null;
    const cred = creds[0];
    try {
      return decryptCredential(cred.encryptedData, cred.iv, cred.authTag);
    } catch {
      logger.error('Failed to decrypt credentials', { integrationId });
      return null;
    }
  }

  private buildAuthHeader(credentials: Record<string, unknown>, provider: string): string | null {
    if (credentials.apiKey) return `Bearer ${credentials.apiKey}`;
    if (credentials.token) return `Bearer ${credentials.token}`;
    if (credentials.accessToken) return `Bearer ${credentials.accessToken}`;
    if (credentials.username && credentials.password) {
      const encoded = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
      return `Basic ${encoded}`;
    }
    if (provider === 'custom' && credentials.headerName && credentials.headerValue) {
      return `${credentials.headerValue}`;
    }
    return null;
  }

  private resolveProviderEndpoint(provider: string, action: string): string | null {
    const endpoints: Record<string, Record<string, string>> = {
      mailchimp: {
        add_subscriber: 'https://us1.api.mailchimp.com/3.0/lists/{listId}/members',
      },
      hubspot: {
        create_contact: 'https://api.hubapi.com/crm/v3/objects/contacts',
      },
      slack: {
        post_message: 'https://slack.com/api/chat.postMessage',
      },
    };
    const providerEndpoints = endpoints[provider];
    if (!providerEndpoints) return null;
    return providerEndpoints[action] ?? null;
  }
}
