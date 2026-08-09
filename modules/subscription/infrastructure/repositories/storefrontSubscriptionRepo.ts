import { query, queryOne } from '../../../../libs/db';

export async function findActivePlansWithProduct(): Promise<unknown[]> {
  const results = await query<unknown[]>(
    `SELECT sp.*, sprod."name" as "productName", sprod."description" as "productDescription"
     FROM "subscriptionPlan" sp
     LEFT JOIN "subscriptionProduct" sprod ON sp."subscriptionProductId" = sprod."subscriptionProductId"
     WHERE sp."isActive" = true
     ORDER BY sp."sortOrder", sp."price" ASC`,
    [],
  );
  return results || [];
}

export async function findByCustomerIdWithPlan(customerId: string): Promise<unknown[]> {
  const results = await query<unknown[]>(
    `SELECT cs.*, sp."name" as "planName", sp."billingInterval", sp."price", sp."currency"
     FROM "customerSubscription" cs
     LEFT JOIN "subscriptionPlan" sp ON cs."subscriptionPlanId" = sp."subscriptionPlanId"
     WHERE cs."customerId" = $1
     ORDER BY cs."createdAt" DESC`,
    [customerId],
  );
  return results || [];
}

export async function findByIdWithPlan(subscriptionId: string, customerId: string): Promise<unknown | null> {
  return await queryOne<unknown>(
    `SELECT cs.*, sp."name" as "planName", sp."billingInterval", sp."price", sp."currency",
            sp."features", sp."description" as "planDescription"
     FROM "customerSubscription" cs
     LEFT JOIN "subscriptionPlan" sp ON cs."subscriptionPlanId" = sp."subscriptionPlanId"
     WHERE cs."customerSubscriptionId" = $1 AND cs."customerId" = $2`,
    [subscriptionId, customerId],
  );
}

export async function findActiveByCustomerId(subscriptionId: string, customerId: string): Promise<unknown | null> {
  return await queryOne<unknown>(
    `SELECT * FROM "customerSubscription" WHERE "customerSubscriptionId" = $1 AND "customerId" = $2 AND "status" = 'active'`,
    [subscriptionId, customerId],
  );
}

export async function cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
  await query(
    `UPDATE "customerSubscription" SET "status" = 'cancelled', "cancelledAt" = NOW(), "cancellationReason" = $1, "updatedAt" = NOW() WHERE "customerSubscriptionId" = $2`,
    [reason || '', subscriptionId],
  );
}

export async function findBillingHistory(subscriptionId: string): Promise<unknown[]> {
  const results = await query<unknown[]>(
    `SELECT * FROM "subscriptionBilling" WHERE "customerSubscriptionId" = $1 ORDER BY "billingDate" DESC LIMIT 12`,
    [subscriptionId],
  );
  return results || [];
}

export default {
  findActivePlansWithProduct,
  findByCustomerIdWithPlan,
  findByIdWithPlan,
  findActiveByCustomerId,
  cancelSubscription,
  findBillingHistory,
};
