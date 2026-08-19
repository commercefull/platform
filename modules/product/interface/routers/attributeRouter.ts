import express from 'express';
import attributeController from '../controllers/AttributeController';
import productSearchController from '../controllers/ProductSearchController';
import productTypeController from '../controllers/ProductTypeController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// ==================== PRODUCT SEARCH (Public) ====================

// Search products with filters and facets
router.get('/products/search', productSearchController.search.bind(productSearchController));
router.post('/products/search', productSearchController.searchPost.bind(productSearchController));

// Get search suggestions for autocomplete
router.get('/products/search/suggestions', productSearchController.getSuggestions.bind(productSearchController));

// Find products by attribute
router.get('/products/by-attribute/:code/:value', productSearchController.findByAttribute.bind(productSearchController));

// Find similar products
router.get('/products/:productId/similar', productSearchController.findSimilar.bind(productSearchController));

// ==================== PRODUCT TYPES (Business) ====================

// List all product types
router.get('/product-types', isOrganizationLoggedIn, productTypeController.listProductTypes.bind(productTypeController));

// Get product type by ID
router.get('/product-types/:id', isOrganizationLoggedIn, productTypeController.getProductType.bind(productTypeController));

// Get product type by slug
router.get('/product-types/slug/:slug', isOrganizationLoggedIn, productTypeController.getProductTypeBySlug.bind(productTypeController));

// Create product type
router.post('/product-types', isOrganizationLoggedIn, productTypeController.createProductType.bind(productTypeController));

// Update product type
router.put('/product-types/:id', isOrganizationLoggedIn, productTypeController.updateProductType.bind(productTypeController));

// Delete product type
router.delete('/product-types/:id', isOrganizationLoggedIn, productTypeController.deleteProductType.bind(productTypeController));

// Get attributes for a product type
router.get('/product-types/:id/attributes', isOrganizationLoggedIn, productTypeController.getProductTypeAttributes.bind(productTypeController));

// ==================== ATTRIBUTES (Business) ====================

// List all attributes
router.get('/attributes', isOrganizationLoggedIn, attributeController.listAttributes.bind(attributeController));

// Get attribute by ID
router.get('/attributes/:id', isOrganizationLoggedIn, attributeController.getAttribute.bind(attributeController));

// Get attribute by code
router.get('/attributes/code/:code', isOrganizationLoggedIn, attributeController.getAttributeByCode.bind(attributeController));

// Create attribute
router.post('/attributes', isOrganizationLoggedIn, attributeController.createAttribute.bind(attributeController));

// Update attribute
router.put('/attributes/:id', isOrganizationLoggedIn, attributeController.updateAttribute.bind(attributeController));

// Delete attribute
router.delete('/attributes/:id', isOrganizationLoggedIn, attributeController.deleteAttribute.bind(attributeController));

// ==================== ATTRIBUTE VALUES (Business) ====================

// Get attribute values
router.get('/attributes/:id/values', isOrganizationLoggedIn, attributeController.getAttributeValues.bind(attributeController));

// Add attribute value
router.post('/attributes/:id/values', isOrganizationLoggedIn, attributeController.addAttributeValue.bind(attributeController));

// Remove attribute value
router.delete('/attributes/:id/values/:valueId', isOrganizationLoggedIn, attributeController.removeAttributeValue.bind(attributeController));

// ==================== PRODUCT ATTRIBUTES (Business) ====================

// Get product attributes
router.get('/products/:productId/attributes', isOrganizationLoggedIn, attributeController.getProductAttributes.bind(attributeController));

// Set single product attribute
router.post('/products/:productId/attributes', isOrganizationLoggedIn, attributeController.setProductAttribute.bind(attributeController));

// Set multiple product attributes
router.put('/products/:productId/attributes', isOrganizationLoggedIn, attributeController.setProductAttributes.bind(attributeController));

// Remove product attribute
router.delete(
  '/products/:productId/attributes/:attributeId',
  isOrganizationLoggedIn,
  attributeController.removeProductAttribute.bind(attributeController),
);

export const attributeBusinessRouter = router;
