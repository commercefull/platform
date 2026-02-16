/**
 * Storefront Loyalty Controller
 * Manages customer loyalty points and rewards
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { query, queryOne } from '../../../libs/db';
import { storefrontRespond } from '../../respond';

interface CustomerUser {
  id: string;
  customerId: string;
  email: string;
}

/**
 * GET: View loyalty dashboard
 */
export const loyaltyDashboard = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    const membership = await queryOne<any>(
      `SELECT lm.*, lt."name" as "tierName", lt."minimumPoints", lt."multiplier"
       FROM "loyaltyMember" lm
       LEFT JOIN "loyaltyTier" lt ON lm."loyaltyTierId" = lt."loyaltyTierId"
       WHERE lm."customerId" = $1`,
      [user.customerId],
    );

    const recentTransactions = await query<any[]>(
      `SELECT * FROM "loyaltyTransaction"
       WHERE "customerId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 20`,
      [user.customerId],
    );

    const availableRewards = await query<any[]>(
      `SELECT * FROM "loyaltyReward"
       WHERE "isActive" = true AND "pointsCost" <= $1
       ORDER BY "pointsCost" ASC`,
      [membership?.pointsBalance || 0],
    );

    storefrontRespond(req, res, 'loyalty/index', {
      pageName: 'My Loyalty',
      membership,
      transactions: recentTransactions || [],
      rewards: availableRewards || [],
    });
  } catch (error) {
    logger.error('Error loading loyalty dashboard:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load loyalty information',
    });
  }
};

/**
 * GET: View loyalty points history
 */
export const pointsHistory = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    const { page = '1' } = req.query;
    const limit = 20;
    const offset = (parseInt(page as string) - 1) * limit;

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "loyaltyTransaction" WHERE "customerId" = $1`,
      [user.customerId],
    );
    const total = parseInt(countResult?.count || '0');

    const transactions = await query<any[]>(
      `SELECT * FROM "loyaltyTransaction"
       WHERE "customerId" = $1
       ORDER BY "createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [user.customerId, limit, offset],
    );

    const pages = Math.ceil(total / limit);
    const currentPage = parseInt(page as string);

    storefrontRespond(req, res, 'loyalty/history', {
      pageName: 'Points History',
      transactions: transactions || [],
      pagination: {
        total,
        page: currentPage,
        pages,
        hasNext: currentPage < pages,
        hasPrev: currentPage > 1,
      },
    });
  } catch (error) {
    logger.error('Error loading points history:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load points history',
    });
  }
};

/**
 * POST: Redeem loyalty reward
 */
export const redeemReward = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.status(401).json({ error: 'Please sign in' });
    }

    const { rewardId } = req.params;

    const reward = await queryOne<any>(
      `SELECT * FROM "loyaltyReward" WHERE "loyaltyRewardId" = $1 AND "isActive" = true`,
      [rewardId],
    );

    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    const membership = await queryOne<any>(
      `SELECT * FROM "loyaltyMember" WHERE "customerId" = $1`,
      [user.customerId],
    );

    if (!membership || membership.pointsBalance < reward.pointsCost) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    // Deduct points
    await queryOne<any>(
      `UPDATE "loyaltyMember" SET "pointsBalance" = "pointsBalance" - $1, "updatedAt" = NOW()
       WHERE "customerId" = $2 RETURNING "loyaltyMemberId"`,
      [reward.pointsCost, user.customerId],
    );

    // Record transaction
    await queryOne<any>(
      `INSERT INTO "loyaltyTransaction" (
        "customerId", "type", "points", "description", "createdAt", "updatedAt"
      ) VALUES ($1, 'redeem', $2, $3, NOW(), NOW())
      RETURNING "loyaltyTransactionId"`,
      [user.customerId, -reward.pointsCost, `Redeemed: ${reward.name}`],
    );

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true });
    }
    return res.redirect('/loyalty');
  } catch (error) {
    logger.error('Error redeeming reward:', error);
    res.status(500).json({ error: 'Failed to redeem reward' });
  }
};
