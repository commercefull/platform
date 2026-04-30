# Product – Merchant: Variants & Media EARS Requirements

> **System**: CommerceFull – `product`
> **Actor**: Merchant / Admin
> **Date**: 2026-04-28
> **Source**: `modules/product/domain/entities/ProductVariant.ts`, `modules/product/infrastructure/repositories/productMediaRepo.ts`

---

## Context

A product with `hasVariants = true` exposes variant management endpoints.
Each variant has its own SKU, price, stock, attributes, barcode, and optional media.
The `productMedia` table stores rich media (image, video, document, 3d_model, audio) at both product and variant level, separate from the legacy `productImage` table.

### Policy Defaults

| Policy                        | Default |
| ----------------------------- | ------- |
| Low stock threshold (variant) | 5       |
| Variant list limit            | 100     |
| Default weight unit           | `kg`    |
| Default dimension unit        | `cm`    |

---

## 1. Ubiquitous Requirements

The system shall ensure every `ProductVariant` maintains a non-negative `stockQuantity`.

The system shall ensure every variant `sku` is unique across the catalog.

The system shall record `createdAt` and `updatedAt` on every variant and media record.

The system shall mark a variant `isLowStock = true` when `0 < stockQuantity ≤ lowStockThreshold`.

The system shall mark a variant `isOutOfStock = true` when `stockQuantity ≤ 0`.

When a new media item is set as primary (`isPrimary = true`), the system shall automatically unset `isPrimary` on all other media items for the same product or variant.

---

## 2. Event-Driven Requirements

### 2.1 Variant CRUD

When an authenticated merchant calls `POST /business/products/:productId/variants` with a valid SKU and attributes, the system shall create the variant, associate it with the product, and publish `product.variant_created` with `{ productId, variantId, sku, attributes }`.

When an authenticated merchant calls `PUT /business/products/:productId/variants/:variantId` with valid updates, the system shall apply the changes and publish `product.variant_updated` with `{ productId, variantId, updatedFields }`.

When an authenticated merchant calls `DELETE /business/products/:productId/variants/:variantId`, the system shall remove the variant and publish `product.variant_deleted` with `{ productId, variantId, sku }`.

When an authenticated merchant calls `PATCH /business/products/variants/:variantId/inventory` with a new quantity, the system shall update the variant's `stockQuantity`.

When an authenticated merchant calls `GET /business/products/:productId/variants`, the system shall return all active variants for the product ordered by `position ASC`.

When an authenticated merchant calls `GET /business/products/variants/:variantId`, the system shall return the full variant detail.

### 2.2 Barcode Lookup

When an authenticated merchant calls `GET /business/products/barcode/:barcode`, the system shall return the product and variant matching that barcode.

### 2.3 Product Images (legacy `productImage` table)

When an authenticated merchant calls `POST /business/products/:productId/images` with a valid image payload, the system shall attach the image to the product and publish `product.image_added` with `{ productId, imageId, url, isPrimary }`.

When an authenticated merchant calls `PUT /business/products/:productId/images/:imageId` with valid updates, the system shall apply the changes.

When an authenticated merchant calls `POST /business/products/:productId/images/reorder` with an ordered array of `imageIds`, the system shall update each image's `position` to match the supplied order.

When an authenticated merchant calls `DELETE /business/products/:productId/images/:imageId`, the system shall remove the image; if the removed image was primary and other images remain, the system shall promote the first remaining image to primary.

### 2.4 Rich Media (`productMedia` table)

The `productMedia` table supports five media types: `image`, `video`, `document`, `3d_model`, `audio`. Media can be attached at product level or variant level.

When an authenticated merchant creates a media record with `isPrimary = true`, the system shall unset `isPrimary` on all other media for the same product (or variant) before inserting the new record.

When an authenticated merchant calls bulk reorder on media, the system shall update `sortOrder` on each record in the supplied order.

When an authenticated merchant deletes a media record, the system shall remove it and return the deleted `productMediaId`.

---

## 3. State-Driven Requirements

While a product has `hasVariants = false`, the system shall use the product-level price and stock for purchase eligibility.

While a product has `hasVariants = true`, the system shall use variant-level price and stock for purchase eligibility.

While a variant has `isActive = false`, the system shall exclude it from the default variant list returned to customers.

---

## 4. Unwanted Behaviour / Edge Cases

If a merchant attempts to decrement a variant's stock below 0, the system shall reject with: `"Insufficient stock"`.

If a merchant attempts to set a variant's `stockQuantity` to a negative value, the system shall reject with: `"Stock quantity cannot be negative"`.

If a merchant requests a variant or media record that does not exist, the system shall return HTTP 404.

If a merchant calls `GET /business/products/barcode/:barcode` with an empty barcode, the system shall reject with HTTP 400: `"Barcode is required"`.

If no product variant matches the provided barcode, the system shall return HTTP 404.

If a merchant attempts to add a media value of type `select` or `radio` to an attribute that does not support options, the system shall reject with an appropriate error.

---

## 8. Use Case Traceability

| Requirement                              | Use Case / Controller       | Source File                                                          |
| ---------------------------------------- | --------------------------- | -------------------------------------------------------------------- |
| Create variant → `product.variant_created` | `CreateProductVariantUseCase` | `modules/product/application/useCases/CreateProductVariant.ts`     |
| Get variants for product                 | `GetProductVariantsUseCase` | `modules/product/application/useCases/GetProductVariants.ts`         |
| Update / delete variant                  | `ProductBusinessController` | `modules/product/interface/controllers/ProductBusinessController.ts` |
| Patch variant inventory                  | `ProductBusinessController` | `modules/product/interface/controllers/ProductBusinessController.ts` |
| Barcode lookup                           | `ProductBusinessController` | `modules/product/interface/controllers/ProductBusinessController.ts` |
| Add / update / delete / reorder images   | `ProductBusinessController` | `modules/product/interface/controllers/ProductBusinessController.ts` |
| Rich media CRUD + reorder                | `productMediaRepo`          | `modules/product/infrastructure/repositories/productMediaRepo.ts`    |
