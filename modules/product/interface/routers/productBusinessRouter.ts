/**
 * Product Business Router
 * Defines API routes for business/admin product operations
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  addProductImage,
  applyAttributeSet,
  approveReview,
  configureVariant,
  createDownload,
  createProduct,
  createProductVariant,
  createRelationship,
  deleteDownload,
  deleteProduct,
  deleteProductImage,
  deleteProductVariant,
  deleteRelationship,
  deleteReview,
  deleteReviewMedia,
  findByBarcode,
  getProduct,
  getProductImages,
  getProductStoreAvailability,
  getProductVariant,
  getProductVariants,
  getReview,
  getVariantMatrix,
  listDownloads,
  listGroupedChildren,
  listProductQa,
  listProducts,
  listRelationships,
  listReviewMedia,
  listReviews,
  publishProduct,
  rejectReview,
  reorderProductImages,
  reorderRelationships,
  respondToReview,
  unpublishProduct,
  updateDownload,
  updateProduct,
  updateProductImage,
  updateProductStatus,
  updateProductVariant,
  updateProductVisibility,
  updateQaStatus,
  updateVariantInventory,
} from '../controllers/ProductBusinessController';
import {
  addBundleItem,
  createBundle,
  deleteBundle,
  deleteBundleItem,
  getBundle,
  getBundles,
  updateBundle,
  updateBundleItem,
} from '../controllers/BundleController';
import {
  createCategory,
  deleteCategory,
  getCategory,
  getCategoryBySlug,
  getCategoryChildren,
  getRootCategories,
  listCategories,
  updateCategory,
} from '../controllers/CategoryBusinessController';
import attributeController from '../controllers/AttributeController';
import attributeGroupController from '../controllers/AttributeGroupController';
import attributeOptionController from '../controllers/AttributeOptionController';
import attributeSetController from '../controllers/AttributeSetController';
import productTypeController from '../controllers/ProductTypeController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = createHttpRouter();

// Apply authentication middleware
router.use(isOrganizationLoggedIn);

// ============================================================================
// Category Routes (Business)
// ============================================================================

router.get('/categories/root', asyncHandler(getRootCategories));
router.get('/categories', asyncHandler(listCategories));
router.post('/categories', asyncHandler(createCategory));
router.get('/categories/:id/children', asyncHandler(getCategoryChildren));
router.get('/categories/slug/:slug', asyncHandler(getCategoryBySlug));
router.get('/categories/:id', asyncHandler(getCategory));
router.put('/categories/:id', asyncHandler(updateCategory));
router.delete('/categories/:id', asyncHandler(deleteCategory));

// ============================================================================
// Business/Admin Product Routes
// ============================================================================

/**
 * List all products
 * GET /business/products
 */
router.get('/products', asyncHandler(listProducts));

/**
 * Create a new product
 * POST /business/products
 */
router.post('/products', asyncHandler(createProduct));

/**
 * Get product store availability
 * GET /business/products/:productId/store-availability
 */
router.get('/products/:productId/store-availability', asyncHandler(getProductStoreAvailability));

/**
 * Find product by variant barcode
 * GET /business/products/barcode/:barcode
 */
router.get('/products/barcode/:barcode', asyncHandler(findByBarcode));

/**
 * Flat variant routes — must be before /:productId to avoid collision
 */
router.get('/products/variants/:variantId', asyncHandler(getProductVariant));
router.put('/products/variants/:variantId', asyncHandler(updateProductVariant));
router.patch('/products/variants/:variantId/inventory', asyncHandler(updateVariantInventory));
router.delete('/products/variants/:variantId', asyncHandler(deleteProductVariant));

/**
 * Get product details
 * GET /business/products/:productId
 */
router.get('/products/:productId', asyncHandler(getProduct));

/**
 * Update a product
 * PUT /business/products/:productId
 */
router.put('/products/:productId', asyncHandler(updateProduct));

/**
 * Update product status
 * PUT /business/products/:productId/status
 */
router.put('/products/:productId/status', asyncHandler(updateProductStatus));

/**
 * Update product visibility
 * PUT /business/products/:productId/visibility
 */
router.put('/products/:productId/visibility', asyncHandler(updateProductVisibility));

/**
 * Publish a product
 * POST /business/products/:productId/publish
 */
router.post('/products/:productId/publish', asyncHandler(publishProduct));

