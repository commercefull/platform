/**
 * Marketing Customer Router
 * Routes for customer-facing marketing operations
 */

import { Router } from 'express';
import {
  // Product Recommendations
  getProductRecommendations,
  getFrequentlyBoughtTogether,
  getSimilarProducts,
  recordProductView,
  updateProductView,
  getRecentlyViewed,
  recordRecommendationClick,
  // Affiliate Program
  applyForAffiliate,
  getMyAffiliateAccount,
  getMyAffiliateLinks,
  createAffiliateLink,
  getMyCommissions,
  trackAffiliateClick,
  // Referrals
  getMyReferrals,
  createReferral,
  validateReferralCode
} from './controllers/marketingCustomerController';

const router = Router();

// ============================================================================
// Product Recommendation Routes (Public)
// ============================================================================

// Get recommendations for a product
router.get('/products/:productId/recommendations', getProductRecommendations);
router.get('/products/:productId/frequently-bought-together', getFrequentlyBoughtTogether);
router.get('/products/:productId/similar', getSimilarProducts);

// Track product views
router.post('/product-views', recordProductView);
router.put('/product-views/:viewId', updateProductView);
router.get('/recently-viewed', getRecentlyViewed);

// Track recommendation clicks
router.post('/recommendations/:recommendationId/click', recordRecommendationClick);

// ============================================================================
// Affiliate Routes (Public)
// ============================================================================

// Affiliate link tracking (public, no auth)
router.get('/affiliate/:code', trackAffiliateClick);

// Affiliate program application
router.post('/affiliate/apply', applyForAffiliate);

// Affiliate dashboard (requires affiliate auth)
router.get('/affiliate/account', getMyAffiliateAccount);
router.get('/affiliate/links', getMyAffiliateLinks);
router.post('/affiliate/links', createAffiliateLink);
router.get('/affiliate/commissions', getMyCommissions);

// ============================================================================
// Referral Routes (Requires customer auth)
// ============================================================================

router.get('/referrals', getMyReferrals);
router.post('/referrals', createReferral);
router.get('/referrals/validate/:code', validateReferralCode);

export const marketingCustomerRouter = router;
export default router;
