/**
 * Subscription Aggregate Root
 *
 * Represents a recurring subscription for a customer,
 * managing billing cycles, plan details, and lifecycle state.
 */

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired' | 'trial' | 'past_due';
export type BillingInterval = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface SubscriptionProps {
  subscriptionId: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  billingIntervalCount: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string;
  trialEnd?: string;
  cancelledAt?: string;
  cancelReason?: string;
  nextBillingDate?: string;
  amount: number;
  currencyCode: string;
  paymentMethodId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export class Subscription {
  private props: SubscriptionProps;

  constructor(props: SubscriptionProps) {
    this.props = props;
  }

  get subscriptionId(): string {
    return this.props.subscriptionId;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get status(): SubscriptionStatus {
    return this.props.status;
  }

  get isActive(): boolean {
    return this.props.status === 'active' || this.props.status === 'trial';
  }

  get isCancelled(): boolean {
    return this.props.status === 'cancelled';
  }

  pause(): void {
    if (this.props.status !== 'active') {
      throw new Error('Can only pause active subscriptions');
    }
    this.props.status = 'paused';
  }

  resume(): void {
    if (this.props.status !== 'paused') {
      throw new Error('Can only resume paused subscriptions');
    }
    this.props.status = 'active';
  }

  cancel(reason?: string): void {
    this.props.status = 'cancelled';
    this.props.cancelledAt = new Date().toISOString();
    this.props.cancelReason = reason;
  }

  toJSON(): SubscriptionProps {
    return { ...this.props };
  }
}
