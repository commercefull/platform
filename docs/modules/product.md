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
