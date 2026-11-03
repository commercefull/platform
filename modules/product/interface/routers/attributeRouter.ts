import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import attributeController from '../controllers/AttributeController';
import productSearchController from '../controllers/ProductSearchController';
import productTypeController from '../controllers/ProductTypeController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = createHttpRouter();

// ==================== PRODUCT SEARCH (Public) ====================

// Search products with filters and facets
router.get('/products/search', asyncHandler(productSearchController.search));
router.post('/products/search', asyncHandler(productSearchController.searchPost));

// Get search suggestions for autocomplete
router.get('/products/search/suggestions', asyncHandler(productSearchController.getSuggestions));

// Find products by attribute
router.get('/products/by-attribute/:code/:value', asyncHandler(productSearchController.findByAttribute));

// Find similar products
router.get('/products/:productId/similar', asyncHandler(productSearchController.findSimilar));

// ==================== PRODUCT TYPES (Business) ====================

// List all product types
router.get('/product-types', isOrganizationLoggedIn, asyncHandler(productTypeController.listProductTypes));

// Get product type by ID
router.get('/product-types/:id', isOrganizationLoggedIn, asyncHandler(productTypeController.getProductType));

// Get product type by slug
router.get('/product-types/slug/:slug', isOrganizationLoggedIn, asyncHandler(productTypeController.getProductTypeBySlug));

// Create product type
router.post('/product-types', isOrganizationLoggedIn, asyncHandler(productTypeController.createProductType));

// Update product type
router.put('/product-types/:id', isOrganizationLoggedIn, asyncHandler(productTypeController.updateProductType));

// Delete product type
router.delete('/product-types/:id', isOrganizationLoggedIn, asyncHandler(productTypeController.deleteProductType));

// Get attributes for a product type
router.get('/product-types/:id/attributes', isOrganizationLoggedIn, asyncHandler(productTypeController.getProductTypeAttributes));

// ==================== ATTRIBUTES (Business) ====================

// List all attributes
router.get('/attributes', isOrganizationLoggedIn, asyncHandler(attributeController.listAttributes));

// Get attribute by ID
router.get('/attributes/:id', isOrganizationLoggedIn, asyncHandler(attributeController.getAttribute));

// Get attribute by code
router.get('/attributes/code/:code', isOrganizationLoggedIn, asyncHandler(attributeController.getAttributeByCode));

// Create attribute
router.post('/attributes', isOrganizationLoggedIn, asyncHandler(attributeController.createAttribute));

// Update attribute
router.put('/attributes/:id', isOrganizationLoggedIn, asyncHandler(attributeController.updateAttribute));

// Delete attribute
router.delete('/attributes/:id', isOrganizationLoggedIn, asyncHandler(attributeController.deleteAttribute));

// ==================== ATTRIBUTE VALUES (Business) ====================

// Get attribute values
router.get('/attributes/:id/values', isOrganizationLoggedIn, asyncHandler(attributeController.getAttributeValues));

// Add attribute value
router.post('/attributes/:id/values', isOrganizationLoggedIn, asyncHandler(attributeController.addAttributeValue));

// Remove attribute value
router.delete('/attributes/:id/values/:valueId', isOrganizationLoggedIn, asyncHandler(attributeController.removeAttributeValue));

// ==================== PRODUCT ATTRIBUTES (Business) ====================

// Get product attributes
router.get('/products/:productId/attributes', isOrganizationLoggedIn, asyncHandler(attributeController.getProductAttributes));

// Set single product attribute
router.post('/products/:productId/attributes', isOrganizationLoggedIn, asyncHandler(attributeController.setProductAttribute));

// Set multiple product attributes
router.put('/products/:productId/attributes', isOrganizationLoggedIn, asyncHandler(attributeController.setProductAttributes));

// Remove product attribute
router.delete('/products/:productId/attributes/:attributeId', isOrganizationLoggedIn, attributeController.removeProductAttribute);

export const attributeBusinessRouter = router;
