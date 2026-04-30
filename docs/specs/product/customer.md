# Product – Customer/Guest EARS Requirements

> **System**: CommerceFull – `product`
> **Actor**: Customer / Guest
> **Date**: 2026-04-28
> **Source**: `docs/modules/product.md`, domain code in `modules/product/`

---

## Context

Customers and guests browse, search, and interact with the published product catalog through the `/customer` API and the storefront portal. All customer-facing product endpoints are public (no authentication required) unless the operation involves a customer identity (e.g. submitting a review or voting on one). Only products in `ACTIVE` status with `VISIBLE` or `FEATURED` visibility are exposed to customers.

### Actors

| Actor    | Role                                                                                  |
| -------- | ------------------------------------------------------------------------------------- |
| Customer | Authenticated shopper; can submit reviews, vote on reviews, and submit Q&A questions  |
| Guest    | Unauthenticated visitor; can browse, search, and view products                        |
| System   | Tracks product views for analytics; enforces visibility and status filters             |

### Purchasability Rule

A product is purchasable when:
- `status = ACTIVE`
- `visibility ∈ { VISIBLE, FEATURED }`

### Policy Defaults

| Policy                              | Default                                    |
| ----------------------------------- | ------------------------------------------ |
| Default page size (listing)         | 20 products                                |
| Default page size (featured)        | 10 products                                |
| Default page size (related)         | 8 products                                 |
| Default sort order                  | `createdAt DESC` (newest first)            |
| Search minimum query length         | 2 characters (suggestions require ≥ 2)     |
| Review rating range                 | 1–5 (inclusive)                            |
| Q&A initial status                  | `pending` (requires merchant approval)     |
| Review initial status               | `pending` (requires merchant approval)     |
| One vote per customer per review    | Enforced via `ON CONFLICT DO NOTHING`      |

---

## 1. Ubiquitous Requirements

The system shall never expose a product with `status ≠ ACTIVE` to any customer-facing endpoint.

The system shall never expose a product with `visibility ∉ { VISIBLE, FEATURED }` to any customer-facing listing, search, or detail endpoint.

The system shall never expose a product whose `deletedAt` is set to any customer-facing endpoint.

The system shall return only `approved` reviews in all customer-facing review responses.

The system shall return only `approved` Q&A entries in all customer-facing Q&A responses.

The system shall use double-quoted camelCase identifiers in every SQL statement (e.g. `"productId"`, `"createdAt"`).

---

## 2. Event-Driven Requirements

### 2.1 Product Browsing

When a guest or customer calls `GET /customer/products`, the system shall return a paginated list of `ACTIVE` products with `VISIBLE` or `FEATURED` visibility, sorted by `createdAt DESC` by default.

When a guest or customer calls `GET /customer/products/featured`, the system shall return a paginated list of `ACTIVE` products with `isFeatured = true` and `VISIBLE` or `FEATURED` visibility.

When a guest or customer calls `GET /customer/products/category/:categoryId`, the system shall return a paginated list of `ACTIVE` products with `VISIBLE` or `FEATURED` visibility assigned to the specified category.

When a guest or customer calls `GET /customer/products/:identifier` with a valid UUID or slug, the system shall return the full product detail including variants and images.

When a guest or customer calls `GET /customer/products/barcode/:barcode`, the system shall look up the product and variant matching the barcode and return the product detail.

When a guest or customer calls `GET /customer/products/:productId/related`, the system shall return a list of related products based on category, tags, or recommendations, excluding the source product.

### 2.2 Product Search

When a guest or customer calls `GET /customer/products/search` with a `q` parameter, the system shall return a paginated list of matching `ACTIVE` products with `VISIBLE`, `SEARCH_ONLY`, or `FEATURED` visibility, along with `total`, `page`, `limit`, and `totalPages` metadata.

When a guest or customer calls `GET /customer/products/search` with `minPrice` and/or `maxPrice` parameters, the system shall filter results to products whose effective price falls within the specified range.

When a guest or customer calls `GET /customer/products/search` with `isFeatured=true`, the system shall return only products where `isFeatured = true`.

When a guest or customer calls `GET /customer/products/search` with `sortBy` and `sortOrder` parameters, the system shall return results ordered accordingly.

When a guest or customer calls `POST /customer/products/search` with a JSON body including `includeFacets: true`, the system shall return search results together with facets for `categories`, `brands`, `priceRanges`, and `attributes`.

When a guest or customer calls `GET /customer/products/search/suggestions` with a `q` parameter of at least 2 characters, the system shall return an array of autocomplete suggestions up to the requested `limit`.

When a guest or customer calls `GET /customer/products/:productId/similar`, the system shall return a list of similar products based on shared attributes, excluding the source product.

When a guest or customer calls `GET /customer/products/by-attribute/:code/:value`, the system shall return all `ACTIVE` visible products that have the specified attribute code set to the specified value.

### 2.3 Reviews

