# Migrating from Shopify

> **Your exit.** This guide walks through a complete Shopify→CommerceFull migration using the platform's built-in migration module.

---

## Overview

CommerceFull's [migration module](../modules/migration.md) provides the orchestration layer for importing data from external commerce platforms. It tracks each import as a job, maintains a mapping table between source-platform IDs and platform-internal IDs, and logs any errors encountered.

The module supports imports from: **Shopify**, WooCommerce, Magento, BigCommerce, PrestaShop, Shopware, Wix, Squarespace, CSV, or custom API sources.

This guide focuses on Shopify — the most common migration path.

---

## Prerequisites

- CommerceFull installed and running (`yarn dev` or production build)
- PostgreSQL migrated (`yarn db:migrate`)
- Admin account created (`yarn job:new:admin`)
- Organization created (`yarn job:new:organization`)
- Shopify Admin API access (private app or API credentials with read access to products, customers, orders, inventory)

---

## What Can Be Migrated

| Entity | Shopify Source | CommerceFull Module |
|---|---|---|
| Products | Shopify Products API | `product` |
| Product variants | Shopify Products API (variants) | `product` |
| Categories/collections | Shopify Custom Collections | `content` |
| Customers | Shopify Customers API | `customer` |
| Orders | Shopify Orders API | `order` |
| Inventory levels | Shopify Inventory API | `inventory` |
| Coupons/discounts | Shopify Price Rules / Discount Codes | `coupon` |
| Tax rates | Shopify Tax settings | `tax` |
| Shipping zones | Shopify Shipping Zones | `shipping` |
| Reviews | Shopify Product Reviews (metafields) | `product` (reviews subsystem) |
| Gift cards | Shopify Gift Cards API | `coupon` (gift card subsystem) |
| CMS pages | Shopify Pages | `content` |

---

## Migration Workflow

### Step 1: Export from Shopify

Use the Shopify Admin API to export your data. For each entity type, fetch all records and save them as JSON or CSV.

```bash
# Example: Export products via Shopify Admin API
curl -X GET "https://your-store.myshopify.com/admin/api/2026-07/products.json?limit=250" \
  -H "X-Shopify-Access-Token: YOUR_ACCESS_TOKEN" \
  -o products_page_1.json

# Paginate through all results using the Link header
# Repeat for customers, orders, inventory, etc.
```

Alternatively, use Shopify's built-in CSV export from the admin panel (Products → Export, Customers → Export, etc.).

### Step 2: Create an Import Job

Create a migration job via the Business API. This registers the import with the platform and returns a job ID.

```bash
curl -X POST http://localhost:3000/business/migration/jobs \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "organizationId": "your-org-id",
    "jobType": "full",
    "source": "shopify",
    "sourceStoreUrl": "https://your-store.myshopify.com",
    "dryRun": false,
    "autoActivate": true
  }'
```

> **Tip:** Start with `dryRun: true` to validate your data without writing anything. Review the error log, fix issues, then re-run with `dryRun: false`.

### Step 3: Start the Job

```bash
curl -X POST http://localhost:3000/business/migration/jobs/{importJobId}/start \
  -H "Cookie: your_session_cookie"
```

### Step 4: Stream Records

For each record from your Shopify export, import it into the appropriate CommerceFull module and record the mapping:

```bash
# 1. Create the product via the Business API
curl -X POST http://localhost:3000/business/products \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "name": "Example Product",
    "sku": "EXAMPLE-001",
    "price": 29.99,
    "currency": "USD"
  }'

# 2. Record the mapping (Shopify product ID → CommerceFull product ID)
curl -X POST http://localhost:3000/business/migration/jobs/{importJobId}/mappings \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "entityType": "product",
    "sourceId": "shopify-product-123456",
    "platformId": "commercefull-product-uuid"
  }'

# 3. Record success or error
# On success — the job's successCount auto-increments via the use case
# On error — log it for later triage
curl -X POST http://localhost:3000/business/migration/jobs/{importJobId}/errors \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "entityType": "product",
    "sourceId": "shopify-product-789",
    "severity": "error",
    "message": "Missing required field: price"
  }'
```

### Step 5: Monitor Progress

Check job status and stats:

```bash
curl http://localhost:3000/business/migration/jobs/{importJobId} \
  -H "Cookie: your_session_cookie"
```

Response includes progress counters: `totalRecords`, `processedRecords`, `successCount`, `errorCount`, `skippedCount`.

Review errors by severity:

```bash
curl "http://localhost:3000/business/migration/jobs/{importJobId}/errors?severity=error&resolved=false" \
  -H "Cookie: your_session_cookie"
```

### Step 6: Complete the Job

Once all records are processed:

```bash
curl -X POST http://localhost:3000/business/migration/jobs/{importJobId}/complete \
  -H "Cookie: your_session_cookie"
```

### Step 7: Verify and Cutover

1. **Verify data** — spot-check products, customers, and orders in the admin panel
2. **Test checkout** — run a test order end-to-end
3. **Update DNS** — point your domain to the new CommerceFull instance
4. **Redirect Shopify traffic** — set up 301 redirects from old Shopify URLs to new CommerceFull URLs
5. **Cancel Shopify** — once you've verified everything works, cancel your Shopify subscription

---

## ID Mapping and Deduplication

The migration module maintains a mapping table (`importMapping`) that links Shopify IDs to CommerceFull IDs. This enables:

- **Re-run safety** — if a migration fails partway through, re-running won't create duplicates (the mapping is checked first)
- **Cross-entity references** — when importing orders that reference Shopify customer IDs, the mapping table resolves them to CommerceFull customer IDs
- **Rollback** — identify which entities were created by a specific import job

---

## Migration Checklist

- [ ] Export all data from Shopify (products, customers, orders, inventory, coupons, pages)
- [ ] Create import job in CommerceFull (`source: shopify`)
- [ ] Run dry-run import (`dryRun: true`) and review errors
- [ ] Fix data issues in export files
- [ ] Run full import (`dryRun: false`)
- [ ] Review error log and resolve any remaining errors
- [ ] Verify products, customers, orders in admin panel
- [ ] Test checkout flow end-to-end
- [ ] Configure payment gateway (Stripe/Adyen)
- [ ] Configure shipping zones and rates
- [ ] Configure tax rates
- [ ] Set up email notifications
- [ ] Update DNS to point to CommerceFull
- [ ] Set up 301 redirects from Shopify URLs
- [ ] Monitor for 48 hours
- [ ] Cancel Shopify subscription

---

## Other Platforms

The same workflow applies to other supported sources. Change the `source` field when creating the import job:

| Source | `source` value | Export method |
|---|---|---|
| WooCommerce | `woocommerce` | WooCommerce REST API or WP All Export |
| Magento | `magento` | Magento REST API or data export |
| BigCommerce | `bigcommerce` | BigCommerce API |
| PrestaShop | `prestashop` | PrestaShop CSV export |
| Shopware | `shopware` | Shopware API |
| Wix | `wix` | Wix Stores CSV export |
| Squarespace | `squarespace` | Squarespace CSV export |
| Custom CSV | `csv` | Any CSV file with mapped columns |
| Custom API | `api` | Any REST API with a custom connector |

See the [migration module reference](../modules/migration.md) for the full API documentation.
