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
router.get('/search', productController.searchProducts);

/**
 * Get featured products
 * GET /api/products/featured
 */
router.get('/featured', productController.getFeaturedProducts);

/**
 * Get products by category
 * GET /api/products/category/:categoryId
 */
router.get('/category/:categoryId', productController.getProductsByCategory);

/**
 * List products
 * GET /api/products
 */
router.get('/', productController.listProducts);

/**
 * Get related products
 * GET /api/products/:productId/related
 */
router.get('/:productId/related', productController.getRelatedProducts);

/**
 * Get product by ID or slug
 * GET /api/products/:identifier
 */
router.get('/:identifier', productController.getProduct);

// ============================================================================
// Bundle Routes
// ============================================================================

router.get('/bundles', bundleController.getActiveBundles);
router.get('/bundles/:id', bundleController.getBundleDetails);
router.get('/bundles/product/:productId', bundleController.getBundleByProduct);
router.post('/bundles/:id/calculate', bundleController.calculateBundlePrice);

export const productCustomerRouter = router;
export default router;
