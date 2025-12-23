/**
 * ResumeSubscription Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface ResumeSubscriptionInput {
  subscriptionId: string;
}

export interface ResumeSubscriptionOutput {
  subscriptionId: string;
  status: string;
  resumedAt: Date;
  nextBillingDate: Date;
}

export class ResumeSubscriptionUseCase {
  constructor(private readonly subscriptionRepo: any) {}

  async execute(input: ResumeSubscriptionInput): Promise<ResumeSubscriptionOutput> {
    if (!input.subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    const subscription = await this.subscriptionRepo.findById(input.subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status !== 'paused') {
      throw new Error('Only paused subscriptions can be resumed');
    }

    const resumedAt = new Date();
    const nextBillingDate = this.calculateNextBillingDate(subscription);

    await this.subscriptionRepo.update(input.subscriptionId, {
      status: 'active',
      pausedAt: null,
      pauseReason: null,
      pauseUntil: null,
      nextBillingDate,
    });

    eventBus.emit('subscription.resumed', {
      subscriptionId: input.subscriptionId,
      customerId: subscription.customerId,
    });

    return {
      subscriptionId: input.subscriptionId,
      status: 'active',
      resumedAt,
      nextBillingDate,
    };
  }

  private calculateNextBillingDate(subscription: any): Date {
    const now = new Date();
    const interval = subscription.billingInterval || 'monthly';
    const nextDate = new Date(now);

    switch (interval) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }

    return nextDate;
  }
}
