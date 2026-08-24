/**
 * PauseSubscription Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { SubscriptionNotFoundError, SubscriptionValidationError } from '../../domain/errors/SubscriptionErrors';

export interface PauseSubscriptionInput {
  subscriptionId: string;
  reason?: string;
  pauseUntil?: Date;
}

export interface PauseSubscriptionOutput {
  subscriptionId: string;
  status: string;
  pausedAt: Date;
  pauseUntil?: Date;
}

interface SubscriptionRecord {
  status: string;
  customerId: string;
}

interface SubscriptionRepoPort {
  findById(id: string): Promise<SubscriptionRecord | null>;
  update(id: string, data: Record<string, unknown>): Promise<void>;
}

export class PauseSubscriptionUseCase {
  constructor(private readonly subscriptionRepo: SubscriptionRepoPort) {}

  async execute(input: PauseSubscriptionInput): Promise<PauseSubscriptionOutput> {
    if (!input.subscriptionId) {
      throw new SubscriptionValidationError('Subscription ID is required');
    }

    const subscription = await this.subscriptionRepo.findById(input.subscriptionId);
    if (!subscription) {
      throw new SubscriptionNotFoundError(input.subscriptionId);
    }

    if (subscription.status !== 'active') {
      throw new SubscriptionValidationError('Only active subscriptions can be paused');
    }

    const pausedAt = new Date();
    await this.subscriptionRepo.update(input.subscriptionId, {
      status: 'paused',
      pausedAt,
      pauseReason: input.reason,
      pauseUntil: input.pauseUntil,
    });

    eventBus.emit('subscription.paused', {
      subscriptionId: input.subscriptionId,
      customerId: subscription.customerId,
      reason: input.reason,
    });

    return {
      subscriptionId: input.subscriptionId,
      status: 'paused',
      pausedAt,
      pauseUntil: input.pauseUntil,
    };
  }
}
