/**
 * Admin Programs Repository
 * Handles dashboard queries for membership, subscription, and loyalty programs
 * in the admin hub
 */

import { query, queryOne } from '../../../../libs/db';
import type {
  MembershipPlan as DbMembershipPlan,
  MembershipSubscription as DbMembershipSubscription,
  SubscriptionPlan as DbSubscriptionPlan,
  CustomerSubscription as DbCustomerSubscription,
  LoyaltyReward as DbLoyaltyReward,
  LoyaltyTransaction as DbLoyaltyTransaction,
} from '../../../../libs/db/types';

type MembershipTierRow = DbMembershipPlan & { memberCount: string };
type MembershipRow = DbMembershipSubscription & { tierName: string | null; email: string | null; customerName: string | null };
type SubscriptionPlanRow = DbSubscriptionPlan & { subscriberCount: string };
type SubscriptionRow = DbCustomerSubscription & { planName: string | null; email: string | null; customerName: string | null };
type LoyaltyRewardRow = DbLoyaltyReward & { redemptionCount: string };
type LoyaltyTransactionRow = DbLoyaltyTransaction & { email: string | null; customerName: string | null };

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
     FROM "membershipSubscription"`,
  );

  return {
    totalMembers: parseInt(result?.totalMembers || '0'),
    activeMembers: parseInt(result?.activeMembers || '0'),
    expiringThisMonth: parseInt(result?.expiringThisMonth || '0'),
  };
}

export async function findMembershipTiersWithCounts(): Promise<unknown[]> {
  return (
    (await query<MembershipTierRow[]>(
      `SELECT mt.*, COUNT(um."membershipSubscriptionId") as "memberCount"
       FROM "membershipPlan" mt
       LEFT JOIN "membershipSubscription" um ON mt."membershipPlanId" = um."membershipPlanId"
       WHERE mt."isActive" = true
       GROUP BY mt."membershipPlanId"
       ORDER BY mt."priority", mt."priceCents"`,
    )) || []
  );
}

export async function findRecentMemberships(limit: number = 20): Promise<unknown[]> {
  return (
    (await query<MembershipRow[]>(
      `SELECT um.*, mt."name" as "tierName", c."email",
              COALESCE(c."firstName" || ' ' || c."lastName", c."email") as "customerName"
       FROM "membershipSubscription" um
       LEFT JOIN "membershipPlan" mt ON um."membershipPlanId" = mt."membershipPlanId"
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
     FROM "customerSubscription"`,
  );

  const mrrResult = await queryOne<{ mrr: string }>(
    `SELECT COALESCE(SUM(sp."priceCents"), 0) as "mrr"
     FROM "customerSubscription" s
     JOIN "subscriptionPlan" sp ON s."subscriptionPlanId" = sp."subscriptionPlanId"
     WHERE s."status" = 'active' AND sp."billingInterval" = 'month'`,
  );

  return {
    totalSubscriptions: parseInt(statsResult?.totalSubscriptions || '0'),
    activeSubscriptions: parseInt(statsResult?.activeSubscriptions || '0'),
    mrr: parseFloat(mrrResult?.mrr || '0'),
  };
}

export async function findSubscriptionPlansWithCounts(): Promise<unknown[]> {
  return (
    (await query<SubscriptionPlanRow[]>(
      `SELECT sp.*, COUNT(s."customerSubscriptionId") as "subscriberCount"
       FROM "subscriptionPlan" sp
       LEFT JOIN "customerSubscription" s ON sp."subscriptionPlanId" = s."subscriptionPlanId"
       WHERE sp."isActive" = true
       GROUP BY sp."subscriptionPlanId"
       ORDER BY sp."priceCents"`,
    )) || []
  );
}

export async function findRecentSubscriptions(limit: number = 20): Promise<unknown[]> {
  return (
    (await query<SubscriptionRow[]>(
      `SELECT s.*, sp."name" as "planName", c."email",
              COALESCE(c."firstName" || ' ' || c."lastName", c."email") as "customerName"
       FROM "customerSubscription" s
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
      SUM(CASE WHEN "action" = 'credit' THEN "points" ELSE 0 END) as "totalPointsIssued",
      SUM(CASE WHEN "action" = 'debit' THEN "points" ELSE 0 END) as "totalPointsRedeemed"
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
    (await query<LoyaltyRewardRow[]>(
      `SELECT lr.*, COUNT(lrd."redemptionId") as "redemptionCount"
       FROM "loyaltyReward" lr
       LEFT JOIN "loyaltyRedemption" lrd ON lr."rewardId" = lrd."rewardId"
       WHERE lr."isActive" = true
       GROUP BY lr."rewardId"
       ORDER BY lr."pointsCost"`,
    )) || []
  );
}

export async function findRecentLoyaltyTransactions(limit: number = 20): Promise<unknown[]> {
  return (
    (await query<LoyaltyTransactionRow[]>(
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
