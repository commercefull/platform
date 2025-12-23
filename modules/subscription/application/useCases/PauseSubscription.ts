/**
 * PauseSubscription Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';

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

export class PauseSubscriptionUseCase {
  constructor(private readonly subscriptionRepo: any) {}

  async execute(input: PauseSubscriptionInput): Promise<PauseSubscriptionOutput> {
    if (!input.subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    const subscription = await this.subscriptionRepo.findById(input.subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status !== 'active') {
      throw new Error('Only active subscriptions can be paused');
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
