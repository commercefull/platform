/**
 * Subscription Repository
 * Handles CRUD operations for subscription products, plans, and customer subscriptions
 */

import { query, queryOne } from '../../../libs/db';

// ============================================================================
// Types
// ============================================================================

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
  metadata?: Record<string, any>;
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
  metadata?: Record<string, any>;
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
  customizations?: Record<string, any>;
  metadata?: Record<string, any>;
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
  lineItems?: any[];
  metadata?: Record<string, any>;
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
  metadata?: Record<string, any>;
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
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Subscription Products
// ============================================================================

export async function getSubscriptionProduct(subscriptionProductId: string): Promise<SubscriptionProduct | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "subscriptionProduct" WHERE "subscriptionProductId" = $1',
    [subscriptionProductId]
  );
  return row ? mapToSubscriptionProduct(row) : null;
}

export async function getSubscriptionProductByProductId(productId: string): Promise<SubscriptionProduct | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "subscriptionProduct" WHERE "productId" = $1',
    [productId]
  );
  return row ? mapToSubscriptionProduct(row) : null;
}

export async function getSubscriptionProducts(activeOnly: boolean = true): Promise<SubscriptionProduct[]> {
  let whereClause = '1=1';
  if (activeOnly) {
    whereClause = '"isActive" = true';
  }
  
  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "subscriptionProduct" WHERE ${whereClause} ORDER BY "createdAt" DESC`
  );
  return (rows || []).map(mapToSubscriptionProduct);
}

export async function saveSubscriptionProduct(product: Partial<SubscriptionProduct> & { productId: string }): Promise<SubscriptionProduct> {
  const now = new Date().toISOString();

  if (product.subscriptionProductId) {
    await query(
      `UPDATE "subscriptionProduct" SET
        "isSubscriptionOnly" = $1, "allowOneTimePurchase" = $2, "minSubscriptionLength" = $3,
        "maxSubscriptionLength" = $4, "trialDays" = $5, "trialRequiresPayment" = $6,
        "billingAnchor" = $7, "billingAnchorDay" = $8, "prorateOnChange" = $9,
        "allowPause" = $10, "maxPauseDays" = $11, "maxPausesPerYear" = $12,
        "allowSkip" = $13, "maxSkipsPerYear" = $14, "allowEarlyCancel" = $15,
        "cancelNoticeDays" = $16, "earlyTerminationFee" = $17, "autoRenew" = $18,
        "renewalReminderDays" = $19, "metadata" = $20, "isActive" = $21, "updatedAt" = $22
      WHERE "subscriptionProductId" = $23`,
      [
        product.isSubscriptionOnly || false, product.allowOneTimePurchase !== false,
        product.minSubscriptionLength, product.maxSubscriptionLength,
        product.trialDays || 0, product.trialRequiresPayment || false,
        product.billingAnchor || 'subscription_start', product.billingAnchorDay,
        product.prorateOnChange !== false, product.allowPause !== false,
        product.maxPauseDays, product.maxPausesPerYear, product.allowSkip !== false,
        product.maxSkipsPerYear, product.allowEarlyCancel !== false,
        product.cancelNoticeDays || 0, product.earlyTerminationFee,
        product.autoRenew !== false, product.renewalReminderDays || 7,
        product.metadata ? JSON.stringify(product.metadata) : null,
        product.isActive !== false, now, product.subscriptionProductId
      ]
    );
    return (await getSubscriptionProduct(product.subscriptionProductId))!;
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "subscriptionProduct" (
        "productId", "isSubscriptionOnly", "allowOneTimePurchase", "minSubscriptionLength",
        "maxSubscriptionLength", "trialDays", "trialRequiresPayment", "billingAnchor",
        "billingAnchorDay", "prorateOnChange", "allowPause", "maxPauseDays",
        "maxPausesPerYear", "allowSkip", "maxSkipsPerYear", "allowEarlyCancel",
        "cancelNoticeDays", "earlyTerminationFee", "autoRenew", "renewalReminderDays",
        "metadata", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *`,
      [
        product.productId, product.isSubscriptionOnly || false,
        product.allowOneTimePurchase !== false, product.minSubscriptionLength,
        product.maxSubscriptionLength, product.trialDays || 0,
        product.trialRequiresPayment || false, product.billingAnchor || 'subscription_start',
        product.billingAnchorDay, product.prorateOnChange !== false,
        product.allowPause !== false, product.maxPauseDays, product.maxPausesPerYear,
        product.allowSkip !== false, product.maxSkipsPerYear,
        product.allowEarlyCancel !== false, product.cancelNoticeDays || 0,
        product.earlyTerminationFee, product.autoRenew !== false,
        product.renewalReminderDays || 7,
        product.metadata ? JSON.stringify(product.metadata) : null, true, now, now
      ]
    );
    return mapToSubscriptionProduct(result!);
  }
}