/**
 * Unpublish a product
 * POST /business/products/:productId/unpublish
 */
router.post('/products/:productId/unpublish', asyncHandler(unpublishProduct));

/**
 * Delete a product
 * DELETE /business/products/:productId
 */
router.delete('/products/:productId', asyncHandler(deleteProduct));

// ============================================================================
// Variant Routes
// ============================================================================

router.get('/products/:productId/variants', asyncHandler(getProductVariants));
router.post('/products/:productId/variants', asyncHandler(createProductVariant));
router.get('/products/:productId/variants/:variantId', asyncHandler(getProductVariant));
router.put('/products/:productId/variants/:variantId', asyncHandler(updateProductVariant));
router.delete('/products/:productId/variants/:variantId', asyncHandler(deleteProductVariant));

// ============================================================================
// Image/Media Routes
// ============================================================================

router.get('/products/:productId/images', asyncHandler(getProductImages));
router.post('/products/:productId/images', asyncHandler(addProductImage));
router.put('/products/:productId/images/:imageId', asyncHandler(updateProductImage));
router.delete('/products/:productId/images/:imageId', asyncHandler(deleteProductImage));
router.post('/products/:productId/images/reorder', asyncHandler(reorderProductImages));

// ============================================================================
// Review Management Routes (Admin)
// ============================================================================

router.get('/reviews', asyncHandler(listReviews));
router.get('/reviews/:reviewId', asyncHandler(getReview));
router.put('/reviews/:reviewId/approve', asyncHandler(approveReview));
router.put('/reviews/:reviewId/reject', asyncHandler(rejectReview));
router.post('/reviews/:reviewId/respond', asyncHandler(respondToReview));
router.delete('/reviews/:reviewId', asyncHandler(deleteReview));

// ============================================================================
// Bundle Routes
// ============================================================================

router.get('/bundles', asyncHandler(getBundles));
router.get('/bundles/:id', asyncHandler(getBundle));
router.post('/bundles', asyncHandler(createBundle));
router.put('/bundles/:id', asyncHandler(updateBundle));
router.delete('/bundles/:id', asyncHandler(deleteBundle));
router.post('/bundles/:id/items', asyncHandler(addBundleItem));
router.put('/bundles/:id/items/:itemId', asyncHandler(updateBundleItem));
router.delete('/bundles/:id/items/:itemId', asyncHandler(deleteBundleItem));

// ============================================================================
// Product Type Routes
// ============================================================================

router.get('/product-types', asyncHandler(productTypeController.listProductTypes));
router.get('/product-types/:id', asyncHandler(productTypeController.getProductType));
router.get('/product-types/slug/:slug', asyncHandler(productTypeController.getProductTypeBySlug));
router.post('/product-types', asyncHandler(productTypeController.createProductType));
router.put('/product-types/:id', asyncHandler(productTypeController.updateProductType));
router.delete('/product-types/:id', asyncHandler(productTypeController.deleteProductType));
router.get('/product-types/:id/attributes', asyncHandler(productTypeController.getProductTypeAttributes));

// ============================================================================
// Attribute Set Routes
// ============================================================================

router.get('/attribute-sets', asyncHandler(attributeSetController.listAttributeSets));
router.get('/attribute-sets/:id', asyncHandler(attributeSetController.getAttributeSet));
router.post('/attribute-sets', asyncHandler(attributeSetController.createAttributeSet));
router.put('/attribute-sets/:id', asyncHandler(attributeSetController.updateAttributeSet));
router.delete('/attribute-sets/:id', asyncHandler(attributeSetController.deleteAttributeSet));
router.post('/attribute-sets/:id/attributes', asyncHandler(attributeSetController.addAttributeToSet));
router.delete('/attribute-sets/:id/attributes/:attributeId', asyncHandler(attributeSetController.removeAttributeFromSet));
router.post('/attribute-sets/:id/attributes/reorder', asyncHandler(attributeSetController.reorderAttributes));

// ============================================================================
// Attribute Group Routes
// ============================================================================

router.get('/attribute-groups', asyncHandler(attributeGroupController.listAttributeGroups));
router.get('/attribute-groups/:id', asyncHandler(attributeGroupController.getAttributeGroup));
router.get('/attribute-groups/code/:code', asyncHandler(attributeGroupController.getAttributeGroupByCode));
router.post('/attribute-groups', asyncHandler(attributeGroupController.createAttributeGroup));
router.put('/attribute-groups/:id', asyncHandler(attributeGroupController.updateAttributeGroup));
router.delete('/attribute-groups/:id', asyncHandler(attributeGroupController.deleteAttributeGroup));

