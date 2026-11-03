/**
 * Subscription plan queries — extracted from subscriptionRepo.
 */

import { query, queryOne } from '../../../../libs/db';
import type { SubscriptionPlan } from './subscriptionTypes';
import { mapToSubscriptionPlan } from './subscriptionHelpers';
import type { SubscriptionPlan as DbSubscriptionPlan } from '../../../../libs/db/types';

export async function getSubscriptionPlan(subscriptionPlanId: string): Promise<SubscriptionPlan | null> {
  const row = await queryOne<Record<string, unknown>>('SELECT * FROM "subscriptionPlan" WHERE "subscriptionPlanId" = $1', [
    subscriptionPlanId,
  ]);
  return row ? mapToSubscriptionPlan(row) : null;
}

export async function getSubscriptionPlans(subscriptionProductId: string, activeOnly: boolean = true): Promise<SubscriptionPlan[]> {
  let whereClause = '"subscriptionProductId" = $1';
  if (activeOnly) {
    whereClause += ' AND "isActive" = true';
  }

  const rows = await query<DbSubscriptionPlan[]>(`SELECT * FROM "subscriptionPlan" WHERE ${whereClause} ORDER BY "sortOrder" ASC, "priceCents" ASC`,
    [subscriptionProductId],
  );
  return (rows || []).map(mapToSubscriptionPlan);
}

type SubscriptionPlanInput = Partial<SubscriptionPlan> &
  ({ subscriptionPlanId: string } | { subscriptionProductId: string; name: string; priceCents: number });

export async function saveSubscriptionPlan(plan: SubscriptionPlanInput): Promise<SubscriptionPlan> {
  if (plan.subscriptionPlanId) {
    await updateSubscriptionPlan({ ...plan, subscriptionPlanId: plan.subscriptionPlanId });
    return (await getSubscriptionPlan(plan.subscriptionPlanId))!;
  }
  const result = await insertSubscriptionPlan(plan);
  return mapToSubscriptionPlan(result!);
}

function planSlug(plan: Partial<SubscriptionPlan>): string {
  return plan.slug || plan.name?.toLowerCase().replace(/\s+/g, '-') || '';
}

function planRowValues(plan: Partial<SubscriptionPlan>) {
  return {
    name: plan.name,
    slug: planSlug(plan),
    description: plan.description,
    billingInterval: plan.billingInterval || 'month',
    billingIntervalCount: plan.billingIntervalCount || 1,
    priceCents: plan.priceCents,
    compareAtPriceCents: plan.compareAtPriceCents,
    currencyCode: plan.currency || 'USD',
    setupFeeCents: plan.setupFeeCents || 0,
    trialDays: plan.trialDays,
    contractLength: plan.contractLength,
    isContractRequired: plan.isContractRequired || false,
    discountPercent: plan.discountPercent || 0,
    discountAmountCents: plan.discountAmountCents || 0,
    freeShippingThresholdCents: plan.freeShippingThresholdCents,
    includesFreeShipping: plan.includesFreeShipping || false,
    includedProducts: plan.includedProducts ? JSON.stringify(plan.includedProducts) : null,
    features: plan.features ? JSON.stringify(plan.features) : null,
    metadata: plan.metadata ? JSON.stringify(plan.metadata) : null,
    sortOrder: plan.sortOrder || 0,
    isPopular: plan.isPopular || false,
    isActive: plan.isActive !== false,
  };
}

async function updateSubscriptionPlan(plan: Partial<SubscriptionPlan> & { subscriptionPlanId: string }): Promise<void> {
  const now = new Date().toISOString();
  const v = planRowValues(plan);
  await query(
    `UPDATE "subscriptionPlan" SET
        "name" = COALESCE($1, "name"), "slug" = COALESCE($2, "slug"), "description" = $3,
        "billingInterval" = COALESCE($4, "billingInterval"),
        "billingIntervalCount" = COALESCE($5, "billingIntervalCount"),
        "priceCents" = COALESCE($6, "priceCents"), "compareAtPriceCents" = $7,
        "currencyCode" = COALESCE($8, "currencyCode"), "setupFeeCents" = COALESCE($9, "setupFeeCents"),
        "trialDays" = $10, "contractLength" = $11,
        "isContractRequired" = COALESCE($12, "isContractRequired"),
        "discountPercent" = COALESCE($13, "discountPercent"),
        "discountAmountCents" = COALESCE($14, "discountAmountCents"),
        "freeShippingThresholdCents" = $15,
        "includesFreeShipping" = COALESCE($16, "includesFreeShipping"),
        "includedProducts" = COALESCE($17, "includedProducts"),
        "features" = COALESCE($18, "features"),
        "metadata" = COALESCE($19, "metadata"),
        "sortOrder" = COALESCE($20, "sortOrder"),
        "isPopular" = COALESCE($21, "isPopular"),
        "isActive" = COALESCE($22, "isActive"), "updatedAt" = $23
      WHERE "subscriptionPlanId" = $24`,
    [
      v.name,
      v.slug,
      v.description,
      v.billingInterval,
      v.billingIntervalCount,
      v.priceCents,
      v.compareAtPriceCents,
      v.currencyCode,
      v.setupFeeCents,
      v.trialDays,
      v.contractLength,
      v.isContractRequired,
      v.discountPercent,
      v.discountAmountCents,
      v.freeShippingThresholdCents,
      v.includesFreeShipping,
      v.includedProducts,
      v.features,
      v.metadata,
      v.sortOrder,
      v.isPopular,
      v.isActive,
      now,
      plan.subscriptionPlanId,
    ],
  );
}

async function insertSubscriptionPlan(plan: SubscriptionPlanInput): Promise<Record<string, unknown> | null> {
  const now = new Date().toISOString();
  const v = planRowValues(plan);
  return queryOne<Record<string, unknown>>(
    `INSERT INTO "subscriptionPlan" (
        "subscriptionProductId", "name", "slug", "description", "billingInterval",
        "billingIntervalCount", "priceCents", "compareAtPriceCents", "currencyCode", "setupFeeCents",
        "trialDays", "contractLength", "isContractRequired", "discountPercent",
        "discountAmountCents", "freeShippingThresholdCents", "includesFreeShipping",
        "includedProducts", "features", "metadata", "sortOrder", "isPopular",
        "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING *`,
    [
      plan.subscriptionProductId,
      v.name,
      v.slug,
      v.description,
      v.billingInterval,
      v.billingIntervalCount,
      v.priceCents,
      v.compareAtPriceCents,
      v.currencyCode,
      v.setupFeeCents,
      v.trialDays,
      v.contractLength,
      v.isContractRequired,
      v.discountPercent,
      v.discountAmountCents,
      v.freeShippingThresholdCents,
      v.includesFreeShipping,
      v.includedProducts,
      v.features,
      v.metadata,
      v.sortOrder,
      v.isPopular,
      true,
      now,
      now,
    ],
  );
}

export async function deleteSubscriptionPlan(subscriptionPlanId: string): Promise<void> {
  await query('UPDATE "subscriptionPlan" SET "isActive" = false, "updatedAt" = $1 WHERE "subscriptionPlanId" = $2', [
    new Date().toISOString(),
    subscriptionPlanId,
  ]);
}