export async function deleteSubscriptionProduct(subscriptionProductId: string): Promise<void> {
  await query(
    'UPDATE "subscriptionProduct" SET "isActive" = false, "updatedAt" = $1 WHERE "subscriptionProductId" = $2',
    [new Date().toISOString(), subscriptionProductId]
  );
}

// ============================================================================
// Subscription Plans
// ============================================================================

export async function getSubscriptionPlan(subscriptionPlanId: string): Promise<SubscriptionPlan | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "subscriptionPlan" WHERE "subscriptionPlanId" = $1',
    [subscriptionPlanId]
  );
  return row ? mapToSubscriptionPlan(row) : null;
}

export async function getSubscriptionPlans(subscriptionProductId: string, activeOnly: boolean = true): Promise<SubscriptionPlan[]> {
  let whereClause = '"subscriptionProductId" = $1';
  if (activeOnly) {
    whereClause += ' AND "isActive" = true';
  }
  
  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "subscriptionPlan" WHERE ${whereClause} ORDER BY "sortOrder" ASC, "price" ASC`,
    [subscriptionProductId]
  );
  return (rows || []).map(mapToSubscriptionPlan);
}

export async function saveSubscriptionPlan(plan: Partial<SubscriptionPlan> & {
  subscriptionProductId: string;
  name: string;
  price: number;
}): Promise<SubscriptionPlan> {
  const now = new Date().toISOString();
  const slug = plan.slug || plan.name.toLowerCase().replace(/\s+/g, '-');

  if (plan.subscriptionPlanId) {
    await query(
      `UPDATE "subscriptionPlan" SET
        "name" = $1, "slug" = $2, "description" = $3, "billingInterval" = $4,
        "billingIntervalCount" = $5, "price" = $6, "compareAtPrice" = $7,
        "currency" = $8, "setupFee" = $9, "trialDays" = $10, "contractLength" = $11,
        "isContractRequired" = $12, "discountPercent" = $13, "discountAmount" = $14,
        "freeShippingThreshold" = $15, "includesFreeShipping" = $16,
        "includedProducts" = $17, "features" = $18, "metadata" = $19,
        "sortOrder" = $20, "isPopular" = $21, "isActive" = $22, "updatedAt" = $23
      WHERE "subscriptionPlanId" = $24`,
      [
        plan.name, slug, plan.description, plan.billingInterval || 'month',
        plan.billingIntervalCount || 1, plan.price, plan.compareAtPrice,
        plan.currency || 'USD', plan.setupFee || 0, plan.trialDays,
        plan.contractLength, plan.isContractRequired || false,
        plan.discountPercent || 0, plan.discountAmount || 0,
        plan.freeShippingThreshold, plan.includesFreeShipping || false,
        plan.includedProducts ? JSON.stringify(plan.includedProducts) : null,
        plan.features ? JSON.stringify(plan.features) : null,
        plan.metadata ? JSON.stringify(plan.metadata) : null,
        plan.sortOrder || 0, plan.isPopular || false, plan.isActive !== false,
        now, plan.subscriptionPlanId
      ]
    );
    return (await getSubscriptionPlan(plan.subscriptionPlanId))!;
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "subscriptionPlan" (
        "subscriptionProductId", "name", "slug", "description", "billingInterval",
        "billingIntervalCount", "price", "compareAtPrice", "currency", "setupFee",
        "trialDays", "contractLength", "isContractRequired", "discountPercent",
        "discountAmount", "freeShippingThreshold", "includesFreeShipping",
        "includedProducts", "features", "metadata", "sortOrder", "isPopular",
        "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING *`,
      [
        plan.subscriptionProductId, plan.name, slug, plan.description,
        plan.billingInterval || 'month', plan.billingIntervalCount || 1,
        plan.price, plan.compareAtPrice, plan.currency || 'USD',
        plan.setupFee || 0, plan.trialDays, plan.contractLength,
        plan.isContractRequired || false, plan.discountPercent || 0,
        plan.discountAmount || 0, plan.freeShippingThreshold,
        plan.includesFreeShipping || false,
        plan.includedProducts ? JSON.stringify(plan.includedProducts) : null,
        plan.features ? JSON.stringify(plan.features) : null,
        plan.metadata ? JSON.stringify(plan.metadata) : null,
        plan.sortOrder || 0, plan.isPopular || false, true, now, now
      ]
    );
    return mapToSubscriptionPlan(result!);
  }
}

