import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import attributeController from '../controllers/AttributeController';
import productSearchController from '../controllers/ProductSearchController';
import productTypeController from '../controllers/ProductTypeController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// ==================== PRODUCT SEARCH (Public) ====================

// Search products with filters and facets
router.get('/products/search', asyncHandler(productSearchController.search.bind(productSearchController)));
router.post('/products/search', asyncHandler(productSearchController.searchPost.bind(productSearchController)));

// Get search suggestions for autocomplete
router.get('/products/search/suggestions', asyncHandler(productSearchController.getSuggestions.bind(productSearchController)));

// Find products by attribute
router.get('/products/by-attribute/:code/:value', asyncHandler(productSearchController.findByAttribute.bind(productSearchController)));

// Find similar products
router.get('/products/:productId/similar', asyncHandler(productSearchController.findSimilar.bind(productSearchController)));

// ==================== PRODUCT TYPES (Business) ====================

// List all product types
router.get('/product-types', isOrganizationLoggedIn, asyncHandler(productTypeController.listProductTypes.bind(productTypeController)));

// Get product type by ID
router.get('/product-types/:id', isOrganizationLoggedIn, asyncHandler(productTypeController.getProductType.bind(productTypeController)));

// Get product type by slug
router.get('/product-types/slug/:slug', isOrganizationLoggedIn, asyncHandler(productTypeController.getProductTypeBySlug.bind(productTypeController)));

// Create product type
router.post('/product-types', isOrganizationLoggedIn, asyncHandler(productTypeController.createProductType.bind(productTypeController)));

// Update product type
router.put('/product-types/:id', isOrganizationLoggedIn, asyncHandler(productTypeController.updateProductType.bind(productTypeController)));

// Delete product type
router.delete('/product-types/:id', isOrganizationLoggedIn, asyncHandler(productTypeController.deleteProductType.bind(productTypeController)));

// Get attributes for a product type
router.get('/product-types/:id/attributes', isOrganizationLoggedIn, asyncHandler(productTypeController.getProductTypeAttributes.bind(productTypeController)));

// ==================== ATTRIBUTES (Business) ====================

// List all attributes
router.get('/attributes', isOrganizationLoggedIn, asyncHandler(attributeController.listAttributes.bind(attributeController)));

// Get attribute by ID
router.get('/attributes/:id', isOrganizationLoggedIn, asyncHandler(attributeController.getAttribute.bind(attributeController)));

// Get attribute by code
router.get('/attributes/code/:code', isOrganizationLoggedIn, asyncHandler(attributeController.getAttributeByCode.bind(attributeController)));

// Create attribute
router.post('/attributes', isOrganizationLoggedIn, asyncHandler(attributeController.createAttribute.bind(attributeController)));

// Update attribute
router.put('/attributes/:id', isOrganizationLoggedIn, asyncHandler(attributeController.updateAttribute.bind(attributeController)));

// Delete attribute
router.delete('/attributes/:id', isOrganizationLoggedIn, asyncHandler(attributeController.deleteAttribute.bind(attributeController)));

// ==================== ATTRIBUTE VALUES (Business) ====================

// Get attribute values
router.get('/attributes/:id/values', isOrganizationLoggedIn, asyncHandler(attributeController.getAttributeValues.bind(attributeController)));

// Add attribute value
router.post('/attributes/:id/values', isOrganizationLoggedIn, asyncHandler(attributeController.addAttributeValue.bind(attributeController)));

// Remove attribute value
router.delete('/attributes/:id/values/:valueId', isOrganizationLoggedIn, asyncHandler(attributeController.removeAttributeValue.bind(attributeController)));

// ==================== PRODUCT ATTRIBUTES (Business) ====================

// Get product attributes
router.get('/products/:productId/attributes', isOrganizationLoggedIn, asyncHandler(attributeController.getProductAttributes.bind(attributeController)));

// Set single product attribute
router.post('/products/:productId/attributes', isOrganizationLoggedIn, asyncHandler(attributeController.setProductAttribute.bind(attributeController)));

// Set multiple product attributes
router.put('/products/:productId/attributes', isOrganizationLoggedIn, asyncHandler(attributeController.setProductAttributes.bind(attributeController)));

// Remove product attribute
router.delete(
  '/products/:productId/attributes/:attributeId',
  isOrganizationLoggedIn,
  attributeController.removeProductAttribute.bind(attributeController),
);

export const attributeBusinessRouter = router;
