/**
 * ProcessRenewal Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface ProcessRenewalInput {
  subscriptionId: string;
}

export interface ProcessRenewalOutput {
  subscriptionId: string;
  renewed: boolean;
  newPeriodStart: Date;
  newPeriodEnd: Date;
  amountCharged: number;
  invoiceId?: string;
}

export class ProcessRenewalUseCase {
  constructor(
    private readonly subscriptionRepo: any,
    private readonly paymentService: any,
    private readonly invoiceService: any,
  ) {}

  async execute(input: ProcessRenewalInput): Promise<ProcessRenewalOutput> {
    if (!input.subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    const subscription = await this.subscriptionRepo.findById(input.subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status !== 'active') {
      throw new Error('Only active subscriptions can be renewed');
    }

    // Check if renewal is due
    const now = new Date();
    const nextBillingDate = new Date(subscription.nextBillingDate);
    if (now < nextBillingDate) {
      throw new Error('Subscription is not yet due for renewal');
    }

    // Create invoice
    const invoice = await this.invoiceService.create({
      subscriptionId: input.subscriptionId,
      customerId: subscription.customerId,
      amount: subscription.price,
      description: `Subscription renewal - ${subscription.planName}`,
    });

    // Process payment
    let paymentSuccess = false;
    try {
      await this.paymentService.charge({
        customerId: subscription.customerId,
        amount: subscription.price,
        paymentMethodId: subscription.paymentMethodId,
        invoiceId: invoice.invoiceId,
      });
      paymentSuccess = true;
    } catch (error) {
      // Payment failed - enter dunning
      await this.subscriptionRepo.update(input.subscriptionId, {
        status: 'past_due',
        dunningStartedAt: now,
      });

      eventBus.emit('subscription.payment.failed', {
        subscriptionId: input.subscriptionId,
        customerId: subscription.customerId,
        amount: subscription.price,
      });

      throw new Error('Payment failed for subscription renewal');
    }

    // Calculate new period
    const newPeriodStart = new Date(nextBillingDate);
    const newPeriodEnd = this.calculateNextBillingDate(newPeriodStart, subscription.billingInterval);

    // Update subscription
    await this.subscriptionRepo.update(input.subscriptionId, {
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
      nextBillingDate: newPeriodEnd,
      renewalCount: (subscription.renewalCount || 0) + 1,
      lastRenewalAt: now,
    });

    eventBus.emit('subscription.renewed', {
      subscriptionId: input.subscriptionId,
      customerId: subscription.customerId,
      amount: subscription.price,
    });

    eventBus.emit('subscription.payment.success', {
      subscriptionId: input.subscriptionId,
      customerId: subscription.customerId,
      amount: subscription.price,
      invoiceId: invoice.invoiceId,
    });

    return {
      subscriptionId: input.subscriptionId,
      renewed: true,
      newPeriodStart,
      newPeriodEnd,
      amountCharged: subscription.price,
      invoiceId: invoice.invoiceId,
    };
  }

  private calculateNextBillingDate(fromDate: Date, interval: string): Date {
    const nextDate = new Date(fromDate);

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
