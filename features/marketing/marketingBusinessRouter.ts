/**
 * Marketing Business Router
 * Routes for admin/merchant marketing operations
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

router.get('/campaigns', getCampaigns);
router.get('/campaigns/:id', getCampaign);
router.post('/campaigns', createCampaign);
router.put('/campaigns/:id', updateCampaign);
router.delete('/campaigns/:id', deleteCampaign);
router.get('/campaigns/:id/recipients', getCampaignRecipients);
router.post('/campaigns/:id/recipients', addCampaignRecipients);

// ============================================================================
// Email Template Routes
// ============================================================================

router.get('/templates', getTemplates);
router.get('/templates/:id', getTemplate);
router.post('/templates', createTemplate);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);

// ============================================================================
// Abandoned Cart Routes
// ============================================================================

router.get('/abandoned-carts', getAbandonedCarts);
router.get('/abandoned-carts/stats', getAbandonedCartStats);
router.get('/abandoned-carts/:id', getAbandonedCart);

// ============================================================================
// Product Recommendation Routes
// ============================================================================

router.get('/recommendations', getRecommendations);
router.post('/recommendations', createRecommendation);
router.delete('/recommendations/:id', deleteRecommendation);
router.post('/recommendations/compute', computeRecommendations);
router.get('/products/:productId/view-stats', getProductViewStats);

// ============================================================================
// Affiliate Routes
// ============================================================================

router.get('/affiliates', getAffiliates);
router.get('/affiliates/:id', getAffiliate);
router.put('/affiliates/:id', updateAffiliate);
router.post('/affiliates/:id/approve', approveAffiliate);
router.post('/affiliates/:id/reject', rejectAffiliate);
router.post('/affiliates/:id/suspend', suspendAffiliate);
router.get('/affiliates/:id/commissions', getAffiliateCommissions);
router.post('/commissions/:commissionId/approve', approveCommission);
router.post('/commissions/:commissionId/reject', rejectCommission);

export const marketingBusinessRouter = router;
export default router;
