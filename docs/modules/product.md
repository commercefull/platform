# Product Feature

## Overview

The Product feature manages the product catalog, including products, variants, bundles, media, and categorization. It supports both organization/admin operations and customer-facing product browsing.

## Pricing Boundary

Product is **catalog-only** — `Product` and `ProductVariant` entities and their
tables carry no price fields. Prices are owned by the
[pricing module](./pricing.md) (`productBasePrice`, integer cents) and reach
product use cases through the consumer-owned `ProductPricingPort`
(`application/ports/`) backed by `infrastructure/acl/ProductPricingAdapter`.

- API DTOs expose `basePriceCents`, `salePriceCents`, `compareAtPriceCents`,
  `costPriceCents`, `effectivePriceCents`, and `currency` — always integer cents.
- Search/list filters accept `priceMinCents`/`priceMaxCents`; `price_asc` /
  `price_desc` ordering sorts on the product-level base price.
- Views format cents to display strings at render time (`(cents / 100)`).

---

## Use Cases

| ID         | Use Case                 | Actor          | Purpose                                                                                  |
| ---------- | ------------------------ | -------------- | ---------------------------------------------------------------------------------------- |
| UC-PRD-001 | List Products            | Merchant/Admin | List all products (including unpublished) with optional status/category/search filtering |
| UC-PRD-002 | Create Product           | Merchant/Admin | Create a new product with a master variant in draft status                               |
| UC-PRD-003 | Get Product Details      | Merchant/Admin | Retrieve full product details including variants, categories, and media                  |
| UC-PRD-004 | Update Product           | Merchant/Admin | Update an existing product's fields (name, description, price, etc.)                     |
| UC-PRD-005 | Update Product Status    | Merchant/Admin | Change a product's status (draft, active, archived)                                      |
| UC-PRD-006 | Publish Product          | Merchant/Admin | Publish a product to make it visible on the storefront                                   |
| UC-PRD-007 | Unpublish Product        | Merchant/Admin | Unpublish a product to hide it from the storefront                                       |
| UC-PRD-008 | Delete Product           | Merchant/Admin | Soft delete a product (cannot delete products with open orders)                          |
| UC-PRD-009 | Search Products          | Customer/Guest | Search published products by text, category, or price range with sorting                 |
| UC-PRD-010 | Get Featured Products    | Customer/Guest | Retrieve curated featured products for storefront display                                |
| UC-PRD-011 | Get Products by Category | Customer/Guest | Browse published products in a category including subcategories                          |
| UC-PRD-012 | List Products            | Customer/Guest | Browse all published products with sorting and pagination                                |
| UC-PRD-013 | Get Related Products     | Customer/Guest | Retrieve products related to a specific product (by category, tags, or recommendations)  |
| UC-PRD-014 | Get Product Details      | Customer/Guest | Retrieve a published product's details by ID or slug for storefront display              |
| UC-PRD-015 | List Bundles             | Merchant/Admin | List all product bundles                                                                 |
| UC-PRD-016 | Create Bundle            | Merchant/Admin | Create a product bundle (fixed, dynamic, mix_match) with a discount type                 |
| UC-PRD-017 | Get Bundle               | Merchant/Admin | Retrieve a specific product bundle by ID                                                 |
| UC-PRD-018 | Update Bundle            | Merchant/Admin | Update an existing bundle's discount or active status                                    |
| UC-PRD-019 | Delete Bundle            | Merchant/Admin | Permanently delete a product bundle                                                      |
| UC-PRD-020 | Manage Bundle Items      | Merchant/Admin | Add, update, or remove items within a product bundle                                     |
| UC-PRD-021 | Get Active Bundles       | Customer/Guest | Retrieve active product bundles for storefront display                                   |
| UC-PRD-022 | Get Bundle Details       | Customer/Guest | Retrieve details of a specific product bundle                                            |
| UC-PRD-023 | Get Bundle for Product   | Customer/Guest | Retrieve bundles that include a specific product                                         |
| UC-PRD-024 | Calculate Bundle Price   | Customer/Guest | Calculate the price of a bundle based on selected items and quantities                   |

### API Endpoints

