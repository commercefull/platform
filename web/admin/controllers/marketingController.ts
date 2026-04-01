import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import * as emailCampaignRepo from '../../../modules/marketing/infrastructure/repositories/emailCampaignRepo';
import * as affiliateRepo from '../../../modules/marketing/infrastructure/repositories/affiliateRepo';
import * as referralRepo from '../../../modules/marketing/infrastructure/repositories/referralRepo';
import { CreateEmailCampaignUseCase, CreateEmailCampaignCommand } from '../../../modules/marketing/application/useCases/CreateEmailCampaign';
import { SendEmailCampaignUseCase, SendEmailCampaignCommand } from '../../../modules/marketing/application/useCases/SendEmailCampaign';
import { CreateAffiliateUseCase, CreateAffiliateCommand } from '../../../modules/marketing/application/useCases/CreateAffiliate';
import { logger } from '../../../libs/logger';
import { adminRespond } from '../../respond';

// ============================================================================
// Campaigns
// ============================================================================

export const listCampaigns = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    let campaigns;
    if (status) {
      campaigns = await emailCampaignRepo.findByStatus(status as string);
    } else {
      // Fetch all by querying each status and merging, or use a direct query
      const { query } = await import('../../../libs/db');
      campaigns = (await query<emailCampaignRepo.MarketingEmailCampaign[]>(
        `SELECT * FROM "marketingEmailCampaign" ORDER BY "createdAt" DESC LIMIT 100`,
        [],
      )) || [];
    }

    adminRespond(req, res, 'marketing/campaigns/index', {
      pageName: 'Email Campaigns',
      campaigns,
      filters: { status: status || '' },
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error listing campaigns:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message });
  }
};

export const createCampaignForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'marketing/campaigns/form', {
      pageName: 'Create Campaign',
      campaign: null,
      formData: {},
    });
  } catch (error: any) {
    logger.error('Error loading campaign form:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message });
  }
};

export const createCampaign = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { name, subject, templateId, scheduledAt } = req.body;
    const useCase = new CreateEmailCampaignUseCase();
    const result = await useCase.execute(
      new CreateEmailCampaignCommand(
        name,
        subject,
        undefined,
        templateId || undefined,
        scheduledAt ? new Date(scheduledAt) : undefined,
      ),
    );
    res.redirect(`/admin/marketing/campaigns/${result.marketingEmailCampaignId}?success=Campaign+created`);
  } catch (error: any) {
    logger.error('Error creating campaign:', error);
    adminRespond(req, res, 'marketing/campaigns/form', {
      pageName: 'Create Campaign',
      campaign: null,
      formData: req.body,
      error: error.message,
    });
  }
};

export const viewCampaign = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { campaignId } = req.params;
    const campaign = await emailCampaignRepo.findById(campaignId);
    if (!campaign) {
      adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Campaign not found' });
      return;
    }
    adminRespond(req, res, 'marketing/campaigns/detail', {
      pageName: campaign.name,
      campaign,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error viewing campaign:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message });
  }
};

export const sendCampaign = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { campaignId } = req.params;
    const recipients: Array<{ email: string }> = req.body.recipients || [];
    const useCase = new SendEmailCampaignUseCase();
    await useCase.execute(new SendEmailCampaignCommand(campaignId, recipients));
    res.redirect(`/admin/marketing/campaigns/${campaignId}?success=Campaign+sent`);
  } catch (error: any) {
    logger.error('Error sending campaign:', error);
    res.redirect(`/admin/marketing/campaigns/${req.params.campaignId}?error=${encodeURIComponent(error.message)}`);
  }
};

// ============================================================================
// Affiliates
// ============================================================================

export const listAffiliates = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { query } = await import('../../../libs/db');
    const affiliates = (await query<affiliateRepo.MarketingAffiliate[]>(
      `SELECT * FROM "marketingAffiliate" ORDER BY "createdAt" DESC LIMIT 100`,
      [],
    )) || [];

    adminRespond(req, res, 'marketing/affiliates/index', {
      pageName: 'Affiliates',
      affiliates,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error listing affiliates:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message });
  }
};

export const createAffiliateForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'marketing/affiliates/form', {
      pageName: 'Create Affiliate',
      affiliate: null,
      formData: {},
    });
  } catch (error: any) {
    logger.error('Error loading affiliate form:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message });
  }
};

export const createAffiliate = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, code, commissionRate, trackingUrl, trackingSlug } = req.body;
    const useCase = new CreateAffiliateUseCase();
    const result = await useCase.execute(
      new CreateAffiliateCommand(
        name,
        email,
        code,
        parseFloat(commissionRate) || 0,
        trackingUrl || `${req.protocol}://${req.hostname}/ref/${code}`,
        trackingSlug || code,
      ),
    );
    res.redirect(`/admin/marketing/affiliates/${result.marketingAffiliateId}?success=Affiliate+created`);
  } catch (error: any) {
    logger.error('Error creating affiliate:', error);
    adminRespond(req, res, 'marketing/affiliates/form', {
      pageName: 'Create Affiliate',
      affiliate: null,
      formData: req.body,
      error: error.message,
    });
  }
};

export const viewAffiliate = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { affiliateId } = req.params;
    const affiliate = await affiliateRepo.findById(affiliateId);
    if (!affiliate) {
      adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Affiliate not found' });
      return;
    }
    const commissions = await affiliateRepo.findCommissions(affiliateId);
    adminRespond(req, res, 'marketing/affiliates/detail', {
      pageName: affiliate.name,
      affiliate,
      commissions,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error viewing affiliate:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message });
  }
};

// ============================================================================
// Referrals
// ============================================================================

export const listReferrals = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { query } = await import('../../../libs/db');
    const referrals = (await query<referralRepo.Referral[]>(
      `SELECT * FROM "referral" ORDER BY "createdAt" DESC LIMIT 100`,
      [],
    )) || [];

    adminRespond(req, res, 'marketing/referrals/index', {
      pageName: 'Referrals',
      referrals,
    });
  } catch (error: any) {
    logger.error('Error listing referrals:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message });
  }
};
