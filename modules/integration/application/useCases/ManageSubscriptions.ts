import { randomUUID } from 'crypto';
import type {
  IntegrationRepository, IntegrationSubscriptionRepository,
} from '../../domain/repositories/IntegrationRepository';
import { IntegrationEventSubscription } from '../../domain/entities/IntegrationEventSubscription';
import { IntegrationNotFoundError, SubscriptionNotFoundError } from '../../domain/errors/IntegrationErrors';

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

  async updateSubscription(
    subscriptionId: string,
    updates: {
      targetAction?: string;
      payloadMapping?: Record<string, unknown>;
      headers?: Record<string, string> | null;
      isActive?: boolean;
    },
  ): Promise<IntegrationEventSubscription> {
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