| ID         | Method          | Endpoint                                  |
| ---------- | --------------- | ----------------------------------------- |
| UC-PRD-001 | GET             | `/business/products`                      |
| UC-PRD-002 | POST            | `/business/products`                      |
| UC-PRD-003 | GET             | `/business/products/:productId`           |
| UC-PRD-004 | PUT             | `/business/products/:productId`           |
| UC-PRD-005 | PUT             | `/business/products/:productId/status`    |
| UC-PRD-006 | POST            | `/business/products/:productId/publish`   |
| UC-PRD-007 | POST            | `/business/products/:productId/unpublish` |
| UC-PRD-008 | DELETE          | `/business/products/:productId`           |
| UC-PRD-009 | GET             | `/products/search`                        |
| UC-PRD-010 | GET             | `/products/featured`                      |
| UC-PRD-011 | GET             | `/products/category/:categoryId`          |
| UC-PRD-012 | GET             | `/products`                               |
| UC-PRD-013 | GET             | `/products/:productId/related`            |
| UC-PRD-014 | GET             | `/products/:identifier`                   |
| UC-PRD-015 | GET             | `/business/products/bundles`              |
| UC-PRD-016 | POST            | `/business/products/bundles`              |
| UC-PRD-017 | GET             | `/business/products/bundles/:id`          |
| UC-PRD-018 | PUT             | `/business/products/bundles/:id`          |
| UC-PRD-019 | DELETE          | `/business/products/bundles/:id`          |
| UC-PRD-020 | POST/PUT/DELETE | `/business/products/bundles/:id/items`    |
| UC-PRD-021 | GET             | `/products/bundles`                       |
| UC-PRD-022 | GET             | `/products/bundles/:id`                   |
| UC-PRD-023 | GET             | `/products/bundles/product/:productId`    |
| UC-PRD-024 | POST            | `/products/bundles/:id/calculate`         |

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

| Use Case                 | Test File                                | Status |
| ------------------------ | ---------------------------------------- | ------ |
| UC-PRD-001               | `product/organization/lifecycle.test.ts` | ✅     |
| UC-PRD-002               | `product/organization/lifecycle.test.ts` | ✅     |
| UC-PRD-003               | `product/organization/lifecycle.test.ts` | ✅     |
| UC-PRD-004               | `product/organization/lifecycle.test.ts` | ✅     |
| UC-PRD-005               | `product/organization/lifecycle.test.ts` | ✅     |
| UC-PRD-006               | `product/organization/lifecycle.test.ts` | ✅     |
| UC-PRD-007               | `product/organization/lifecycle.test.ts` | ✅     |
| UC-PRD-008               | `product/organization/lifecycle.test.ts` | ✅     |
| UC-PRD-009               | `product/customer/search.test.ts`        | ✅     |
| UC-PRD-010               | `product/customer/browsing.test.ts`      | ✅     |
| UC-PRD-011               | `product/customer/categories.test.ts`    | ✅     |
| UC-PRD-012               | `product/customer/browsing.test.ts`      | ✅     |
| UC-PRD-013               | `product/customer/browsing.test.ts`      | ✅     |
| UC-PRD-014               | `product/customer/browsing.test.ts`      | ✅     |
| UC-PRD-015 to UC-PRD-020 | `product/organization/bundles.test.ts`   | ✅     |
| UC-PRD-021 to UC-PRD-024 | `product/customer/bundles.test.ts`       | ✅     |