export async function deleteSubscriptionPlan(subscriptionPlanId: string): Promise<void> {
  await query(
    'UPDATE "subscriptionPlan" SET "isActive" = false, "updatedAt" = $1 WHERE "subscriptionPlanId" = $2',
    [new Date().toISOString(), subscriptionPlanId]
  );
}

// ============================================================================
// Customer Subscriptions
// ============================================================================

export async function getCustomerSubscription(customerSubscriptionId: string): Promise<CustomerSubscription | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "customerSubscription" WHERE "customerSubscriptionId" = $1',
    [customerSubscriptionId]
  );
  return row ? mapToCustomerSubscription(row) : null;
}

export async function getCustomerSubscriptionByNumber(subscriptionNumber: string): Promise<CustomerSubscription | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "customerSubscription" WHERE "subscriptionNumber" = $1',
    [subscriptionNumber]
  );
  return row ? mapToCustomerSubscription(row) : null;
}

export async function getCustomerSubscriptions(
  filters?: { customerId?: string; status?: SubscriptionStatus },
  pagination?: { limit?: number; offset?: number }
): Promise<{ data: CustomerSubscription[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];
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
    params
  );

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "customerSubscription" WHERE ${whereClause} 
     ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    data: (rows || []).map(mapToCustomerSubscription),
    total: parseInt(countResult?.count || '0')
  };
}

export async function getSubscriptionsDueBilling(beforeDate: Date): Promise<CustomerSubscription[]> {
  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "customerSubscription" 
     WHERE "status" IN ('active', 'trialing') 
     AND "nextBillingAt" <= $1 
     ORDER BY "nextBillingAt" ASC`,
    [beforeDate.toISOString()]
  );
  return (rows || []).map(mapToCustomerSubscription);
}

export async function createCustomerSubscription(subscription: {
  customerId: string;
  subscriptionPlanId: string;
  subscriptionProductId?: string;
  productVariantId?: string;
  quantity?: number;
  shippingAddressId?: string;
  billingAddressId?: string;
  paymentMethodId?: string;
  customizations?: Record<string, any>;
}): Promise<CustomerSubscription> {
  const now = new Date();
  const plan = await getSubscriptionPlan(subscription.subscriptionPlanId);
  if (!plan) throw new Error('Subscription plan not found');

  const subscriptionNumber = await generateSubscriptionNumber();
  const quantity = subscription.quantity || 1;
  const unitPrice = plan.price;
  const discountAmount = plan.discountAmount || (unitPrice * (plan.discountPercent || 0) / 100);
  const totalPrice = (unitPrice * quantity) - discountAmount;

  // Calculate trial and billing dates
  const trialDays = plan.trialDays || 0;
  const trialStartAt = trialDays > 0 ? now : null;
  const trialEndAt = trialDays > 0 ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null;
  const currentPeriodStart = trialEndAt || now;
  const currentPeriodEnd = calculateNextBillingDate(currentPeriodStart, plan.billingInterval, plan.billingIntervalCount);
  const nextBillingAt = trialEndAt || currentPeriodEnd;

  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "customerSubscription" (
      "subscriptionNumber", "customerId", "subscriptionPlanId", "subscriptionProductId",
      "productVariantId", "status", "quantity", "unitPrice", "discountAmount",
      "taxAmount", "totalPrice", "currency", "billingInterval", "billingIntervalCount",
      "trialStartAt", "trialEndAt", "currentPeriodStart", "currentPeriodEnd",
      "nextBillingAt", "contractCyclesRemaining", "shippingAddressId", "billingAddressId",
      "paymentMethodId", "customizations", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
    RETURNING *`,
    [
      subscriptionNumber, subscription.customerId, subscription.subscriptionPlanId,
      subscription.subscriptionProductId, subscription.productVariantId,
      trialDays > 0 ? 'trialing' : 'active', quantity, unitPrice, discountAmount,
      0, totalPrice, plan.currency, plan.billingInterval, plan.billingIntervalCount,
      trialStartAt?.toISOString(), trialEndAt?.toISOString(),
      currentPeriodStart.toISOString(), currentPeriodEnd.toISOString(),
      nextBillingAt.toISOString(), plan.contractLength,
      subscription.shippingAddressId, subscription.billingAddressId,
      subscription.paymentMethodId,
      subscription.customizations ? JSON.stringify(subscription.customizations) : null,
      now.toISOString(), now.toISOString()
    ]
  );

  return mapToCustomerSubscription(result!);
}

