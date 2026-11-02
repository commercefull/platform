import type { HttpRouter } from 'libs/http';
import { asyncHandler } from '../../../libs/asyncHandler';
import {
  createProduct,
  createProductCategory,
  createProductCategoryForm,
  createProductForm,
  createProductTag,
  deleteProduct,
  deleteProductCategory,
  deleteProductTag,
  deleteReviewMedia,
  editProductCategoryForm,
  editProductForm,
  listProductCategories,
  listProductPrices,
  listProductQa,
  listProductTags,
  listProducts,
  listReviewMedia,
  publishProduct,
  unpublishProduct,
  updateProduct,
  updateProductCategory,
  updateProductStatus,
  updateVariantInventoryPolicy,
  updateQaStatus,
  upsertProductPrice,
  addProductRelationship,
  removeProductRelationship,
  viewProduct,
  createCategory,
  createCategoryForm,
  deleteCategory,
  editCategoryForm,
  listCategories,
  reorderCategories,
  updateCategory,
  viewCategory,
  listAdminBrands,
  viewBrand,
  createBrandForm,
  createBrand,
  editBrandForm,
  updateBrand,
  deleteBrand,
} from '../../../modules/product';
import {
  listCollections,
  createCollectionForm,
  createCollection,
  viewCollection,
  editCollectionForm,
  updateCollection,
  deleteCollection,
  upsertCollectionPublication,
  deleteCollectionPublication,
  viewStoreAssortment,
  setStoreAssortmentMode,
  addStoreAssortmentEntry,
  removeStoreAssortmentEntry,
} from '../../../modules/assortment';
import {
  recommendationsDashboard,
  createRecommendationRule,
  deleteRecommendationRule,
  createRecommendationExclusion,
  deleteRecommendationExclusion,
  productSuggestionsPartial,
  acceptProductSuggestion,
  hideProductSuggestion,
} from '../../../modules/recommendation';
import {
  createPriceList,
  createPriceListForm,
  createPriceRule,
  createPriceRuleForm,
  deletePriceList,
  deletePriceRule,
  editPriceListForm,
  editPriceRuleForm,
  listPriceLists,
  listPriceRules,
  updatePriceList,
  updatePriceRule,
  viewPriceList,
  viewPriceRule,
} from '../../../modules/pricing';

/**
 * Catalog admin routes: categories, collections/assortment, pricing,
 * brands, products, and recommendations.
 */
