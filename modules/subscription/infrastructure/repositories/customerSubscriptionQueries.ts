/**
 * Customer subscription queries and lifecycle operations — extracted from subscriptionRepo.
 */

import { query, queryOne } from '../../../../libs/db';
import { SubscriptionNotFoundError, SubscriptionPlanNotFoundError } from '../../domain/errors/SubscriptionErrors';
import type { CustomerSubscription, SubscriptionPlan, SubscriptionPause, SubscriptionStatus } from './subscriptionTypes';
import {
  mapToCustomerSubscription,
  mapToSubscriptionPause,
  generateSubscriptionNumber,
  calculateNextBillingDate,
} from './subscriptionHelpers';
import { getSubscriptionPlan } from './subscriptionPlanQueries';
import type { CustomerSubscription as DbCustomerSubscription, SubscriptionPause as DbSubscriptionPause } from '../../../../libs/db/types';

export async function getCustomerSubscription(customerSubscriptionId: string): Promise<CustomerSubscription | null> {
  const row = await queryOne<DbCustomerSubscription>('SELECT * FROM "customerSubscription" WHERE "customerSubscriptionId" = $1', [
    customerSubscriptionId,
  ]);
  return row ? mapToCustomerSubscription(row) : null;
}

export async function getCustomerSubscriptionByNumber(subscriptionNumber: string): Promise<CustomerSubscription | null> {
  const row = await queryOne<DbCustomerSubscription>('SELECT * FROM "customerSubscription" WHERE "subscriptionNumber" = $1', [
    subscriptionNumber,
  ]);
  return row ? mapToCustomerSubscription(row) : null;
}

export async function getCustomerSubscriptions(
  filters?: { customerId?: string; status?: SubscriptionStatus },
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: CustomerSubscription[]; total: number }> {
  let whereClause = '1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters?.customerId) {
    whereClause += ` AND "customerId" = $${paramIndex++}`;
    params.push(filters.customerId);
  }
  if (filters?.status) {
    whereClause += ` AND "status" = $${paramIndex++}`;
    params.push(filters.status);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "customerSubscription" WHERE ${whereClause}`,
    params,
  );

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<DbCustomerSubscription[]>(
    `SELECT * FROM "customerSubscription" WHERE ${whereClause} 
     ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset],
  );

  return {
    data: (rows || []).map(mapToCustomerSubscription),
    total: parseInt(countResult?.count || '0'),
  };
}

export async function getSubscriptionsDueBilling(beforeDate: Date): Promise<CustomerSubscription[]> {
  const rows = await query<DbCustomerSubscription[]>(
    `SELECT * FROM "customerSubscription" 
     WHERE "status" IN ('active', 'trialing') 
     AND "nextBillingAt" <= $1 
     ORDER BY "nextBillingAt" ASC`,
    [beforeDate.toISOString()],
  );
  return (rows || []).map(mapToCustomerSubscription);
}

interface CustomerSubscriptionInput {
  customerId: string;
  subscriptionPlanId: string;
  subscriptionProductId?: string;
  productVariantId?: string;
  quantity?: number;
  shippingAddressId?: string;
  billingAddressId?: string;
  paymentMethodId?: string;
  customizations?: Record<string, unknown>;
  storeId?: string;
  salesChannelId?: string;
  /** Total quoted tax (added + price-included portions), for reporting. */
  taxAmountCents?: number;
  /** Portion of tax added on top of the subtotal — 0 for tax-inclusive pricing. */
  taxAddedCents?: number;
  currencyCode?: string;
  metadata?: Record<string, unknown>;
}

export async function createCustomerSubscription(subscription: CustomerSubscriptionInput): Promise<CustomerSubscription> {
  const now = new Date();
  const plan = await getSubscriptionPlan(subscription.subscriptionPlanId);
  if (!plan) throw new SubscriptionPlanNotFoundError(subscription.subscriptionPlanId);

  const schedule = subscriptionSchedule(plan, now);
  const result = await insertCustomerSubscription(subscription, plan, schedule, await generateSubscriptionNumber());
  return mapToCustomerSubscription(result!);
}

interface SubscriptionSchedule {
  trialDays: number;
  trialStartAt: Date | null;
  trialEndAt: Date | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingAt: Date;
}

