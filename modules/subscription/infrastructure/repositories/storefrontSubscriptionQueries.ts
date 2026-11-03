/**
 * Storefront subscription queries — extracted from subscriptionRepo.
 */

import { query, queryOne } from '../../../../libs/db';
import type {
  CustomerSubscription as DbCustomerSubscription,
  SubscriptionOrder as DbSubscriptionOrder,
  SubscriptionPlan as DbSubscriptionPlan,
} from '../../../../libs/db/types';

type PlanWithProductRow = DbSubscriptionPlan & {
  productName: string | null;
  productDescription: string | null;
};
type SubscriptionWithPlanRow = DbCustomerSubscription & {
  planName: string | null;
  billingInterval: string | null;
  priceCents: number | null;
  currencyCode: string | null;
};
type SubscriptionWithPlanDetailRow = SubscriptionWithPlanRow & {
  features: unknown | null;
  planDescription: string | null;
};

export async function findActivePlansWithProduct(): Promise<unknown[]> {
  const results = await query<PlanWithProductRow[]>(
    `SELECT sp.*, p."name" as "productName", p."description" as "productDescription"
     FROM "subscriptionPlan" sp
     LEFT JOIN "subscriptionProduct" sprod ON sp."subscriptionProductId" = sprod."subscriptionProductId"
     LEFT JOIN "product" p ON sprod."productId" = p."productId"
     WHERE sp."isActive" = true
     ORDER BY sp."sortOrder", sp."priceCents" ASC`,
    [],
  );
  return results || [];
}

export async function findByCustomerIdWithPlan(customerId: string): Promise<unknown[]> {
  const results = await query<SubscriptionWithPlanRow[]>(
    `SELECT cs.*, sp."name" as "planName", sp."billingInterval", sp."priceCents", sp."currencyCode"
     FROM "customerSubscription" cs
     LEFT JOIN "subscriptionPlan" sp ON cs."subscriptionPlanId" = sp."subscriptionPlanId"
     WHERE cs."customerId" = $1
     ORDER BY cs."createdAt" DESC`,
    [customerId],
  );
  return results || [];
}

export async function findByIdWithPlan(subscriptionId: string, customerId: string): Promise<unknown | null> {
  return await queryOne<SubscriptionWithPlanDetailRow>(
    `SELECT cs.*, sp."name" as "planName", sp."billingInterval", sp."priceCents", sp."currencyCode",
            sp."features", sp."description" as "planDescription"
     FROM "customerSubscription" cs
     LEFT JOIN "subscriptionPlan" sp ON cs."subscriptionPlanId" = sp."subscriptionPlanId"
     WHERE cs."customerSubscriptionId" = $1 AND cs."customerId" = $2`,
    [subscriptionId, customerId],
  );
}

export async function findActiveByCustomerId(subscriptionId: string, customerId: string): Promise<unknown | null> {
  return await queryOne<DbCustomerSubscription>(`SELECT * FROM "customerSubscription" WHERE "customerSubscriptionId" = $1 AND "customerId" = $2 AND "status" = 'active'`,
    [subscriptionId, customerId],
  );
}

export async function cancelSubscriptionStorefront(subscriptionId: string, reason: string): Promise<void> {
  await query(
    `UPDATE "customerSubscription" SET "status" = 'cancelled', "cancelledAt" = NOW(), "cancellationReason" = $1, "updatedAt" = NOW() WHERE "customerSubscriptionId" = $2`,
    [reason || '', subscriptionId],
  );
}

export async function findBillingHistory(subscriptionId: string): Promise<unknown[]> {
  const results = await query<DbSubscriptionOrder[]>(
    `SELECT * FROM "subscriptionOrder" WHERE "customerSubscriptionId" = $1 ORDER BY "periodStart" DESC LIMIT 12`,
    [subscriptionId],
  );
  return results || [];
}