<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/attribute-groups` | `asyncHandler(attributeGroupController.listAttributeGroups.bi` | — |
| POST | `/attribute-groups` | `asyncHandler(attributeGroupController.createAttributeGroup.b` | — |
| GET | `/attribute-groups/:id` | `asyncHandler(attributeGroupController.getAttributeGroup.bind` | — |
| PUT | `/attribute-groups/:id` | `asyncHandler(attributeGroupController.updateAttributeGroup.b` | — |
| DELETE | `/attribute-groups/:id` | `asyncHandler(attributeGroupController.deleteAttributeGroup.b` | — |
| GET | `/attribute-groups/code/:code` | `asyncHandler(attributeGroupController.getAttributeGroupByCod` | — |
| POST | `/attribute-options` | `asyncHandler(attributeOptionController.createAttributeOption` | — |
| GET | `/attribute-options/:id` | `asyncHandler(attributeOptionController.getAttributeOption.bi` | — |
| PUT | `/attribute-options/:id` | `asyncHandler(attributeOptionController.updateAttributeOption` | — |
| DELETE | `/attribute-options/:id` | `asyncHandler(attributeOptionController.deleteAttributeOption` | — |
| GET | `/attribute-options/attribute/:attributeId` | `asyncHandler(attributeOptionController.getOptionsByAttribute` | — |
| GET | `/attribute-options/attribute/:attributeId/value/:value` | `asyncHandler(attributeOptionController.getOptionByValue.bind` | — |
| GET | `/attribute-sets` | `asyncHandler(attributeSetController.listAttributeSets.bind(a` | — |
| POST | `/attribute-sets` | `asyncHandler(attributeSetController.createAttributeSet.bind(` | — |
| GET | `/attribute-sets/:id` | `asyncHandler(attributeSetController.getAttributeSet.bind(att` | — |
| PUT | `/attribute-sets/:id` | `asyncHandler(attributeSetController.updateAttributeSet.bind(` | — |
| DELETE | `/attribute-sets/:id` | `asyncHandler(attributeSetController.deleteAttributeSet.bind(` | — |
| POST | `/attribute-sets/:id/attributes` | `asyncHandler(attributeSetController.addAttributeToSet.bind(a` | — |
| DELETE | `/attribute-sets/:id/attributes/:attributeId` | `asyncHandler(attributeSetController.removeAttributeFromSet.b` | — |
| POST | `/attribute-sets/:id/attributes/reorder` | `asyncHandler(attributeSetController.reorderAttributes.bind(a` | — |
| GET | `/attributes` | `isOrganizationLoggedIn` | List all attributes |
| POST | `/attributes` | `isOrganizationLoggedIn` | Create attribute |
| GET | `/attributes` | `asyncHandler(attributeController.listAttributes.bind(attribu` | — |
| POST | `/attributes` | `asyncHandler(attributeController.createAttribute.bind(attrib` | — |
| GET | `/attributes/:id` | `isOrganizationLoggedIn` | Get attribute by ID |
| PUT | `/attributes/:id` | `isOrganizationLoggedIn` | Update attribute |
| DELETE | `/attributes/:id` | `isOrganizationLoggedIn` | Delete attribute |
| GET | `/attributes/:id` | `asyncHandler(attributeController.getAttribute.bind(attribute` | — |
| PUT | `/attributes/:id` | `asyncHandler(attributeController.updateAttribute.bind(attrib` | — |
| DELETE | `/attributes/:id` | `asyncHandler(attributeController.deleteAttribute.bind(attrib` | — |
| GET | `/attributes/:id/values` | `isOrganizationLoggedIn` | Get attribute values |
| POST | `/attributes/:id/values` | `isOrganizationLoggedIn` | Add attribute value |
| GET | `/attributes/:id/values` | `asyncHandler(attributeController.getAttributeValues.bind(att` | Attribute Values |
| POST | `/attributes/:id/values` | `asyncHandler(attributeController.addAttributeValue.bind(attr` | — |
| DELETE | `/attributes/:id/values/:valueId` | `isOrganizationLoggedIn` | Remove attribute value |
| DELETE | `/attributes/:id/values/:valueId` | `asyncHandler(attributeController.removeAttributeValue.bind(a` | — |
| GET | `/attributes/code/:code` | `isOrganizationLoggedIn` | Get attribute by code |
| GET | `/attributes/code/:code` | `asyncHandler(attributeController.getAttributeByCode.bind(att` | — |
| GET | `/attributes/group/:groupId` | `asyncHandler(attributeController.listAttributesByGroup.bind(` | — |
| GET | `/bundles` | `asyncHandler(bundleController.getBundles)` | — |
| POST | `/bundles` | `asyncHandler(bundleController.createBundle)` | — |
| GET | `/bundles/:id` | `asyncHandler(bundleController.getBundle)` | — |
| PUT | `/bundles/:id` | `asyncHandler(bundleController.updateBundle)` | — |
| DELETE | `/bundles/:id` | `asyncHandler(bundleController.deleteBundle)` | — |
| POST | `/bundles/:id/items` | `asyncHandler(bundleController.addBundleItem)` | — |
| PUT | `/bundles/:id/items/:itemId` | `asyncHandler(bundleController.updateBundleItem)` | — |
| DELETE | `/bundles/:id/items/:itemId` | `asyncHandler(bundleController.deleteBundleItem)` | — |
| GET | `/categories` | `asyncHandler(categoryController.listCategories)` | List all active categories
GET /customer/categories
Query params: ?featured=true | ?menu=true | ?root=true |
| GET | `/categories` | `asyncHandler(categoryController.listCategories)` | — |
| POST | `/categories` | `asyncHandler(categoryController.createCategory)` | — |
| GET | `/categories/:categoryId/children` | `asyncHandler(categoryController.getCategoryChildren)` | Get subcategories of a parent category
GET /customer/categories/:categoryId/children |
| GET | `/categories/:id` | `asyncHandler(categoryController.getCategory)` | — |
| PUT | `/categories/:id` | `asyncHandler(categoryController.updateCategory)` | — |
| DELETE | `/categories/:id` | `asyncHandler(categoryController.deleteCategory)` | — |
| GET | `/categories/:id/children` | `asyncHandler(categoryController.getCategoryChildren)` | — |
| GET | `/categories/:identifier` | `asyncHandler(categoryController.getCategory)` | Get category by ID or slug
GET /customer/categories/:identifier |
| GET | `/categories/root` | `asyncHandler(categoryController.getRootCategories)` | — |
| GET | `/categories/slug/:slug` | `asyncHandler(categoryController.getCategoryBySlug)` | — |
| GET | `/collections` | `asyncHandler(productController.listCollections)` | — |
| POST | `/collections` | `asyncHandler(productController.createCollection)` | — |
| PUT | `/collections/:collectionId` | `asyncHandler(productController.updateCollection)` | — |
| DELETE | `/collections/:collectionId` | `asyncHandler(productController.deleteCollection)` | — |
| PUT | `/downloads/:downloadId` | `asyncHandler(productController.updateDownload)` | — |
| DELETE | `/downloads/:downloadId` | `asyncHandler(productController.deleteDownload)` | — |
| GET | `/product-types` | `isOrganizationLoggedIn` | List all product types |
| POST | `/product-types` | `isOrganizationLoggedIn` | Create product type |
| GET | `/product-types` | `asyncHandler(productTypeController.listProductTypes.bind(pro` | — |
| POST | `/product-types` | `asyncHandler(productTypeController.createProductType.bind(pr` | — |
| GET | `/product-types/:id` | `isOrganizationLoggedIn` | Get product type by ID |
| PUT | `/product-types/:id` | `isOrganizationLoggedIn` | Update product type |
| DELETE | `/product-types/:id` | `isOrganizationLoggedIn` | Delete product type |
| GET | `/product-types/:id` | `asyncHandler(productTypeController.getProductType.bind(produ` | — |
| PUT | `/product-types/:id` | `asyncHandler(productTypeController.updateProductType.bind(pr` | — |
| DELETE | `/product-types/:id` | `asyncHandler(productTypeController.deleteProductType.bind(pr` | — |
| GET | `/product-types/:id/attributes` | `isOrganizationLoggedIn` | Get attributes for a product type |
| GET | `/product-types/:id/attributes` | `asyncHandler(productTypeController.getProductTypeAttributes.` | — |
| GET | `/product-types/slug/:slug` | `isOrganizationLoggedIn` | Get product type by slug |
| GET | `/product-types/slug/:slug` | `asyncHandler(productTypeController.getProductTypeBySlug.bind` | — |
| GET | `/products` | `asyncHandler(productController.listProducts)` | List all products
GET /business/products |
| POST | `/products` | `asyncHandler(productController.createProduct)` | Create a new product
POST /business/products |
| GET | `/products` | `asyncHandler(productController.listProducts)` | List products
GET /products |
| GET | `/products/:identifier` | `asyncHandler(productController.getProduct)` | Get product by ID or slug
GET /products/:identifier |
| GET | `/products/:productId` | `asyncHandler(productController.getProduct)` | Get product details
GET /business/products/:productId |
| PUT | `/products/:productId` | `asyncHandler(productController.updateProduct)` | Update a product
PUT /business/products/:productId |
| DELETE | `/products/:productId` | `asyncHandler(productController.deleteProduct)` | Delete a product
DELETE /business/products/:productId |
| POST | `/products/:productId/apply-attribute-set` | `asyncHandler(productController.applyAttributeSet)` | — |
| GET | `/products/:productId/attributes` | `isOrganizationLoggedIn` | Get product attributes |
| POST | `/products/:productId/attributes` | `isOrganizationLoggedIn` | Set single product attribute |
| PUT | `/products/:productId/attributes` | `isOrganizationLoggedIn` | Set multiple product attributes |
| GET | `/products/:productId/attributes` | `asyncHandler(attributeController.getProductAttributes.bind(a` | Product Attributes |
| POST | `/products/:productId/attributes` | `asyncHandler(attributeController.setProductAttribute.bind(at` | — |
| PUT | `/products/:productId/attributes` | `asyncHandler(attributeController.setProductAttributes.bind(a` | — |
| DELETE | `/products/:productId/attributes/:attributeId` | `isOrganizationLoggedIn` | Remove product attribute |
| DELETE | `/products/:productId/attributes/:attributeId` | `asyncHandler(attributeController.removeProductAttribute.bind` | — |
| GET | `/products/:productId/availability` | `asyncHandler(productController.getProductAvailability)` | Get product availability
GET /products/:productId/availability |
| POST | `/products/:productId/configure` | `asyncHandler(productController.configureVariant)` | — |
| POST | `/products/:productId/configure` | `asyncHandler(productController.configureVariant)` | — |
| GET | `/products/:productId/downloads` | `asyncHandler(productController.listDownloads)` | — |
| POST | `/products/:productId/downloads` | `asyncHandler(productController.createDownload)` | — |
| GET | `/products/:productId/downloads` | `asyncHandler(productController.getProductDownloads)` | — |
| GET | `/products/:productId/grouped-children` | `asyncHandler(productController.listGroupedChildren)` | — |
| GET | `/products/:productId/images` | `asyncHandler(productController.getProductImages)` | — |
| POST | `/products/:productId/images` | `asyncHandler(productController.addProductImage)` | — |
| PUT | `/products/:productId/images/:imageId` | `asyncHandler(productController.updateProductImage)` | — |
| DELETE | `/products/:productId/images/:imageId` | `asyncHandler(productController.deleteProductImage)` | — |
| POST | `/products/:productId/images/reorder` | `asyncHandler(productController.reorderProductImages)` | — |
| POST | `/products/:productId/publish` | `asyncHandler(productController.publishProduct)` | Publish a product
POST /business/products/:productId/publish |
| GET | `/products/:productId/qa` | `asyncHandler(productController.listProductQa)` | — |
| GET | `/products/:productId/qa` | `asyncHandler(productController.listProductQaCustomer)` | — |
| POST | `/products/:productId/qa` | `asyncHandler(productController.submitProductQa)` | — |
| PATCH | `/products/:productId/qa/:qaId/status` | `asyncHandler(productController.updateQaStatus)` | — |
| GET | `/products/:productId/related` | `asyncHandler(productController.getRelatedProducts)` | Get related products
GET /products/:productId/related |
| GET | `/products/:productId/relationships` | `asyncHandler(productController.listRelationships)` | — |
| POST | `/products/:productId/relationships` | `asyncHandler(productController.createRelationship)` | — |
| GET | `/products/:productId/reviews` | `asyncHandler(productController.getProductReviews)` | — |
| POST | `/products/:productId/reviews` | `optionalCustomerAuth` | — |
| POST | `/products/:productId/reviews/:reviewId/vote` | `isCustomerLoggedIn` | — |
| GET | `/products/:productId/reviews/media` | `asyncHandler(productController.listReviewMedia)` | — |
| DELETE | `/products/:productId/reviews/media/:mediaId` | `asyncHandler(productController.deleteReviewMedia)` | — |
| GET | `/products/:productId/similar` | `asyncHandler(productSearchController.findSimilar.bind(produc` | Find similar products |
| GET | `/products/:productId/similar` | `asyncHandler(productSearchController.findSimilar.bind(produc` | Find similar products
GET /customer/products/:productId/similar |
| PUT | `/products/:productId/status` | `asyncHandler(productController.updateProductStatus)` | Update product status
PUT /business/products/:productId/status |
| GET | `/products/:productId/store-availability` | `asyncHandler(productController.getProductStoreAvailability)` | Get product store availability
GET /business/products/:productId/store-availability |
| POST | `/products/:productId/unpublish` | `asyncHandler(productController.unpublishProduct)` | Unpublish a product
POST /business/products/:productId/unpublish |
| GET | `/products/:productId/variant-matrix` | `asyncHandler(productController.getVariantMatrix)` | — |
| GET | `/products/:productId/variants` | `asyncHandler(productController.getProductVariants)` | — |
| POST | `/products/:productId/variants` | `asyncHandler(productController.createProductVariant)` | — |
| GET | `/products/:productId/variants/:variantId` | `asyncHandler(productController.getProductVariant)` | — |
| PUT | `/products/:productId/variants/:variantId` | `asyncHandler(productController.updateProductVariant)` | — |
| DELETE | `/products/:productId/variants/:variantId` | `asyncHandler(productController.deleteProductVariant)` | — |
| PUT | `/products/:productId/visibility` | `asyncHandler(productController.updateProductVisibility)` | Update product visibility
PUT /business/products/:productId/visibility |
| GET | `/products/barcode/:barcode` | `asyncHandler(productController.findByBarcode)` | Find product by variant barcode
GET /business/products/barcode/:barcode |
| GET | `/products/barcode/:barcode` | `asyncHandler(productController.findByBarcode)` | Find product by variant barcode
GET /customer/products/barcode/:barcode |
| GET | `/products/bundles` | `asyncHandler(bundleController.getActiveBundles)` | — |
| GET | `/products/bundles/:id` | `asyncHandler(bundleController.getBundleDetails)` | — |
| POST | `/products/bundles/:id/calculate` | `asyncHandler(bundleController.calculateBundlePrice)` | — |
| GET | `/products/bundles/product/:productId` | `asyncHandler(bundleController.getBundleByProduct)` | — |
| GET | `/products/by-attribute/:code/:value` | `asyncHandler(productSearchController.findByAttribute.bind(pr` | Find products by attribute |
| GET | `/products/by-attribute/:code/:value` | `asyncHandler(productSearchController.findByAttribute.bind(pr` | Find products by attribute
GET /customer/products/by-attribute/:code/:value |
| GET | `/products/category/:categoryId` | `asyncHandler(productController.getProductsByCategory)` | Get products by category
GET /products/category/:categoryId |
| GET | `/products/featured` | `asyncHandler(productController.getFeaturedProducts)` | Get featured products
GET /products/featured |
| GET | `/products/search` | `asyncHandler(productSearchController.search.bind(productSear` | Search products with filters and facets |
| POST | `/products/search` | `asyncHandler(productSearchController.searchPost.bind(product` | — |
| GET | `/products/search` | `asyncHandler(productSearchController.search.bind(productSear` | Search products with advanced filters and facets
GET /customer/products/search |
| POST | `/products/search` | `asyncHandler(productSearchController.searchPost.bind(product` | Search products (POST for complex queries)
POST /customer/products/search |
| GET | `/products/search/suggestions` | `asyncHandler(productSearchController.getSuggestions.bind(pro` | Get search suggestions for autocomplete |
| GET | `/products/search/suggestions` | `asyncHandler(productSearchController.getSuggestions.bind(pro` | Get search suggestions for autocomplete
GET /customer/products/search/suggestions |
| GET | `/products/variants/:variantId` | `asyncHandler(productController.getProductVariant)` | Flat variant routes — must be before /:productId to avoid collision |
| PUT | `/products/variants/:variantId` | `asyncHandler(productController.updateProductVariant)` | — |
| DELETE | `/products/variants/:variantId` | `asyncHandler(productController.deleteProductVariant)` | — |
| PATCH | `/products/variants/:variantId/inventory` | `asyncHandler(productController.updateVariantInventory)` | — |
| DELETE | `/relationships/:relationshipId` | `asyncHandler(productController.deleteRelationship)` | — |
| GET | `/reviews` | `asyncHandler(productController.listReviews)` | — |
| GET | `/reviews/:reviewId` | `asyncHandler(productController.getReview)` | — |
| DELETE | `/reviews/:reviewId` | `asyncHandler(productController.deleteReview)` | — |
| PUT | `/reviews/:reviewId/approve` | `asyncHandler(productController.approveReview)` | — |
| POST | `/reviews/:reviewId/helpful` | `optionalCustomerAuth` | — |
| PUT | `/reviews/:reviewId/reject` | `asyncHandler(productController.rejectReview)` | — |
| POST | `/reviews/:reviewId/report` | `optionalCustomerAuth` | — |
| POST | `/reviews/:reviewId/respond` | `asyncHandler(productController.respondToReview)` | — |

<!-- GENERATED:ENDPOINTS:END -->
