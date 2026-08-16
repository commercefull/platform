# Product Feature

## Overview

The Product feature manages the product catalog, including products, variants, bundles, media, and categorization. It supports both business/admin operations and customer-facing product browsing.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-PRD-001 | List Products | Merchant/Admin | List all products (including unpublished) with optional status/category/search filtering |
| UC-PRD-002 | Create Product | Merchant/Admin | Create a new product with a master variant in draft status |
| UC-PRD-003 | Get Product Details | Merchant/Admin | Retrieve full product details including variants, categories, and media |
| UC-PRD-004 | Update Product | Merchant/Admin | Update an existing product's fields (name, description, price, etc.) |
| UC-PRD-005 | Update Product Status | Merchant/Admin | Change a product's status (draft, active, archived) |
| UC-PRD-006 | Publish Product | Merchant/Admin | Publish a product to make it visible on the storefront |
| UC-PRD-007 | Unpublish Product | Merchant/Admin | Unpublish a product to hide it from the storefront |
| UC-PRD-008 | Delete Product | Merchant/Admin | Soft delete a product (cannot delete products with open orders) |
| UC-PRD-009 | Search Products | Customer/Guest | Search published products by text, category, or price range with sorting |
| UC-PRD-010 | Get Featured Products | Customer/Guest | Retrieve curated featured products for storefront display |
| UC-PRD-011 | Get Products by Category | Customer/Guest | Browse published products in a category including subcategories |
| UC-PRD-012 | List Products | Customer/Guest | Browse all published products with sorting and pagination |
| UC-PRD-013 | Get Related Products | Customer/Guest | Retrieve products related to a specific product (by category, tags, or recommendations) |
| UC-PRD-014 | Get Product Details | Customer/Guest | Retrieve a published product's details by ID or slug for storefront display |
| UC-PRD-015 | List Bundles | Merchant/Admin | List all product bundles |
| UC-PRD-016 | Create Bundle | Merchant/Admin | Create a product bundle (fixed, dynamic, mix_match) with a discount type |
| UC-PRD-017 | Get Bundle | Merchant/Admin | Retrieve a specific product bundle by ID |
| UC-PRD-018 | Update Bundle | Merchant/Admin | Update an existing bundle's discount or active status |
| UC-PRD-019 | Delete Bundle | Merchant/Admin | Permanently delete a product bundle |
| UC-PRD-020 | Manage Bundle Items | Merchant/Admin | Add, update, or remove items within a product bundle |
| UC-PRD-021 | Get Active Bundles | Customer/Guest | Retrieve active product bundles for storefront display |
| UC-PRD-022 | Get Bundle Details | Customer/Guest | Retrieve details of a specific product bundle |
| UC-PRD-023 | Get Bundle for Product | Customer/Guest | Retrieve bundles that include a specific product |
| UC-PRD-024 | Calculate Bundle Price | Customer/Guest | Calculate the price of a bundle based on selected items and quantities |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-PRD-001 | GET | `/business/products` |
| UC-PRD-002 | POST | `/business/products` |
| UC-PRD-003 | GET | `/business/products/:productId` |
| UC-PRD-004 | PUT | `/business/products/:productId` |
| UC-PRD-005 | PUT | `/business/products/:productId/status` |
| UC-PRD-006 | POST | `/business/products/:productId/publish` |
| UC-PRD-007 | POST | `/business/products/:productId/unpublish` |
| UC-PRD-008 | DELETE | `/business/products/:productId` |
| UC-PRD-009 | GET | `/products/search` |
| UC-PRD-010 | GET | `/products/featured` |
| UC-PRD-011 | GET | `/products/category/:categoryId` |
| UC-PRD-012 | GET | `/products` |
| UC-PRD-013 | GET | `/products/:productId/related` |
| UC-PRD-014 | GET | `/products/:identifier` |
| UC-PRD-015 | GET | `/business/products/bundles` |
| UC-PRD-016 | POST | `/business/products/bundles` |
| UC-PRD-017 | GET | `/business/products/bundles/:id` |
| UC-PRD-018 | PUT | `/business/products/bundles/:id` |
| UC-PRD-019 | DELETE | `/business/products/bundles/:id` |
| UC-PRD-020 | POST/PUT/DELETE | `/business/products/bundles/:id/items` |
| UC-PRD-021 | GET | `/products/bundles` |
| UC-PRD-022 | GET | `/products/bundles/:id` |
| UC-PRD-023 | GET | `/products/bundles/product/:productId` |
| UC-PRD-024 | POST | `/products/bundles/:id/calculate` |

