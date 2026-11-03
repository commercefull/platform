/**
 * Subscription order queries — extracted from subscriptionRepo.
 */

import { query, queryOne } from '../../../../libs/db';
import type { SubscriptionOrder, SubscriptionOrderStatus } from './subscriptionTypes';
import { mapToSubscriptionOrder } from './subscriptionHelpers';
import type { SubscriptionOrder as DbSubscriptionOrder } from '../../../../libs/db/types';

export async function getSubscriptionOrder(subscriptionOrderId: string): Promise<SubscriptionOrder | null> {
  const row = await queryOne<DbSubscriptionOrder>('SELECT * FROM "subscriptionOrder" WHERE "subscriptionOrderId" = $1', [
    subscriptionOrderId,
  ]);
  return row ? mapToSubscriptionOrder(row) : null;
}

export async function getSubscriptionOrders(customerSubscriptionId: string): Promise<SubscriptionOrder[]> {
  const rows = await query<DbSubscriptionOrder[]>('SELECT * FROM "subscriptionOrder" WHERE "customerSubscriptionId" = $1 ORDER BY "billingCycleNumber" DESC',
    [customerSubscriptionId],
  );
  return (rows || []).map(mapToSubscriptionOrder);
}

export async function getSubscriptionOrdersPending(): Promise<SubscriptionOrder[]> {
  const rows = await query<DbSubscriptionOrder[]>(`SELECT * FROM "subscriptionOrder" 
     WHERE "status" = 'pending' 
     ORDER BY "scheduledAt" ASC`,
  );
  return (rows || []).map(mapToSubscriptionOrder);
}

export async function getFailedSubscriptionPayments(): Promise<SubscriptionOrder[]> {
  const rows = await query<DbSubscriptionOrder[]>(`SELECT * FROM "subscriptionOrder" 
     WHERE "status" = 'failed' 
     ORDER BY "failedAt" DESC 
     LIMIT 100`,
  );
  return (rows || []).map(mapToSubscriptionOrder);
}

export async function createSubscriptionOrder(order: {
  customerSubscriptionId: string;
  billingCycleNumber: number;
  periodStart: Date;
  periodEnd: Date;
  subtotalCents: number;
  discountAmountCents?: number;
  taxAmountCents?: number;
  shippingAmountCents?: number;
  scheduledAt?: Date;
}): Promise<SubscriptionOrder> {
  const now = new Date().toISOString();
  const totalAmountCents =
    order.subtotalCents - (order.discountAmountCents || 0) + (order.taxAmountCents || 0) + (order.shippingAmountCents || 0);

  const result = await queryOne<DbSubscriptionOrder>(
    `INSERT INTO "subscriptionOrder" (
      "customerSubscriptionId", "billingCycleNumber", "periodStart", "periodEnd",
      "status", "subtotalCents", "discountAmountCents", "taxAmountCents", "shippingAmountCents",
      "totalAmountCents", "scheduledAt", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      order.customerSubscriptionId,
      order.billingCycleNumber,
      order.periodStart.toISOString(),
      order.periodEnd.toISOString(),
      order.subtotalCents,
      order.discountAmountCents || 0,
      order.taxAmountCents || 0,
      order.shippingAmountCents || 0,
      totalAmountCents,
      order.scheduledAt?.toISOString(),
      now,
      now,
    ],
  );

  return mapToSubscriptionOrder(result!);
}

export async function updateSubscriptionOrderStatus(
  subscriptionOrderId: string,
  status: SubscriptionOrderStatus,
  additionalFields?: { orderId?: string; failureReason?: string; paymentIntentId?: string },
): Promise<void> {
  const now = new Date().toISOString();
  let setClause = '"status" = $1, "updatedAt" = $2';
  const params: unknown[] = [status, now];
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
  await query(`UPDATE "subscriptionOrder" SET ${setClause} WHERE "subscriptionOrderId" = $${paramIndex}`, params);
}

