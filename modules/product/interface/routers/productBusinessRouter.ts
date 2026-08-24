/**
 * Product Business Router
 * Defines API routes for business/admin product operations
 */

import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import * as productController from '../controllers/ProductBusinessController';
import * as bundleController from '../controllers/BundleController';
import * as categoryController from '../controllers/CategoryBusinessController';
import attributeController from '../controllers/AttributeController';
import attributeGroupController from '../controllers/AttributeGroupController';
import attributeOptionController from '../controllers/AttributeOptionController';
import attributeSetController from '../controllers/AttributeSetController';
import productTypeController from '../controllers/ProductTypeController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// Apply authentication middleware
router.use(isOrganizationLoggedIn);

// ============================================================================
// Category Routes (Business)
// ============================================================================

router.get('/categories/root', asyncHandler(categoryController.getRootCategories));
router.get('/categories', asyncHandler(categoryController.listCategories));
router.post('/categories', asyncHandler(categoryController.createCategory));
router.get('/categories/:id/children', asyncHandler(categoryController.getCategoryChildren));
router.get('/categories/slug/:slug', asyncHandler(categoryController.getCategoryBySlug));
router.get('/categories/:id', asyncHandler(categoryController.getCategory));
router.put('/categories/:id', asyncHandler(categoryController.updateCategory));
router.delete('/categories/:id', asyncHandler(categoryController.deleteCategory));

// ============================================================================
// Business/Admin Product Routes
// ============================================================================

/**
 * List all products
 * GET /business/products
 */
router.get('/products', asyncHandler(productController.listProducts));

/**
 * Create a new product
 * POST /business/products
 */
router.post('/products', asyncHandler(productController.createProduct));

/**
 * Get product store availability
 * GET /business/products/:productId/store-availability
 */
router.get('/products/:productId/store-availability', asyncHandler(productController.getProductStoreAvailability));

/**
 * Find product by variant barcode
 * GET /business/products/barcode/:barcode
 */
router.get('/products/barcode/:barcode', asyncHandler(productController.findByBarcode));

/**
 * Flat variant routes — must be before /:productId to avoid collision
 */
router.get('/products/variants/:variantId', asyncHandler(productController.getProductVariant));
router.put('/products/variants/:variantId', asyncHandler(productController.updateProductVariant));
router.patch('/products/variants/:variantId/inventory', asyncHandler(productController.updateVariantInventory));
router.delete('/products/variants/:variantId', asyncHandler(productController.deleteProductVariant));

/**
 * Get product details
 * GET /business/products/:productId
 */
router.get('/products/:productId', asyncHandler(productController.getProduct));

/**
 * Update a product
 * PUT /business/products/:productId
 */
router.put('/products/:productId', asyncHandler(productController.updateProduct));

/**
 * Update product status
 * PUT /business/products/:productId/status
 */
router.put('/products/:productId/status', asyncHandler(productController.updateProductStatus));

/**
 * Update product visibility
 * PUT /business/products/:productId/visibility
 */
router.put('/products/:productId/visibility', asyncHandler(productController.updateProductVisibility));

/**
 * Publish a product
 * POST /business/products/:productId/publish
 */
router.post('/products/:productId/publish', asyncHandler(productController.publishProduct));

/**
 * Unpublish a product
 * POST /business/products/:productId/unpublish
 */
router.post('/products/:productId/unpublish', asyncHandler(productController.unpublishProduct));

/**
 * Delete a product
 * DELETE /business/products/:productId
 */
router.delete('/products/:productId', asyncHandler(productController.deleteProduct));

// ============================================================================
// Variant Routes
// ============================================================================

router.get('/products/:productId/variants', asyncHandler(productController.getProductVariants));
router.post('/products/:productId/variants', asyncHandler(productController.createProductVariant));
router.get('/products/:productId/variants/:variantId', asyncHandler(productController.getProductVariant));
router.put('/products/:productId/variants/:variantId', asyncHandler(productController.updateProductVariant));
router.delete('/products/:productId/variants/:variantId', asyncHandler(productController.deleteProductVariant));

// ============================================================================
// Image/Media Routes
// ============================================================================

router.get('/products/:productId/images', asyncHandler(productController.getProductImages));
router.post('/products/:productId/images', asyncHandler(productController.addProductImage));
router.put('/products/:productId/images/:imageId', asyncHandler(productController.updateProductImage));
router.delete('/products/:productId/images/:imageId', asyncHandler(productController.deleteProductImage));
router.post('/products/:productId/images/reorder', asyncHandler(productController.reorderProductImages));

