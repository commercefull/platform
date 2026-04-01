/**
 * Storefront Referral Controller
 * Customer-facing referral status page
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { logger } from '../../../libs/logger';
import { storefrontRespond } from '../../respond';
import * as referralRepo from '../../../modules/marketing/infrastructure/repositories/referralRepo';

/**
 * GET /referrals
 * Renders the customer's referral link, referral count, and reward status
 */
export const getReferralStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const customerId = user?.customerId || user?.id;

    if (!customerId) {
      return res.redirect('/signin');
    }

    const referrals = await referralRepo.findByReferrer(customerId);

    // Build a simple referral link using the first referral code, or a placeholder
    const referralCode = referrals.length > 0 ? referrals[0].code : null;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const referralLink = referralCode ? `${baseUrl}/signup?ref=${referralCode}` : null;

    const referralCount = referrals.length;
    const convertedCount = referrals.filter(r => r.status === 'converted').length;

    // Collect reward statuses across all referrals
    const rewardStatuses = referrals.map(r => r.status);

    storefrontRespond(req, res, 'referrals/index', {
      pageName: 'My Referrals',
      referralLink,
      referralCode,
      referralCount,
      convertedCount,
      referrals,
      rewardStatuses,
    });
  } catch (error) {
    logger.error('Error loading referral status:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load referral information',
    });
  }
};
