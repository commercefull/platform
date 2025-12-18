/**
 * Marketing Business Router
 * 
 * Routes for admin/merchant marketing operations.
 * Mounted at /business/marketing
 */

import { Router } from 'express';
import { isMerchantLoggedIn } from '../../libs/auth';
import {
  // Email Campaigns
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignRecipients,
  addCampaignRecipients,
  // Email Templates
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  // Abandoned Carts
  getAbandonedCarts,
  getAbandonedCart,
  getAbandonedCartStats,
  // Product Recommendations
  getRecommendations,
  createRecommendation,
  deleteRecommendation,
  computeRecommendations,
  getProductViewStats,
  // Affiliates
  getAffiliates,
  getAffiliate,
  updateAffiliate,
  approveAffiliate,
  rejectAffiliate,
  suspendAffiliate,
  getAffiliateCommissions,
  approveCommission,
  rejectCommission
} from './controllers/marketingBusinessController';

const router = Router();

router.use(isMerchantLoggedIn);

// ============================================================================
// Email Campaign Routes
// ============================================================================

router.get('/marketing/campaigns', getCampaigns);
router.get('/marketing/campaigns/:id', getCampaign);
router.post('/marketing/campaigns', createCampaign);
router.put('/marketing/campaigns/:id', updateCampaign);
router.delete('/marketing/campaigns/:id', deleteCampaign);
router.get('/marketing/campaigns/:id/recipients', getCampaignRecipients);
router.post('/marketing/campaigns/:id/recipients', addCampaignRecipients);

// ============================================================================
// Email Template Routes
// ============================================================================

router.get('/marketing/templates', getTemplates);
router.get('/marketing/templates/:id', getTemplate);
router.post('/marketing/templates', createTemplate);
router.put('/marketing/templates/:id', updateTemplate);
router.delete('/marketing/templates/:id', deleteTemplate);

// ============================================================================
// Abandoned Cart Routes
// ============================================================================

router.get('/marketing/abandoned-carts', getAbandonedCarts);
router.get('/marketing/abandoned-carts/stats', getAbandonedCartStats);
router.get('/marketing/abandoned-carts/:id', getAbandonedCart);

// ============================================================================
// Product Recommendation Routes
// ============================================================================

router.get('/marketing/recommendations', getRecommendations);
router.post('/marketing/recommendations', createRecommendation);
router.delete('/marketing/recommendations/:id', deleteRecommendation);
router.post('/marketing/recommendations/compute', computeRecommendations);
router.get('/marketing/products/:productId/view-stats', getProductViewStats);

// ============================================================================
// Affiliate Routes
// ============================================================================

router.get('/marketing/affiliates', getAffiliates);
router.get('/marketing/affiliates/:id', getAffiliate);
router.put('/marketing/affiliates/:id', updateAffiliate);
router.post('/marketing/affiliates/:id/approve', approveAffiliate);
router.post('/marketing/affiliates/:id/reject', rejectAffiliate);
router.post('/marketing/affiliates/:id/suspend', suspendAffiliate);
router.get('/marketing/affiliates/:id/commissions', getAffiliateCommissions);
router.post('/marketing/commissions/:commissionId/approve', approveCommission);
router.post('/marketing/commissions/:commissionId/reject', rejectCommission);

export const marketingBusinessRouter = router;