// ============================================================================
// Review Management Routes (Admin)
// ============================================================================

router.get('/reviews', asyncHandler(productController.listReviews));
router.get('/reviews/:reviewId', asyncHandler(productController.getReview));
router.put('/reviews/:reviewId/approve', asyncHandler(productController.approveReview));
router.put('/reviews/:reviewId/reject', asyncHandler(productController.rejectReview));
router.post('/reviews/:reviewId/respond', asyncHandler(productController.respondToReview));
router.delete('/reviews/:reviewId', asyncHandler(productController.deleteReview));

// ============================================================================
// Bundle Routes
// ============================================================================

router.get('/bundles', asyncHandler(bundleController.getBundles));
router.get('/bundles/:id', asyncHandler(bundleController.getBundle));
router.post('/bundles', asyncHandler(bundleController.createBundle));
router.put('/bundles/:id', asyncHandler(bundleController.updateBundle));
router.delete('/bundles/:id', asyncHandler(bundleController.deleteBundle));
router.post('/bundles/:id/items', asyncHandler(bundleController.addBundleItem));
router.put('/bundles/:id/items/:itemId', asyncHandler(bundleController.updateBundleItem));
router.delete('/bundles/:id/items/:itemId', asyncHandler(bundleController.deleteBundleItem));

// ============================================================================
// Product Type Routes
// ============================================================================

router.get('/product-types', asyncHandler(productTypeController.listProductTypes.bind(productTypeController)));
router.get('/product-types/:id', asyncHandler(productTypeController.getProductType.bind(productTypeController)));
router.get('/product-types/slug/:slug', asyncHandler(productTypeController.getProductTypeBySlug.bind(productTypeController)));
router.post('/product-types', asyncHandler(productTypeController.createProductType.bind(productTypeController)));
router.put('/product-types/:id', asyncHandler(productTypeController.updateProductType.bind(productTypeController)));
router.delete('/product-types/:id', asyncHandler(productTypeController.deleteProductType.bind(productTypeController)));
router.get('/product-types/:id/attributes', asyncHandler(productTypeController.getProductTypeAttributes.bind(productTypeController)));

// ============================================================================
// Attribute Set Routes
// ============================================================================

router.get('/attribute-sets', asyncHandler(attributeSetController.listAttributeSets.bind(attributeSetController)));
router.get('/attribute-sets/:id', asyncHandler(attributeSetController.getAttributeSet.bind(attributeSetController)));
router.post('/attribute-sets', asyncHandler(attributeSetController.createAttributeSet.bind(attributeSetController)));
router.put('/attribute-sets/:id', asyncHandler(attributeSetController.updateAttributeSet.bind(attributeSetController)));
router.delete('/attribute-sets/:id', asyncHandler(attributeSetController.deleteAttributeSet.bind(attributeSetController)));
router.post('/attribute-sets/:id/attributes', asyncHandler(attributeSetController.addAttributeToSet.bind(attributeSetController)));
router.delete('/attribute-sets/:id/attributes/:attributeId', asyncHandler(attributeSetController.removeAttributeFromSet.bind(attributeSetController)));
router.post('/attribute-sets/:id/attributes/reorder', asyncHandler(attributeSetController.reorderAttributes.bind(attributeSetController)));

// ============================================================================
// Attribute Group Routes
// ============================================================================

router.get('/attribute-groups', asyncHandler(attributeGroupController.listAttributeGroups.bind(attributeGroupController)));
router.get('/attribute-groups/:id', asyncHandler(attributeGroupController.getAttributeGroup.bind(attributeGroupController)));
router.get('/attribute-groups/code/:code', asyncHandler(attributeGroupController.getAttributeGroupByCode.bind(attributeGroupController)));
router.post('/attribute-groups', asyncHandler(attributeGroupController.createAttributeGroup.bind(attributeGroupController)));
router.put('/attribute-groups/:id', asyncHandler(attributeGroupController.updateAttributeGroup.bind(attributeGroupController)));
router.delete('/attribute-groups/:id', asyncHandler(attributeGroupController.deleteAttributeGroup.bind(attributeGroupController)));

// ============================================================================
// Attribute Routes
// ============================================================================

