/**
 * ChangeSubscriptionPlan Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';
import {
  SubscriptionNotFoundError,
  SubscriptionPlanNotFoundError,
  SubscriptionValidationError,
} from '../../domain/errors/SubscriptionErrors';

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
  proratedAmountCents?: number;
}

interface SubscriptionRecord {
  status: string;
  planId: string;
  customerId: string;
  nextBillingDate: string;
  currentPeriodStart?: string;
  startDate?: string;
  priceCents?: number;
}

interface PlanRecord {
  priceCents?: number;
}

interface SubscriptionRepoPort {
  findById(id: string): Promise<SubscriptionRecord | null>;
  update(id: string, data: Record<string, unknown>): Promise<void>;
}

interface PlanRepoPort {
  findById(id: string): Promise<PlanRecord | null>;
}

export class ChangeSubscriptionPlanUseCase {
  constructor(
    private readonly subscriptionRepo: SubscriptionRepoPort,
    private readonly planRepo: PlanRepoPort,
  ) {}

  async execute(input: ChangeSubscriptionPlanInput): Promise<ChangeSubscriptionPlanOutput> {
    if (!input.subscriptionId || !input.newPlanId) {
      throw new SubscriptionValidationError('Subscription ID and new plan ID are required');
    }

    const subscription = await this.subscriptionRepo.findById(input.subscriptionId);
    if (!subscription) {
      throw new SubscriptionNotFoundError(input.subscriptionId);
    }

    if (subscription.status !== 'active' && subscription.status !== 'paused') {
      throw new SubscriptionValidationError('Cannot change plan for inactive subscription');
    }

    const newPlan = await this.planRepo.findById(input.newPlanId);
    if (!newPlan) {
      throw new SubscriptionPlanNotFoundError(input.newPlanId);
    }

    const previousPlanId = subscription.planId;
    const effectiveDate = input.applyImmediately ? new Date() : new Date(subscription.nextBillingDate);

    let proratedAmountCents: number | undefined;
    if (input.prorateCharges && input.applyImmediately) {
      proratedAmountCents = this.calculateProration(subscription, newPlan);
    }

    await this.subscriptionRepo.update(input.subscriptionId, {
      planId: input.newPlanId,
      planChangedAt: new Date(),
      previousPlanId,
      proratedAmountCents,
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
      proratedAmountCents,
    };
  }

  private calculateProration(subscription: SubscriptionRecord, newPlan: PlanRecord): number {
    const now = new Date();
    const billingStart = new Date(subscription.currentPeriodStart || subscription.startDate || now.toISOString());
    const billingEnd = new Date(subscription.nextBillingDate);

    const totalDays = (billingEnd.getTime() - billingStart.getTime()) / (1000 * 60 * 60 * 24);
    const remainingDays = (billingEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (remainingDays <= 0 || totalDays <= 0) return 0;

    const oldDailyRate = (subscription.priceCents || 0) / totalDays;
    const newDailyRate = (newPlan.priceCents || 0) / totalDays;

    const unusedCredit = oldDailyRate * remainingDays;
    const newCharge = newDailyRate * remainingDays;

    return Math.max(0, Math.round(newCharge - unusedCredit));
  }
}