export async function updateSubscriptionStatus(
  customerSubscriptionId: string,
  status: SubscriptionStatus,
  additionalFields?: Partial<CustomerSubscription>
): Promise<void> {
  const now = new Date().toISOString();
  let setClause = '"status" = $1, "updatedAt" = $2';
  const params: any[] = [status, now];
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
  await query(
    `UPDATE "customerSubscription" SET ${setClause} WHERE "customerSubscriptionId" = $${paramIndex}`,
    params
  );
}

export async function cancelSubscription(
  customerSubscriptionId: string,
  reason?: string,
  cancelledBy?: string,
  cancelAtPeriodEnd: boolean = true
): Promise<void> {
  const now = new Date().toISOString();
  
  if (cancelAtPeriodEnd) {
    await query(
      `UPDATE "customerSubscription" SET 
        "cancelAtPeriodEnd" = true, "cancellationReason" = $1, "cancelledBy" = $2, "updatedAt" = $3
       WHERE "customerSubscriptionId" = $4`,
      [reason, cancelledBy, now, customerSubscriptionId]
    );
  } else {
    await query(
      `UPDATE "customerSubscription" SET 
        "status" = 'cancelled', "cancelledAt" = $1, "cancellationReason" = $2, 
        "cancelledBy" = $3, "updatedAt" = $1
       WHERE "customerSubscriptionId" = $4`,
      [now, reason, cancelledBy, customerSubscriptionId]
    );
  }
}

export async function pauseSubscription(
  customerSubscriptionId: string,
  resumeAt?: Date,
  reason?: string,
  pausedBy?: string
): Promise<SubscriptionPause> {
  const now = new Date();
  
  // Update subscription status
  await query(
    `UPDATE "customerSubscription" SET 
      "status" = 'paused', "pausedAt" = $1, "resumeAt" = $2, "pauseReason" = $3,
      "pauseCount" = "pauseCount" + 1, "updatedAt" = $1
     WHERE "customerSubscriptionId" = $4`,
    [now.toISOString(), resumeAt?.toISOString(), reason, customerSubscriptionId]
  );

  // Create pause record
  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "subscriptionPause" (
      "customerSubscriptionId", "status", "pausedAt", "scheduledResumeAt",
      "reason", "pausedBy", "createdAt", "updatedAt"
    ) VALUES ($1, 'active', $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      customerSubscriptionId, now.toISOString(), resumeAt?.toISOString(),
      reason, pausedBy, now.toISOString(), now.toISOString()
    ]
  );

  return mapToSubscriptionPause(result!);
}

export async function resumeSubscription(
  customerSubscriptionId: string,
  resumedBy?: string
): Promise<void> {
  const now = new Date();
  const subscription = await getCustomerSubscription(customerSubscriptionId);
  if (!subscription) throw new Error('Subscription not found');

  // Calculate new billing period
  const plan = await getSubscriptionPlan(subscription.subscriptionPlanId);
  const nextBillingAt = calculateNextBillingDate(now, subscription.billingInterval, subscription.billingIntervalCount);

  await query(
    `UPDATE "customerSubscription" SET 
      "status" = 'active', "pausedAt" = NULL, "resumeAt" = NULL, "pauseReason" = NULL,
      "currentPeriodStart" = $1, "currentPeriodEnd" = $2, "nextBillingAt" = $2, "updatedAt" = $1
     WHERE "customerSubscriptionId" = $3`,
    [now.toISOString(), nextBillingAt.toISOString(), customerSubscriptionId]
  );

  // Update pause record
  await query(
    `UPDATE "subscriptionPause" SET 
      "status" = 'resumed', "actualResumeAt" = $1, "resumedBy" = $2, "updatedAt" = $1
     WHERE "customerSubscriptionId" = $3 AND "status" = 'active'`,
    [now.toISOString(), resumedBy, customerSubscriptionId]
  );
}

