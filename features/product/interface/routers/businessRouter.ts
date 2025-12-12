/**
 * Product Business Router
 * Defines API routes for business/admin product operations
 */

import express from 'express';
import * as productController from '../controllers/ProductBusinessController';
import * as bundleController from '../controllers/BundleController';
import { isMerchantLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// Apply authentication middleware
router.use(isMerchantLoggedIn);

// ============================================================================
// Business/Admin Product Routes
// ============================================================================

/**
 * List all products
 * GET /business/products
 */
router.get('/products', productController.listProducts);

/**
 * Create a new product
 * POST /business/products
 */
router.post('/products', productController.createProduct);

/**
 * Get product details
 * GET /business/products/:productId
 */
router.get('/products/:productId', productController.getProduct);

/**
 * Update a product
 * PUT /business/products/:productId
 */
router.put('/products/:productId', productController.updateProduct);

/**
 * Update product status
 * PUT /business/products/:productId/status
 */
router.put('/products/:productId/status', productController.updateProductStatus);

/**
 * Update product visibility
 * PUT /business/products/:productId/visibility
 */
router.put('/products/:productId/visibility', productController.updateProductVisibility);

/**
 * Publish a product
 * POST /business/products/:productId/publish
 */
router.post('/products/:productId/publish', productController.publishProduct);

/**
 * Unpublish a product
 * POST /business/products/:productId/unpublish
 */
router.post('/products/:productId/unpublish', productController.unpublishProduct);

/**
 * Delete a product
 * DELETE /business/products/:productId
 */
router.delete('/products/:productId', productController.deleteProduct);

// ============================================================================
// Bundle Routes
// ============================================================================

router.get('/bundles', bundleController.getBundles);
router.get('/bundles/:id', bundleController.getBundle);
router.post('/bundles', bundleController.createBundle);
router.put('/bundles/:id', bundleController.updateBundle);
router.delete('/bundles/:id', bundleController.deleteBundle);
router.post('/bundles/:id/items', bundleController.addBundleItem);
router.put('/bundles/:id/items/:itemId', bundleController.updateBundleItem);
router.delete('/bundles/:id/items/:itemId', bundleController.deleteBundleItem);

export const productBusinessRouter = router;
export default router;
