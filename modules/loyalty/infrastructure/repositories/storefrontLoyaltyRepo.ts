import { query, queryOne } from '../../../../libs/db';

export async function findMemberWithTier(customerId: string): Promise<unknown | null> {
  return await queryOne<unknown>(
    `SELECT lp.*, lp."currentPoints" as "pointsBalance",
            lt."name" as "tierName", lt."pointsThreshold" as "minimumPoints", lt."pointsMultiplier" as "multiplier"
     FROM "loyaltyPoints" lp
     LEFT JOIN "loyaltyTier" lt ON lp."tierId" = lt."tierId"
     WHERE lp."customerId" = $1`,
    [customerId],
  );
}

export async function findCustomerTransactions(customerId: string, limit: number, offset: number): Promise<unknown[]> {
  const results = await query<unknown[]>(
    `SELECT * FROM "loyaltyTransaction" WHERE "customerId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
    [customerId, limit, offset],
  );
  return results || [];
}

export async function countCustomerTransactions(customerId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "loyaltyTransaction" WHERE "customerId" = $1`, [
    customerId,
  ]);
  return result ? parseInt(result.count, 10) : 0;
}

export async function findAvailableRewards(pointsBalance: number): Promise<unknown[]> {
  const results = await query<unknown[]>(
    `SELECT * FROM "loyaltyReward" WHERE "isActive" = true AND "pointsCost" <= $1 ORDER BY "pointsCost" ASC`,
    [pointsBalance],
  );
  return results || [];
}

export async function findRewardById(rewardId: string): Promise<unknown | null> {
  return await queryOne<unknown>(`SELECT * FROM "loyaltyReward" WHERE "rewardId" = $1 AND "isActive" = true`, [rewardId]);
}

export async function findMemberByCustomerId(customerId: string): Promise<unknown | null> {
  return await queryOne<unknown>(`SELECT *, "currentPoints" as "pointsBalance" FROM "loyaltyPoints" WHERE "customerId" = $1`, [customerId]);
}

export async function deductPoints(customerId: string, points: number): Promise<void> {
  await queryOne<unknown>(
    `UPDATE "loyaltyPoints" SET "currentPoints" = "currentPoints" - $1, "lastActivity" = NOW(), "updatedAt" = NOW() WHERE "customerId" = $2 RETURNING "loyaltyPointsId"`,
    [points, customerId],
  );
}

export async function createRedeemTransaction(customerId: string, points: number, description: string): Promise<void> {
  await queryOne<unknown>(
    `INSERT INTO "loyaltyTransaction" ("customerId", "action", "points", "description", "createdAt", "updatedAt")
     VALUES ($1, 'debit', $2, $3, NOW(), NOW()) RETURNING "loyaltyTransactionId"`,
    [customerId, -Math.abs(points), description],
  );
}

export default {
  findMemberWithTier,
  findCustomerTransactions,
  countCustomerTransactions,
  findAvailableRewards,
  findRewardById,
  findMemberByCustomerId,
  deductPoints,
  createRedeemTransaction,
};