export function registerCatalogRoutes(router: HttpRouter): void {
  // ==========================================================================
  // Catalog - Categories Routes
  // ==========================================================================

  router.get('/catalog/categories', asyncHandler(listCategories));
  router.get('/catalog/categories/create', asyncHandler(createCategoryForm));
  router.post('/catalog/categories', asyncHandler(createCategory));
  router.get('/catalog/categories/:categoryId', asyncHandler(viewCategory));
  router.get('/catalog/categories/:categoryId/edit', asyncHandler(editCategoryForm));
  router.post('/catalog/categories/:categoryId', asyncHandler(updateCategory));
  router.put('/catalog/categories/:categoryId', asyncHandler(updateCategory));
  router.delete('/catalog/categories/:categoryId', asyncHandler(deleteCategory));
  router.post('/catalog/categories/reorder', asyncHandler(reorderCategories));

  // ==========================================================================
  // Catalog - Collections Routes
  // ==========================================================================

  router.get('/catalog/collections', asyncHandler(listCollections));
  router.get('/catalog/collections/create', asyncHandler(createCollectionForm));
  router.post('/catalog/collections', asyncHandler(createCollection));
  router.get('/catalog/collections/:collectionId', asyncHandler(viewCollection));
  router.get('/catalog/collections/:collectionId/edit', asyncHandler(editCollectionForm));
  router.post('/catalog/collections/:collectionId', asyncHandler(updateCollection));
  router.put('/catalog/collections/:collectionId', asyncHandler(updateCollection));
  router.delete('/catalog/collections/:collectionId', asyncHandler(deleteCollection));
  router.post('/catalog/collections/:collectionId/publications', asyncHandler(upsertCollectionPublication));
  router.post('/catalog/collections/:collectionId/publications/:publicationId/remove', asyncHandler(deleteCollectionPublication));
  router.get('/stores/:storeId/assortment', asyncHandler(viewStoreAssortment));
  router.post('/stores/:storeId/assortment/mode', asyncHandler(setStoreAssortmentMode));
  router.post('/stores/:storeId/assortment/entries', asyncHandler(addStoreAssortmentEntry));
  router.post('/stores/:storeId/assortment/entries/:entryId/remove', asyncHandler(removeStoreAssortmentEntry));

  // ==========================================================================
  // Catalog - Pricing Routes
  // ==========================================================================

  router.get('/catalog/pricing', asyncHandler(listPriceLists));
  router.get('/catalog/pricing/lists/create', asyncHandler(createPriceListForm));
  router.post('/catalog/pricing/lists', asyncHandler(createPriceList));
  router.get('/catalog/pricing/lists/:listId', asyncHandler(viewPriceList));
  router.get('/catalog/pricing/lists/:listId/edit', asyncHandler(editPriceListForm));
  router.post('/catalog/pricing/lists/:listId', asyncHandler(updatePriceList));
  router.put('/catalog/pricing/lists/:listId', asyncHandler(updatePriceList));
  router.delete('/catalog/pricing/lists/:listId', asyncHandler(deletePriceList));

  router.get('/catalog/pricing/rules', asyncHandler(listPriceRules));
  router.get('/catalog/pricing/rules/create', asyncHandler(createPriceRuleForm));
  router.post('/catalog/pricing/rules', asyncHandler(createPriceRule));
  router.get('/catalog/pricing/rules/:ruleId', asyncHandler(viewPriceRule));
  router.get('/catalog/pricing/rules/:ruleId/edit', asyncHandler(editPriceRuleForm));
  router.post('/catalog/pricing/rules/:ruleId', asyncHandler(updatePriceRule));
  router.put('/catalog/pricing/rules/:ruleId', asyncHandler(updatePriceRule));
  router.delete('/catalog/pricing/rules/:ruleId', asyncHandler(deletePriceRule));

  // ==========================================================================
  // Brand Routes
  // ==========================================================================

  router.get('/catalog/brands', asyncHandler(listAdminBrands));
  router.get('/catalog/brands/new', asyncHandler(createBrandForm));
  router.post('/catalog/brands', asyncHandler(createBrand));
  router.get('/catalog/brands/:brandId', asyncHandler(viewBrand));
  router.get('/catalog/brands/:brandId/edit', asyncHandler(editBrandForm));
  router.post('/catalog/brands/:brandId', asyncHandler(updateBrand));
  router.delete('/catalog/brands/:brandId', asyncHandler(deleteBrand));

  // ==========================================================================
  // Product Routes
  // ==========================================================================

  router.get('/products', asyncHandler(listProducts));
  router.get('/products/create', asyncHandler(createProductForm));
  router.post('/products', asyncHandler(createProduct));

  // Product Categories (standalone productCategory records)
  router.get('/products/categories', asyncHandler(listProductCategories));
  router.get('/products/categories/create', asyncHandler(createProductCategoryForm));
  router.post('/products/categories', asyncHandler(createProductCategory));
  router.get('/products/categories/:categoryId/edit', asyncHandler(editProductCategoryForm));
  router.post('/products/categories/:categoryId', asyncHandler(updateProductCategory));
  router.delete('/products/categories/:categoryId', asyncHandler(deleteProductCategory));

  // Product Tags
  router.get('/products/tags', asyncHandler(listProductTags));
  router.post('/products/tags', asyncHandler(createProductTag));
  router.delete('/products/tags/:tagId', asyncHandler(deleteProductTag));

  router.get('/products/:productId', asyncHandler(viewProduct));
  router.get('/products/:productId/edit', asyncHandler(editProductForm));
  router.post('/products/:productId', asyncHandler(updateProduct)); // Form POST (method override)
  router.put('/products/:productId', asyncHandler(updateProduct)); // API PUT
  router.delete('/products/:productId', asyncHandler(deleteProduct));
  router.post('/products/:productId/status', asyncHandler(updateProductStatus));
  router.post('/products/:productId/variants/:variantId/inventory-policy', asyncHandler(updateVariantInventoryPolicy));
  router.post('/products/:productId/publish', asyncHandler(publishProduct));
  router.post('/products/:productId/unpublish', asyncHandler(unpublishProduct));

  // Product Q&A
  router.get('/products/:productId/qa', asyncHandler(listProductQa));
  router.post('/products/:productId/qa/:qaId/status', asyncHandler(updateQaStatus));

  // Product Review Media
  router.get('/products/:productId/reviews/media', asyncHandler(listReviewMedia));
  router.delete('/products/:productId/reviews/media/:mediaId', asyncHandler(deleteReviewMedia));

  // Product Prices
  router.get('/products/:productId/prices', asyncHandler(listProductPrices));
  router.post('/products/:productId/prices', asyncHandler(upsertProductPrice));

  // Product Relationships (manual recommendation links)
  router.post('/products/:productId/relationships', asyncHandler(addProductRelationship));
  router.post('/products/:productId/relationships/:relationshipId/delete', asyncHandler(removeProductRelationship));

  // Product Recommendations — suggestions panel on the product editor
  router.get('/products/:productId/recommendations/suggestions', asyncHandler(productSuggestionsPartial));
  router.post('/products/:productId/recommendations/suggestions/:candidateProductId/accept', asyncHandler(acceptProductSuggestion));
  router.post('/products/:productId/recommendations/suggestions/:candidateProductId/hide', asyncHandler(hideProductSuggestion));

  // Recommendations — org-scoped rules, exclusions and stats
  router.get('/recommendations', asyncHandler(recommendationsDashboard));
  router.post('/recommendations/rules', asyncHandler(createRecommendationRule));
  router.post('/recommendations/rules/:ruleId/delete', asyncHandler(deleteRecommendationRule));
  router.post('/recommendations/exclusions', asyncHandler(createRecommendationExclusion));
  router.post('/recommendations/exclusions/:exclusionId/delete', asyncHandler(deleteRecommendationExclusion));
}
