import { query, queryOne } from '../../../../libs/db';

export async function findMemberWithTier(customerId: string): Promise<unknown | null> {
  return await queryOne<unknown>(
    `SELECT lm.*, lt."name" as "tierName", lt."minimumPoints", lt."multiplier"
     FROM "loyaltyMember" lm
     LEFT JOIN "loyaltyTier" lt ON lm."loyaltyTierId" = lt."loyaltyTierId"
     WHERE lm."customerId" = $1`,
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
  const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "loyaltyTransaction" WHERE "customerId" = $1`, [customerId]);
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
  return await queryOne<unknown>(`SELECT * FROM "loyaltyReward" WHERE "loyaltyRewardId" = $1 AND "isActive" = true`, [rewardId]);
}

export async function findMemberByCustomerId(customerId: string): Promise<unknown | null> {
  return await queryOne<unknown>(`SELECT * FROM "loyaltyMember" WHERE "customerId" = $1`, [customerId]);
}

export async function deductPoints(customerId: string, points: number): Promise<void> {
  await queryOne<unknown>(
    `UPDATE "loyaltyMember" SET "pointsBalance" = "pointsBalance" - $1, "updatedAt" = NOW() WHERE "customerId" = $2 RETURNING "loyaltyMemberId"`,
    [points, customerId],
  );
}

export async function createRedeemTransaction(customerId: string, points: number, description: string): Promise<void> {
  await queryOne<unknown>(
    `INSERT INTO "loyaltyTransaction" ("customerId", "type", "points", "description", "createdAt", "updatedAt")
     VALUES ($1, 'redeem', $2, $3, NOW(), NOW()) RETURNING "loyaltyTransactionId"`,
    [customerId, points, description],
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
