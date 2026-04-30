/**
 * Product Business Router
 * Defines API routes for business/admin product operations
 */

import express from 'express';
import * as productController from '../controllers/ProductBusinessController';
import * as bundleController from '../controllers/BundleController';
import * as categoryController from '../controllers/CategoryBusinessController';
import attributeController from '../controllers/AttributeController';
import attributeGroupController from '../controllers/AttributeGroupController';
import attributeOptionController from '../controllers/AttributeOptionController';
import attributeSetController from '../controllers/AttributeSetController';
import productTypeController from '../controllers/ProductTypeController';
import { isMerchantLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// Apply authentication middleware
router.use(isMerchantLoggedIn);

// ============================================================================
// Category Routes (Business)
// ============================================================================

router.get('/categories/root', categoryController.getRootCategories);
router.get('/categories', categoryController.listCategories);
router.post('/categories', categoryController.createCategory);
router.get('/categories/:id/children', categoryController.getCategoryChildren);
router.get('/categories/slug/:slug', categoryController.getCategoryBySlug);
router.get('/categories/:id', categoryController.getCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

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
 * Get product store availability
 * GET /business/products/:productId/store-availability
 */
router.get('/products/:productId/store-availability', productController.getProductStoreAvailability);

/**
 * Find product by variant barcode
 * GET /business/products/barcode/:barcode
 */
router.get('/products/barcode/:barcode', productController.findByBarcode);

/**
 * Flat variant routes — must be before /:productId to avoid collision
 */
router.get('/products/variants/:variantId', productController.getProductVariant);
router.put('/products/variants/:variantId', productController.updateProductVariant);
router.patch('/products/variants/:variantId/inventory', productController.updateVariantInventory);
router.delete('/products/variants/:variantId', productController.deleteProductVariant);

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
// Variant Routes
// ============================================================================

router.get('/products/:productId/variants', productController.getProductVariants);
router.post('/products/:productId/variants', productController.createProductVariant);
router.get('/products/:productId/variants/:variantId', productController.getProductVariant);
router.put('/products/:productId/variants/:variantId', productController.updateProductVariant);
router.delete('/products/:productId/variants/:variantId', productController.deleteProductVariant);

// ============================================================================
// Image/Media Routes
// ============================================================================

router.get('/products/:productId/images', productController.getProductImages);
router.post('/products/:productId/images', productController.addProductImage);
router.put('/products/:productId/images/:imageId', productController.updateProductImage);
router.delete('/products/:productId/images/:imageId', productController.deleteProductImage);
router.post('/products/:productId/images/reorder', productController.reorderProductImages);

// ============================================================================
// Review Management Routes (Admin)
// ============================================================================

router.get('/reviews', productController.listReviews);
router.get('/reviews/:reviewId', productController.getReview);
router.put('/reviews/:reviewId/approve', productController.approveReview);
router.put('/reviews/:reviewId/reject', productController.rejectReview);
router.post('/reviews/:reviewId/respond', productController.respondToReview);
router.delete('/reviews/:reviewId', productController.deleteReview);

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
// Attribute Set Routes
// ============================================================================

router.get('/attribute-sets', attributeSetController.listAttributeSets.bind(attributeSetController));
router.get('/attribute-sets/:id', attributeSetController.getAttributeSet.bind(attributeSetController));
router.post('/attribute-sets', attributeSetController.createAttributeSet.bind(attributeSetController));
router.put('/attribute-sets/:id', attributeSetController.updateAttributeSet.bind(attributeSetController));
router.delete('/attribute-sets/:id', attributeSetController.deleteAttributeSet.bind(attributeSetController));
router.post('/attribute-sets/:id/attributes', attributeSetController.addAttributeToSet.bind(attributeSetController));
router.delete('/attribute-sets/:id/attributes/:attributeId', attributeSetController.removeAttributeFromSet.bind(attributeSetController));
router.post('/attribute-sets/:id/attributes/reorder', attributeSetController.reorderAttributes.bind(attributeSetController));

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
router.get('/attributes/code/:code', attributeController.getAttributeByCode.bind(attributeController));
router.get('/attributes/group/:groupId', attributeController.listAttributesByGroup.bind(attributeController));
router.get('/attributes/:id', attributeController.getAttribute.bind(attributeController));
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

// ============================================================================
// Attribute Option Routes
// ============================================================================

router.get('/attribute-options/attribute/:attributeId/value/:value', attributeOptionController.getOptionByValue.bind(attributeOptionController));
router.get('/attribute-options/attribute/:attributeId', attributeOptionController.getOptionsByAttribute.bind(attributeOptionController));
router.get('/attribute-options/:id', attributeOptionController.getAttributeOption.bind(attributeOptionController));
router.post('/attribute-options', attributeOptionController.createAttributeOption.bind(attributeOptionController));
router.put('/attribute-options/:id', attributeOptionController.updateAttributeOption.bind(attributeOptionController));
router.delete('/attribute-options/:id', attributeOptionController.deleteAttributeOption.bind(attributeOptionController));

// ============================================================================
// Q&A Routes (Business)
// ============================================================================

router.get('/products/:productId/qa', productController.listProductQa);
router.patch('/products/:productId/qa/:qaId/status', productController.updateQaStatus);

// ============================================================================
// Review Media Routes (Business)
// ============================================================================

router.get('/products/:productId/reviews/media', productController.listReviewMedia);
router.delete('/products/:productId/reviews/media/:mediaId', productController.deleteReviewMedia);

// ============================================================================
// Collection Routes (Business)
// ============================================================================

router.get('/collections', productController.listCollections);
router.post('/collections', productController.createCollection);
router.put('/collections/:collectionId', productController.updateCollection);
router.delete('/collections/:collectionId', productController.deleteCollection);

export const productBusinessRouter = router;
