# Product – Merchant: Product Lifecycle EARS Requirements

> **System**: CommerceFull – `product`
> **Actor**: Merchant / Admin
> **Date**: 2026-04-28
> **Source**: `docs/modules/product.md`, `modules/product/`

---

## Context

Merchants manage the full product lifecycle through `POST/PUT/DELETE /business/products`.
All `/business` routes require `isMerchantLoggedIn` middleware.
Every product must be owned by either a `merchantId` or a `businessId`.

### Product Status State Machine

| From             | To (allowed)                               |
| ---------------- | ------------------------------------------ |
| `DRAFT`          | `PENDING_REVIEW`, `ACTIVE`, `ARCHIVED`     |
| `PENDING_REVIEW` | `ACTIVE`, `DRAFT`, `ARCHIVED`              |
| `ACTIVE`         | `INACTIVE`, `DISCONTINUED`, `ARCHIVED`     |
| `INACTIVE`       | `ACTIVE`, `DISCONTINUED`, `ARCHIVED`       |
| `DISCONTINUED`   | `ARCHIVED`                                 |
| `ARCHIVED`       | _(none — terminal)_                        |

### Product Visibility Values

| Value          | Catalog | Search | Featured |
| -------------- | ------- | ------ | -------- |
| `visible`      | ✅      | ✅     | ❌       |
| `hidden`       | ❌      | ❌     | ❌       |
| `catalog_only` | ✅      | ❌     | ❌       |
| `search_only`  | ❌      | ✅     | ❌       |
| `featured`     | ✅      | ✅     | ✅       |

### Policy Defaults

| Policy                        | Default                                        |
| ----------------------------- | ---------------------------------------------- |
| Initial status                | `DRAFT`                                        |
| Initial visibility            | `HIDDEN`                                       |
| Minimum order quantity        | 1                                              |
| Soft delete                   | Sets `deletedAt`, status → `ARCHIVED`          |
| Hard delete                   | Permanent — requires `?permanent=true`         |
| Publish precondition          | Product must be `ACTIVE`                       |
| Featured + visible            | Auto-promoted to `featured` visibility         |
| Default currency              | `USD`                                          |
| Slug max length               | 200 characters                                 |

---

## 1. Ubiquitous Requirements

The system shall associate every product with exactly one owner — either a `merchantId` or a `businessId` — and reject creation if neither is provided.

The system shall assign every new product `DRAFT` status and `HIDDEN` visibility at creation time.

The system shall enforce the `ProductStatusTransitions` map and reject any transition not listed in it.

The system shall record `createdAt` and `updatedAt` on every product record.

The system shall use double-quoted camelCase identifiers in every SQL statement (e.g. `"productId"`, `"createdAt"`).

The system shall scope every `/business` query by the authenticated merchant's identity and never return products belonging to another merchant.

The system shall soft-delete products by setting `deletedAt` and transitioning status to `ARCHIVED` when a standard delete is requested.

The system shall permanently remove a product and all child records only when `?permanent=true` is explicitly passed.

The system shall ensure every `Price` value object enforces: `basePrice ≥ 0`, `salePrice ≥ 0`, and `salePrice ≤ basePrice`.

The system shall auto-generate a URL-safe `slug` from the product `name` when no slug is provided.

The system shall ensure every product `slug` is unique across the catalog.

The system shall ensure every product `sku` is unique across the catalog when provided.

---

## 2. Event-Driven Requirements

When an authenticated merchant calls `POST /business/products` with a valid `name` and `productTypeId`, the system shall create the product in `DRAFT` status with `HIDDEN` visibility and publish `product.created` with `{ productId, name, sku, categoryId, merchantId }`.

When an authenticated merchant calls `PUT /business/products/:productId` with one or more valid field updates, the system shall apply only the provided fields, persist the changes, and publish `product.updated` with `{ productId, updatedFields }`.

When an authenticated merchant calls `PUT /business/products/:productId/status` with a valid target status, the system shall transition the product status, persist the change, and publish `product.status_changed` with `{ productId, previousStatus, newStatus }`.

When an authenticated merchant calls `PUT /business/products/:productId/visibility` with a valid visibility value, the system shall update the product visibility and persist the change.

When an authenticated merchant calls `POST /business/products/:productId/publish` and the product is `ACTIVE`, the system shall set `publishedAt` to the current timestamp, set visibility to `VISIBLE`, and publish `product.published` with `{ productId, name, publishedAt }`.

When an authenticated merchant calls `POST /business/products/:productId/unpublish`, the system shall set visibility to `HIDDEN` and publish `product.unpublished` with `{ productId }`.

When an authenticated merchant calls `DELETE /business/products/:productId` without `?permanent=true`, the system shall set `deletedAt`, transition status to `ARCHIVED`, set visibility to `HIDDEN`, and publish `product.deleted` with `{ productId, name, permanent: false }`.

When an authenticated merchant calls `DELETE /business/products/:productId?permanent=true`, the system shall permanently remove the product and publish `product.deleted` with `{ productId, name, permanent: true }`.

When a product's `basePrice` is updated and the new value differs from the previous effective price, the system shall publish `product.price_changed` with `{ productId, previousPrice, newPrice, currency }`.

When a merchant sets `isFeatured = true` on a product whose visibility is `VISIBLE`, the system shall automatically promote visibility to `FEATURED`.

When a merchant sets `isFeatured = false` on a product whose visibility is `FEATURED`, the system shall demote visibility back to `VISIBLE`.

---

