/**
 * Product Customer Router
 * Defines API routes for customer-facing product operations
 */

import express from 'express';
import * as productController from '../controllers/ProductCustomerController';
import * as bundleController from '../controllers/BundleController';
import productSearchController from '../controllers/ProductSearchController';

const router = express.Router();

// ============================================================================
// Public Product Routes
// ============================================================================

/**
 * Search products with advanced filters and facets
 * GET /customer/products/search
 */
router.get('/products/search', productSearchController.search.bind(productSearchController));

/**
 * Search products (POST for complex queries)
 * POST /customer/products/search
 */
router.post('/products/search', productSearchController.searchPost.bind(productSearchController));

/**
 * Get search suggestions for autocomplete
 * GET /customer/products/search/suggestions
 */
router.get('/products/search/suggestions', productSearchController.getSuggestions.bind(productSearchController));

/**
 * Find products by attribute
 * GET /customer/products/by-attribute/:code/:value
 */
router.get('/products/by-attribute/:code/:value', productSearchController.findByAttribute.bind(productSearchController));

/**
 * Find similar products
 * GET /customer/products/:productId/similar
 */
router.get('/products/:productId/similar', productSearchController.findSimilar.bind(productSearchController));

/**
 * Find product by variant barcode
 * GET /customer/products/barcode/:barcode
 */
router.get('/products/barcode/:barcode', productController.findByBarcode);

/**
 * Get featured products
 * GET /products/featured
 */
router.get('/products/featured', productController.getFeaturedProducts);

/**
 * Get products by category
 * GET /products/category/:categoryId
 */
router.get('/products/category/:categoryId', productController.getProductsByCategory);

/**
 * List products
 * GET /products
 */
router.get('/products', productController.listProducts);

/**
 * Get related products
 * GET /products/:productId/related
 */
router.get('/products/:productId/related', productController.getRelatedProducts);

// ============================================================================
// Review Routes (Customer)
// ============================================================================

router.get('/products/:productId/reviews', productController.getProductReviews);
router.post('/products/:productId/reviews', productController.createReview);
router.post('/reviews/:reviewId/helpful', productController.markReviewHelpful);
router.post('/reviews/:reviewId/report', productController.reportReview);

/**
 * Get product by ID or slug
 * GET /products/:identifier
 */
router.get('/products/:identifier', productController.getProduct);

// ============================================================================
// Bundle Routes
// ============================================================================

router.get('/products/bundles', bundleController.getActiveBundles);
router.get('/products/bundles/:id', bundleController.getBundleDetails);
router.get('/products/bundles/product/:productId', bundleController.getBundleByProduct);
router.post('/products/bundles/:id/calculate', bundleController.calculateBundlePrice);

export const productCustomerRouter = router;
