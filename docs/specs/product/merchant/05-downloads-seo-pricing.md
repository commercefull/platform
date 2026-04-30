# Product – Merchant: Downloads, Extended SEO & Price Records EARS Requirements

> **System**: CommerceFull – `product`
> **Actor**: Merchant / Admin
> **Date**: 2026-04-28
> **Source**: `modules/product/infrastructure/repositories/productDownloadRepo.ts`, `modules/product/infrastructure/repositories/productSeoRepo.ts`, `modules/product/infrastructure/repositories/productPriceRepo.ts`

---

## Context

Three supplementary data models extend the core product record:

1. **Downloadable files** (`productDownload`) — file assets attached to downloadable products or variants, with download limits and expiry.
2. **Extended SEO** (`productSeo`) — a dedicated SEO record per product with Open Graph, Twitter Card, canonical URL, robots directive, and JSON-LD structured data, beyond the basic `metaTitle/metaDescription/metaKeywords` stored on the product entity itself.
3. **Price records** (`productPrice`) — multi-currency, quantity-tiered, date-ranged price overrides per product or variant, linked to optional price lists.

---

## Part A — Downloadable Files

### A.1 Ubiquitous Requirements

The system shall associate every `productDownload` record with a `productId` and optionally a `productVariantId`.

The system shall record `createdAt` and `updatedAt` on every download record.

### A.2 Event-Driven Requirements

When an authenticated merchant creates a download record with valid `productId`, `name`, and `fileUrl`, the system shall persist it and return the created record.

When an authenticated merchant calls the list endpoint for a product's downloads, the system shall return all download records for that product ordered by `sortOrder ASC, name ASC`.

When an authenticated merchant calls the list endpoint with a `productVariantId`, the system shall return only download records scoped to that variant.

When an authenticated merchant updates a download record with valid fields, the system shall apply the changes and return the updated record.

When an authenticated merchant activates a download record, the system shall set `isActive = true`.

When an authenticated merchant deactivates a download record, the system shall set `isActive = false`.

When an authenticated merchant reorders download records, the system shall update `sortOrder` on each record in the supplied order.

When an authenticated merchant deletes a download record, the system shall permanently remove it.

### A.3 Optional Feature Requirements

Where `maxDownloads` is set on a download record, the system shall enforce that limit when customers attempt to download the file.

Where `daysValid` is set on a download record, the system shall enforce that the download link expires after the specified number of days from purchase.

Where `sampleUrl` is set on a download record, the system shall expose the sample URL to customers before purchase.

### A.4 Unwanted Behaviour

If a merchant requests a download record that does not exist, the system shall return HTTP 404.

---

## Part B — Extended SEO

### B.1 Ubiquitous Requirements

The system shall allow at most one `productSeo` record per product.

The system shall record `createdAt` and `updatedAt` on every SEO record.

### B.2 Event-Driven Requirements

When an authenticated merchant creates a SEO record for a product that has no existing SEO record, the system shall insert it and return the created record.

When an authenticated merchant calls upsert on a product's SEO record, the system shall create it if it does not exist or update it if it does, in a single operation.

When an authenticated merchant updates a SEO record with valid fields, the system shall apply the changes and return the updated record.

When an authenticated merchant soft-deletes a SEO record, the system shall set `deletedAt` and return HTTP 200.

### B.3 SEO Fields Covered

| Field              | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `metaTitle`        | HTML `<title>` override                              |
| `metaDescription`  | HTML meta description                                |
| `metaKeywords`     | HTML meta keywords                                   |
| `ogTitle`          | Open Graph title                                     |
| `ogDescription`    | Open Graph description                               |
| `ogImage`          | Open Graph image URL                                 |
| `twitterCard`      | Twitter Card type (default: `summary_large_image`)   |
| `twitterTitle`     | Twitter Card title                                   |
| `twitterDescription` | Twitter Card description                           |
| `twitterImage`     | Twitter Card image URL                               |
| `canonicalUrl`     | Canonical URL for duplicate content management       |
| `robots`           | Robots directive (default: `index, follow`)          |
| `structuredData`   | JSON-LD schema object for rich snippets              |

### B.4 Unwanted Behaviour

If a merchant attempts to create a SEO record for a product that already has one, the system shall reject with: `"SEO already exists for this product"` (use upsert instead).

---

## Part C — Price Records

### C.1 Ubiquitous Requirements

The system shall associate every `productPrice` record with a `productId` and optionally a `productVariantId`.

The system shall record `createdAt` and `updatedAt` on every price record.

### C.2 Event-Driven Requirements

When an authenticated merchant creates a price record with valid `productId`, `currencyCode`, and `amount`, the system shall persist it and return the created record.

When an authenticated merchant calls the list endpoint for a product's prices, the system shall return all price records for that product ordered by `currencyCode ASC, minQuantity ASC NULLS FIRST`.

When an authenticated merchant calls the list endpoint for a variant's prices, the system shall return all price records scoped to that variant.

When an authenticated merchant updates a price record with valid fields, the system shall apply the changes and return the updated record.

### C.3 Price Record Fields

| Field            | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| `currencyCode`   | ISO 4217 currency code (required)                            |
| `amount`         | Price amount (required)                                      |
| `compareAtAmount`| Strike-through / compare-at price                            |
| `priceListId`    | Optional link to a named price list (e.g. B2B, wholesale)    |
| `minQuantity`    | Minimum quantity for this tier to apply                      |
| `maxQuantity`    | Maximum quantity for this tier to apply                      |
| `startsAt`       | Date/time from which this price is active                    |
| `endsAt`         | Date/time after which this price expires                     |

### C.4 Optional Feature Requirements

Where `priceListId` is set, the system shall apply this price only when the customer's session matches that price list (e.g. B2B negotiated pricing).

Where `minQuantity` / `maxQuantity` are set, the system shall apply this price only when the ordered quantity falls within the specified range (volume pricing).

Where `startsAt` / `endsAt` are set, the system shall apply this price only within the specified date range (scheduled promotions).

---

## 8. Use Case Traceability

| Requirement                          | Repo / Controller       | Source File                                                                    |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------ |
| Download CRUD + activate/deactivate  | `ProductDownloadRepo`   | `modules/product/infrastructure/repositories/productDownloadRepo.ts`           |
| Extended SEO upsert / update         | `ProductSeoRepo`        | `modules/product/infrastructure/repositories/productSeoRepo.ts`                |
| Price record CRUD                    | `ProductPriceRepo`      | `modules/product/infrastructure/repositories/productPriceRepo.ts`              |