---

## Events Emitted

| Event                    | Trigger                 | Payload                         |
| ------------------------ | ----------------------- | ------------------------------- |
| `product.created`        | Product created         | productId, name, sku            |
| `product.updated`        | Product modified        | productId, changes              |
| `product.deleted`        | Product deleted         | productId                       |
| `product.published`      | Product published       | productId                       |
| `product.unpublished`    | Product unpublished     | productId                       |
| `product.archived`       | Product archived        | productId                       |
| `product.status_changed` | Status changed          | productId, oldStatus, newStatus |
| `product.price_changed`  | Price modified          | productId, oldPrice, newPrice   |
| `product.viewed`         | Customer viewed product | productId, customerId           |
| `bundle.created`         | Bundle created          | bundleId, productId             |
| `bundle.purchased`       | Bundle purchased        | bundleId, orderId               |

---

## Integration Test Coverage

| Use Case                 | Test File                              | Status |
| ------------------------ | -------------------------------------- | ------ |
| UC-PRD-001               | `product/merchant/lifecycle.test.ts`   | ✅     |
| UC-PRD-002               | `product/merchant/lifecycle.test.ts`   | ✅     |
| UC-PRD-003               | `product/merchant/lifecycle.test.ts`   | ✅     |
| UC-PRD-004               | `product/merchant/lifecycle.test.ts`   | ✅     |
| UC-PRD-005               | `product/merchant/lifecycle.test.ts`   | ✅     |
| UC-PRD-006               | `product/merchant/lifecycle.test.ts`   | ✅     |
| UC-PRD-007               | `product/merchant/lifecycle.test.ts`   | ✅     |
| UC-PRD-008               | `product/merchant/lifecycle.test.ts`   | ✅     |
| UC-PRD-009               | `product/customer/search.test.ts`      | ✅     |
| UC-PRD-010               | `product/customer/browsing.test.ts`    | ✅     |
| UC-PRD-011               | `product/customer/categories.test.ts`  | ✅     |
| UC-PRD-012               | `product/customer/browsing.test.ts`    | ✅     |
| UC-PRD-013               | `product/customer/browsing.test.ts`    | ✅     |
| UC-PRD-014               | `product/customer/browsing.test.ts`    | ✅     |
| UC-PRD-015 to UC-PRD-020 | `product/merchant/bundles.test.ts`     | ✅     |
| UC-PRD-021 to UC-PRD-024 | `product/customer/bundles.test.ts`     | ✅     |


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/business/attribute-groups` | `bind` | — |
| POST | `/business/attribute-groups` | `bind` | — |
| GET | `/business/attribute-groups/:id` | `bind` | — |
| PUT | `/business/attribute-groups/:id` | `bind` | — |
| DELETE | `/business/attribute-groups/:id` | `bind` | — |
| GET | `/business/attribute-groups/code/:code` | `bind` | — |
| POST | `/business/attribute-options` | `bind` | — |
| GET | `/business/attribute-options/:id` | `bind` | — |
| PUT | `/business/attribute-options/:id` | `bind` | — |
| DELETE | `/business/attribute-options/:id` | `bind` | — |
| GET | `/business/attribute-options/attribute/:attributeId` | `bind` | — |
| GET | `/business/attribute-options/attribute/:attributeId/value/:value` | `bind` | — |
| GET | `/business/attribute-sets` | `bind` | — |
| POST | `/business/attribute-sets` | `bind` | — |
| GET | `/business/attribute-sets/:id` | `bind` | — |
| PUT | `/business/attribute-sets/:id` | `bind` | — |
| DELETE | `/business/attribute-sets/:id` | `bind` | — |
| POST | `/business/attribute-sets/:id/attributes` | `bind` | — |
| DELETE | `/business/attribute-sets/:id/attributes/:attributeId` | `bind` | — |
| POST | `/business/attribute-sets/:id/attributes/reorder` | `bind` | — |
| GET | `/business/attributes` | `isMerchantLoggedIn` | List all attributes |
| POST | `/business/attributes` | `isMerchantLoggedIn` | Create attribute |
| GET | `/business/attributes` | `bind` | — |
| POST | `/business/attributes` | `bind` | — |
| GET | `/business/attributes/:id` | `isMerchantLoggedIn` | Get attribute by ID |
| PUT | `/business/attributes/:id` | `isMerchantLoggedIn` | Update attribute |
| DELETE | `/business/attributes/:id` | `isMerchantLoggedIn` | Delete attribute |
| GET | `/business/attributes/:id` | `bind` | — |
| PUT | `/business/attributes/:id` | `bind` | — |
| DELETE | `/business/attributes/:id` | `bind` | — |
| GET | `/business/attributes/:id/values` | `isMerchantLoggedIn` | Get attribute values |
| POST | `/business/attributes/:id/values` | `isMerchantLoggedIn` | Add attribute value |
| GET | `/business/attributes/:id/values` | `bind` | Attribute Values |
| POST | `/business/attributes/:id/values` | `bind` | — |
| DELETE | `/business/attributes/:id/values/:valueId` | `isMerchantLoggedIn` | Remove attribute value |
| DELETE | `/business/attributes/:id/values/:valueId` | `bind` | — |
| GET | `/business/attributes/code/:code` | `isMerchantLoggedIn` | Get attribute by code |
| GET | `/business/attributes/code/:code` | `bind` | — |
| GET | `/business/attributes/group/:groupId` | `bind` | — |
| GET | `/business/bundles` | `getBundles` | — |
| POST | `/business/bundles` | `createBundle` | — |
| GET | `/business/bundles/:id` | `getBundle` | — |
| PUT | `/business/bundles/:id` | `updateBundle` | — |
| DELETE | `/business/bundles/:id` | `deleteBundle` | — |
| POST | `/business/bundles/:id/items` | `addBundleItem` | — |
| PUT | `/business/bundles/:id/items/:itemId` | `updateBundleItem` | — |
| DELETE | `/business/bundles/:id/items/:itemId` | `deleteBundleItem` | — |
| GET | `/business/categories` | `listCategories` | — |
| POST | `/business/categories` | `createCategory` | — |
| GET | `/business/categories/:id` | `getCategory` | — |
| PUT | `/business/categories/:id` | `updateCategory` | — |
| DELETE | `/business/categories/:id` | `deleteCategory` | — |
| GET | `/business/categories/:id/children` | `getCategoryChildren` | — |
| GET | `/business/categories/root` | `getRootCategories` | — |
| GET | `/business/categories/slug/:slug` | `getCategoryBySlug` | — |
| GET | `/business/collections` | `listCollections` | — |
| POST | `/business/collections` | `createCollection` | — |
| PUT | `/business/collections/:collectionId` | `updateCollection` | — |
| DELETE | `/business/collections/:collectionId` | `deleteCollection` | — |
| PUT | `/business/downloads/:downloadId` | `updateDownload` | — |
| DELETE | `/business/downloads/:downloadId` | `deleteDownload` | — |
| GET | `/business/product-types` | `isMerchantLoggedIn` | List all product types |
| POST | `/business/product-types` | `isMerchantLoggedIn` | Create product type |
| GET | `/business/product-types` | `bind` | — |
| POST | `/business/product-types` | `bind` | — |
| GET | `/business/product-types/:id` | `isMerchantLoggedIn` | Get product type by ID |
| PUT | `/business/product-types/:id` | `isMerchantLoggedIn` | Update product type |
| DELETE | `/business/product-types/:id` | `isMerchantLoggedIn` | Delete product type |
| GET | `/business/product-types/:id` | `bind` | — |
| PUT | `/business/product-types/:id` | `bind` | — |
| DELETE | `/business/product-types/:id` | `bind` | — |
| GET | `/business/product-types/:id/attributes` | `isMerchantLoggedIn` | Get attributes for a product type |
| GET | `/business/product-types/:id/attributes` | `bind` | — |
| GET | `/business/product-types/slug/:slug` | `isMerchantLoggedIn` | Get product type by slug |
| GET | `/business/product-types/slug/:slug` | `bind` | — |
| GET | `/business/products` | `listProducts` | List all products
GET /business/products |
| POST | `/business/products` | `createProduct` | Create a new product
POST /business/products |
| GET | `/business/products/:productId` | `getProduct` | Get product details
GET /business/products/:productId |
| PUT | `/business/products/:productId` | `updateProduct` | Update a product
PUT /business/products/:productId |
| DELETE | `/business/products/:productId` | `deleteProduct` | Delete a product
DELETE /business/products/:productId |
| POST | `/business/products/:productId/apply-attribute-set` | `applyAttributeSet` | — |
| GET | `/business/products/:productId/attributes` | `isMerchantLoggedIn` | Get product attributes |
| POST | `/business/products/:productId/attributes` | `isMerchantLoggedIn` | Set single product attribute |
| PUT | `/business/products/:productId/attributes` | `isMerchantLoggedIn` | Set multiple product attributes |
| GET | `/business/products/:productId/attributes` | `bind` | Product Attributes |
| POST | `/business/products/:productId/attributes` | `bind` | — |
| PUT | `/business/products/:productId/attributes` | `bind` | — |
| DELETE | `/business/products/:productId/attributes/:attributeId` | `isMerchantLoggedIn` | Remove product attribute |
| DELETE | `/business/products/:productId/attributes/:attributeId` | `bind` | — |
| POST | `/business/products/:productId/configure` | `configureVariant` | — |
| GET | `/business/products/:productId/downloads` | `listDownloads` | — |
| POST | `/business/products/:productId/downloads` | `createDownload` | — |
| GET | `/business/products/:productId/grouped-children` | `listGroupedChildren` | — |
| GET | `/business/products/:productId/images` | `getProductImages` | — |
| POST | `/business/products/:productId/images` | `addProductImage` | — |
| PUT | `/business/products/:productId/images/:imageId` | `updateProductImage` | — |
| DELETE | `/business/products/:productId/images/:imageId` | `deleteProductImage` | — |
| POST | `/business/products/:productId/images/reorder` | `reorderProductImages` | — |
| POST | `/business/products/:productId/publish` | `publishProduct` | Publish a product
POST /business/products/:productId/publish |
| GET | `/business/products/:productId/qa` | `listProductQa` | — |
| PATCH | `/business/products/:productId/qa/:qaId/status` | `updateQaStatus` | — |
| GET | `/business/products/:productId/relationships` | `listRelationships` | — |
| POST | `/business/products/:productId/relationships` | `createRelationship` | — |
| GET | `/business/products/:productId/reviews/media` | `listReviewMedia` | — |
| DELETE | `/business/products/:productId/reviews/media/:mediaId` | `deleteReviewMedia` | — |
| GET | `/business/products/:productId/similar` | `bind` | Find similar products |
| PUT | `/business/products/:productId/status` | `updateProductStatus` | Update product status
PUT /business/products/:productId/status |
| GET | `/business/products/:productId/store-availability` | `getProductStoreAvailability` | Get product store availability
GET /business/products/:productId/store-availability |
| POST | `/business/products/:productId/unpublish` | `unpublishProduct` | Unpublish a product
POST /business/products/:productId/unpublish |
| GET | `/business/products/:productId/variant-matrix` | `getVariantMatrix` | — |
| GET | `/business/products/:productId/variants` | `getProductVariants` | — |
| POST | `/business/products/:productId/variants` | `createProductVariant` | — |
| GET | `/business/products/:productId/variants/:variantId` | `getProductVariant` | — |
| PUT | `/business/products/:productId/variants/:variantId` | `updateProductVariant` | — |
| DELETE | `/business/products/:productId/variants/:variantId` | `deleteProductVariant` | — |
| PUT | `/business/products/:productId/visibility` | `updateProductVisibility` | Update product visibility
PUT /business/products/:productId/visibility |
| GET | `/business/products/barcode/:barcode` | `findByBarcode` | Find product by variant barcode
GET /business/products/barcode/:barcode |
| GET | `/business/products/by-attribute/:code/:value` | `bind` | Find products by attribute |
| GET | `/business/products/search` | `bind` | Search products with filters and facets |
| POST | `/business/products/search` | `bind` | — |
| GET | `/business/products/search/suggestions` | `bind` | Get search suggestions for autocomplete |
| GET | `/business/products/variants/:variantId` | `getProductVariant` | Flat variant routes — must be before /:productId to avoid collision |
| PUT | `/business/products/variants/:variantId` | `updateProductVariant` | — |
| DELETE | `/business/products/variants/:variantId` | `deleteProductVariant` | — |
| PATCH | `/business/products/variants/:variantId/inventory` | `updateVariantInventory` | — |
| DELETE | `/business/relationships/:relationshipId` | `deleteRelationship` | — |
| GET | `/business/reviews` | `listReviews` | — |
| GET | `/business/reviews/:reviewId` | `getReview` | — |
| DELETE | `/business/reviews/:reviewId` | `deleteReview` | — |
| PUT | `/business/reviews/:reviewId/approve` | `approveReview` | — |
| PUT | `/business/reviews/:reviewId/reject` | `rejectReview` | — |
| POST | `/business/reviews/:reviewId/respond` | `respondToReview` | — |
| GET | `/customer/categories` | `listCategories` | List all active categories
GET /customer/categories
Query params: ?featured=true | ?menu=true | ?root=true |
| GET | `/customer/categories/:categoryId/children` | `getCategoryChildren` | Get subcategories of a parent category
GET /customer/categories/:categoryId/children |
| GET | `/customer/categories/:identifier` | `getCategory` | Get category by ID or slug
GET /customer/categories/:identifier |
| GET | `/customer/products` | `listProducts` | List products
GET /products |
| GET | `/customer/products/:identifier` | `getProduct` | Get product by ID or slug
GET /products/:identifier |
| GET | `/customer/products/:productId/availability` | `getProductAvailability` | Get product availability
GET /products/:productId/availability |
| POST | `/customer/products/:productId/configure` | `configureVariant` | — |
| GET | `/customer/products/:productId/downloads` | `getProductDownloads` | — |
| GET | `/customer/products/:productId/qa` | `listProductQaCustomer` | — |
| POST | `/customer/products/:productId/qa` | `submitProductQa` | — |
| GET | `/customer/products/:productId/related` | `getRelatedProducts` | Get related products
GET /products/:productId/related |
| GET | `/customer/products/:productId/reviews` | `getProductReviews` | — |
| POST | `/customer/products/:productId/reviews` | `createReview` | — |
| POST | `/customer/products/:productId/reviews/:reviewId/vote` | `voteOnReview` | — |
| GET | `/customer/products/:productId/similar` | `bind` | Find similar products
GET /customer/products/:productId/similar |
| GET | `/customer/products/barcode/:barcode` | `findByBarcode` | Find product by variant barcode
GET /customer/products/barcode/:barcode |
| GET | `/customer/products/bundles` | `getActiveBundles` | — |
| GET | `/customer/products/bundles/:id` | `getBundleDetails` | — |
| POST | `/customer/products/bundles/:id/calculate` | `calculateBundlePrice` | — |
| GET | `/customer/products/bundles/product/:productId` | `getBundleByProduct` | — |
| GET | `/customer/products/by-attribute/:code/:value` | `bind` | Find products by attribute
GET /customer/products/by-attribute/:code/:value |
| GET | `/customer/products/category/:categoryId` | `getProductsByCategory` | Get products by category
GET /products/category/:categoryId |
| GET | `/customer/products/featured` | `getFeaturedProducts` | Get featured products
GET /products/featured |
| GET | `/customer/products/search` | `bind` | Search products with advanced filters and facets
GET /customer/products/search |
| POST | `/customer/products/search` | `bind` | Search products (POST for complex queries)
POST /customer/products/search |
| GET | `/customer/products/search/suggestions` | `bind` | Get search suggestions for autocomplete
GET /customer/products/search/suggestions |
| POST | `/customer/reviews/:reviewId/helpful` | `markReviewHelpful` | — |
| POST | `/customer/reviews/:reviewId/report` | `reportReview` | — |

<!-- GENERATED:ENDPOINTS:END -->
