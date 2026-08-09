import { query, queryOne } from '../../../../libs/db';

export async function findActivePlansWithBenefitCount(): Promise<unknown[]> {
  const results = await query<unknown[]>(
    `SELECT mp.*, COUNT(mb."membershipBenefitId") as "benefitCount"
     FROM "membershipPlan" mp
     LEFT JOIN "membershipBenefit" mb ON mp."membershipPlanId" = mb."membershipPlanId"
     WHERE mp."isActive" = true
     GROUP BY mp."membershipPlanId"
     ORDER BY mp."sortOrder", mp."price" ASC`,
    [],
  );
  return results || [];
}

export async function findPlanById(planId: string): Promise<unknown | null> {
  return await queryOne<unknown>(`SELECT * FROM "membershipPlan" WHERE "membershipPlanId" = $1 AND "isActive" = true`, [planId]);
}

export async function findBenefitsByPlanId(planId: string): Promise<unknown[]> {
  const results = await query<unknown[]>(`SELECT * FROM "membershipBenefit" WHERE "membershipPlanId" = $1 ORDER BY "sortOrder"`, [planId]);
  return results || [];
}

export async function findActiveMembershipWithPlan(customerId: string): Promise<unknown | null> {
  return await queryOne<unknown>(
    `SELECT m.*, mp."name" as "planName", mp."tier", mp."price", mp."currency"
     FROM "membership" m
     LEFT JOIN "membershipPlan" mp ON m."membershipPlanId" = mp."membershipPlanId"
     WHERE m."customerId" = $1 AND m."status" = 'active'
     ORDER BY m."createdAt" DESC LIMIT 1`,
    [customerId],
  );
}

export async function findActiveMembershipByCustomerId(customerId: string): Promise<unknown | null> {
  return await queryOne<unknown>(`SELECT * FROM "membership" WHERE "customerId" = $1 AND "status" = 'active'`, [customerId]);
}

export async function createMembership(customerId: string, planId: string): Promise<void> {
  await query(
    `INSERT INTO "membership" ("customerId", "membershipPlanId", "status", "startDate", "createdAt", "updatedAt")
     VALUES ($1, $2, 'active', NOW(), NOW(), NOW())`,
    [customerId, planId],
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