// ============================================================================
// Attribute Routes
// ============================================================================

router.get('/attributes', asyncHandler(attributeController.listAttributes));
router.get('/attributes/code/:code', asyncHandler(attributeController.getAttributeByCode));
router.get('/attributes/group/:groupId', asyncHandler(attributeController.listAttributesByGroup));
router.get('/attributes/:id', asyncHandler(attributeController.getAttribute));
router.post('/attributes', asyncHandler(attributeController.createAttribute));
router.put('/attributes/:id', asyncHandler(attributeController.updateAttribute));
router.delete('/attributes/:id', asyncHandler(attributeController.deleteAttribute));

// Attribute Values
router.get('/attributes/:id/values', asyncHandler(attributeController.getAttributeValues));
router.post('/attributes/:id/values', asyncHandler(attributeController.addAttributeValue));
router.delete('/attributes/:id/values/:valueId', asyncHandler(attributeController.removeAttributeValue));

// Product Attributes
router.get('/products/:productId/attributes', asyncHandler(attributeController.getProductAttributes));
router.post('/products/:productId/attributes', asyncHandler(attributeController.setProductAttribute));
router.put('/products/:productId/attributes', asyncHandler(attributeController.setProductAttributes));
router.delete('/products/:productId/attributes/:attributeId', asyncHandler(attributeController.removeProductAttribute));

// ============================================================================
// Attribute Option Routes
// ============================================================================

router.get('/attribute-options/attribute/:attributeId/value/:value', asyncHandler(attributeOptionController.getOptionByValue));
router.get('/attribute-options/attribute/:attributeId', asyncHandler(attributeOptionController.getOptionsByAttribute));
router.get('/attribute-options/:id', asyncHandler(attributeOptionController.getAttributeOption));
router.post('/attribute-options', asyncHandler(attributeOptionController.createAttributeOption));
router.put('/attribute-options/:id', asyncHandler(attributeOptionController.updateAttributeOption));
router.delete('/attribute-options/:id', asyncHandler(attributeOptionController.deleteAttributeOption));

// ============================================================================
// Q&A Routes (Business)
// ============================================================================

router.get('/products/:productId/qa', asyncHandler(listProductQa));
router.patch('/products/:productId/qa/:qaId/status', asyncHandler(updateQaStatus));

// ============================================================================
// Review Media Routes (Business)
// ============================================================================

router.get('/products/:productId/reviews/media', asyncHandler(listReviewMedia));
router.delete('/products/:productId/reviews/media/:mediaId', asyncHandler(deleteReviewMedia));

// Collection routes moved to modules/assortment (/business/assortment/*)

// ============================================================================
// Download Routes (Business)
// ============================================================================

router.get('/products/:productId/downloads', asyncHandler(listDownloads));
router.post('/products/:productId/downloads', asyncHandler(createDownload));
router.put('/downloads/:downloadId', asyncHandler(updateDownload));
router.delete('/downloads/:downloadId', asyncHandler(deleteDownload));

// ============================================================================
// Product Relationship Routes (Business)
// ============================================================================

router.get('/products/:productId/relationships', asyncHandler(listRelationships));
router.post('/products/:productId/relationships', asyncHandler(createRelationship));
router.put('/products/:productId/relationships/reorder', asyncHandler(reorderRelationships));
// G6: kept under the /products topic prefix (was /business/relationships/:id)
router.delete('/products/relationships/:relationshipId', asyncHandler(deleteRelationship));

// ============================================================================
// Configurable Product Routes (Business)
// ============================================================================

router.get('/products/:productId/variant-matrix', asyncHandler(getVariantMatrix));
router.post('/products/:productId/configure', asyncHandler(configureVariant));

// ============================================================================
// Grouped Product Routes (Business)
// ============================================================================

router.get('/products/:productId/grouped-children', asyncHandler(listGroupedChildren));

// ============================================================================
// Attribute Set Application Route (Business)
// ============================================================================

router.post('/products/:productId/apply-attribute-set', asyncHandler(applyAttributeSet));

export const productBusinessRouter = router;
