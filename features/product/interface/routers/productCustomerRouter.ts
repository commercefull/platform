/**
 * Product Customer Router
 * Defines API routes for customer-facing product operations
 */

import express from 'express';
import * as productController from '../controllers/ProductCustomerController';
import * as bundleController from '../controllers/BundleController';

const router = express.Router();

// ============================================================================
// Public Product Routes
// ============================================================================

/**
 * Search products
 * GET /api/products/search
 */
router.get('/products/search', productController.searchProducts);

/**
 * Get featured products
 * GET /api/products/featured
 */
router.get('/products/featured', productController.getFeaturedProducts);

/**
 * Get products by category
 * GET /api/products/category/:categoryId
 */
router.get('/products/category/:categoryId', productController.getProductsByCategory);

/**
 * List products
 * GET /api/products
 */
router.get('/products', productController.listProducts);

/**
 * Get related products
 * GET /api/products/:productId/related
 */
router.get('/products/:productId/related', productController.getRelatedProducts);

/**
 * Get product by ID or slug
 * GET /api/products/:identifier
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
