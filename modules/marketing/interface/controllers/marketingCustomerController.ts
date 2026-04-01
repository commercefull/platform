/**
 * Marketing Customer Controller
 * HTTP interface for customer-facing marketing operations
 */

import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { logger } from '../../../../libs/logger';
import * as referralRepo from '../../infrastructure/repositories/referralRepo';

/**
 * Get customer's referral status
 * GET /customer/referrals
 */
export const getReferralStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?.customerId || (req as any).user?.id;

    if (!customerId) {
      errorResponse(res, 'Unauthorized', 401);
      return;
    }

    const referrals = await referralRepo.findByReferrer(customerId);
    successResponse(res, { referrals });
  } catch (error: any) {
    logger.error('getReferralStatus error:', error);
    errorResponse(res, error.message || 'Failed to get referral status');
  }
};