export async function advanceBillingCycle(customerSubscriptionId: string): Promise<void> {
  const now = new Date();
  const subscription = await getCustomerSubscription(customerSubscriptionId);
  if (!subscription) throw new Error('Subscription not found');

  const newPeriodStart = subscription.currentPeriodEnd || now;
  const newPeriodEnd = calculateNextBillingDate(newPeriodStart, subscription.billingInterval, subscription.billingIntervalCount);

  await query(
    `UPDATE "customerSubscription" SET 
      "currentPeriodStart" = $1, "currentPeriodEnd" = $2, "nextBillingAt" = $2,
      "billingCycleCount" = "billingCycleCount" + 1, "lastPaymentAt" = $3, "updatedAt" = $3
     WHERE "customerSubscriptionId" = $4`,
    [newPeriodStart.toISOString(), newPeriodEnd.toISOString(), now.toISOString(), customerSubscriptionId]
  );
}

// ============================================================================
// Subscription Orders
// ============================================================================

export async function getSubscriptionOrder(subscriptionOrderId: string): Promise<SubscriptionOrder | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "subscriptionOrder" WHERE "subscriptionOrderId" = $1',
    [subscriptionOrderId]
  );
  return row ? mapToSubscriptionOrder(row) : null;
}

export async function getSubscriptionOrders(customerSubscriptionId: string): Promise<SubscriptionOrder[]> {
  const rows = await query<Record<string, any>[]>(
    'SELECT * FROM "subscriptionOrder" WHERE "customerSubscriptionId" = $1 ORDER BY "billingCycleNumber" DESC',
    [customerSubscriptionId]
  );
  return (rows || []).map(mapToSubscriptionOrder);
}

export async function createSubscriptionOrder(order: {
  customerSubscriptionId: string;
  billingCycleNumber: number;
  periodStart: Date;
  periodEnd: Date;
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  shippingAmount?: number;
  scheduledAt?: Date;
}): Promise<SubscriptionOrder> {
  const now = new Date().toISOString();
  const totalAmount = order.subtotal - (order.discountAmount || 0) + (order.taxAmount || 0) + (order.shippingAmount || 0);

  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "subscriptionOrder" (
      "customerSubscriptionId", "billingCycleNumber", "periodStart", "periodEnd",
      "status", "subtotal", "discountAmount", "taxAmount", "shippingAmount",
      "totalAmount", "scheduledAt", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      order.customerSubscriptionId, order.billingCycleNumber,
      order.periodStart.toISOString(), order.periodEnd.toISOString(),
      order.subtotal, order.discountAmount || 0, order.taxAmount || 0,
      order.shippingAmount || 0, totalAmount, order.scheduledAt?.toISOString(),
      now, now
    ]
  );

  return mapToSubscriptionOrder(result!);
}

export async function updateSubscriptionOrderStatus(
  subscriptionOrderId: string,
  status: SubscriptionOrderStatus,
  additionalFields?: { orderId?: string; failureReason?: string; paymentIntentId?: string }
): Promise<void> {
  const now = new Date().toISOString();
  let setClause = '"status" = $1, "updatedAt" = $2';
  const params: any[] = [status, now];
  let paramIndex = 3;

  if (status === 'paid') {
    setClause += `, "paidAt" = $${paramIndex++}`;
    params.push(now);
  }
  if (status === 'failed') {
    setClause += `, "failedAt" = $${paramIndex++}, "retryCount" = "retryCount" + 1`;
    params.push(now);
  }
  if (status === 'processing') {
    setClause += `, "processedAt" = $${paramIndex++}`;
    params.push(now);
  }
  if (additionalFields?.orderId) {
    setClause += `, "orderId" = $${paramIndex++}`;
    params.push(additionalFields.orderId);
  }
  if (additionalFields?.failureReason) {
    setClause += `, "failureReason" = $${paramIndex++}`;
    params.push(additionalFields.failureReason);
  }
  if (additionalFields?.paymentIntentId) {
    setClause += `, "paymentIntentId" = $${paramIndex++}`;
    params.push(additionalFields.paymentIntentId);
  }

  params.push(subscriptionOrderId);
  await query(
    `UPDATE "subscriptionOrder" SET ${setClause} WHERE "subscriptionOrderId" = $${paramIndex}`,
    params
  );
}

