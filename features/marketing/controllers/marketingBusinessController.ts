/**
 * Marketing Business Controller
 * Handles admin/merchant marketing operations
 */

import { Request, Response, NextFunction } from 'express';
import * as emailCampaignRepo from '../repos/emailCampaignRepo';
import * as abandonedCartRepo from '../repos/abandonedCartRepo';
import * as recommendationRepo from '../repos/recommendationRepo';
import * as affiliateRepo from '../repos/affiliateRepo';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// ============================================================================
// Email Campaigns
// ============================================================================

export const getCampaigns: AsyncHandler = async (req, res, next) => {
  try {
    const merchantId = (req as any).merchantId;
    const { status, campaignType, limit, offset } = req.query;

    const result = await emailCampaignRepo.getCampaignsByMerchant(
      merchantId,
      { status: status as any, campaignType: campaignType as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCampaign: AsyncHandler = async (req, res, next) => {
  try {
    const campaign = await emailCampaignRepo.getCampaign(req.params.id);
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    res.json({ success: true, data: campaign });
  } catch (error: any) {
    console.error('Get campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCampaign: AsyncHandler = async (req, res, next) => {
  try {
    const merchantId = (req as any).merchantId;
    const campaign = await emailCampaignRepo.saveCampaign({
      merchantId,
      ...req.body
    });
    res.status(201).json({ success: true, data: campaign });
  } catch (error: any) {
    console.error('Create campaign error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCampaign: AsyncHandler = async (req, res, next) => {
  try {
    const campaign = await emailCampaignRepo.saveCampaign({
      emailCampaignId: req.params.id,
      ...req.body
    });
    res.json({ success: true, data: campaign });
  } catch (error: any) {
    console.error('Update campaign error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCampaign: AsyncHandler = async (req, res, next) => {
  try {
    await emailCampaignRepo.deleteCampaign(req.params.id);
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error: any) {
    console.error('Delete campaign error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCampaignRecipients: AsyncHandler = async (req, res, next) => {
  try {
    const { status, limit, offset } = req.query;
    const result = await emailCampaignRepo.getRecipients(
      req.params.id,
      { status: status as any },
      { limit: parseInt(limit as string) || 100, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get recipients error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addCampaignRecipients: AsyncHandler = async (req, res, next) => {
  try {
    const count = await emailCampaignRepo.addRecipients(req.params.id, req.body.recipients);
    res.json({ success: true, added: count });
  } catch (error: any) {
    console.error('Add recipients error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Email Templates
// ============================================================================

export const getTemplates: AsyncHandler = async (req, res, next) => {
  try {
    const merchantId = (req as any).merchantId;
    const { category, isActive } = req.query;
    const templates = await emailCampaignRepo.getTemplatesByMerchant(merchantId, {
      category: category as string,
      isActive: isActive === 'true'
    });
    res.json({ success: true, data: templates });
  } catch (error: any) {
    console.error('Get templates error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTemplate: AsyncHandler = async (req, res, next) => {
  try {
    const template = await emailCampaignRepo.getTemplate(req.params.id);
    if (!template) {
      res.status(404).json({ success: false, message: 'Template not found' });
      return;
    }
    res.json({ success: true, data: template });
  } catch (error: any) {
    console.error('Get template error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTemplate: AsyncHandler = async (req, res, next) => {
  try {
    const merchantId = (req as any).merchantId;
    const template = await emailCampaignRepo.saveTemplate({
      merchantId,
      ...req.body
    });
    res.status(201).json({ success: true, data: template });
  } catch (error: any) {
    console.error('Create template error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTemplate: AsyncHandler = async (req, res, next) => {
  try {
    const template = await emailCampaignRepo.saveTemplate({
      emailTemplateId: req.params.id,
      ...req.body
    });
    res.json({ success: true, data: template });
  } catch (error: any) {
    console.error('Update template error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteTemplate: AsyncHandler = async (req, res, next) => {
  try {
    await emailCampaignRepo.deleteTemplate(req.params.id);
    res.json({ success: true, message: 'Template deleted' });
  } catch (error: any) {
    console.error('Delete template error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Abandoned Carts
// ============================================================================

export const getAbandonedCarts: AsyncHandler = async (req, res, next) => {
  try {
    const { status, minValue, limit, offset } = req.query;
    const result = await abandonedCartRepo.getAbandonedCarts(
      { 
        status: status as any, 
        minValue: minValue ? parseFloat(minValue as string) : undefined 
      },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get abandoned carts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAbandonedCart: AsyncHandler = async (req, res, next) => {
  try {
    const cart = await abandonedCartRepo.getAbandonedCart(req.params.id);
    if (!cart) {
      res.status(404).json({ success: false, message: 'Abandoned cart not found' });
      return;
    }
    const emails = await abandonedCartRepo.getAbandonedCartEmails(req.params.id);
    res.json({ success: true, data: { ...cart, emails } });
  } catch (error: any) {
    console.error('Get abandoned cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAbandonedCartStats: AsyncHandler = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await abandonedCartRepo.getAbandonedCartStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Get abandoned cart stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Product Recommendations
// ============================================================================

export const getRecommendations: AsyncHandler = async (req, res, next) => {
  try {
    const { productId, type, limit } = req.query;
    if (!productId) {
      res.status(400).json({ success: false, message: 'productId is required' });
      return;
    }
    const recommendations = await recommendationRepo.getRecommendationsForProduct(
      productId as string,
      type as any,
      parseInt(limit as string) || 10
    );
    res.json({ success: true, data: recommendations });
  } catch (error: any) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRecommendation: AsyncHandler = async (req, res, next) => {
  try {
    const recommendation = await recommendationRepo.saveRecommendation({
      ...req.body,
      isManual: true
    });
    res.status(201).json({ success: true, data: recommendation });
  } catch (error: any) {
    console.error('Create recommendation error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteRecommendation: AsyncHandler = async (req, res, next) => {
  try {
    await recommendationRepo.deleteRecommendation(req.params.id);
    res.json({ success: true, message: 'Recommendation deleted' });
  } catch (error: any) {
    console.error('Delete recommendation error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const computeRecommendations: AsyncHandler = async (req, res, next) => {
  try {
    const { type } = req.body;
    let count = 0;

    if (type === 'frequently_bought_together' || !type) {
      count += await recommendationRepo.computeFrequentlyBoughtTogether();
    }
    if (type === 'customers_also_viewed' || !type) {
      count += await recommendationRepo.computeCustomersAlsoViewed();
    }

    res.json({ success: true, computed: count });
  } catch (error: any) {
    console.error('Compute recommendations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductViewStats: AsyncHandler = async (req, res, next) => {
  try {
    const { days } = req.query;
    const stats = await recommendationRepo.getProductViewStats(
      req.params.productId,
      parseInt(days as string) || 30
    );
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Get product view stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Affiliates
// ============================================================================

export const getAffiliates: AsyncHandler = async (req, res, next) => {
  try {
    const { status, tier, limit, offset } = req.query;
    const result = await affiliateRepo.getAffiliates(
      { status: status as any, tier: tier as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get affiliates error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAffiliate: AsyncHandler = async (req, res, next) => {
  try {
    const affiliate = await affiliateRepo.getAffiliate(req.params.id);
    if (!affiliate) {
      res.status(404).json({ success: false, message: 'Affiliate not found' });
      return;
    }
    res.json({ success: true, data: affiliate });
  } catch (error: any) {
    console.error('Get affiliate error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAffiliate: AsyncHandler = async (req, res, next) => {
  try {
    const affiliate = await affiliateRepo.saveAffiliate({
      affiliateId: req.params.id,
      ...req.body
    });
    res.json({ success: true, data: affiliate });
  } catch (error: any) {
    console.error('Update affiliate error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const approveAffiliate: AsyncHandler = async (req, res, next) => {
  try {
    const adminId = (req as any).adminId || (req as any).userId;
    await affiliateRepo.approveAffiliate(req.params.id, adminId);
    res.json({ success: true, message: 'Affiliate approved' });
  } catch (error: any) {
    console.error('Approve affiliate error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectAffiliate: AsyncHandler = async (req, res, next) => {
  try {
    await affiliateRepo.rejectAffiliate(req.params.id, req.body.reason);
    res.json({ success: true, message: 'Affiliate rejected' });
  } catch (error: any) {
    console.error('Reject affiliate error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const suspendAffiliate: AsyncHandler = async (req, res, next) => {
  try {
    await affiliateRepo.suspendAffiliate(req.params.id);
    res.json({ success: true, message: 'Affiliate suspended' });
  } catch (error: any) {
    console.error('Suspend affiliate error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAffiliateCommissions: AsyncHandler = async (req, res, next) => {
  try {
    const { status, limit, offset } = req.query;
    const result = await affiliateRepo.getCommissions(
      req.params.id,
      { status: status as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get commissions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveCommission: AsyncHandler = async (req, res, next) => {
  try {
    const adminId = (req as any).adminId || (req as any).userId;
    await affiliateRepo.approveCommission(req.params.commissionId, adminId);
    res.json({ success: true, message: 'Commission approved' });
  } catch (error: any) {
    console.error('Approve commission error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectCommission: AsyncHandler = async (req, res, next) => {
  try {
    await affiliateRepo.rejectCommission(req.params.commissionId, req.body.reason);
    res.json({ success: true, message: 'Commission rejected' });
  } catch (error: any) {
    console.error('Reject commission error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
