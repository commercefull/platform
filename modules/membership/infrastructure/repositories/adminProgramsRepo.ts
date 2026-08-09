/**
 * Admin Programs Repository
 * Handles dashboard queries for membership, subscription, and loyalty programs
 * in the admin hub using legacy table names (userMembership, membershipTier, subscription, etc.)
 */

import { query, queryOne } from '../../../../libs/db';

// ============================================================================
// Membership Dashboard
// ============================================================================

export async function getMembershipStats(): Promise<{
  totalMembers: number;
  activeMembers: number;
  expiringThisMonth: number;
}> {
  const result = await queryOne<{ totalMembers: string; activeMembers: string; expiringThisMonth: string }>(
    `SELECT 
      COUNT(*) as "totalMembers",
      SUM(CASE WHEN "status" = 'active' THEN 1 ELSE 0 END) as "activeMembers",
      SUM(CASE WHEN "endDate" IS NOT NULL AND "endDate" <= NOW() + INTERVAL '30 days' THEN 1 ELSE 0 END) as "expiringThisMonth"
     FROM "userMembership"`,
  );

  return {
    totalMembers: parseInt(result?.totalMembers || '0'),
    activeMembers: parseInt(result?.activeMembers || '0'),
    expiringThisMonth: parseInt(result?.expiringThisMonth || '0'),
  };
}

export async function findMembershipTiersWithCounts(): Promise<unknown[]> {
  return (
    (await query<unknown[]>(
      `SELECT mt.*, COUNT(um."userMembershipId") as "memberCount"
       FROM "membershipTier" mt
       LEFT JOIN "userMembership" um ON mt."membershipTierId" = um."membershipTierId"
       WHERE mt."deletedAt" IS NULL
       GROUP BY mt."membershipTierId"
       ORDER BY mt."sortOrder", mt."price"`,
    )) || []
  );
}

export async function findRecentMemberships(limit: number = 20): Promise<unknown[]> {
  return (
    (await query<unknown[]>(
      `SELECT um.*, mt."name" as "tierName", c."email", 
              COALESCE(c."firstName" || ' ' || c."lastName", c."email") as "customerName"
       FROM "userMembership" um
       LEFT JOIN "membershipTier" mt ON um."membershipTierId" = mt."membershipTierId"
       LEFT JOIN "customer" c ON um."customerId" = c."customerId"
       ORDER BY um."createdAt" DESC
       LIMIT $1`,
      [limit],
    )) || []
  );
}

// ============================================================================
// Subscription Dashboard
// ============================================================================

export async function getSubscriptionStats(): Promise<{
  totalSubscriptions: number;
  activeSubscriptions: number;
  mrr: number;
}> {
  const statsResult = await queryOne<{ totalSubscriptions: string; activeSubscriptions: string }>(
    `SELECT 
      COUNT(*) as "totalSubscriptions",
      SUM(CASE WHEN "status" = 'active' THEN 1 ELSE 0 END) as "activeSubscriptions"
     FROM "subscription"`,
  );

  const mrrResult = await queryOne<{ mrr: string }>(
    `SELECT COALESCE(SUM(sp."price"), 0) as "mrr"
     FROM "subscription" s
     JOIN "subscriptionPlan" sp ON s."subscriptionPlanId" = sp."subscriptionPlanId"
     WHERE s."status" = 'active' AND sp."billingCycle" = 'monthly'`,
  );

  return {
    totalSubscriptions: parseInt(statsResult?.totalSubscriptions || '0'),
    activeSubscriptions: parseInt(statsResult?.activeSubscriptions || '0'),
    mrr: parseFloat(mrrResult?.mrr || '0'),
  };
}

export async function findSubscriptionPlansWithCounts(): Promise<unknown[]> {
  return (
    (await query<unknown[]>(
      `SELECT sp.*, COUNT(s."subscriptionId") as "subscriberCount"
       FROM "subscriptionPlan" sp
       LEFT JOIN "subscription" s ON sp."subscriptionPlanId" = s."subscriptionPlanId"
       WHERE sp."deletedAt" IS NULL
       GROUP BY sp."subscriptionPlanId"
       ORDER BY sp."price"`,
    )) || []
  );
}

export async function findRecentSubscriptions(limit: number = 20): Promise<unknown[]> {
  return (
    (await query<unknown[]>(
      `SELECT s.*, sp."name" as "planName", c."email",
              COALESCE(c."firstName" || ' ' || c."lastName", c."email") as "customerName"
       FROM "subscription" s
       LEFT JOIN "subscriptionPlan" sp ON s."subscriptionPlanId" = sp."subscriptionPlanId"
       LEFT JOIN "customer" c ON s."customerId" = c."customerId"
       ORDER BY s."createdAt" DESC
       LIMIT $1`,
      [limit],
    )) || []
  );
}

// ============================================================================
// Loyalty Dashboard
// ============================================================================

export async function getLoyaltyStats(): Promise<{
  totalMembers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
}> {
  const result = await queryOne<{ totalMembers: string; totalPointsIssued: string; totalPointsRedeemed: string }>(
    `SELECT 
      COUNT(DISTINCT "customerId") as "totalMembers",
      SUM(CASE WHEN "type" = 'earn' THEN "points" ELSE 0 END) as "totalPointsIssued",
      SUM(CASE WHEN "type" = 'redeem' THEN "points" ELSE 0 END) as "totalPointsRedeemed"
     FROM "loyaltyTransaction"`,
  );

  return {
    totalMembers: parseInt(result?.totalMembers || '0'),
    totalPointsIssued: parseInt(result?.totalPointsIssued || '0'),
    totalPointsRedeemed: parseInt(result?.totalPointsRedeemed || '0'),
  };
}

export async function findLoyaltyRewardsWithCounts(): Promise<unknown[]> {
  return (
    (await query<unknown[]>(
      `SELECT lr.*, COUNT(lrd."loyaltyRedemptionId") as "redemptionCount"
       FROM "loyaltyReward" lr
       LEFT JOIN "loyaltyRedemption" lrd ON lr."loyaltyRewardId" = lrd."loyaltyRewardId"
       WHERE lr."deletedAt" IS NULL
       GROUP BY lr."loyaltyRewardId"
       ORDER BY lr."pointsCost"`,
    )) || []
  );
}

export async function findRecentLoyaltyTransactions(limit: number = 20): Promise<unknown[]> {
  return (
    (await query<unknown[]>(
      `SELECT lt.*, c."email",
              COALESCE(c."firstName" || ' ' || c."lastName", c."email") as "customerName"
       FROM "loyaltyTransaction" lt
       LEFT JOIN "customer" c ON lt."customerId" = c."customerId"
       ORDER BY lt."createdAt" DESC
       LIMIT $1`,
      [limit],
    )) || []
  );
}

export default {
  getMembershipStats,
  findMembershipTiersWithCounts,
  findRecentMemberships,
  getSubscriptionStats,
  findSubscriptionPlansWithCounts,
  findRecentSubscriptions,
  getLoyaltyStats,
  findLoyaltyRewardsWithCounts,
  findRecentLoyaltyTransactions,
};
