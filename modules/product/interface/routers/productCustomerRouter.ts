/**
 * Product Customer Router
 * Defines API routes for customer-facing product operations
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  configureVariant,
  createReview,
  findByBarcode,
  getFeaturedProducts,
  getProduct,
  getProductAvailability,
  getProductDownloads,
  getProductReviews,
  getProductsByCategory,
  getRelatedProducts,
  listProductQaCustomer,
  listProducts,
  markReviewHelpful,
  reportReview,
  submitProductQa,
  voteOnReview,
} from '../controllers/ProductCustomerController';
import {
  calculateBundlePrice,
  getActiveBundles,
  getBundleByProduct,
  getBundleDetails,
} from '../controllers/BundleController';
import productSearchController from '../controllers/ProductSearchController';
import { isCustomerLoggedIn, optionalCustomerAuth } from '../../../../libs/auth';

const router = createHttpRouter();

// ============================================================================
// Public Product Routes
// ============================================================================

/**
 * Search products with advanced filters and facets
 * GET /customer/products/search
 */
router.get('/products/search', asyncHandler(productSearchController.search.bind(productSearchController)));

/**
 * Search products (POST for complex queries)
 * POST /customer/products/search
 */
router.post('/products/search', asyncHandler(productSearchController.searchPost.bind(productSearchController)));

/**
 * Get search suggestions for autocomplete
 * GET /customer/products/search/suggestions
 */
router.get('/products/search/suggestions', asyncHandler(productSearchController.getSuggestions.bind(productSearchController)));

/**
 * Find products by attribute
 * GET /customer/products/by-attribute/:code/:value
 */
router.get('/products/by-attribute/:code/:value', asyncHandler(productSearchController.findByAttribute.bind(productSearchController)));

/**
 * Find similar products
 * GET /customer/products/:productId/similar
 */
router.get('/products/:productId/similar', asyncHandler(productSearchController.findSimilar.bind(productSearchController)));

/**
 * Find product by variant barcode
 * GET /customer/products/barcode/:barcode
 */
router.get('/products/barcode/:barcode', asyncHandler(findByBarcode));

/**
 * Get featured products
 * GET /products/featured
 */
router.get('/products/featured', asyncHandler(getFeaturedProducts));

/**
 * Get products by category
 * GET /products/category/:categoryId
 */
router.get('/products/category/:categoryId', asyncHandler(getProductsByCategory));

/**
 * List products
 * GET /products
 */
router.get('/products', asyncHandler(listProducts));

/**
 * Get related products
 * GET /products/:productId/related
 */
router.get('/products/:productId/related', asyncHandler(getRelatedProducts));

// ============================================================================
// Review Routes (Customer)
// ============================================================================

router.get('/products/:productId/reviews', asyncHandler(getProductReviews));
router.post('/products/:productId/reviews', optionalCustomerAuth, asyncHandler(createReview));
router.post('/reviews/:reviewId/helpful', optionalCustomerAuth, asyncHandler(markReviewHelpful));
router.post('/reviews/:reviewId/report', optionalCustomerAuth, asyncHandler(reportReview));

// ============================================================================
// Q&A Routes (Customer)
// ============================================================================

router.get('/products/:productId/qa', asyncHandler(listProductQaCustomer));
router.post('/products/:productId/qa', asyncHandler(submitProductQa));

// ============================================================================
// Review Vote Routes (Customer)
// ============================================================================

router.post('/products/:productId/reviews/:reviewId/vote', isCustomerLoggedIn, asyncHandler(voteOnReview));

// ============================================================================
// Bundle Routes
// ============================================================================

router.get('/products/bundles', asyncHandler(getActiveBundles));
router.get('/products/bundles/product/:productId', asyncHandler(getBundleByProduct));
router.get('/products/bundles/:id', asyncHandler(getBundleDetails));
router.post('/products/bundles/:id/calculate', asyncHandler(calculateBundlePrice));

// ============================================================================
// Configurable Product Routes (Customer)
// ============================================================================

router.post('/products/:productId/configure', asyncHandler(configureVariant));

// ============================================================================
// Product Download Routes (Customer)
// ============================================================================

router.get('/products/:productId/downloads', asyncHandler(getProductDownloads));

/**
 * Get product availability
 * GET /products/:productId/availability
 */
router.get('/products/:productId/availability', asyncHandler(getProductAvailability));

/**
 * Get product by ID or slug
 * GET /products/:identifier
 */
router.get('/products/:identifier', asyncHandler(getProduct));

export const productCustomerRouter = router;
