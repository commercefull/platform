/**
 * Product Business Router
 * Defines API routes for business/admin product operations
 */

import express from 'express';
import * as productController from '../controllers/ProductBusinessController';
import * as bundleController from '../controllers/BundleController';
import attributeController from '../controllers/AttributeController';
import attributeGroupController from '../controllers/AttributeGroupController';
import productTypeController from '../controllers/ProductTypeController';
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

// ============================================================================
// Product Type Routes
// ============================================================================

router.get('/product-types', productTypeController.listProductTypes.bind(productTypeController));
router.get('/product-types/:id', productTypeController.getProductType.bind(productTypeController));
router.get('/product-types/slug/:slug', productTypeController.getProductTypeBySlug.bind(productTypeController));
router.post('/product-types', productTypeController.createProductType.bind(productTypeController));
router.put('/product-types/:id', productTypeController.updateProductType.bind(productTypeController));
router.delete('/product-types/:id', productTypeController.deleteProductType.bind(productTypeController));
router.get('/product-types/:id/attributes', productTypeController.getProductTypeAttributes.bind(productTypeController));

// ============================================================================
// Attribute Group Routes
// ============================================================================

router.get('/attribute-groups', attributeGroupController.listAttributeGroups.bind(attributeGroupController));
router.get('/attribute-groups/:id', attributeGroupController.getAttributeGroup.bind(attributeGroupController));
router.get('/attribute-groups/code/:code', attributeGroupController.getAttributeGroupByCode.bind(attributeGroupController));
router.post('/attribute-groups', attributeGroupController.createAttributeGroup.bind(attributeGroupController));
router.put('/attribute-groups/:id', attributeGroupController.updateAttributeGroup.bind(attributeGroupController));
router.delete('/attribute-groups/:id', attributeGroupController.deleteAttributeGroup.bind(attributeGroupController));

// ============================================================================
// Attribute Routes
// ============================================================================

router.get('/attributes', attributeController.listAttributes.bind(attributeController));
router.get('/attributes/:id', attributeController.getAttribute.bind(attributeController));
router.get('/attributes/code/:code', attributeController.getAttributeByCode.bind(attributeController));
router.post('/attributes', attributeController.createAttribute.bind(attributeController));
router.put('/attributes/:id', attributeController.updateAttribute.bind(attributeController));
router.delete('/attributes/:id', attributeController.deleteAttribute.bind(attributeController));

// Attribute Values
router.get('/attributes/:id/values', attributeController.getAttributeValues.bind(attributeController));
router.post('/attributes/:id/values', attributeController.addAttributeValue.bind(attributeController));
router.delete('/attributes/:id/values/:valueId', attributeController.removeAttributeValue.bind(attributeController));

// Product Attributes
router.get('/products/:productId/attributes', attributeController.getProductAttributes.bind(attributeController));
router.post('/products/:productId/attributes', attributeController.setProductAttribute.bind(attributeController));
router.put('/products/:productId/attributes', attributeController.setProductAttributes.bind(attributeController));
router.delete('/products/:productId/attributes/:attributeId', attributeController.removeProductAttribute.bind(attributeController));

export const productBusinessRouter = router;
