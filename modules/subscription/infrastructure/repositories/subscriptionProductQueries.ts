/**
 * Subscription product queries — extracted from subscriptionRepo.
 */

import { query, queryOne } from '../../../../libs/db';
import type { SubscriptionProduct } from './subscriptionTypes';
import { mapToSubscriptionProduct } from './subscriptionHelpers';
import type { SubscriptionProduct as DbSubscriptionProduct } from '../../../../libs/db/types';

export async function getSubscriptionProduct(subscriptionProductId: string): Promise<SubscriptionProduct | null> {
  const row = await queryOne<Record<string, unknown>>('SELECT * FROM "subscriptionProduct" WHERE "subscriptionProductId" = $1', [
    subscriptionProductId,
  ]);
  return row ? mapToSubscriptionProduct(row) : null;
}

export async function getSubscriptionProductByProductId(productId: string): Promise<SubscriptionProduct | null> {
  const row = await queryOne<Record<string, unknown>>('SELECT * FROM "subscriptionProduct" WHERE "productId" = $1', [productId]);
  return row ? mapToSubscriptionProduct(row) : null;
}

export async function getSubscriptionProducts(activeOnly: boolean = true): Promise<SubscriptionProduct[]> {
  let whereClause = '1=1';
  if (activeOnly) {
    whereClause = '"isActive" = true';
  }

  const rows = await query<DbSubscriptionProduct[]>(`SELECT * FROM "subscriptionProduct" WHERE ${whereClause} ORDER BY "createdAt" DESC`);
  return (rows || []).map(mapToSubscriptionProduct);
}

export async function saveSubscriptionProduct(product: Partial<SubscriptionProduct> & { productId: string }): Promise<SubscriptionProduct> {
  if (product.subscriptionProductId) {
    await updateSubscriptionProduct({ ...product, subscriptionProductId: product.subscriptionProductId });
    return (await getSubscriptionProduct(product.subscriptionProductId))!;
  }
  const result = await insertSubscriptionProduct(product);
  return mapToSubscriptionProduct(result!);
}

function subscriptionProductRowValues(product: Partial<SubscriptionProduct>) {
  return {
    isSubscriptionOnly: product.isSubscriptionOnly || false,
    allowOneTimePurchase: product.allowOneTimePurchase !== false,
    minSubscriptionLength: product.minSubscriptionLength,
    maxSubscriptionLength: product.maxSubscriptionLength,
    trialDays: product.trialDays || 0,
    trialRequiresPayment: product.trialRequiresPayment || false,
    billingAnchor: product.billingAnchor || 'subscription_start',
    billingAnchorDay: product.billingAnchorDay,
    prorateOnChange: product.prorateOnChange !== false,
    allowPause: product.allowPause !== false,
    maxPauseDays: product.maxPauseDays,
    maxPausesPerYear: product.maxPausesPerYear,
    allowSkip: product.allowSkip !== false,
    maxSkipsPerYear: product.maxSkipsPerYear,
    allowEarlyCancel: product.allowEarlyCancel !== false,
    cancelNoticeDays: product.cancelNoticeDays || 0,
    earlyTerminationFeeCents: product.earlyTerminationFeeCents,
    autoRenew: product.autoRenew !== false,
    renewalReminderDays: product.renewalReminderDays || 7,
    metadata: product.metadata ? JSON.stringify(product.metadata) : null,
    isActive: product.isActive !== false,
  };
}

async function updateSubscriptionProduct(product: Partial<SubscriptionProduct> & { subscriptionProductId: string }): Promise<void> {
  const now = new Date().toISOString();
  const v = subscriptionProductRowValues(product);
  await query(
    `UPDATE "subscriptionProduct" SET
        "isSubscriptionOnly" = $1, "allowOneTimePurchase" = $2, "minSubscriptionLength" = $3,
        "maxSubscriptionLength" = $4, "trialDays" = $5, "trialRequiresPayment" = $6,
        "billingAnchor" = $7, "billingAnchorDay" = $8, "prorateOnChange" = $9,
        "allowPause" = $10, "maxPauseDays" = $11, "maxPausesPerYear" = $12,
        "allowSkip" = $13, "maxSkipsPerYear" = $14, "allowEarlyCancel" = $15,
        "cancelNoticeDays" = $16, "earlyTerminationFeeCents" = $17, "autoRenew" = $18,
        "renewalReminderDays" = $19, "metadata" = $20, "isActive" = $21, "updatedAt" = $22
      WHERE "subscriptionProductId" = $23`,
    [
      v.isSubscriptionOnly,
      v.allowOneTimePurchase,
      v.minSubscriptionLength,
      v.maxSubscriptionLength,
      v.trialDays,
      v.trialRequiresPayment,
      v.billingAnchor,
      v.billingAnchorDay,
      v.prorateOnChange,
      v.allowPause,
      v.maxPauseDays,
      v.maxPausesPerYear,
      v.allowSkip,
      v.maxSkipsPerYear,
      v.allowEarlyCancel,
      v.cancelNoticeDays,
      v.earlyTerminationFeeCents,
      v.autoRenew,
      v.renewalReminderDays,
      v.metadata,
      v.isActive,
      now,
      product.subscriptionProductId,
    ],
  );
}

async function insertSubscriptionProduct(
  product: Partial<SubscriptionProduct> & { productId: string },
): Promise<Record<string, unknown> | null> {
  const now = new Date().toISOString();
  const v = subscriptionProductRowValues(product);
  return queryOne<Record<string, unknown>>(
    `INSERT INTO "subscriptionProduct" (
        "productId", "isSubscriptionOnly", "allowOneTimePurchase", "minSubscriptionLength",
        "maxSubscriptionLength", "trialDays", "trialRequiresPayment", "billingAnchor",
        "billingAnchorDay", "prorateOnChange", "allowPause", "maxPauseDays",
        "maxPausesPerYear", "allowSkip", "maxSkipsPerYear", "allowEarlyCancel",
        "cancelNoticeDays", "earlyTerminationFeeCents", "autoRenew", "renewalReminderDays",
        "metadata", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *`,
    [
      product.productId,
      v.isSubscriptionOnly,
      v.allowOneTimePurchase,
      v.minSubscriptionLength,
      v.maxSubscriptionLength,
      v.trialDays,
      v.trialRequiresPayment,
      v.billingAnchor,
      v.billingAnchorDay,
      v.prorateOnChange,
      v.allowPause,
      v.maxPauseDays,
      v.maxPausesPerYear,
      v.allowSkip,
      v.maxSkipsPerYear,
      v.allowEarlyCancel,
      v.cancelNoticeDays,
      v.earlyTerminationFeeCents,
      v.autoRenew,
      v.renewalReminderDays,
      v.metadata,
      true,
      now,
      now,
    ],
  );
}

export async function deleteSubscriptionProduct(subscriptionProductId: string): Promise<void> {
  await query('UPDATE "subscriptionProduct" SET "isActive" = false, "updatedAt" = $1 WHERE "subscriptionProductId" = $2', [
    new Date().toISOString(),
    subscriptionProductId,
  ]);
}

