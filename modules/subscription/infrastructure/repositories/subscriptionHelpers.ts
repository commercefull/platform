/**
 * Row mappers and internal helpers for the subscription repository.
 */

import { queryOne } from '../../../../libs/db';
import type {
  BillingInterval,
  BillingAnchor,
  SubscriptionStatus,
  SubscriptionOrderStatus,
  PauseStatus,
  DunningStatus,
  SubscriptionProduct,
  SubscriptionPlan,
  CustomerSubscription,
  SubscriptionOrder,
  SubscriptionPause,
  DunningAttempt,
} from './subscriptionTypes';

export async function generateSubscriptionNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "customerSubscription" WHERE "subscriptionNumber" LIKE $1`,
    [`SUB${year}%`],
  );
  const count = parseInt(result?.count || '0') + 1;
  return `SUB${year}-${count.toString().padStart(6, '0')}`;
}

export function calculateNextBillingDate(from: Date, interval: BillingInterval, count: number): Date {
  const date = new Date(from);
  switch (interval) {
    case 'day':
      date.setDate(date.getDate() + count);
      break;
    case 'week':
      date.setDate(date.getDate() + count * 7);
      break;
    case 'month':
      date.setMonth(date.getMonth() + count);
      break;
    case 'year':
      date.setFullYear(date.getFullYear() + count);
      break;
  }
  return date;
}

export function mapToSubscriptionProduct(row: Record<string, unknown>): SubscriptionProduct {
  return {
    subscriptionProductId: row.subscriptionProductId as string,
    productId: row.productId as string,
    isSubscriptionOnly: Boolean(row.isSubscriptionOnly),
    allowOneTimePurchase: Boolean(row.allowOneTimePurchase),
    minSubscriptionLength: row.minSubscriptionLength ? parseInt(row.minSubscriptionLength as string) : undefined,
    maxSubscriptionLength: row.maxSubscriptionLength ? parseInt(row.maxSubscriptionLength as string) : undefined,
    trialDays: parseInt(row.trialDays as string) || 0,
    trialRequiresPayment: Boolean(row.trialRequiresPayment),
    billingAnchor: row.billingAnchor as BillingAnchor,
    billingAnchorDay: row.billingAnchorDay ? parseInt(row.billingAnchorDay as string) : undefined,
    prorateOnChange: Boolean(row.prorateOnChange),
    allowPause: Boolean(row.allowPause),
    maxPauseDays: row.maxPauseDays ? parseInt(row.maxPauseDays as string) : undefined,
    maxPausesPerYear: row.maxPausesPerYear ? parseInt(row.maxPausesPerYear as string) : undefined,
    allowSkip: Boolean(row.allowSkip),
    maxSkipsPerYear: row.maxSkipsPerYear ? parseInt(row.maxSkipsPerYear as string) : undefined,
    allowEarlyCancel: Boolean(row.allowEarlyCancel),
    cancelNoticeDays: parseInt(row.cancelNoticeDays as string) || 0,
    earlyTerminationFeeCents: row.earlyTerminationFeeCents != null ? Number(row.earlyTerminationFeeCents) : undefined,
    autoRenew: Boolean(row.autoRenew),
    renewalReminderDays: parseInt(row.renewalReminderDays as string) || 7,
    metadata: row.metadata as Record<string, unknown> | undefined,
    isActive: Boolean(row.isActive),
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

export function mapToSubscriptionPlan(row: Record<string, unknown>): SubscriptionPlan {
  return {
    subscriptionPlanId: row.subscriptionPlanId as string,
    subscriptionProductId: row.subscriptionProductId as string,
    name: row.name as string,
    slug: row.slug as string | undefined,
    description: row.description as string | undefined,
    billingInterval: row.billingInterval as BillingInterval,
    billingIntervalCount: parseInt(row.billingIntervalCount as string) || 1,
    priceCents: Number(row.priceCents) || 0,
    compareAtPriceCents: row.compareAtPriceCents != null ? Number(row.compareAtPriceCents) : undefined,
    currency: (row.currencyCode as string) || 'USD',
    setupFeeCents: Number(row.setupFeeCents) || 0,
    trialDays: row.trialDays ? parseInt(row.trialDays as string) : undefined,
    contractLength: row.contractLength ? parseInt(row.contractLength as string) : undefined,
    isContractRequired: Boolean(row.isContractRequired),
    discountPercent: parseFloat(row.discountPercent as string) || 0,
    discountAmountCents: parseFloat(row.discountAmountCents as string) || 0,
    freeShippingThresholdCents: row.freeShippingThresholdCents != null ? Number(row.freeShippingThresholdCents) : undefined,
    includesFreeShipping: Boolean(row.includesFreeShipping),
    includedProducts: row.includedProducts as string[] | undefined,
    features: row.features as string[] | undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
    sortOrder: parseInt(row.sortOrder as string) || 0,
    isPopular: Boolean(row.isPopular),
    isActive: Boolean(row.isActive),
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

export function mapToCustomerSubscription(row: Record<string, unknown>): CustomerSubscription {
  return {
    ...subscriptionIdentityFields(row),
    ...subscriptionPricingFields(row),
    ...subscriptionDateFields(row),
    ...subscriptionLifecycleFields(row),
  };
}

function subscriptionIdentityFields(row: Record<string, unknown>) {
  return {
    customerSubscriptionId: row.customerSubscriptionId as string,
    subscriptionNumber: row.subscriptionNumber as string | undefined,
    customerId: row.customerId as string,
    subscriptionPlanId: row.subscriptionPlanId as string,
    subscriptionProductId: row.subscriptionProductId as string | undefined,
    productVariantId: row.productVariantId as string | undefined,
    status: row.status as SubscriptionStatus,
  };
}

function subscriptionPricingFields(row: Record<string, unknown>) {
  return {
    quantity: parseInt(row.quantity as string) || 1,
    unitPriceCents: parseFloat(row.unitPriceCents as string) || 0,
    discountAmountCents: parseFloat(row.discountAmountCents as string) || 0,
    taxAmountCents: parseFloat(row.taxAmountCents as string) || 0,
    totalPriceCents: parseFloat(row.totalPriceCents as string) || 0,
    currency: (row.currencyCode as string) || 'USD',
    billingInterval: row.billingInterval as BillingInterval,
    billingIntervalCount: parseInt(row.billingIntervalCount as string) || 1,
    contractCyclesRemaining: row.contractCyclesRemaining ? parseInt(row.contractCyclesRemaining as string) : undefined,
    lifetimeValueCents: parseFloat(row.lifetimeValueCents as string) || 0,
  };
}

function subscriptionDateFields(row: Record<string, unknown>) {
  return {
    trialStartAt: row.trialStartAt ? new Date(row.trialStartAt as string) : undefined,
    trialEndAt: row.trialEndAt ? new Date(row.trialEndAt as string) : undefined,
    currentPeriodStart: row.currentPeriodStart ? new Date(row.currentPeriodStart as string) : undefined,
    currentPeriodEnd: row.currentPeriodEnd ? new Date(row.currentPeriodEnd as string) : undefined,
    nextBillingAt: row.nextBillingAt ? new Date(row.nextBillingAt as string) : undefined,
    cancelledAt: row.cancelledAt ? new Date(row.cancelledAt as string) : undefined,
    pausedAt: row.pausedAt ? new Date(row.pausedAt as string) : undefined,
    resumeAt: row.resumeAt ? new Date(row.resumeAt as string) : undefined,
    lastPaymentAt: row.lastPaymentAt ? new Date(row.lastPaymentAt as string) : undefined,
    lastPaymentFailedAt: row.lastPaymentFailedAt ? new Date(row.lastPaymentFailedAt as string) : undefined,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

function subscriptionLifecycleFields(row: Record<string, unknown>) {
  return {
    cancellationReason: row.cancellationReason as string | undefined,
    cancelledBy: row.cancelledBy as string | undefined,
    cancelAtPeriodEnd: Boolean(row.cancelAtPeriodEnd),
    pauseReason: row.pauseReason as string | undefined,
    pauseCount: parseInt(row.pauseCount as string) || 0,
    skipCount: parseInt(row.skipCount as string) || 0,
    billingCycleCount: parseInt(row.billingCycleCount as string) || 0,
    failedPaymentCount: parseInt(row.failedPaymentCount as string) || 0,
    shippingAddressId: row.shippingAddressId as string | undefined,
    billingAddressId: row.billingAddressId as string | undefined,
    paymentMethodId: row.paymentMethodId as string | undefined,
    externalSubscriptionId: row.externalSubscriptionId as string | undefined,
    customizations: row.customizations as Record<string, unknown> | undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
    storeId: row.storeId as string | undefined,
    salesChannelId: row.salesChannelId as string | undefined,
  };
}

export function mapToSubscriptionOrder(row: Record<string, unknown>): SubscriptionOrder {
  return {
    subscriptionOrderId: row.subscriptionOrderId as string,
    customerSubscriptionId: row.customerSubscriptionId as string,
    orderId: row.orderId as string | undefined,
    billingCycleNumber: parseInt(row.billingCycleNumber as string) || 1,
    periodStart: new Date(row.periodStart as string),
    periodEnd: new Date(row.periodEnd as string),
    status: row.status as SubscriptionOrderStatus,
    subtotalCents: parseFloat(row.subtotalCents as string) || 0,
    discountAmountCents: parseFloat(row.discountAmountCents as string) || 0,
    taxAmountCents: parseFloat(row.taxAmountCents as string) || 0,
    shippingAmountCents: parseFloat(row.shippingAmountCents as string) || 0,
    totalAmountCents: parseFloat(row.totalAmountCents as string) || 0,
    currency: (row.currencyCode as string) || 'USD',
    scheduledAt: row.scheduledAt ? new Date(row.scheduledAt as string) : undefined,
    processedAt: row.processedAt ? new Date(row.processedAt as string) : undefined,
    paidAt: row.paidAt ? new Date(row.paidAt as string) : undefined,
    failedAt: row.failedAt ? new Date(row.failedAt as string) : undefined,
    failureReason: row.failureReason as string | undefined,
    retryCount: parseInt(row.retryCount as string) || 0,
    nextRetryAt: row.nextRetryAt ? new Date(row.nextRetryAt as string) : undefined,
    paymentIntentId: row.paymentIntentId as string | undefined,
    invoiceId: row.invoiceId as string | undefined,
    isProrated: Boolean(row.isProrated),
    lineItems: row.lineItems as unknown[] | undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

export function mapToSubscriptionPause(row: Record<string, unknown>): SubscriptionPause {
  return {
    subscriptionPauseId: row.subscriptionPauseId as string,
    customerSubscriptionId: row.customerSubscriptionId as string,
    status: row.status as PauseStatus,
    pausedAt: new Date(row.pausedAt as string),
    scheduledResumeAt: row.scheduledResumeAt ? new Date(row.scheduledResumeAt as string) : undefined,
    actualResumeAt: row.actualResumeAt ? new Date(row.actualResumeAt as string) : undefined,
    reason: row.reason as string | undefined,
    customerNote: row.customerNote as string | undefined,
    pausedBy: row.pausedBy as string | undefined,
    resumedBy: row.resumedBy as string | undefined,
    pauseDays: row.pauseDays ? parseInt(row.pauseDays as string) : undefined,
    billingCyclesSkipped: parseInt(row.billingCyclesSkipped as string) || 0,
    creditAmountCents: parseFloat(row.creditAmountCents as string) || 0,
    creditApplied: Boolean(row.creditApplied),
    metadata: row.metadata as Record<string, unknown> | undefined,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

export function mapToDunningAttempt(row: Record<string, unknown>): DunningAttempt {
  return {
    dunningAttemptId: row.dunningAttemptId as string,
    customerSubscriptionId: row.customerSubscriptionId as string,
    subscriptionOrderId: row.subscriptionOrderId as string | undefined,
    attemptNumber: parseInt(row.attemptNumber as string) || 1,
    status: row.status as DunningStatus,
    amountCents: parseFloat(row.amountCents as string) || 0,
    currency: (row.currencyCode as string) || 'USD',
    scheduledAt: new Date(row.scheduledAt as string),
    attemptedAt: row.attemptedAt ? new Date(row.attemptedAt as string) : undefined,
    paymentMethodId: row.paymentMethodId as string | undefined,
    paymentIntentId: row.paymentIntentId as string | undefined,
    failureCode: row.failureCode as string | undefined,
    failureMessage: row.failureMessage as string | undefined,
    emailSent: Boolean(row.emailSent),
    emailSentAt: row.emailSentAt ? new Date(row.emailSentAt as string) : undefined,
    emailType: row.emailType as string | undefined,
    smsSent: Boolean(row.smsSent),
    smsSentAt: row.smsSentAt ? new Date(row.smsSentAt as string) : undefined,
    action: row.action as string | undefined,
    actionTakenBy: row.actionTakenBy as string | undefined,
    actionTakenAt: row.actionTakenAt ? new Date(row.actionTakenAt as string) : undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}
