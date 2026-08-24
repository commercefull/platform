/**
 * Subscription Domain Types
 *
 * Type definitions owned by the domain layer.
 * Infrastructure imports these — never the reverse.
 */

export type BillingInterval = 'day' | 'week' | 'month' | 'year';
export type BillingAnchor = 'subscription_start' | 'month_start' | 'specific_day';
export type SubscriptionStatus = 'pending' | 'trialing' | 'active' | 'paused' | 'past_due' | 'cancelled' | 'expired';
export type SubscriptionOrderStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'skipped';
export type PauseStatus = 'active' | 'resumed' | 'expired' | 'cancelled';
export type DunningStatus = 'pending' | 'processing' | 'success' | 'failed' | 'skipped';

export interface SubscriptionProduct {
  subscriptionProductId: string;
  productId: string;
  isSubscriptionOnly: boolean;
  allowOneTimePurchase: boolean;
  minSubscriptionLength?: number;
  maxSubscriptionLength?: number;
  trialDays: number;
  trialRequiresPayment: boolean;
  billingAnchor: BillingAnchor;
  billingAnchorDay?: number;
  prorateOnChange: boolean;
  allowPause: boolean;
  maxPauseDays?: number;
  maxPausesPerYear?: number;
  allowSkip: boolean;
  maxSkipsPerYear?: number;
  allowEarlyCancel: boolean;
  cancelNoticeDays: number;
  earlyTerminationFee?: number;
  autoRenew: boolean;
  renewalReminderDays: number;
  metadata?: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  subscriptionPlanId: string;
  subscriptionProductId: string;
  name: string;
  slug?: string;
  description?: string;
  billingInterval: BillingInterval;
  billingIntervalCount: number;
  price: number;
  compareAtPrice?: number;
  currency: string;
  setupFee: number;
  trialDays?: number;
  contractLength?: number;
  isContractRequired: boolean;
  discountPercent: number;
  discountAmount: number;
  freeShippingThreshold?: number;
  includesFreeShipping: boolean;
  includedProducts?: string[];
  features?: string[];
  metadata?: Record<string, unknown>;
  sortOrder: number;
  isPopular: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerSubscription {
  customerSubscriptionId: string;
  subscriptionNumber?: string;
  customerId: string;
  subscriptionPlanId: string;
  subscriptionProductId?: string;
  productVariantId?: string;
  status: SubscriptionStatus;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalPrice: number;
  currency: string;
  billingInterval: BillingInterval;
  billingIntervalCount: number;
  trialStartAt?: Date;
  trialEndAt?: Date;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  nextBillingAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelAtPeriodEnd: boolean;
  pausedAt?: Date;
  resumeAt?: Date;
  pauseReason?: string;
  pauseCount: number;
  skipCount: number;
  billingCycleCount: number;
  contractCyclesRemaining?: number;
  shippingAddressId?: string;
  billingAddressId?: string;
  paymentMethodId?: string;
  externalSubscriptionId?: string;
  lifetimeValue: number;
  failedPaymentCount: number;
  lastPaymentAt?: Date;
  lastPaymentFailedAt?: Date;
  customizations?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionOrder {
  subscriptionOrderId: string;
  customerSubscriptionId: string;
  orderId?: string;
  billingCycleNumber: number;
  periodStart: Date;
  periodEnd: Date;
  status: SubscriptionOrderStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  currency: string;
  scheduledAt?: Date;
  processedAt?: Date;
  paidAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  retryCount: number;
  nextRetryAt?: Date;
  paymentIntentId?: string;
  invoiceId?: string;
  isProrated: boolean;
  lineItems?: unknown[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPause {
  subscriptionPauseId: string;
  customerSubscriptionId: string;
  status: PauseStatus;
  pausedAt: Date;
  scheduledResumeAt?: Date;
  actualResumeAt?: Date;
  reason?: string;
  customerNote?: string;
  pausedBy?: string;
  resumedBy?: string;
  pauseDays?: number;
  billingCyclesSkipped: number;
  creditAmount: number;
  creditApplied: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DunningAttempt {
  dunningAttemptId: string;
  customerSubscriptionId: string;
  subscriptionOrderId?: string;
  attemptNumber: number;
  status: DunningStatus;
  amount: number;
  currency: string;
  scheduledAt: Date;
  attemptedAt?: Date;
  paymentMethodId?: string;
  paymentIntentId?: string;
  failureCode?: string;
  failureMessage?: string;
  emailSent: boolean;
  emailSentAt?: Date;
  emailType?: string;
  smsSent: boolean;
  smsSentAt?: Date;
  action?: string;
  actionTakenBy?: string;
  actionTakenAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
