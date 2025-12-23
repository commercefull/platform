/**
 * ChangeSubscriptionPlan Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface ChangeSubscriptionPlanInput {
  subscriptionId: string;
  newPlanId: string;
  applyImmediately?: boolean;
  prorateCharges?: boolean;
}

export interface ChangeSubscriptionPlanOutput {
  subscriptionId: string;
  previousPlanId: string;
  newPlanId: string;
  effectiveDate: Date;
  proratedAmount?: number;
}

export class ChangeSubscriptionPlanUseCase {
  constructor(
    private readonly subscriptionRepo: any,
    private readonly planRepo: any,
  ) {}

  async execute(input: ChangeSubscriptionPlanInput): Promise<ChangeSubscriptionPlanOutput> {
    if (!input.subscriptionId || !input.newPlanId) {
      throw new Error('Subscription ID and new plan ID are required');
    }

    const subscription = await this.subscriptionRepo.findById(input.subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status !== 'active' && subscription.status !== 'paused') {
      throw new Error('Cannot change plan for inactive subscription');
    }

    const newPlan = await this.planRepo.findById(input.newPlanId);
    if (!newPlan) {
      throw new Error('New plan not found');
    }

    const previousPlanId = subscription.planId;
    const effectiveDate = input.applyImmediately ? new Date() : new Date(subscription.nextBillingDate);

    let proratedAmount: number | undefined;
    if (input.prorateCharges && input.applyImmediately) {
      proratedAmount = this.calculateProration(subscription, newPlan);
    }

    await this.subscriptionRepo.update(input.subscriptionId, {
      planId: input.newPlanId,
      planChangedAt: new Date(),
      previousPlanId,
      proratedAmount,
    });

    eventBus.emit('subscription.activated', {
      subscriptionId: input.subscriptionId,
      customerId: subscription.customerId,
      previousPlanId,
      newPlanId: input.newPlanId,
      action: 'plan_changed',
    });

    return {
      subscriptionId: input.subscriptionId,
      previousPlanId,
      newPlanId: input.newPlanId,
      effectiveDate,
      proratedAmount,
    };
  }

  private calculateProration(subscription: any, newPlan: any): number {
    const now = new Date();
    const billingStart = new Date(subscription.currentPeriodStart || subscription.startDate);
    const billingEnd = new Date(subscription.nextBillingDate);

    const totalDays = (billingEnd.getTime() - billingStart.getTime()) / (1000 * 60 * 60 * 24);
    const remainingDays = (billingEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (remainingDays <= 0 || totalDays <= 0) return 0;

    const oldDailyRate = (subscription.price || 0) / totalDays;
    const newDailyRate = (newPlan.price || 0) / totalDays;

    const unusedCredit = oldDailyRate * remainingDays;
    const newCharge = newDailyRate * remainingDays;

    return Math.round((newCharge - unusedCredit) * 100) / 100;
  }
}
