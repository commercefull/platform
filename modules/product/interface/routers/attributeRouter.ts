import express from 'express';
import attributeController from '../controllers/AttributeController';
import productSearchController from '../controllers/ProductSearchController';
import productTypeController from '../controllers/ProductTypeController';
import { isMerchantLoggedIn } from '../../../../libs/auth';

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
router.get('/product-types', isMerchantLoggedIn, productTypeController.listProductTypes.bind(productTypeController));

// Get product type by ID
router.get('/product-types/:id', isMerchantLoggedIn, productTypeController.getProductType.bind(productTypeController));

// Get product type by slug
router.get('/product-types/slug/:slug', isMerchantLoggedIn, productTypeController.getProductTypeBySlug.bind(productTypeController));

// Create product type
router.post('/product-types', isMerchantLoggedIn, productTypeController.createProductType.bind(productTypeController));

// Update product type
router.put('/product-types/:id', isMerchantLoggedIn, productTypeController.updateProductType.bind(productTypeController));

// Delete product type
router.delete('/product-types/:id', isMerchantLoggedIn, productTypeController.deleteProductType.bind(productTypeController));

// Get attributes for a product type
router.get('/product-types/:id/attributes', isMerchantLoggedIn, productTypeController.getProductTypeAttributes.bind(productTypeController));

// ==================== ATTRIBUTES (Business) ====================

// List all attributes
router.get('/attributes', isMerchantLoggedIn, attributeController.listAttributes.bind(attributeController));

// Get attribute by ID
router.get('/attributes/:id', isMerchantLoggedIn, attributeController.getAttribute.bind(attributeController));

// Get attribute by code
router.get('/attributes/code/:code', isMerchantLoggedIn, attributeController.getAttributeByCode.bind(attributeController));

// Create attribute
router.post('/attributes', isMerchantLoggedIn, attributeController.createAttribute.bind(attributeController));

// Update attribute
router.put('/attributes/:id', isMerchantLoggedIn, attributeController.updateAttribute.bind(attributeController));

// Delete attribute
router.delete('/attributes/:id', isMerchantLoggedIn, attributeController.deleteAttribute.bind(attributeController));

// ==================== ATTRIBUTE VALUES (Business) ====================

// Get attribute values
router.get('/attributes/:id/values', isMerchantLoggedIn, attributeController.getAttributeValues.bind(attributeController));

// Add attribute value
router.post('/attributes/:id/values', isMerchantLoggedIn, attributeController.addAttributeValue.bind(attributeController));

// Remove attribute value
router.delete('/attributes/:id/values/:valueId', isMerchantLoggedIn, attributeController.removeAttributeValue.bind(attributeController));

// ==================== PRODUCT ATTRIBUTES (Business) ====================

// Get product attributes
router.get('/products/:productId/attributes', isMerchantLoggedIn, attributeController.getProductAttributes.bind(attributeController));

// Set single product attribute
router.post('/products/:productId/attributes', isMerchantLoggedIn, attributeController.setProductAttribute.bind(attributeController));

// Set multiple product attributes
router.put('/products/:productId/attributes', isMerchantLoggedIn, attributeController.setProductAttributes.bind(attributeController));

// Remove product attribute
router.delete(
  '/products/:productId/attributes/:attributeId',
  isMerchantLoggedIn,
  attributeController.removeProductAttribute.bind(attributeController),
);

export const attributeBusinessRouter = router;
