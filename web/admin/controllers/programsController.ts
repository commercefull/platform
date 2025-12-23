/**
 * Programs Controller for Admin Hub
 * Dashboard views for Membership, Subscription, Loyalty, and B2B programs
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { query, queryOne } from '../../../libs/db';
import { adminRespond } from 'web/respond';

// ============================================================================
// Membership Dashboard
// ============================================================================

export const membershipDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get membership stats
    const statsResult = await queryOne<any>(
      `SELECT 
        COUNT(*) as "totalMembers",
        SUM(CASE WHEN "status" = 'active' THEN 1 ELSE 0 END) as "activeMembers",
        SUM(CASE WHEN "endDate" IS NOT NULL AND "endDate" <= NOW() + INTERVAL '30 days' THEN 1 ELSE 0 END) as "expiringThisMonth"
       FROM "userMembership"`,
    );

    // Get tiers
    const tiers = await query<Array<any>>(
      `SELECT mt.*, COUNT(um."userMembershipId") as "memberCount"
       FROM "membershipTier" mt
       LEFT JOIN "userMembership" um ON mt."membershipTierId" = um."membershipTierId"
       WHERE mt."deletedAt" IS NULL
       GROUP BY mt."membershipTierId"
       ORDER BY mt."sortOrder", mt."price"`,
    );

    // Get recent members
    const members = await query<Array<any>>(
      `SELECT um.*, mt."name" as "tierName", c."email", 
              COALESCE(c."firstName" || ' ' || c."lastName", c."email") as "customerName"
       FROM "userMembership" um
       LEFT JOIN "membershipTier" mt ON um."membershipTierId" = mt."membershipTierId"
       LEFT JOIN "customer" c ON um."customerId" = c."customerId"
       ORDER BY um."createdAt" DESC
       LIMIT 20`,
    );

    adminRespond(req, res, 'programs/membership/index', {
      pageName: 'Membership Program',
      stats: {
        totalMembers: parseInt(statsResult?.totalMembers || '0'),
        activeMembers: parseInt(statsResult?.activeMembers || '0'),
        expiringThisMonth: parseInt(statsResult?.expiringThisMonth || '0'),
      },
      tiers: tiers || [],
      members: members || [],
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load membership dashboard',
    });
  }
};

// ============================================================================
// Subscription Dashboard
// ============================================================================

export const subscriptionDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get subscription stats
    const statsResult = await queryOne<any>(
      `SELECT 
        COUNT(*) as "totalSubscriptions",
        SUM(CASE WHEN "status" = 'active' THEN 1 ELSE 0 END) as "activeSubscriptions"
       FROM "subscription"`,
    );

    // Calculate MRR
    const mrrResult = await queryOne<any>(
      `SELECT COALESCE(SUM(sp."price"), 0) as "mrr"
       FROM "subscription" s
       JOIN "subscriptionPlan" sp ON s."subscriptionPlanId" = sp."subscriptionPlanId"
       WHERE s."status" = 'active' AND sp."billingCycle" = 'monthly'`,
    );

    // Get plans
    const plans = await query<Array<any>>(
      `SELECT sp.*, COUNT(s."subscriptionId") as "subscriberCount"
       FROM "subscriptionPlan" sp
       LEFT JOIN "subscription" s ON sp."subscriptionPlanId" = s."subscriptionPlanId"
       WHERE sp."deletedAt" IS NULL
       GROUP BY sp."subscriptionPlanId"
       ORDER BY sp."price"`,
    );

    // Get recent subscriptions
    const subscriptions = await query<Array<any>>(
      `SELECT s.*, sp."name" as "planName", c."email",
              COALESCE(c."firstName" || ' ' || c."lastName", c."email") as "customerName"
       FROM "subscription" s
       LEFT JOIN "subscriptionPlan" sp ON s."subscriptionPlanId" = sp."subscriptionPlanId"
       LEFT JOIN "customer" c ON s."customerId" = c."customerId"
       ORDER BY s."createdAt" DESC
       LIMIT 20`,
    );

    adminRespond(req, res, 'programs/subscription/index', {
      pageName: 'Subscription Management',
      stats: {
        totalSubscriptions: parseInt(statsResult?.totalSubscriptions || '0'),
        activeSubscriptions: parseInt(statsResult?.activeSubscriptions || '0'),
        mrr: parseFloat(mrrResult?.mrr || '0'),
        churnRate: 0, // TODO: Calculate actual churn rate
      },
      plans: plans || [],
      subscriptions: subscriptions || [],
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load subscription dashboard',
    });
  }
};

// ============================================================================
// Loyalty Dashboard
// ============================================================================

export const loyaltyDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get loyalty stats
    const statsResult = await queryOne<any>(
      `SELECT 
        COUNT(DISTINCT "customerId") as "totalMembers",
        SUM(CASE WHEN "type" = 'earn' THEN "points" ELSE 0 END) as "totalPointsIssued",
        SUM(CASE WHEN "type" = 'redeem' THEN "points" ELSE 0 END) as "totalPointsRedeemed"
       FROM "loyaltyTransaction"`,
    );

    // Get rewards
    const rewards = await query<Array<any>>(
      `SELECT lr.*, COUNT(lrd."loyaltyRedemptionId") as "redemptionCount"
       FROM "loyaltyReward" lr
       LEFT JOIN "loyaltyRedemption" lrd ON lr."loyaltyRewardId" = lrd."loyaltyRewardId"
       WHERE lr."deletedAt" IS NULL
       GROUP BY lr."loyaltyRewardId"
       ORDER BY lr."pointsCost"`,
    );

    // Get recent transactions
    const transactions = await query<Array<any>>(
      `SELECT lt.*, c."email",
              COALESCE(c."firstName" || ' ' || c."lastName", c."email") as "customerName"
       FROM "loyaltyTransaction" lt
       LEFT JOIN "customer" c ON lt."customerId" = c."customerId"
       ORDER BY lt."createdAt" DESC
       LIMIT 20`,
    );

    // Get settings
    const settings = {
      pointsPerDollar: 1,
      pointValue: 0.01,
      minRedemption: 100,
    };

    adminRespond(req, res, 'programs/loyalty/index', {
      pageName: 'Loyalty Program',
      stats: {
        totalMembers: parseInt(statsResult?.totalMembers || '0'),
        totalPointsIssued: parseInt(statsResult?.totalPointsIssued || '0'),
        totalPointsRedeemed: parseInt(statsResult?.totalPointsRedeemed || '0'),
      },
      rewards: rewards || [],
      transactions: transactions || [],
      settings,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load loyalty dashboard',
    });
  }
};

// ============================================================================
// B2B Dashboard
// ============================================================================

export const b2bDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get B2B stats
    const statsResult = await queryOne<any>(
      `SELECT 
        COUNT(*) as "totalCompanies",
        SUM(CASE WHEN "status" = 'approved' THEN 1 ELSE 0 END) as "activeCompanies"
       FROM "b2bCompany"
       WHERE "deletedAt" IS NULL`,
    );

    const quoteStats = await queryOne<any>(
      `SELECT COUNT(*) as "pendingQuotes"
       FROM "b2bQuote"
       WHERE "status" = 'pending' AND "deletedAt" IS NULL`,
    );

    const revenueResult = await queryOne<any>(
      `SELECT COALESCE(SUM(o."totalAmount"), 0) as "totalB2BRevenue"
       FROM "order" o
       WHERE o."b2bCompanyId" IS NOT NULL AND o."deletedAt" IS NULL`,
    );

    // Get companies
    const companies = await query<Array<any>>(
      `SELECT bc.*, COUNT(o."orderId") as "orderCount"
       FROM "b2bCompany" bc
       LEFT JOIN "order" o ON bc."b2bCompanyId" = o."b2bCompanyId"
       WHERE bc."deletedAt" IS NULL
       GROUP BY bc."b2bCompanyId"
       ORDER BY bc."createdAt" DESC
       LIMIT 20`,
    );

    // Get recent quotes
    const quotes = await query<Array<any>>(
      `SELECT q.*, bc."name" as "companyName",
              (SELECT COUNT(*) FROM "b2bQuoteItem" qi WHERE qi."b2bQuoteId" = q."b2bQuoteId") as "itemCount"
       FROM "b2bQuote" q
       LEFT JOIN "b2bCompany" bc ON q."b2bCompanyId" = bc."b2bCompanyId"
       WHERE q."deletedAt" IS NULL
       ORDER BY q."createdAt" DESC
       LIMIT 20`,
    );

    adminRespond(req, res, 'programs/b2b/index', {
      pageName: 'B2B Management',
      stats: {
        totalCompanies: parseInt(statsResult?.totalCompanies || '0'),
        activeCompanies: parseInt(statsResult?.activeCompanies || '0'),
        pendingQuotes: parseInt(quoteStats?.pendingQuotes || '0'),
        totalB2BRevenue: parseFloat(revenueResult?.totalB2BRevenue || '0'),
      },
      companies: companies || [],
      quotes: quotes || [],
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load B2B dashboard',
    });
  }
};