// Calculate trial and billing dates
function subscriptionSchedule(plan: SubscriptionPlan, now: Date): SubscriptionSchedule {
  const trialDays = plan.trialDays || 0;
  const trialStartAt = trialDays > 0 ? now : null;
  const trialEndAt = trialDays > 0 ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null;
  const currentPeriodStart = trialEndAt || now;
  const currentPeriodEnd = calculateNextBillingDate(currentPeriodStart, plan.billingInterval, plan.billingIntervalCount);
  const nextBillingAt = trialEndAt || currentPeriodEnd;
  return { trialDays, trialStartAt, trialEndAt, currentPeriodStart, currentPeriodEnd, nextBillingAt };
}

function subscriptionPricing(plan: SubscriptionPlan, quantity: number) {
  const unitPriceCents = plan.priceCents;
  const discountAmountCents = plan.discountAmountCents || (unitPriceCents * (plan.discountPercent || 0)) / 100;
  return { unitPriceCents, discountAmountCents, totalPriceCents: unitPriceCents * quantity - discountAmountCents };
}

async function insertCustomerSubscription(
  subscription: CustomerSubscriptionInput,
  plan: SubscriptionPlan,
  schedule: SubscriptionSchedule,
  subscriptionNumber: string,
): Promise<Record<string, unknown> | null> {
  const now = new Date();
  const quantity = subscription.quantity || 1;
  const pricing = subscriptionPricing(plan, quantity);
  const { trialDays, trialStartAt, trialEndAt, currentPeriodStart, currentPeriodEnd, nextBillingAt } = schedule;

  const result = await queryOne<DbCustomerSubscription>(
    `INSERT INTO "customerSubscription" (
      "subscriptionNumber", "customerId", "subscriptionPlanId", "subscriptionProductId",
      "productVariantId", "status", "quantity", "unitPriceCents", "discountAmountCents",
      "taxAmountCents", "totalPriceCents", "currencyCode", "billingInterval", "billingIntervalCount",
      "trialStartAt", "trialEndAt", "currentPeriodStart", "currentPeriodEnd",
      "nextBillingAt", "contractCyclesRemaining", "shippingAddressId", "billingAddressId",
      "paymentMethodId", "customizations", "storeId", "salesChannelId", "metadata", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
    RETURNING *`,
    [
      subscriptionNumber,
      subscription.customerId,
      subscription.subscriptionPlanId,
      subscription.subscriptionProductId,
      subscription.productVariantId,
      trialDays > 0 ? 'trialing' : 'active',
      quantity,
      pricing.unitPriceCents,
      pricing.discountAmountCents,
      subscription.taxAmountCents ?? 0,
      pricing.totalPriceCents + (subscription.taxAddedCents ?? subscription.taxAmountCents ?? 0),
      subscription.currencyCode ?? plan.currency,
      plan.billingInterval,
      plan.billingIntervalCount,
      trialStartAt?.toISOString(),
      trialEndAt?.toISOString(),
      currentPeriodStart.toISOString(),
      currentPeriodEnd.toISOString(),
      nextBillingAt.toISOString(),
      plan.contractLength,
      subscription.shippingAddressId,
      subscription.billingAddressId,
      subscription.paymentMethodId,
      subscription.customizations ? JSON.stringify(subscription.customizations) : null,
      subscription.storeId ?? null,
      subscription.salesChannelId ?? null,
      subscription.metadata ? JSON.stringify(subscription.metadata) : null,
      now.toISOString(),
      now.toISOString(),
    ],
  );

  return result;
}

export async function updateSubscriptionStatus(
  customerSubscriptionId: string,
  status: SubscriptionStatus,
  additionalFields?: Partial<CustomerSubscription>,
): Promise<void> {
  const now = new Date().toISOString();
  let setClause = '"status" = $1, "updatedAt" = $2';
  const params: unknown[] = [status, now];
  let paramIndex = 3;

  if (additionalFields?.cancelledAt) {
    setClause += `, "cancelledAt" = $${paramIndex++}`;
    params.push(additionalFields.cancelledAt.toISOString());
  }
  if (additionalFields?.cancellationReason) {
    setClause += `, "cancellationReason" = $${paramIndex++}`;
    params.push(additionalFields.cancellationReason);
  }
  if (additionalFields?.cancelledBy) {
    setClause += `, "cancelledBy" = $${paramIndex++}`;
    params.push(additionalFields.cancelledBy);
  }
  if (additionalFields?.pausedAt) {
    setClause += `, "pausedAt" = $${paramIndex++}`;
    params.push(additionalFields.pausedAt.toISOString());
  }
  if (additionalFields?.resumeAt) {
    setClause += `, "resumeAt" = $${paramIndex++}`;
    params.push(additionalFields.resumeAt.toISOString());
  }

  params.push(customerSubscriptionId);
  await query(`UPDATE "customerSubscription" SET ${setClause} WHERE "customerSubscriptionId" = $${paramIndex}`, params);
}

