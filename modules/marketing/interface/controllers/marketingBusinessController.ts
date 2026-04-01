/**
 * Marketing Business Controller
 * HTTP interface for merchant-facing marketing operations
 */

import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { logger } from '../../../../libs/logger';
import * as emailCampaignRepo from '../../infrastructure/repositories/emailCampaignRepo';
import * as affiliateRepo from '../../infrastructure/repositories/affiliateRepo';
import * as referralRepo from '../../infrastructure/repositories/referralRepo';
import { CreateEmailCampaignCommand, CreateEmailCampaignUseCase } from '../../application/useCases/CreateEmailCampaign';
import { SendEmailCampaignCommand, SendEmailCampaignUseCase } from '../../application/useCases/SendEmailCampaign';
import { CreateAffiliateCommand, CreateAffiliateUseCase } from '../../application/useCases/CreateAffiliate';

// ============================================================================
// Campaign Handlers
// ============================================================================

/**
 * List email campaigns
 * GET /business/marketing/campaigns
 */
export const listCampaigns = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || 'draft';
    const limit = parseInt(req.query.limit as string) || 50;

    const campaigns = await emailCampaignRepo.findByStatus(status, limit);
    successResponse(res, { campaigns });
  } catch (error: any) {
    logger.error('listCampaigns error:', error);
    errorResponse(res, error.message || 'Failed to list campaigns');
  }
};

/**
 * Create an email campaign
 * POST /business/marketing/campaigns
 */
export const createCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, subject, templateId, scheduledAt } = req.body;
    const merchantId = (req as any).user?.merchantId;

    const command = new CreateEmailCampaignCommand(
      name,
      subject,
      merchantId,
      templateId,
      scheduledAt ? new Date(scheduledAt) : undefined,
    );

    const useCase = new CreateEmailCampaignUseCase();
    const result = await useCase.execute(command);

    successResponse(res, result, 201);
  } catch (error: any) {
    logger.error('createCampaign error:', error);
    errorResponse(res, error.message || 'Failed to create campaign', 400);
  }
};

/**
 * Send an email campaign
 * POST /business/marketing/campaigns/:campaignId/send
 */
export const sendCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId } = req.params;
    const { recipients } = req.body;

    const command = new SendEmailCampaignCommand(campaignId, recipients || []);
    const useCase = new SendEmailCampaignUseCase();
    const result = await useCase.execute(command);

    successResponse(res, result);
  } catch (error: any) {
    logger.error('sendCampaign error:', error);
    errorResponse(res, error.message || 'Failed to send campaign', 400);
  }
};

// ============================================================================
// Affiliate Handlers
// ============================================================================

/**
 * List affiliates
 * GET /business/marketing/affiliates
 */
export const listAffiliates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.query;

    if (code) {
      const affiliate = await affiliateRepo.findByCode(code as string);
      successResponse(res, { affiliates: affiliate ? [affiliate] : [] });
      return;
    }

    // Return empty list when no filter — repos can be extended later
    successResponse(res, { affiliates: [] });
  } catch (error: any) {
    logger.error('listAffiliates error:', error);
    errorResponse(res, error.message || 'Failed to list affiliates');
  }
};

/**
 * Create an affiliate
 * POST /business/marketing/affiliates
 */
export const createAffiliate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, code, commissionRate, trackingUrl, trackingSlug, customerId } = req.body;
    const merchantId = (req as any).user?.merchantId;

    const command = new CreateAffiliateCommand(
      name,
      email,
      code,
      commissionRate,
      trackingUrl,
      trackingSlug,
      customerId,
      merchantId,
    );

    const useCase = new CreateAffiliateUseCase();
    const result = await useCase.execute(command);

    successResponse(res, result, 201);
  } catch (error: any) {
    logger.error('createAffiliate error:', error);
    errorResponse(res, error.message || 'Failed to create affiliate', 400);
  }
};

/**
 * Get affiliate with commission history
 * GET /business/marketing/affiliates/:affiliateId
 */
export const getAffiliate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { affiliateId } = req.params;

    const affiliate = await affiliateRepo.findById(affiliateId);
    if (!affiliate) {
      errorResponse(res, 'Affiliate not found', 404);
      return;
    }

    const commissions = await affiliateRepo.findCommissions(affiliateId);

    successResponse(res, { affiliate, commissions });
  } catch (error: any) {
    logger.error('getAffiliate error:', error);
    errorResponse(res, error.message || 'Failed to get affiliate');
  }
};

// ============================================================================
// Referral Handlers
// ============================================================================

/**
 * List referrals
 * GET /business/marketing/referrals
 */
export const listReferrals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { referrerId } = req.query;

    if (!referrerId) {
      errorResponse(res, 'referrerId query parameter is required', 400);
      return;
    }

    const referrals = await referralRepo.findByReferrer(referrerId as string);
    successResponse(res, { referrals });
  } catch (error: any) {
    logger.error('listReferrals error:', error);
    errorResponse(res, error.message || 'Failed to list referrals');
  }
};