## 3. State-Driven Requirements

While a product is in `DRAFT` status, the system shall allow transitions to `PENDING_REVIEW`, `ACTIVE`, or `ARCHIVED`.

While a product is in `PENDING_REVIEW` status, the system shall allow transitions to `ACTIVE`, `DRAFT`, or `ARCHIVED`.

While a product is in `ACTIVE` status, the system shall allow transitions to `INACTIVE`, `DISCONTINUED`, or `ARCHIVED`, and shall allow publishing.

While a product is in `INACTIVE` status, the system shall allow transitions to `ACTIVE`, `DISCONTINUED`, or `ARCHIVED`.

While a product is in `DISCONTINUED` status, the system shall allow only the transition to `ARCHIVED`.

While a product is in `ARCHIVED` status, the system shall prevent all further status transitions.

While a product has `visibility = HIDDEN`, the system shall prevent it from appearing in any customer-facing listing or search.

While a product has `visibility = FEATURED`, the system shall include it in featured product queries.

---

## 4. Optional Feature Requirements

Where a product has `isVirtual = true`, the system shall not require physical dimension or weight fields.

Where a product has `isDownloadable = true`, the system shall associate it with downloadable file management (see `05-downloads.md`).

Where a product has `isSubscription = true`, the system shall associate it with subscription billing logic.

Where a product has `isTaxable = true`, the system shall apply the product's `taxClass` during checkout tax calculation.

Where a product has `hasVariants = true`, the system shall expose variant management endpoints and use variant-level pricing and stock for purchase eligibility.

Where a merchant provides `storeId` on a product, the system shall treat the product as a store-specific override and scope all queries to that store.

---

## 5. Unwanted Behaviour / Edge Cases

If a merchant attempts to create a product without a `name`, the system shall reject with HTTP 400: `"Product name is required"`.

If a merchant attempts to create a product without a `productTypeId`, the system shall reject with HTTP 400: `"Product type is required"`.

If a merchant attempts to create a product with a `sku` that already exists, the system shall reject with: `"Product with SKU \"<sku>\" already exists"`.

If a merchant attempts to create a product with a `slug` that already exists, the system shall reject with: `"Product with slug \"<slug>\" already exists"`.

If a merchant attempts to create a product without `merchantId` or `businessId`, the system shall reject with: `"Product must be owned by either a merchant or business"`.

If a merchant attempts a status transition not listed in `ProductStatusTransitions`, the system shall reject with: `"Cannot transition product from <current> to <target>"`.

If a merchant attempts to publish a product that is not `ACTIVE`, the system shall reject with: `"Product must be active to publish"`.

If a merchant provides a `basePrice` less than 0, the system shall reject with: `"Base price cannot be negative"`.

If a merchant provides a `salePrice` greater than `basePrice`, the system shall reject with: `"Sale price cannot be greater than base price"`.

If a merchant requests any operation on a product that does not exist, the system shall return HTTP 404.

---

## 6. Complex Requirements

When a merchant publishes a product while it is `ACTIVE`, the system shall simultaneously set `publishedAt`, set visibility to `VISIBLE`, persist the product, and publish `product.published`.

When a merchant soft-deletes a product, the system shall simultaneously set `deletedAt`, transition status to `ARCHIVED`, set visibility to `HIDDEN`, persist the product, and publish `product.deleted` with `permanent: false`.

When a merchant updates `basePrice` while a `salePrice` exists that would exceed the new `basePrice`, the system shall automatically clear `salePrice` to maintain the invariant `salePrice ≤ basePrice`.

---

## 7. Lifecycle Diagram

```
DRAFT ──► PENDING_REVIEW ──► ACTIVE ──► INACTIVE ──► DISCONTINUED
  │              │               │                          │
  │              └───────────────┤                          ▼
  └──────────────────────────────┴──────────────────────► ARCHIVED
```

Visibility transitions:
```
publish()              → VISIBLE   (requires ACTIVE)
unpublish()            → HIDDEN
archive() / delete()   → HIDDEN
setFeatured(true)  + VISIBLE   → FEATURED
setFeatured(false) + FEATURED  → VISIBLE
```

---

## 8. Use Case Traceability

| Requirement                              | Use Case / Controller       | Source File                                                          |
| ---------------------------------------- | --------------------------- | -------------------------------------------------------------------- |
| Create product → `product.created`       | `CreateProductUseCase`      | `modules/product/application/useCases/CreateProduct.ts`              |
| List products                            | `ListProductsUseCase`       | `modules/product/application/useCases/ListProducts.ts`               |
| Get product detail                       | `GetProductUseCase`         | `modules/product/application/useCases/GetProduct.ts`                 |
| Update product → `product.updated`       | `UpdateProductUseCase`      | `modules/product/application/useCases/UpdateProduct.ts`              |
| Update status / visibility               | `ProductBusinessController` | `modules/product/interface/controllers/ProductBusinessController.ts` |
| Publish / unpublish                      | `ProductBusinessController` | `modules/product/interface/controllers/ProductBusinessController.ts` |
| Soft delete / hard delete                | `ProductBusinessController` | `modules/product/interface/controllers/ProductBusinessController.ts` |
| Get product store availability           | `GetProductStoreAvailabilityUseCase` | `modules/product/application/useCases/GetProductStoreAvailability.ts` |
| Get catalog enrichment (brand/cat/tag/qa)| `GetProductCatalogEnrichmentUseCase` | `modules/product/application/useCases/GetProductCatalogEnrichment.ts` |