When a guest or customer calls `GET /customer/products/:productId/reviews`, the system shall return all `approved` reviews for the product along with `averageRating`, `ratingDistribution`, and `totalCount`.

When a customer calls `POST /customer/products/:productId/reviews` with a valid `rating` (1–5) and `reviewerName`, the system shall create the review with `status = pending` and return it with HTTP 201.

When a customer calls `POST /customer/reviews/:reviewId/helpful`, the system shall increment the review's `helpfulCount`.

When a customer calls `POST /customer/reviews/:reviewId/report`, the system shall increment the review's `reportCount`.

When an authenticated customer calls `POST /customer/products/:productId/reviews/:reviewId/vote` with `isHelpful: true` or `false`, the system shall record the vote using `ON CONFLICT DO NOTHING` to enforce one vote per customer per review, and return the updated helpful/unhelpful counts.

### 2.4 Q&A

When a guest or customer calls `GET /customer/products/:productId/qa`, the system shall return all `approved` Q&A entries for the product.

When a guest or customer calls `POST /customer/products/:productId/qa` with a non-empty `question`, the system shall create the Q&A entry with `status = pending` and return it with HTTP 201.

### 2.5 Bundles

When a guest or customer calls `GET /customer/products/bundles`, the system shall return all active bundles.

When a guest or customer calls `GET /customer/products/bundles/:id`, the system shall return the full bundle details.

When a guest or customer calls `GET /customer/products/bundles/product/:productId`, the system shall return the bundle associated with the specified product.

When a guest or customer calls `POST /customer/products/bundles/:id/calculate` with a list of `{ productId, variantId, quantity }` items, the system shall calculate and return the bundle price for the provided item selection.

---

## 3. State-Driven Requirements

While a product has `status = ACTIVE` and `visibility ∈ { VISIBLE, FEATURED }`, the system shall include it in all customer-facing listing, search, and detail responses.

While a product has `status ≠ ACTIVE` or `visibility ∉ { VISIBLE, FEATURED }`, the system shall exclude it from all customer-facing responses and return HTTP 404 for direct detail requests.

While a product has `hasVariants = true`, the system shall include the full variant list (with stock, pricing, and attribute data) in the product detail response.

While a variant has `stockQuantity ≤ 0`, the system shall mark it as `isOutOfStock = true` and `isInStock = false` in the response.

While a variant has `0 < stockQuantity ≤ lowStockThreshold`, the system shall mark it as `isLowStock = true` in the response.

While a product's `price.salePrice` is set and less than `basePrice`, the system shall mark `isOnSale = true` and compute `discountPercentage` and `discountAmount` in the response.

---

## 4. Optional Feature Requirements

Where a product has `isVirtual = true`, the system shall omit physical shipping requirements from the product detail response.

Where a product has `isDownloadable = true`, the system shall indicate downloadable availability in the product detail response.

Where a product has `isSubscription = true`, the system shall indicate subscription availability in the product detail response.

Where `includeFacets: true` is passed in a `POST /customer/products/search` request, the system shall compute and return facets for `categories`, `brands`, `priceRanges`, and `attributes` alongside the search results.

---

## 5. Unwanted Behaviour / Edge Cases

### 5.1 Visibility Guards

If a customer requests `GET /customer/products/:identifier` for a product that is not `ACTIVE` or not `VISIBLE`/`FEATURED`, the system shall return HTTP 404 (never HTTP 403, to avoid leaking existence).

If a customer requests `GET /customer/products/barcode/:barcode` for a product that is not `ACTIVE` or not `VISIBLE`/`FEATURED`, the system shall return HTTP 404.

### 5.2 Search Guards

If a customer calls `GET /customer/products/search/suggestions` with a query shorter than 2 characters, the system shall return an empty array.

If a customer calls `GET /customer/products/search` with no `q` parameter, the system shall return all visible products (unfiltered by text) with the default pagination.

### 5.3 Review Guards

If a customer attempts to create a review with a `rating` outside the range 1–5, the system shall reject the request with HTTP 400 and the message `"Rating must be between 1 and 5"`.

If a customer attempts to create a review without a `reviewerName`, the system shall reject the request with HTTP 400 and the message `"Reviewer name is required"`.

If a customer attempts to vote on a review without being authenticated, the system shall reject the request with HTTP 401 and the message `"Authentication required"`.

If a customer attempts to vote on a review without providing `isHelpful` as a boolean, the system shall reject the request with HTTP 400 and the message `"isHelpful (boolean) is required"`.

If a customer attempts to vote on a review they have already voted on, the system shall silently ignore the duplicate vote (`ON CONFLICT DO NOTHING`) and return `voted: false` with the current counts.

### 5.4 Q&A Guards

If a customer attempts to submit a Q&A question without a `question` field, the system shall reject the request with HTTP 400 and the message `"question is required"`.

If a customer attempts to submit a Q&A question for a product that does not exist, the system shall reject the request with HTTP 404.

