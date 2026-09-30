import { query, queryOne } from '../../../../libs/db';
import { generateUUID as uuidv4 } from '../../../../libs/uuid';

export async function findActivePlansWithBenefitCount(): Promise<unknown[]> {
  const results = await query<unknown[]>(
    `SELECT mp.*, COUNT(mpb."membershipPlanBenefitId") as "benefitCount"
     FROM "membershipPlan" mp
     LEFT JOIN "membershipPlanBenefit" mpb ON mp."membershipPlanId" = mpb."planId" AND mpb."isActive" = true
     WHERE mp."isActive" = true
     GROUP BY mp."membershipPlanId"
     ORDER BY mp."priority", mp."priceCents" ASC`,
    [],
  );
  return results || [];
}

export async function findPlanById(planId: string): Promise<unknown | null> {
  return await queryOne<unknown>(`SELECT * FROM "membershipPlan" WHERE "membershipPlanId" = $1 AND "isActive" = true`, [planId]);
}

export async function findBenefitsByPlanId(planId: string): Promise<unknown[]> {
  const results = await query<unknown[]>(
    `SELECT mb.* FROM "membershipPlanBenefit" mpb
     JOIN "membershipBenefit" mb ON mpb."benefitId" = mb."membershipBenefitId"
     WHERE mpb."planId" = $1 AND mpb."isActive" = true AND mb."isActive" = true
     ORDER BY mpb."priority"`,
    [planId],
  );
  return results || [];
}

export async function findActiveMembershipWithPlan(customerId: string): Promise<unknown | null> {
  return await queryOne<unknown>(
    `SELECT m.*, mp."name" as "planName", mp."level" as "tier", mp."priceCents", mp."currencyCode"
     FROM "membershipSubscription" m
     LEFT JOIN "membershipPlan" mp ON m."membershipPlanId" = mp."membershipPlanId"
     WHERE m."customerId" = $1 AND m."status" = 'active'
     ORDER BY m."createdAt" DESC LIMIT 1`,
    [customerId],
  );
}

export async function findActiveMembershipByCustomerId(customerId: string): Promise<unknown | null> {
  return await queryOne<unknown>(`SELECT * FROM "membershipSubscription" WHERE "customerId" = $1 AND "status" = 'active'`, [
    customerId,
  ]);
}

export async function createMembership(customerId: string, planId: string): Promise<void> {
  await query(
    `INSERT INTO "membershipSubscription" ("membershipSubscriptionId", "customerId", "membershipPlanId", "status", "isAutoRenew", "startDate", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'active', true, NOW(), NOW(), NOW())`,
    [uuidv4(), customerId, planId],
  );
}

export default {
  findActivePlansWithBenefitCount,
  findPlanById,
  findBenefitsByPlanId,
  findActiveMembershipWithPlan,
  findActiveMembershipByCustomerId,
  createMembership,
};
