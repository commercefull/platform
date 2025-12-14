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
router.get('/marketing/products/:productId/recommendations', getProductRecommendations);
router.get('/marketing/products/:productId/frequently-bought-together', getFrequentlyBoughtTogether);
router.get('/marketing/products/:productId/similar', getSimilarProducts);

// Track product views
router.post('/marketing/product-views', recordProductView);
router.put('/marketing/product-views/:viewId', updateProductView);
router.get('/marketing/recently-viewed', getRecentlyViewed);

// Track recommendation clicks
router.post('/marketing/recommendations/:recommendationId/click', recordRecommendationClick);

// ============================================================================
// Affiliate Routes (Public)
// ============================================================================

// Affiliate link tracking (public, no auth)
router.get('/marketing/affiliate/:code', trackAffiliateClick);

// Affiliate program application
router.post('/marketing/affiliate/apply', applyForAffiliate);

// Affiliate dashboard (requires affiliate auth)
router.get('/marketing/affiliate/account', getMyAffiliateAccount);
router.get('/marketing/affiliate/links', getMyAffiliateLinks);
router.post('/marketing/affiliate/links', createAffiliateLink);
router.get('/marketing/affiliate/commissions', getMyCommissions);

// ============================================================================
// Referral Routes (Requires customer auth)
// ============================================================================

router.get('/marketing/referrals', getMyReferrals);
router.post('/marketing/referrals', createReferral);
router.get('/marketing/referrals/validate/:code', validateReferralCode);

export const marketingCustomerRouter = router;