export async function cancelSubscription(
  customerSubscriptionId: string,
  reason?: string,
  cancelledBy?: string,
  cancelAtPeriodEnd: boolean = true,
): Promise<void> {
  const now = new Date().toISOString();

  if (cancelAtPeriodEnd) {
    await query(
      `UPDATE "customerSubscription" SET 
        "cancelAtPeriodEnd" = true, "cancellationReason" = $1, "cancelledBy" = $2, "updatedAt" = $3
       WHERE "customerSubscriptionId" = $4`,
      [reason, cancelledBy, now, customerSubscriptionId],
    );
  } else {
    await query(
      `UPDATE "customerSubscription" SET 
        "status" = 'cancelled', "cancelledAt" = $1, "cancellationReason" = $2, 
        "cancelledBy" = $3, "updatedAt" = $1
       WHERE "customerSubscriptionId" = $4`,
      [now, reason, cancelledBy, customerSubscriptionId],
    );
  }
}

export async function pauseSubscription(
  customerSubscriptionId: string,
  resumeAt?: Date,
  reason?: string,
  pausedBy?: string,
): Promise<SubscriptionPause> {
  const now = new Date();

  // Update subscription status
  await query(
    `UPDATE "customerSubscription" SET 
      "status" = 'paused', "pausedAt" = $1, "resumeAt" = $2, "pauseReason" = $3,
      "pauseCount" = "pauseCount" + 1, "updatedAt" = $1
     WHERE "customerSubscriptionId" = $4`,
    [now.toISOString(), resumeAt?.toISOString(), reason, customerSubscriptionId],
  );

  // Create pause record
  const result = await queryOne<DbSubscriptionPause>(
    `INSERT INTO "subscriptionPause" (
      "customerSubscriptionId", "status", "pausedAt", "scheduledResumeAt",
      "reason", "pausedBy", "createdAt", "updatedAt"
    ) VALUES ($1, 'active', $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [customerSubscriptionId, now.toISOString(), resumeAt?.toISOString(), reason, pausedBy, now.toISOString(), now.toISOString()],
  );

  return mapToSubscriptionPause(result!);
}

export async function resumeSubscription(customerSubscriptionId: string, resumedBy?: string): Promise<void> {
  const now = new Date();
  const subscription = await getCustomerSubscription(customerSubscriptionId);
  if (!subscription) throw new SubscriptionNotFoundError(customerSubscriptionId);

  // Calculate new billing period
  const _plan = await getSubscriptionPlan(subscription.subscriptionPlanId);
  const nextBillingAt = calculateNextBillingDate(now, subscription.billingInterval, subscription.billingIntervalCount);

  await query(
    `UPDATE "customerSubscription" SET 
      "status" = 'active', "pausedAt" = NULL, "resumeAt" = NULL, "pauseReason" = NULL,
      "currentPeriodStart" = $1, "currentPeriodEnd" = $2, "nextBillingAt" = $2, "updatedAt" = $1
     WHERE "customerSubscriptionId" = $3`,
    [now.toISOString(), nextBillingAt.toISOString(), customerSubscriptionId],
  );

  // Update pause record
  await query(
    `UPDATE "subscriptionPause" SET 
      "status" = 'resumed', "actualResumeAt" = $1, "resumedBy" = $2, "updatedAt" = $1
     WHERE "customerSubscriptionId" = $3 AND "status" = 'active'`,
    [now.toISOString(), resumedBy, customerSubscriptionId],
  );
}

export async function advanceBillingCycle(customerSubscriptionId: string): Promise<void> {
  const now = new Date();
  const subscription = await getCustomerSubscription(customerSubscriptionId);
  if (!subscription) throw new SubscriptionNotFoundError(customerSubscriptionId);

  const newPeriodStart = subscription.currentPeriodEnd || now;
  const newPeriodEnd = calculateNextBillingDate(newPeriodStart, subscription.billingInterval, subscription.billingIntervalCount);

  await query(
    `UPDATE "customerSubscription" SET 
      "currentPeriodStart" = $1, "currentPeriodEnd" = $2, "nextBillingAt" = $2,
      "billingCycleCount" = "billingCycleCount" + 1, "lastPaymentAt" = $3, "updatedAt" = $3
     WHERE "customerSubscriptionId" = $4`,
    [newPeriodStart.toISOString(), newPeriodEnd.toISOString(), now.toISOString(), customerSubscriptionId],
  );
}