// ============================================================================
// Dunning
// ============================================================================

export async function createDunningAttempt(attempt: {
  customerSubscriptionId: string;
  subscriptionOrderId?: string;
  attemptNumber: number;
  amount: number;
  currency?: string;
  scheduledAt: Date;
}): Promise<DunningAttempt> {
  const now = new Date().toISOString();

  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "dunningAttempt" (
      "customerSubscriptionId", "subscriptionOrderId", "attemptNumber",
      "status", "amount", "currency", "scheduledAt", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      attempt.customerSubscriptionId, attempt.subscriptionOrderId,
      attempt.attemptNumber, attempt.amount, attempt.currency || 'USD',
      attempt.scheduledAt.toISOString(), now, now
    ]
  );

  return mapToDunningAttempt(result!);
}

export async function getDunningAttempts(customerSubscriptionId: string): Promise<DunningAttempt[]> {
  const rows = await query<Record<string, any>[]>(
    'SELECT * FROM "dunningAttempt" WHERE "customerSubscriptionId" = $1 ORDER BY "attemptNumber" ASC',
    [customerSubscriptionId]
  );
  return (rows || []).map(mapToDunningAttempt);
}

export async function getPendingDunningAttempts(beforeDate: Date): Promise<DunningAttempt[]> {
  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "dunningAttempt" 
     WHERE "status" = 'pending' AND "scheduledAt" <= $1 
     ORDER BY "scheduledAt" ASC`,
    [beforeDate.toISOString()]
  );
  return (rows || []).map(mapToDunningAttempt);
}

export async function updateDunningAttempt(
  dunningAttemptId: string,
  status: DunningStatus,
  additionalFields?: Partial<DunningAttempt>
): Promise<void> {
  const now = new Date().toISOString();
  let setClause = '"status" = $1, "updatedAt" = $2';
  const params: any[] = [status, now];
  let paramIndex = 3;

  if (status !== 'pending') {
    setClause += `, "attemptedAt" = $${paramIndex++}`;
    params.push(now);
  }
  if (additionalFields?.failureCode) {
    setClause += `, "failureCode" = $${paramIndex++}`;
    params.push(additionalFields.failureCode);
  }
  if (additionalFields?.failureMessage) {
    setClause += `, "failureMessage" = $${paramIndex++}`;
    params.push(additionalFields.failureMessage);
  }
  if (additionalFields?.paymentIntentId) {
    setClause += `, "paymentIntentId" = $${paramIndex++}`;
    params.push(additionalFields.paymentIntentId);
  }

  params.push(dunningAttemptId);
  await query(
    `UPDATE "dunningAttempt" SET ${setClause} WHERE "dunningAttemptId" = $${paramIndex}`,
    params
  );
}

// ============================================================================
// Helpers
// ============================================================================

async function generateSubscriptionNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "customerSubscription" WHERE "subscriptionNumber" LIKE $1`,
    [`SUB${year}%`]
  );
  const count = parseInt(result?.count || '0') + 1;
  return `SUB${year}-${count.toString().padStart(6, '0')}`;
}

