/**
 * Storefront Loyalty Controller
 * Manages customer loyalty points and rewards
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import { ManageStorefrontLoyaltyUseCase } from '../../../modules/loyalty/application/useCases/ManageLoyalty';

const manageStorefrontLoyaltyUseCase = new ManageStorefrontLoyaltyUseCase();

interface CustomerUser {
  id: string;
  customerId: string;
  email: string;
}

/**
 * GET: View loyalty dashboard
 */
export const loyaltyDashboard = async (req: TypedRequest, res: Response) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin');
  }

  const membership = await manageStorefrontLoyaltyUseCase.findMemberWithTier(user.customerId);
  const recentTransactions = await manageStorefrontLoyaltyUseCase.findCustomerTransactions(user.customerId, 20, 0);
  const availableRewards = await manageStorefrontLoyaltyUseCase.findAvailableRewards((membership as Record<string, unknown>)?.pointsBalance as number || 0);

  storefrontRespond(req, res, 'loyalty/index', {
    pageName: 'My Loyalty',
    membership,
    transactions: recentTransactions,
    rewards: availableRewards,
  });
  
};

/**
 * GET: View loyalty points history
 */
export const pointsHistory = async (req: TypedRequest, res: Response) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin');
  }

  const { page = '1' } = req.query;
  const limit = 20;
  const offset = (parseInt(page as string) - 1) * limit;

  const total = await manageStorefrontLoyaltyUseCase.countCustomerTransactions(user.customerId);
  const transactions = await manageStorefrontLoyaltyUseCase.findCustomerTransactions(user.customerId, limit, offset);

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
  
};

/**
 * POST: Redeem loyalty reward
 */
export const redeemReward = async (req: TypedRequest, res: Response) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.status(401).json({ error: 'Please sign in' });
  }

  const { rewardId } = req.params;

  const reward = await manageStorefrontLoyaltyUseCase.findRewardById(rewardId);

  if (!reward) {
    return res.status(404).json({ error: 'Reward not found' });
  }

  const membership = await manageStorefrontLoyaltyUseCase.findMemberByCustomerId(user.customerId);
  const rewardData = reward as Record<string, unknown>;
  const membershipData = membership as Record<string, unknown> | null;

  if (!membershipData || (membershipData.pointsBalance as number) < (rewardData.pointsCost as number)) {
    return res.status(400).json({ error: 'Insufficient points' });
  }

  await manageStorefrontLoyaltyUseCase.deductPoints(user.customerId, rewardData.pointsCost as number);
  await manageStorefrontLoyaltyUseCase.createRedeemTransaction(user.customerId, -(rewardData.pointsCost as number), `Redeemed: ${rewardData.name}`);

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ success: true });
  }
  return res.redirect('/loyalty');
  
};
