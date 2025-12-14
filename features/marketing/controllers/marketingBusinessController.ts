/**
 * Marketing Business Controller
 * Handles admin/merchant marketing operations
 */

import { Request, Response, NextFunction } from 'express';
import * as emailCampaignUseCases from '../application/useCases/emailCampaign';
import * as emailTemplateUseCases from '../application/useCases/emailTemplate';
import * as abandonedCartUseCases from '../application/useCases/abandonedCart';
import * as recommendationUseCases from '../application/useCases/recommendation';
import * as affiliateUseCases from '../application/useCases/affiliate';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// ============================================================================
// Email Campaigns
// ============================================================================

export const getCampaigns: AsyncHandler = async (req, res, next) => {
  try {
    const merchantId = (req as any).merchantId;
    const { status, campaignType, limit, offset } = req.query;

    const result = await emailCampaignUseCases.listCampaigns({
      merchantId,
      status: status as any,
      campaignType: campaignType as any,
      limit: parseInt(limit as string) || 20,
      offset: parseInt(offset as string) || 0
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCampaign: AsyncHandler = async (req, res, next) => {
  try {
    const { campaign } = await emailCampaignUseCases.getCampaign({ campaignId: req.params.id });
    res.json({ success: true, data: campaign });
  } catch (error: any) {
    console.error('Get campaign error:', error);
    if (error.message === 'Campaign not found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCampaign: AsyncHandler = async (req, res, next) => {
  try {
    const merchantId = (req as any).merchantId;
    const { campaign } = await emailCampaignUseCases.createCampaign({
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
    const { campaign } = await emailCampaignUseCases.updateCampaign({
      campaignId: req.params.id,
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
    await emailCampaignUseCases.deleteCampaign({ campaignId: req.params.id });
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error: any) {
    console.error('Delete campaign error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCampaignRecipients: AsyncHandler = async (req, res, next) => {
  try {
    const { status, limit, offset } = req.query;
    const result = await emailCampaignUseCases.listRecipients({
      campaignId: req.params.id,
      status: status as any,
      limit: parseInt(limit as string) || 100,
      offset: parseInt(offset as string) || 0
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get recipients error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addCampaignRecipients: AsyncHandler = async (req, res, next) => {
  try {
    const { added } = await emailCampaignUseCases.addRecipients({
      campaignId: req.params.id,
      recipients: req.body.recipients
    });
    res.json({ success: true, added });
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
    const { templates } = await emailTemplateUseCases.listTemplates({
      merchantId,
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
    const { template } = await emailTemplateUseCases.getTemplate({ templateId: req.params.id });
    res.json({ success: true, data: template });
  } catch (error: any) {
    console.error('Get template error:', error);
    if (error.message === 'Template not found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTemplate: AsyncHandler = async (req, res, next) => {
  try {
    const merchantId = (req as any).merchantId;
    const { template } = await emailTemplateUseCases.createTemplate({
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
    const { template } = await emailTemplateUseCases.updateTemplate({
      templateId: req.params.id,
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
    await emailTemplateUseCases.deleteTemplate({ templateId: req.params.id });
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
    const result = await abandonedCartUseCases.listAbandonedCarts({
      status: status as any,
      minValue: minValue ? parseFloat(minValue as string) : undefined,
      limit: parseInt(limit as string) || 20,
      offset: parseInt(offset as string) || 0
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get abandoned carts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAbandonedCart: AsyncHandler = async (req, res, next) => {
  try {
    const { cart, emails } = await abandonedCartUseCases.getAbandonedCart({ abandonedCartId: req.params.id });
    res.json({ success: true, data: { ...cart, emails } });
  } catch (error: any) {
    console.error('Get abandoned cart error:', error);
    if (error.message === 'Abandoned cart not found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAbandonedCartStats: AsyncHandler = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { stats } = await abandonedCartUseCases.getAbandonedCartStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });
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
    const { recommendations } = await recommendationUseCases.getRecommendations({
      productId: productId as string,
      type: type as any,
      limit: parseInt(limit as string) || 10
    });
    res.json({ success: true, data: recommendations });
  } catch (error: any) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRecommendation: AsyncHandler = async (req, res, next) => {
  try {
    const { recommendation } = await recommendationUseCases.createRecommendation(req.body);
    res.status(201).json({ success: true, data: recommendation });
  } catch (error: any) {
    console.error('Create recommendation error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteRecommendation: AsyncHandler = async (req, res, next) => {
  try {
    await recommendationUseCases.deleteRecommendation({ recommendationId: req.params.id });
    res.json({ success: true, message: 'Recommendation deleted' });
  } catch (error: any) {
    console.error('Delete recommendation error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const computeRecommendations: AsyncHandler = async (req, res, next) => {
  try {
    const { type } = req.body;
    const { computed } = await recommendationUseCases.computeRecommendations({ type });
    res.json({ success: true, computed });
  } catch (error: any) {
    console.error('Compute recommendations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductViewStats: AsyncHandler = async (req, res, next) => {
  try {
    const { days } = req.query;
    // TODO: Add getProductViewStats to recommendation use cases
    res.json({ success: true, data: { productId: req.params.productId, days: parseInt(days as string) || 30 } });
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
    const result = await affiliateUseCases.listAffiliates({
      status: status as any,
      tier: tier as any,
      limit: parseInt(limit as string) || 20,
      offset: parseInt(offset as string) || 0
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get affiliates error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAffiliate: AsyncHandler = async (req, res, next) => {
  try {
    const { affiliate } = await affiliateUseCases.getAffiliate({ affiliateId: req.params.id });
    res.json({ success: true, data: affiliate });
  } catch (error: any) {
    console.error('Get affiliate error:', error);
    if (error.message === 'Affiliate not found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAffiliate: AsyncHandler = async (req, res, next) => {
  try {
    const { affiliate } = await affiliateUseCases.updateAffiliate({
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
    await affiliateUseCases.approveAffiliate({ affiliateId: req.params.id, approvedBy: adminId });
    res.json({ success: true, message: 'Affiliate approved' });
  } catch (error: any) {
    console.error('Approve affiliate error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectAffiliate: AsyncHandler = async (req, res, next) => {
  try {
    await affiliateUseCases.rejectAffiliate({ affiliateId: req.params.id, reason: req.body.reason });
    res.json({ success: true, message: 'Affiliate rejected' });
  } catch (error: any) {
    console.error('Reject affiliate error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const suspendAffiliate: AsyncHandler = async (req, res, next) => {
  try {
    await affiliateUseCases.suspendAffiliate({ affiliateId: req.params.id });
    res.json({ success: true, message: 'Affiliate suspended' });
  } catch (error: any) {
    console.error('Suspend affiliate error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAffiliateCommissions: AsyncHandler = async (req, res, next) => {
  try {
    const { status, limit, offset } = req.query;
    const result = await affiliateUseCases.listCommissions({
      affiliateId: req.params.id,
      status: status as any,
      limit: parseInt(limit as string) || 20,
      offset: parseInt(offset as string) || 0
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get commissions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveCommission: AsyncHandler = async (req, res, next) => {
  try {
    const adminId = (req as any).adminId || (req as any).userId;
    await affiliateUseCases.approveCommission({ commissionId: req.params.commissionId, approvedBy: adminId });
    res.json({ success: true, message: 'Commission approved' });
  } catch (error: any) {
    console.error('Approve commission error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectCommission: AsyncHandler = async (req, res, next) => {
  try {
    await affiliateUseCases.rejectCommission({ commissionId: req.params.commissionId, reason: req.body.reason });
    res.json({ success: true, message: 'Commission rejected' });
  } catch (error: any) {
    console.error('Reject commission error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