function calculateNextBillingDate(from: Date, interval: BillingInterval, count: number): Date {
  const date = new Date(from);
  switch (interval) {
    case 'day':
      date.setDate(date.getDate() + count);
      break;
    case 'week':
      date.setDate(date.getDate() + (count * 7));
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

function mapToSubscriptionProduct(row: Record<string, any>): SubscriptionProduct {
  return {
    subscriptionProductId: row.subscriptionProductId,
    productId: row.productId,
    isSubscriptionOnly: Boolean(row.isSubscriptionOnly),
    allowOneTimePurchase: Boolean(row.allowOneTimePurchase),
    minSubscriptionLength: row.minSubscriptionLength ? parseInt(row.minSubscriptionLength) : undefined,
    maxSubscriptionLength: row.maxSubscriptionLength ? parseInt(row.maxSubscriptionLength) : undefined,
    trialDays: parseInt(row.trialDays) || 0,
    trialRequiresPayment: Boolean(row.trialRequiresPayment),
    billingAnchor: row.billingAnchor,
    billingAnchorDay: row.billingAnchorDay ? parseInt(row.billingAnchorDay) : undefined,
    prorateOnChange: Boolean(row.prorateOnChange),
    allowPause: Boolean(row.allowPause),
    maxPauseDays: row.maxPauseDays ? parseInt(row.maxPauseDays) : undefined,
    maxPausesPerYear: row.maxPausesPerYear ? parseInt(row.maxPausesPerYear) : undefined,
    allowSkip: Boolean(row.allowSkip),
    maxSkipsPerYear: row.maxSkipsPerYear ? parseInt(row.maxSkipsPerYear) : undefined,
    allowEarlyCancel: Boolean(row.allowEarlyCancel),
    cancelNoticeDays: parseInt(row.cancelNoticeDays) || 0,
    earlyTerminationFee: row.earlyTerminationFee ? parseFloat(row.earlyTerminationFee) : undefined,
    autoRenew: Boolean(row.autoRenew),
    renewalReminderDays: parseInt(row.renewalReminderDays) || 7,
    metadata: row.metadata,
    isActive: Boolean(row.isActive),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToSubscriptionPlan(row: Record<string, any>): SubscriptionPlan {
  return {
    subscriptionPlanId: row.subscriptionPlanId,
    subscriptionProductId: row.subscriptionProductId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    billingInterval: row.billingInterval,
    billingIntervalCount: parseInt(row.billingIntervalCount) || 1,
    price: parseFloat(row.price) || 0,
    compareAtPrice: row.compareAtPrice ? parseFloat(row.compareAtPrice) : undefined,
    currency: row.currency || 'USD',
    setupFee: parseFloat(row.setupFee) || 0,
    trialDays: row.trialDays ? parseInt(row.trialDays) : undefined,
    contractLength: row.contractLength ? parseInt(row.contractLength) : undefined,
    isContractRequired: Boolean(row.isContractRequired),
    discountPercent: parseFloat(row.discountPercent) || 0,
    discountAmount: parseFloat(row.discountAmount) || 0,
    freeShippingThreshold: row.freeShippingThreshold ? parseInt(row.freeShippingThreshold) : undefined,
    includesFreeShipping: Boolean(row.includesFreeShipping),
    includedProducts: row.includedProducts,
    features: row.features,
    metadata: row.metadata,
    sortOrder: parseInt(row.sortOrder) || 0,
    isPopular: Boolean(row.isPopular),
    isActive: Boolean(row.isActive),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToCustomerSubscription(row: Record<string, any>): CustomerSubscription {
  return {
    customerSubscriptionId: row.customerSubscriptionId,
    subscriptionNumber: row.subscriptionNumber,
    customerId: row.customerId,
    subscriptionPlanId: row.subscriptionPlanId,
    subscriptionProductId: row.subscriptionProductId,
    productVariantId: row.productVariantId,
    status: row.status,
    quantity: parseInt(row.quantity) || 1,
    unitPrice: parseFloat(row.unitPrice) || 0,
    discountAmount: parseFloat(row.discountAmount) || 0,
    taxAmount: parseFloat(row.taxAmount) || 0,
    totalPrice: parseFloat(row.totalPrice) || 0,
    currency: row.currency || 'USD',
    billingInterval: row.billingInterval,
    billingIntervalCount: parseInt(row.billingIntervalCount) || 1,
    trialStartAt: row.trialStartAt ? new Date(row.trialStartAt) : undefined,
    trialEndAt: row.trialEndAt ? new Date(row.trialEndAt) : undefined,
    currentPeriodStart: row.currentPeriodStart ? new Date(row.currentPeriodStart) : undefined,
    currentPeriodEnd: row.currentPeriodEnd ? new Date(row.currentPeriodEnd) : undefined,
    nextBillingAt: row.nextBillingAt ? new Date(row.nextBillingAt) : undefined,
    cancelledAt: row.cancelledAt ? new Date(row.cancelledAt) : undefined,
    cancellationReason: row.cancellationReason,
    cancelledBy: row.cancelledBy,
    cancelAtPeriodEnd: Boolean(row.cancelAtPeriodEnd),
    pausedAt: row.pausedAt ? new Date(row.pausedAt) : undefined,
    resumeAt: row.resumeAt ? new Date(row.resumeAt) : undefined,
    pauseReason: row.pauseReason,
    pauseCount: parseInt(row.pauseCount) || 0,
    skipCount: parseInt(row.skipCount) || 0,
    billingCycleCount: parseInt(row.billingCycleCount) || 0,
    contractCyclesRemaining: row.contractCyclesRemaining ? parseInt(row.contractCyclesRemaining) : undefined,
    shippingAddressId: row.shippingAddressId,
    billingAddressId: row.billingAddressId,
    paymentMethodId: row.paymentMethodId,
    externalSubscriptionId: row.externalSubscriptionId,
    lifetimeValue: parseFloat(row.lifetimeValue) || 0,
    failedPaymentCount: parseInt(row.failedPaymentCount) || 0,
    lastPaymentAt: row.lastPaymentAt ? new Date(row.lastPaymentAt) : undefined,
    lastPaymentFailedAt: row.lastPaymentFailedAt ? new Date(row.lastPaymentFailedAt) : undefined,
    customizations: row.customizations,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToSubscriptionOrder(row: Record<string, any>): SubscriptionOrder {
  return {
    subscriptionOrderId: row.subscriptionOrderId,
    customerSubscriptionId: row.customerSubscriptionId,
    orderId: row.orderId,
    billingCycleNumber: parseInt(row.billingCycleNumber) || 1,
    periodStart: new Date(row.periodStart),
    periodEnd: new Date(row.periodEnd),
    status: row.status,
    subtotal: parseFloat(row.subtotal) || 0,
    discountAmount: parseFloat(row.discountAmount) || 0,
    taxAmount: parseFloat(row.taxAmount) || 0,
    shippingAmount: parseFloat(row.shippingAmount) || 0,
    totalAmount: parseFloat(row.totalAmount) || 0,
    currency: row.currency || 'USD',
    scheduledAt: row.scheduledAt ? new Date(row.scheduledAt) : undefined,
    processedAt: row.processedAt ? new Date(row.processedAt) : undefined,
    paidAt: row.paidAt ? new Date(row.paidAt) : undefined,
    failedAt: row.failedAt ? new Date(row.failedAt) : undefined,
    failureReason: row.failureReason,
    retryCount: parseInt(row.retryCount) || 0,
    nextRetryAt: row.nextRetryAt ? new Date(row.nextRetryAt) : undefined,
    paymentIntentId: row.paymentIntentId,
    invoiceId: row.invoiceId,
    isProrated: Boolean(row.isProrated),
    lineItems: row.lineItems,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToSubscriptionPause(row: Record<string, any>): SubscriptionPause {
  return {
    subscriptionPauseId: row.subscriptionPauseId,
    customerSubscriptionId: row.customerSubscriptionId,
    status: row.status,
    pausedAt: new Date(row.pausedAt),
    scheduledResumeAt: row.scheduledResumeAt ? new Date(row.scheduledResumeAt) : undefined,
    actualResumeAt: row.actualResumeAt ? new Date(row.actualResumeAt) : undefined,
    reason: row.reason,
    customerNote: row.customerNote,
    pausedBy: row.pausedBy,
    resumedBy: row.resumedBy,
    pauseDays: row.pauseDays ? parseInt(row.pauseDays) : undefined,
    billingCyclesSkipped: parseInt(row.billingCyclesSkipped) || 0,
    creditAmount: parseFloat(row.creditAmount) || 0,
    creditApplied: Boolean(row.creditApplied),
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToDunningAttempt(row: Record<string, any>): DunningAttempt {
  return {
    dunningAttemptId: row.dunningAttemptId,
    customerSubscriptionId: row.customerSubscriptionId,
    subscriptionOrderId: row.subscriptionOrderId,
    attemptNumber: parseInt(row.attemptNumber) || 1,
    status: row.status,
    amount: parseFloat(row.amount) || 0,
    currency: row.currency || 'USD',
    scheduledAt: new Date(row.scheduledAt),
    attemptedAt: row.attemptedAt ? new Date(row.attemptedAt) : undefined,
    paymentMethodId: row.paymentMethodId,
    paymentIntentId: row.paymentIntentId,
    failureCode: row.failureCode,
    failureMessage: row.failureMessage,
    emailSent: Boolean(row.emailSent),
    emailSentAt: row.emailSentAt ? new Date(row.emailSentAt) : undefined,
    emailType: row.emailType,
    smsSent: Boolean(row.smsSent),
    smsSentAt: row.smsSentAt ? new Date(row.smsSentAt) : undefined,
    action: row.action,
    actionTakenBy: row.actionTakenBy,
    actionTakenAt: row.actionTakenAt ? new Date(row.actionTakenAt) : undefined,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}
