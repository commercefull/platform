/**
 * Process Billing Cycle Use Case
 *
 * Creates the subscription order for the next billing cycle and
 * advances the subscription's billing cycle counter.
 */

import type { SubscriptionOrder, SubscriptionRepository } from '../../domain/repositories/SubscriptionRepository';
import { SubscriptionNotFoundError } from '../../domain/errors/SubscriptionErrors';

export type ProcessBillingCyclePort = Pick<
  SubscriptionRepository,
  'getCustomerSubscription' | 'createSubscriptionOrder' | 'advanceBillingCycle'
>;

export class ProcessBillingCycleUseCase {
  constructor(private readonly subscriptionRepo: ProcessBillingCyclePort) {}

  async execute(customerSubscriptionId: string): Promise<SubscriptionOrder> {
    const subscription = await this.subscriptionRepo.getCustomerSubscription(customerSubscriptionId);
    if (!subscription) {
      throw new SubscriptionNotFoundError(customerSubscriptionId);
    }

    // Create subscription order
    const order = await this.subscriptionRepo.createSubscriptionOrder({
      customerSubscriptionId: subscription.customerSubscriptionId,
      billingCycleNumber: subscription.billingCycleCount + 1,
      periodStart: subscription.currentPeriodEnd || new Date(),
      periodEnd: new Date(), // Will be calculated properly
      subtotalCents: subscription.totalPriceCents,
      discountAmountCents: subscription.discountAmountCents,
      taxAmountCents: subscription.taxAmountCents,
    });

    // Advance billing cycle
    await this.subscriptionRepo.advanceBillingCycle(subscription.customerSubscriptionId);

    return order;
  }
}