### 5.5 Barcode Guards

If a customer calls `GET /customer/products/barcode/:barcode` with an empty barcode, the system shall reject the request with HTTP 400 and the message `"Barcode is required"`.

If no product variant matches the provided barcode, the system shall return HTTP 404 and the message `"Product not found"`.

---

## 6. Complex Requirements

When a customer calls `GET /customer/products/:identifier` and the identifier is a UUID, the system shall look up the product by `productId`; when the identifier is not a UUID, the system shall look up the product by `slug`; in both cases the system shall then verify `status = ACTIVE` and `visibility ∈ { VISIBLE, FEATURED }` before returning the detail, and return HTTP 404 if either check fails.

When a customer calls `POST /customer/products/:productId/reviews` while authenticated, the system shall simultaneously create the review with `status = pending`, set `isVerifiedPurchase = true` (because a `customerId` is present), and return HTTP 201.

When a customer calls `POST /customer/products/:productId/reviews` while unauthenticated (no `customerId`), the system shall create the review with `status = pending` and `isVerifiedPurchase = false`, and return HTTP 201.

---

## 7. Customer Product Lifecycle Summary

```
Product visible to customer:
  status = ACTIVE  AND  visibility ∈ { VISIBLE, FEATURED }

Product hidden from customer:
  status ≠ ACTIVE  OR  visibility ∉ { VISIBLE, FEATURED }  OR  deletedAt IS NOT NULL
```

**Review lifecycle (customer perspective):**
```
Customer submits review → status = pending
Merchant approves       → status = approved  (visible to customers)
Merchant rejects        → status = rejected  (hidden from customers)
```

**Q&A lifecycle (customer perspective):**
```
Customer submits question → status = pending
Merchant approves         → status = approved  (visible to customers)
```

### Policy Defaults

| Policy                           | Default                                 |
| -------------------------------- | --------------------------------------- |
| Default listing page size        | 20                                      |
| Default featured page size       | 10                                      |
| Default related products limit   | 8                                       |
| Default search page size         | 20                                      |
| Search suggestion minimum length | 2 characters                            |
| Review initial status            | `pending`                               |
| Q&A initial status               | `pending`                               |
| One vote per customer per review | Enforced (duplicate silently ignored)   |

---

## 8. Use Case Traceability

| Requirement (summary)                                  | Use Case / Controller              | Source File                                                                        |
| ------------------------------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------- |
| List products (customer)                               | `ListProductsUseCase`              | `modules/product/application/useCases/ListProducts.ts`                             |
| Get featured products                                  | `ListProductsUseCase`              | `modules/product/application/useCases/ListProducts.ts`                             |
| Get products by category                               | `ListProductsUseCase`              | `modules/product/application/useCases/ListProducts.ts`                             |
| Get product detail by ID or slug                       | `GetProductUseCase`                | `modules/product/application/useCases/GetProduct.ts`                               |
| Get product by barcode                                 | `ProductCustomerController`        | `modules/product/interface/controllers/ProductCustomerController.ts`               |
| Get related products                                   | `ProductCustomerController`        | `modules/product/interface/controllers/ProductCustomerController.ts`               |
| Search products (GET)                                  | `SearchProductsUseCase`            | `modules/product/application/useCases/SearchProducts.ts`                           |
| Search products with facets (POST)                     | `ProductSearchController`          | `modules/product/interface/controllers/ProductSearchController.ts`                 |
| Search suggestions                                     | `ProductSearchController`          | `modules/product/interface/controllers/ProductSearchController.ts`                 |
| Find similar products                                  | `ProductSearchController`          | `modules/product/interface/controllers/ProductSearchController.ts`                 |
| Find products by attribute                             | `ProductSearchController`          | `modules/product/interface/controllers/ProductSearchController.ts`                 |
| Get product reviews + stats                            | `ProductCustomerController`        | `modules/product/interface/controllers/ProductCustomerController.ts`               |
| Submit review                                          | `ProductCustomerController`        | `modules/product/interface/controllers/ProductCustomerController.ts`               |
| Mark review helpful / report review                    | `ProductCustomerController`        | `modules/product/interface/controllers/ProductCustomerController.ts`               |
| Vote on review (one-per-customer)                      | `VoteOnReviewUseCase`              | `modules/product/application/useCases/VoteOnReview.ts`                             |
| List approved Q&A (customer)                           | `ProductCustomerController`        | `modules/product/interface/controllers/ProductCustomerController.ts`               |
| Submit Q&A question                                    | `SubmitProductQaUseCase`           | `modules/product/application/useCases/SubmitProductQa.ts`                          |
| Get active bundles                                     | `BundleController`                 | `modules/product/interface/controllers/BundleController.ts`                        |
| Get bundle details / by product                        | `BundleController`                 | `modules/product/interface/controllers/BundleController.ts`                        |
| Calculate bundle price                                 | `BundleController`                 | `modules/product/interface/controllers/BundleController.ts`                        |
