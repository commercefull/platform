/**
 * Product Customer Router
 * Defines API routes for customer-facing product operations
 */

import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import * as productController from '../controllers/ProductCustomerController';
import * as bundleController from '../controllers/BundleController';
import productSearchController from '../controllers/ProductSearchController';
import { isCustomerLoggedIn, optionalCustomerAuth } from '../../../../libs/auth';

const router = express.Router();

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
router.get('/products/barcode/:barcode', asyncHandler(productController.findByBarcode));

/**
 * Get featured products
 * GET /products/featured
 */
router.get('/products/featured', asyncHandler(productController.getFeaturedProducts));

/**
 * Get products by category
 * GET /products/category/:categoryId
 */
router.get('/products/category/:categoryId', asyncHandler(productController.getProductsByCategory));

/**
 * List products
 * GET /products
 */
router.get('/products', asyncHandler(productController.listProducts));

/**
 * Get related products
 * GET /products/:productId/related
 */
router.get('/products/:productId/related', asyncHandler(productController.getRelatedProducts));

// ============================================================================
// Review Routes (Customer)
// ============================================================================

router.get('/products/:productId/reviews', asyncHandler(productController.getProductReviews));
router.post('/products/:productId/reviews', optionalCustomerAuth, asyncHandler(productController.createReview));
router.post('/reviews/:reviewId/helpful', optionalCustomerAuth, asyncHandler(productController.markReviewHelpful));
router.post('/reviews/:reviewId/report', optionalCustomerAuth, asyncHandler(productController.reportReview));

// ============================================================================
// Q&A Routes (Customer)
// ============================================================================

router.get('/products/:productId/qa', asyncHandler(productController.listProductQaCustomer));
router.post('/products/:productId/qa', asyncHandler(productController.submitProductQa));

// ============================================================================
// Review Vote Routes (Customer)
// ============================================================================

router.post('/products/:productId/reviews/:reviewId/vote', isCustomerLoggedIn, asyncHandler(productController.voteOnReview));

// ============================================================================
// Bundle Routes
// ============================================================================

router.get('/products/bundles', asyncHandler(bundleController.getActiveBundles));
router.get('/products/bundles/product/:productId', asyncHandler(bundleController.getBundleByProduct));
router.get('/products/bundles/:id', asyncHandler(bundleController.getBundleDetails));
router.post('/products/bundles/:id/calculate', asyncHandler(bundleController.calculateBundlePrice));

// ============================================================================
// Configurable Product Routes (Customer)
// ============================================================================

router.post('/products/:productId/configure', asyncHandler(productController.configureVariant));

// ============================================================================
// Product Download Routes (Customer)
// ============================================================================

router.get('/products/:productId/downloads', asyncHandler(productController.getProductDownloads));

/**
 * Get product availability
 * GET /products/:productId/availability
 */
router.get('/products/:productId/availability', asyncHandler(productController.getProductAvailability));

/**
 * Get product by ID or slug
 * GET /products/:identifier
 */
router.get('/products/:identifier', asyncHandler(productController.getProduct));

export const productCustomerRouter = router;