router.get('/attributes', asyncHandler(attributeController.listAttributes.bind(attributeController)));
router.get('/attributes/code/:code', asyncHandler(attributeController.getAttributeByCode.bind(attributeController)));
router.get('/attributes/group/:groupId', asyncHandler(attributeController.listAttributesByGroup.bind(attributeController)));
router.get('/attributes/:id', asyncHandler(attributeController.getAttribute.bind(attributeController)));
router.post('/attributes', asyncHandler(attributeController.createAttribute.bind(attributeController)));
router.put('/attributes/:id', asyncHandler(attributeController.updateAttribute.bind(attributeController)));
router.delete('/attributes/:id', asyncHandler(attributeController.deleteAttribute.bind(attributeController)));

// Attribute Values
router.get('/attributes/:id/values', asyncHandler(attributeController.getAttributeValues.bind(attributeController)));
router.post('/attributes/:id/values', asyncHandler(attributeController.addAttributeValue.bind(attributeController)));
router.delete('/attributes/:id/values/:valueId', asyncHandler(attributeController.removeAttributeValue.bind(attributeController)));

// Product Attributes
router.get('/products/:productId/attributes', asyncHandler(attributeController.getProductAttributes.bind(attributeController)));
router.post('/products/:productId/attributes', asyncHandler(attributeController.setProductAttribute.bind(attributeController)));
router.put('/products/:productId/attributes', asyncHandler(attributeController.setProductAttributes.bind(attributeController)));
router.delete('/products/:productId/attributes/:attributeId', asyncHandler(attributeController.removeProductAttribute.bind(attributeController)));

// ============================================================================
// Attribute Option Routes
// ============================================================================

router.get('/attribute-options/attribute/:attributeId/value/:value', asyncHandler(attributeOptionController.getOptionByValue.bind(attributeOptionController)));
router.get('/attribute-options/attribute/:attributeId', asyncHandler(attributeOptionController.getOptionsByAttribute.bind(attributeOptionController)));
router.get('/attribute-options/:id', asyncHandler(attributeOptionController.getAttributeOption.bind(attributeOptionController)));
router.post('/attribute-options', asyncHandler(attributeOptionController.createAttributeOption.bind(attributeOptionController)));
router.put('/attribute-options/:id', asyncHandler(attributeOptionController.updateAttributeOption.bind(attributeOptionController)));
router.delete('/attribute-options/:id', asyncHandler(attributeOptionController.deleteAttributeOption.bind(attributeOptionController)));

// ============================================================================
// Q&A Routes (Business)
// ============================================================================

router.get('/products/:productId/qa', asyncHandler(productController.listProductQa));
router.patch('/products/:productId/qa/:qaId/status', asyncHandler(productController.updateQaStatus));

// ============================================================================
// Review Media Routes (Business)
// ============================================================================

router.get('/products/:productId/reviews/media', asyncHandler(productController.listReviewMedia));
router.delete('/products/:productId/reviews/media/:mediaId', asyncHandler(productController.deleteReviewMedia));

// ============================================================================
// Collection Routes (Business)
// ============================================================================

router.get('/collections', asyncHandler(productController.listCollections));
router.post('/collections', asyncHandler(productController.createCollection));
router.put('/collections/:collectionId', asyncHandler(productController.updateCollection));
router.delete('/collections/:collectionId', asyncHandler(productController.deleteCollection));

// ============================================================================
// Download Routes (Business)
// ============================================================================

router.get('/products/:productId/downloads', asyncHandler(productController.listDownloads));
router.post('/products/:productId/downloads', asyncHandler(productController.createDownload));
router.put('/downloads/:downloadId', asyncHandler(productController.updateDownload));
router.delete('/downloads/:downloadId', asyncHandler(productController.deleteDownload));

// ============================================================================
// Product Relationship Routes (Business)
// ============================================================================

router.get('/products/:productId/relationships', asyncHandler(productController.listRelationships));
router.post('/products/:productId/relationships', asyncHandler(productController.createRelationship));
router.delete('/relationships/:relationshipId', asyncHandler(productController.deleteRelationship));

// ============================================================================
// Configurable Product Routes (Business)
// ============================================================================

router.get('/products/:productId/variant-matrix', asyncHandler(productController.getVariantMatrix));
router.post('/products/:productId/configure', asyncHandler(productController.configureVariant));

// ============================================================================
// Grouped Product Routes (Business)
// ============================================================================

router.get('/products/:productId/grouped-children', asyncHandler(productController.listGroupedChildren));

// ============================================================================
// Attribute Set Application Route (Business)
// ============================================================================

router.post('/products/:productId/apply-attribute-set', asyncHandler(productController.applyAttributeSet));

export const productBusinessRouter = router;
