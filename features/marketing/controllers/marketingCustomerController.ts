/**
 * Marketing Customer Controller
 * Handles customer-facing marketing operations
 */

import { Request, Response, NextFunction } from 'express';
import * as recommendationRepo from '../repos/recommendationRepo';
import * as affiliateRepo from '../repos/affiliateRepo';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// ============================================================================
// Product Recommendations (Public)
// ============================================================================

export const getProductRecommendations: AsyncHandler = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { type, limit } = req.query;

    const recommendations = await recommendationRepo.getRecommendationsForProduct(
      productId,
      type as any,
      parseInt(limit as string) || 10
    );

    res.json({ success: true, data: recommendations });
  } catch (error: any) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFrequentlyBoughtTogether: AsyncHandler = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { limit } = req.query;

    const recommendations = await recommendationRepo.getFrequentlyBoughtTogether(
      productId,
      parseInt(limit as string) || 5
    );

    res.json({ success: true, data: recommendations });
  } catch (error: any) {
    console.error('Get frequently bought together error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSimilarProducts: AsyncHandler = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { limit } = req.query;

    const recommendations = await recommendationRepo.getSimilarProducts(
      productId,
      parseInt(limit as string) || 10
    );

    res.json({ success: true, data: recommendations });
  } catch (error: any) {
    console.error('Get similar products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recordProductView: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const sessionId = req.sessionID || req.body.sessionId;

    const view = await recommendationRepo.recordProductView({
      customerId,
      sessionId,
      productId: req.body.productId,
      productVariantId: req.body.productVariantId,
      source: req.body.source,
      referrer: req.get('Referer'),
      deviceType: req.body.deviceType,
      country: req.body.country,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({ success: true, data: { customerProductViewId: view.customerProductViewId } });
  } catch (error: any) {
    console.error('Record product view error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateProductView: AsyncHandler = async (req, res, next) => {
  try {
    await recommendationRepo.updateProductView(req.params.viewId, {
      viewDurationSeconds: req.body.viewDurationSeconds,
      scrollDepthPercent: req.body.scrollDepthPercent,
      addedToCart: req.body.addedToCart,
      purchased: req.body.purchased
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Update product view error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getRecentlyViewed: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const sessionId = req.query.sessionId as string || req.sessionID;
    const { limit } = req.query;

    const views = await recommendationRepo.getRecentlyViewedProducts(
      customerId,
      sessionId,
      parseInt(limit as string) || 10
    );

    res.json({ success: true, data: views });
  } catch (error: any) {
    console.error('Get recently viewed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recordRecommendationClick: AsyncHandler = async (req, res, next) => {
  try {
    await recommendationRepo.incrementClickCount(req.params.recommendationId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Record recommendation click error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Affiliate Program (Public)
// ============================================================================

export const applyForAffiliate: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;

    // Check if already an affiliate
    const existing = await affiliateRepo.getAffiliateByEmail(req.body.email);
    if (existing) {
      res.status(409).json({ success: false, message: 'An affiliate account with this email already exists' });
      return;
    }

    const affiliate = await affiliateRepo.saveAffiliate({
      customerId,
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      companyName: req.body.companyName,
      website: req.body.website,
      socialMedia: req.body.socialMedia,
      bio: req.body.bio,
      categories: req.body.categories
    });

    res.status(201).json({ 
      success: true, 
      message: 'Application submitted successfully. We will review and get back to you.',
      data: { affiliateId: affiliate.affiliateId, status: affiliate.status }
    });
  } catch (error: any) {
    console.error('Apply for affiliate error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyAffiliateAccount: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    if (!customerId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Find affiliate by customer ID
    const affiliates = await affiliateRepo.getAffiliates({ status: undefined });
    const affiliate = affiliates.data.find(a => a.customerId === customerId);

    if (!affiliate) {
      res.status(404).json({ success: false, message: 'No affiliate account found' });
      return;
    }

    res.json({ success: true, data: affiliate });
  } catch (error: any) {
    console.error('Get my affiliate account error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyAffiliateLinks: AsyncHandler = async (req, res, next) => {
  try {
    const affiliateId = (req as any).affiliateId;
    if (!affiliateId) {
      res.status(401).json({ success: false, message: 'Affiliate authentication required' });
      return;
    }

    const links = await affiliateRepo.getAffiliateLinks(affiliateId);
    res.json({ success: true, data: links });
  } catch (error: any) {
    console.error('Get my affiliate links error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAffiliateLink: AsyncHandler = async (req, res, next) => {
  try {
    const affiliateId = (req as any).affiliateId;
    if (!affiliateId) {
      res.status(401).json({ success: false, message: 'Affiliate authentication required' });
      return;
    }

    const link = await affiliateRepo.saveAffiliateLink({
      affiliateId,
      name: req.body.name,
      destinationUrl: req.body.destinationUrl,
      productId: req.body.productId,
      productCategoryId: req.body.productCategoryId,
      utmSource: req.body.utmSource,
      utmMedium: req.body.utmMedium,
      utmCampaign: req.body.utmCampaign
    });

    res.status(201).json({ success: true, data: link });
  } catch (error: any) {
    console.error('Create affiliate link error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyCommissions: AsyncHandler = async (req, res, next) => {
  try {
    const affiliateId = (req as any).affiliateId;
    if (!affiliateId) {
      res.status(401).json({ success: false, message: 'Affiliate authentication required' });
      return;
    }

    const { status, limit, offset } = req.query;
    const result = await affiliateRepo.getCommissions(
      affiliateId,
      { status: status as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get my commissions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Affiliate Link Tracking (Public)
// ============================================================================

export const trackAffiliateClick: AsyncHandler = async (req, res, next) => {
  try {
    const { code } = req.params;
    
    const link = await affiliateRepo.getAffiliateLinkByCode(code);
    if (!link || !link.isActive) {
      res.status(404).json({ success: false, message: 'Link not found' });
      return;
    }

    // Record click (simplified - in production, check for unique clicks via cookies/fingerprinting)
    await affiliateRepo.recordLinkClick(link.affiliateLinkId, true);

    // Return destination URL for redirect
    res.json({ 
      success: true, 
      destinationUrl: link.destinationUrl,
      affiliateId: link.affiliateId
    });
  } catch (error: any) {
    console.error('Track affiliate click error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Referrals (Public)
// ============================================================================

export const getMyReferrals: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    if (!customerId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const referrals = await affiliateRepo.getReferralsByReferrer(customerId);
    res.json({ success: true, data: referrals });
  } catch (error: any) {
    console.error('Get my referrals error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createReferral: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    if (!customerId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Generate referral code
    const referralCode = `REF${customerId.substring(0, 8).toUpperCase()}`;

    const referral = await affiliateRepo.createReferral({
      referrerId: customerId,
      referralCode,
      referredEmail: req.body.email,
      referredFirstName: req.body.firstName,
      source: req.body.source || 'manual',
      channel: req.body.channel,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined
    });

    res.status(201).json({ success: true, data: referral });
  } catch (error: any) {
    console.error('Create referral error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const validateReferralCode: AsyncHandler = async (req, res, next) => {
  try {
    const { code } = req.params;
    
    const referral = await affiliateRepo.getReferralByCode(code);
    if (!referral) {
      res.status(404).json({ success: false, valid: false, message: 'Invalid or expired referral code' });
      return;
    }

    res.json({ 
      success: true, 
      valid: true,
      referralId: referral.referralId
    });
  } catch (error: any) {
    console.error('Validate referral code error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
