import { query, queryOne } from '../../../../libs/db';
import type {
  LoyaltyPoints as DbLoyaltyPoints,
  LoyaltyTransaction as DbLoyaltyTransaction,
  LoyaltyReward as DbLoyaltyReward,
} from '../../../../libs/db/types';

type MemberWithTierRow = DbLoyaltyPoints & {
  pointsBalance: number;
  tierName: string | null;
  minimumPoints: number | null;
  multiplier: string | null;
};
type PointsBalanceRow = DbLoyaltyPoints & { pointsBalance: number };

async function findMemberWithTier(customerId: string): Promise<unknown | null> {
  return await queryOne<MemberWithTierRow>(
    `SELECT lp.*, lp."currentPoints" as "pointsBalance",
            lt."name" as "tierName", lt."pointsThreshold" as "minimumPoints", lt."pointsMultiplier" as "multiplier"
     FROM "loyaltyPoints" lp
     LEFT JOIN "loyaltyTier" lt ON lp."tierId" = lt."tierId"
     WHERE lp."customerId" = $1`,
    [customerId],
  );
}

async function findCustomerTransactions(customerId: string, limit: number, offset: number): Promise<unknown[]> {
  const results = await query<DbLoyaltyTransaction[]>(
    `SELECT * FROM "loyaltyTransaction" WHERE "customerId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
    [customerId, limit, offset],
  );
  return results || [];
}

async function countCustomerTransactions(customerId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "loyaltyTransaction" WHERE "customerId" = $1`, [
    customerId,
  ]);
  return result ? parseInt(result.count, 10) : 0;
}

async function findAvailableRewards(pointsBalance: number): Promise<unknown[]> {
  const results = await query<DbLoyaltyReward[]>(
    `SELECT * FROM "loyaltyReward" WHERE "isActive" = true AND "pointsCost" <= $1 ORDER BY "pointsCost" ASC`,
    [pointsBalance],
  );
  return results || [];
}

async function findRewardById(rewardId: string): Promise<unknown | null> {
  return await queryOne<DbLoyaltyReward>(`SELECT * FROM "loyaltyReward" WHERE "rewardId" = $1 AND "isActive" = true`, [rewardId]);
}

async function findMemberByCustomerId(customerId: string): Promise<unknown | null> {
  return await queryOne<PointsBalanceRow>(`SELECT *, "currentPoints" as "pointsBalance" FROM "loyaltyPoints" WHERE "customerId" = $1`, [
    customerId,
  ]);
}

export default {
  findMemberWithTier,
  findCustomerTransactions,
  countCustomerTransactions,
  findAvailableRewards,
  findRewardById,
  findMemberByCustomerId,
};
