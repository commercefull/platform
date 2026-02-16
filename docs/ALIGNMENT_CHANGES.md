# CommerceFull Platform — Alignment & Changes Required

> **Comprehensive audit of all modules, migrations, web layers, and their alignment status.**
> Generated: February 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Module DDD Alignment Status](#module-ddd-alignment-status)
3. [Router Location Misalignment](#router-location-misalignment)
4. [Repository SQL Naming Issues](#repository-sql-naming-issues)
5. [Migration Schema Issues](#migration-schema-issues)
6. [Web Admin Panel Gaps](#web-admin-panel-gaps)
7. [Merchant Portal Gaps](#merchant-portal-gaps)
8. [B2B Portal Gaps](#b2b-portal-gaps)
9. [Storefront Gaps](#storefront-gaps)
10. [Missing Module Infrastructure](#missing-module-infrastructure)
11. [Cross-Module Integration Gaps](#cross-module-integration-gaps)
12. [Detailed Change List by Module](#detailed-change-list-by-module)
13. [Migration Changes (Existing Files Only)](#migration-changes-existing-files-only)
14. [New Migration Files Required](#new-migration-files-required)
15. [Priority & Execution Order](#priority--execution-order)

---

## Executive Summary

After a thorough investigation of all 36 modules, 411 migration files, 4 web portals, and their interconnections, the following categories of misalignment were identified:

| Category | Count | Severity |
|----------|-------|----------|
| Modules not following DDD structure | 16 | High |
| Routers at wrong location (module root vs `interface/routers/`) | 14 | Medium |
| Repos using `"public"."tableName"` instead of `"tableName"` | 12 | Medium |
| Repos using snake_case column names in SQL | 4 | High |
| Merchant portal missing features | 8+ | High |
| B2B portal missing features | 5+ | High |
| Storefront missing features | 6+ | High |
| Modules missing domain layer | 4 | Medium |
| Modules missing infrastructure layer | 8 | Medium |
| Modules with controllers at wrong level | 10 | Medium |
| Missing customer-facing routers in `boot/routes.ts` | 2 | Medium |

---

## Module DDD Alignment Status

### Fully DDD-Aligned Modules (have `domain/`, `application/`, `infrastructure/`, `interface/`)

| Module | Status | Notes |
|--------|--------|-------|
| `basket` | ✅ Aligned | Full DDD with domain entities |
| `brand` | ✅ Aligned | Clean structure |
| `business` | ✅ Aligned | Uses `interface/http/` instead of `interface/routers/` |
| `channel` | ✅ Aligned | Clean structure |
| `checkout` | ✅ Aligned | Full DDD |
| `configuration` | ✅ Aligned | Uses `interface/http/` |
| `coupon` | ✅ Aligned | Clean structure |
| `customer` | ⚠️ Partial | Has both `useCases/` at root AND `application/`, legacy `repos/` alongside `infrastructure/` |
| `fulfillment` | ⚠️ Partial | Has legacy `repos/` alongside DDD layers |
| `identity` | ⚠️ Partial | Has legacy `repos/`, `controllers/` at root alongside DDD layers |
| `inventory` | ⚠️ Partial | Has legacy `repos/` alongside DDD layers |
| `media` | ✅ Aligned | Uses `interface/http/` |
| `merchant` | ⚠️ Partial | Has legacy `repos/`, `controllers/` alongside DDD layers |
| `order` | ⚠️ Partial | Has legacy `repos/` alongside DDD layers |
| `payment` | ⚠️ Partial | Has legacy `repos/` alongside DDD layers |
| `product` | ⚠️ Partial | Has legacy `repos/` alongside DDD layers (reference DDD module) |
| `segment` | ✅ Aligned | Clean structure |
| `store` | ⚠️ Partial | Has legacy `repos/` alongside DDD layers |

### Legacy Modules (missing DDD layers, flat structure)

| Module | Has `domain/` | Has `application/` | Has `infrastructure/` | Has `interface/` | Router Location |
|--------|:---:|:---:|:---:|:---:|---|
| `analytics` | ✅ | ✅ | ✅ | ❌ | Module root |
| `assortment` | ❌ | ✅ | ❌ | ✅ | `interface/routers/` |
| `b2b` | ✅ | ✅ | ❌ | ❌ | Module root |
| `content` | ✅ | ✅ | ❌ | ❌ | Module root |
| `gdpr` | ✅ | ✅ | ✅ | ⚠️ Partial | Module root |
| `localization` | ✅ | ✅ | ❌ | ❌ | Module root |
| `loyalty` | ✅ | ✅ | ❌ | ❌ | Module root |
| `membership` | ✅ | ✅ | ❌ | ❌ | Module root |
| `notification` | ✅ | ✅ | ❌ | ❌ | Module root |
| `organization` | ❌ | ✅ | ❌ | ✅ | `interface/routers/` |
| `pricing` | ✅ | ✅ | ❌ | ❌ | Module root |
| `promotion` | ✅ | ✅ | ❌ | ⚠️ Partial | `interface/routers/` |
| `shipping` | ✅ | ✅ | ❌ | ❌ | Module root |
| `subscription` | ❌ | ✅ | ❌ | ❌ | Module root |
| `supplier` | ✅ | ✅ | ❌ | ❌ | Module root |
| `support` | ❌ | ✅ | ❌ | ❌ | Module root |
| `tax` | ✅ | ✅ | ❌ | ❌ | Module root |
| `warehouse` | ✅ | ✅ | ❌ | ❌ | Module root |

---

## Router Location Misalignment

The DDD standard places routers in `modules/[mod]/interface/routers/`. The following 14 modules have routers at the module root level:

| Module | Current Location | Should Be |
|--------|-----------------|-----------|
| `analytics` | `modules/analytics/analyticsBusinessRouter.ts` | `modules/analytics/interface/routers/analyticsBusinessRouter.ts` |
| `b2b` | `modules/b2b/b2bBusinessRouter.ts` | `modules/b2b/interface/routers/b2bBusinessRouter.ts` |
| `b2b` | `modules/b2b/b2bCustomerRouter.ts` | `modules/b2b/interface/routers/b2bCustomerRouter.ts` |
| `content` | `modules/content/contentBusinessRouter.ts` | `modules/content/interface/routers/contentBusinessRouter.ts` |
| `gdpr` | `modules/gdpr/gdprBusinessRouter.ts` | `modules/gdpr/interface/routers/gdprBusinessRouter.ts` |
| `gdpr` | `modules/gdpr/gdprCustomerRouter.ts` | `modules/gdpr/interface/routers/gdprCustomerRouter.ts` |
| `localization` | `modules/localization/localizationBusinessRouter.ts` | `modules/localization/interface/routers/localizationBusinessRouter.ts` |
| `localization` | `modules/localization/localizationCustomerRouter.ts` | `modules/localization/interface/routers/localizationCustomerRouter.ts` |
| `loyalty` | `modules/loyalty/loyaltyBusinessRouter.ts` | `modules/loyalty/interface/routers/loyaltyBusinessRouter.ts` |
| `loyalty` | `modules/loyalty/loyaltyCustomerRouter.ts` | `modules/loyalty/interface/routers/loyaltyCustomerRouter.ts` |
| `membership` | `modules/membership/membershipBusinessRouter.ts` | `modules/membership/interface/routers/membershipBusinessRouter.ts` |
| `membership` | `modules/membership/membershipCustomerRouter.ts` | `modules/membership/interface/routers/membershipCustomerRouter.ts` |
| `notification` | `modules/notification/notificationBusinessRouter.ts` | `modules/notification/interface/routers/notificationBusinessRouter.ts` |
| `notification` | `modules/notification/notificationCustomerRouter.ts` | `modules/notification/interface/routers/notificationCustomerRouter.ts` |
| `pricing` | `modules/pricing/pricingBusinessRouter.ts` | `modules/pricing/interface/routers/pricingBusinessRouter.ts` |
| `shipping` | `modules/shipping/shippingBusinessRouter.ts` | `modules/shipping/interface/routers/shippingBusinessRouter.ts` |
| `shipping` | `modules/shipping/shippingCustomerRouter.ts` | `modules/shipping/interface/routers/shippingCustomerRouter.ts` |
| `subscription` | `modules/subscription/subscriptionBusinessRouter.ts` | `modules/subscription/interface/routers/subscriptionBusinessRouter.ts` |
| `subscription` | `modules/subscription/subscriptionCustomerRouter.ts` | `modules/subscription/interface/routers/subscriptionCustomerRouter.ts` |
| `supplier` | `modules/supplier/supplierBusinessRouter.ts` | `modules/supplier/interface/routers/supplierBusinessRouter.ts` |
| `support` | `modules/support/supportBusinessRouter.ts` | `modules/support/interface/routers/supportBusinessRouter.ts` |
| `support` | `modules/support/supportCustomerRouter.ts` | `modules/support/interface/routers/supportCustomerRouter.ts` |
| `tax` | `modules/tax/taxBusinessRouter.ts` | `modules/tax/interface/routers/taxBusinessRouter.ts` |
| `tax` | `modules/tax/taxCustomerRouter.ts` | `modules/tax/interface/routers/taxCustomerRouter.ts` |
| `warehouse` | `modules/warehouse/warehouseBusinessRouter.ts` | `modules/warehouse/interface/routers/warehouseBusinessRouter.ts` |
| `warehouse` | `modules/warehouse/warehouseCustomerRouter.ts` | `modules/warehouse/interface/routers/warehouseCustomerRouter.ts` |

**Action**: Move each router file to `interface/routers/` and update the import path in `boot/routes.ts`.

### Controller Location Misalignment

Similarly, these modules have `controllers/` at the module root instead of `interface/controllers/`:

| Module | Current | Should Be |
|--------|---------|-----------|
| `analytics` | `modules/analytics/controllers/` | `modules/analytics/interface/controllers/` |
| `b2b` | `modules/b2b/controllers/` | `modules/b2b/interface/controllers/` |
| `content` | `modules/content/controllers/` | `modules/content/interface/controllers/` |
| `identity` | `modules/identity/controllers/` | `modules/identity/interface/controllers/` |
| `localization` | `modules/localization/controllers/` | `modules/localization/interface/controllers/` |
| `loyalty` | `modules/loyalty/controllers/` | `modules/loyalty/interface/controllers/` |
| `membership` | `modules/membership/controllers/` | `modules/membership/interface/controllers/` |
| `merchant` | `modules/merchant/controllers/` | `modules/merchant/interface/controllers/` |
| `pricing` | `modules/pricing/controllers/` | `modules/pricing/interface/controllers/` |
| `subscription` | `modules/subscription/controllers/` | `modules/subscription/interface/controllers/` |
| `supplier` | `modules/supplier/controllers/` | `modules/supplier/interface/controllers/` |
| `support` | `modules/support/controllers/` | `modules/support/interface/controllers/` |
| `tax` | `modules/tax/controllers/` | `modules/tax/interface/controllers/` |
| `warehouse` | `modules/warehouse/controllers/` | `modules/warehouse/interface/controllers/` |

---

## Repository SQL Naming Issues

### Issue 1: `"public"."tableName"` References (12 repos)

These repos use `"public"."tableName"` instead of just `"tableName"`. The `"public".` schema prefix is unnecessary and inconsistent with the rest of the codebase.

| File | Occurrences |
|------|-------------|
| `modules/product/repos/productMediaRepo.ts` | 18 |
| `modules/notification/repos/notificationDeliveryLogRepo.ts` | 16 |
| `modules/order/repos/orderReturnRepo.ts` | 16 |
| `modules/product/repos/productReviewRepo.ts` | 16 |
| `modules/supplier/repos/purchaseOrderRepo.ts` | 16 |
| `modules/supplier/repos/supplierRepo.ts` | 16 |
| `modules/product/repos/productRelationshipRepo.ts` | 15 |
| `modules/order/repos/orderFulfillmentRepo.ts` | 13 |
| `modules/order/repos/orderItemRepo.ts` | 12 |
| `modules/notification/repos/notificationTemplateRepo.ts` | 11 |
| `modules/identity/repos/identityRefreshTokenRepo.ts` | 8 |
| `modules/identity/repos/identityTokenBlacklistRepo.ts` | 5 |

**Action**: In each file, replace `"public"."tableName"` with `"tableName"`.

### Issue 2: snake_case Column Names in SQL (4 repos)

These repos use snake_case column names in SQL queries, which don't match the camelCase database schema:

| File | snake_case Columns Found |
|------|-------------------------|
| `modules/pricing/repos/pricingRuleRepo.ts` | `product_ids`, `customer_ids`, `customer_group_ids`, `category_ids`, `minimum_quantity`, `maximum_quantity`, `minimum_order_amount` |
| `modules/content/repos/contentRepo.ts` | Various snake_case references |
| `modules/product/repos/productVariantRepo.ts` | Various snake_case references |
| `modules/tax/repos/taxQueryRepo.ts` | Various snake_case references |

**Action**: Update all SQL queries to use camelCase column names matching the migration schema. Update the corresponding field mapping dictionaries.

---

## Migration Schema Issues

### Issue 1: Duplicate Timestamp Prefixes

Several migration files share the same timestamp prefix, which can cause ordering issues:

| Timestamp | Files |
|-----------|-------|
| `20240805000002` | `createProductTypeTable.js`, `session.js` |
| `20240805000102` | `createCountry.js`, `createCurrencyRegion.js` |
| `20240805000490` | `createOrderTable.js`, `createPromotionCouponRestrictionTable.js` |
| `20240805000510` | `createCustomerTaxExemptionCategoryTable.js`, `createTaxCalculationTable.js` |
| `20240805000533` | `addMetadataToPricingRule.js`, `createRuleAdjustmentTable.js` |
| `20240805000702` | `createBasketItem.js`, `createCartPromotionTable.js` |
| `20240805000703` | `createBasketDiscount.js`, `createCartPromotionItemTable.js` |
| `20240805000709` | `createOrderItemTable.js`, `createOrderTaxTable.js`, `createPromotionUsageTable.js` |
| `20240805000710` | `createOrderDiscountTable.js`, `createOrderShippingTable.js`, `createPromotionCouponUsageTable.js` |
| `20240805000807` | `createOrderPaymentRefund.js`, `createPaymentDisputeTable.js` |
| `20240805000809` | `createOrderFulfillmentItem.js`, `createPaymentFeeTable.js` |
| `20240805000901` | `createContentType.js`, `createProductMediaTable.js` |
| `20240805000902` | `createContentBlockType.js`, `createProductSeoTable.js` |
| `20240805000904` | `createProductCategoryMap.js`, `createProductTagMap.js` |
| `20240805000905` | `createContentTemplate.js`, `createProductCollectionMap.js` |
| `20240805000907` | `createProductReviewTable.js`, `seedContentTemplates.js` |
| `20240805000909` | `createContentPage.js`, `createProductReviewVoteTable.js` |
| `20240805001022` | `createProductListItemTable.js`, `createProductToCategory.js` |
| `20240805001023` | `createProductAttributeValueMapTable.js`, `createProductToTag.js` |
| `20240805001801` | `createDistributionShippingZone.js`, `createPromotionGiftCard.js` |
| `20240805001802` | `createDistributionShippingMethod.js`, `createPromotionGiftCardTransaction.js` |
| `20240805001803` | `createDistributionShippingRate.js`, `createProductBundle.js` |
| `20240805001810` | `createDistributionFulfillmentPartner.js`, `createFraudCheck.js` |
| `20240805001811` | `createDistributionRule.js`, `createFraudBlacklist.js` |
| `20241219000007` | `createReportExecution.js`, `createUser.js` |

**Action**: These are existing files and should NOT be renamed (Knex tracks them by filename). However, be aware of this when adding new migrations — always use unique timestamps.

### Issue 2: `pricingRuleTable` Migration Has snake_case Columns

The migration file `20240805000532_createPricingRuleTable.js` likely defines columns with snake_case names that don't match the camelCase convention. This needs to be verified and the existing migration updated.

**Action**: Check and update `20240805000532_createPricingRuleTable.js` to use camelCase column names. Also update the related `addMetadataToPricingRule.js`, `createRuleAdjustmentTable.js`, and `createRuleConditionTable.js`.

---

## Web Admin Panel Gaps

The admin panel (`web/admin/`) is the most complete portal with 41 controllers and comprehensive routing. However, some gaps exist:

### Missing Admin Views

The admin panel has routes defined but may be missing corresponding EJS view files for:

| Feature Area | Routes Exist | Views Directory | Status |
|-------------|:---:|---|---|
| Products | ✅ | `views/products/` | ✅ Complete |
| Orders | ✅ | `views/orders/` | ✅ Complete |
| Customers | ✅ | `views/customers/` | ✅ Complete |
| Inventory | ✅ | `views/inventory/` | ✅ Complete |
| Analytics | ✅ | `views/analytics/` | ✅ Complete |
| Catalog (categories, brands, pricing) | ✅ | `views/catalog/` | ✅ Complete |
| Promotions | ✅ | `views/promotions/` | ✅ Complete |
| Content | ✅ | `views/content/` | ✅ Complete |
| Shipping | ✅ | `views/shipping/` | ✅ Complete |
| Tax | ✅ | `views/tax/` | ✅ Complete |
| Support | ✅ | `views/support/` | ✅ Complete |
| Users/Roles | ✅ | `views/users/` | ✅ Complete |
| Settings | ✅ | `views/settings/` | ✅ Complete |
| GDPR | ✅ | `views/gdpr/` | ✅ Complete |
| Operations | ✅ | `views/operations/` | ✅ Complete |
| Programs (membership, subscription, loyalty, b2b) | ✅ | `views/programs/` | ✅ Complete |
| Platform | ✅ | `views/platform/` | ✅ Complete |
| Sales (segments) | ✅ | `views/sales/` | ✅ Complete |
| Payments | ✅ | `views/payments/` | ✅ Complete |
| Marketing (SEO) | ✅ | `views/marketing/` | ✅ Complete |
| Notifications | ✅ | `views/notifications/` | ✅ Complete |

### Duplicate Payment Routes

The admin router has **duplicate payment gateway routes** defined twice (lines 289-298 and 348-356). This should be cleaned up.

**Action**: Remove the duplicate payment routes block (lines 289-298 or 348-356) from `web/admin/adminRouters.ts`.

---

## Merchant Portal Gaps

The merchant portal (`web/merchant/`) is **severely underdeveloped** with only 4 controllers and minimal routing:

### Current State
- ✅ Auth (login/logout)
- ✅ Dashboard
- ✅ Products (list, create form, view, edit form) — **read-only, no POST handlers for create/update**
- ✅ Orders (list, view) — **read-only**

### Missing Features (Critical for Merchant Self-Service)

| Feature | Priority | Description |
|---------|----------|-------------|
| **Product CRUD** | 🔴 Critical | POST handlers for create/update/delete products |
| **Inventory Management** | 🔴 Critical | Stock levels, adjustments, low-stock alerts |
| **Order Fulfillment** | 🔴 Critical | Ship orders, update tracking, manage returns |
| **Financial Dashboard** | 🔴 Critical | Settlements, payouts, transaction history |
| **Settings/Profile** | 🟡 High | Merchant profile, store settings, payment info |
| **Shipping Templates** | 🟡 High | Manage shipping methods and rates |
| **Analytics** | 🟡 High | Sales reports, product performance |
| **Notifications** | 🟢 Medium | View and manage notifications |
| **Reviews** | 🟢 Medium | Respond to product reviews |
| **Promotions** | 🟢 Medium | Create merchant-specific promotions |

### Required Changes

1. **Add controllers**: `inventoryController.ts`, `fulfillmentController.ts`, `financeController.ts`, `settingsController.ts`, `analyticsController.ts`, `shippingController.ts`, `notificationController.ts`
2. **Add views**: Create corresponding EJS view directories and templates
3. **Add routes**: Extend `merchantRouters.ts` with full CRUD routes
4. **Add POST handlers**: Product create, update, delete, status changes

---

## B2B Portal Gaps

The B2B portal (`web/b2b/`) is **underdeveloped** with only 5 controllers:

### Current State
- ✅ Auth (login/logout)
- ✅ Dashboard
- ✅ Quotes (list, create form, view) — **no POST handlers for create/update**
- ✅ Orders (list, view, reorder form) — **no POST handlers**
- ✅ Approvals (list pending, history, view) — **no POST handlers for approve/reject**

### Missing Features

| Feature | Priority | Description |
|---------|----------|-------------|
| **Quote CRUD** | 🔴 Critical | POST handlers for create/update/send quotes |
| **Approval Actions** | 🔴 Critical | POST handlers for approve/reject actions |
| **Order Reorder** | 🔴 Critical | POST handler for reorder |
| **Product Catalog** | 🟡 High | Browse products with company-specific pricing |
| **Company User Management** | 🟡 High | Add/remove/manage company users |
| **Company Account** | 🟡 High | Company profile, addresses, credit info |
| **Credit Management** | 🟢 Medium | View credit limits, transactions |
| **Purchase Orders** | 🟢 Medium | Create and manage purchase orders |

### Required Changes

1. **Add POST handlers** to existing controllers for quotes, approvals, orders
2. **Add controllers**: `catalogController.ts`, `companyController.ts`, `creditController.ts`, `purchaseOrderController.ts`
3. **Add views**: Product catalog, company management, credit views
4. **Add routes**: Extend `b2bRouters.ts`

---

## Storefront Gaps

The storefront (`web/storefront/`) has a solid foundation but is missing several customer-facing features:

### Current State
- ✅ Home page
- ✅ Product listing (PLP)
- ✅ Product detail (PDP)
- ✅ Category browsing
- ✅ Search
- ✅ Basket/Cart
- ✅ Checkout
- ✅ Order history & tracking
- ✅ Auth (signin/signup/profile)
- ✅ Static pages (about, contact, FAQ, returns, support, shipping policy, careers)
- ✅ CMS content pages

### Missing Features

| Feature | Priority | Description |
|---------|----------|-------------|
| **Wishlist** | 🟡 High | Save products for later (migration exists: `createCustomerWishlist`) |
| **Product Reviews** | 🟡 High | Submit and view reviews (migration exists: `createProductReviewTable`) |
| **Customer Addresses** | 🟡 High | Manage saved addresses (migration exists: `createCustomerAddress`) |
| **Order Returns** | 🟡 High | Request returns/refunds (migration exists: `createOrderReturnTable`) |
| **Loyalty Dashboard** | 🟢 Medium | View points, tier, rewards |
| **Membership Dashboard** | 🟢 Medium | View membership status, benefits |
| **Subscription Management** | 🟢 Medium | View/manage subscriptions |
| **Notification Preferences** | 🟢 Medium | Manage email/push preferences |
| **Gift Cards** | 🟢 Medium | Purchase and redeem gift cards |
| **B2B Registration** | 🟢 Medium | Company registration for B2B access |
| **Product Q&A** | 🟢 Low | Ask/answer product questions (migration exists: `createProductQaTable`) |
| **Product Comparison** | 🟢 Low | Compare products side-by-side |

### Required Changes

1. **Add controllers**: `wishlistController.ts`, `reviewController.ts`, `addressController.ts`, `returnController.ts`, `loyaltyController.ts`, `membershipController.ts`, `subscriptionController.ts`
2. **Add views**: Wishlist page, review forms, address management, return request, loyalty dashboard
3. **Add routes**: Extend `storefrontRouter.ts`

---

## Missing Module Infrastructure

### Modules Missing `infrastructure/` Layer

These modules have `repos/` at the module root but no `infrastructure/repositories/` directory:

| Module | Has `repos/` | Needs `infrastructure/repositories/` |
|--------|:---:|:---:|
| `analytics` | ✅ | ✅ |
| `b2b` | ✅ | ✅ |
| `content` | ✅ | ✅ |
| `localization` | ✅ | ✅ |
| `loyalty` | ✅ | ✅ |
| `membership` | ✅ | ✅ |
| `notification` | ✅ | ✅ |
| `pricing` | ✅ | ✅ |
| `shipping` | ✅ | ✅ |
| `subscription` | ✅ | ✅ |
| `supplier` | ✅ | ✅ |
| `support` | ✅ | ✅ |
| `tax` | ✅ | ✅ |
| `warehouse` | ✅ | ✅ |

**Action**: For each module, create `infrastructure/repositories/` and either:
- Move repo files there and update imports, OR
- Create new DDD-aligned repository implementations that wrap the legacy repos

### Modules Missing `domain/` Layer

| Module | Missing |
|--------|---------|
| `assortment` | No `domain/` — needs entities, value objects |
| `organization` | No `domain/` — needs entities |
| `subscription` | No `domain/` — needs entities, value objects |
| `support` | No `domain/` — needs entities |

### Modules with Duplicate/Conflicting Structures

| Module | Issue |
|--------|-------|
| `customer` | Has `useCases/` at module root AND `application/` — should consolidate into `application/useCases/` |
| `identity` | Has `controllers/` at root AND `interface/` — should consolidate into `interface/controllers/` |
| `merchant` | Has `controllers/` at root AND `interface/` — should consolidate into `interface/controllers/` |

---

## Cross-Module Integration Gaps

### Missing Event Handlers

The event bus defines many event types, but not all modules emit or handle them:

| Event | Producer Module | Consumer Module | Status |
|-------|----------------|-----------------|--------|
| `order.created` | order | notification, analytics, inventory | ⚠️ Verify handlers |
| `order.paid` | payment | order, fulfillment, analytics | ⚠️ Verify handlers |
| `product.price_changed` | product | pricing, basket, notification | ⚠️ Verify handlers |
| `basket.abandoned` | basket | notification, analytics | ⚠️ Verify handlers |
| `customer.registered` | identity | notification, loyalty, analytics | ⚠️ Verify handlers |
| `membership.subscribed` | membership | notification, loyalty | ⚠️ Verify handlers |
| `loyalty.points_earned` | loyalty | notification | ⚠️ Verify handlers |

### Missing Customer-Facing API Routes

The following modules have business routers registered in `boot/routes.ts` but are missing from the customer routes:

| Module | Business Router | Customer Router | In `boot/routes.ts` Customer? |
|--------|:---:|:---:|:---:|
| `analytics` | ✅ | ❌ | N/A (admin-only) |
| `brand` | ✅ | ❌ | ❌ Missing |
| `channel` | ✅ | ❌ | N/A (admin-only) |
| `configuration` | ✅ | ❌ | N/A (admin-only) |
| `coupon` | ✅ | ❌ | ❌ Missing |
| `fulfillment` | ✅ | ✅ | ❌ Missing |
| `media` | ✅ | ❌ | N/A |
| `organization` | ✅ | ❌ | N/A (admin-only) |
| `segment` | ✅ | ❌ | N/A (admin-only) |
| `store` | ✅ | ❌ | ❌ Missing |

**Action**: Add customer-facing routers for `brand`, `coupon`, `fulfillment`, and `store` to `boot/routes.ts` under the `/customer` prefix.

---

## Detailed Change List by Module

### 1. `analytics`
- [ ] Move `analyticsBusinessRouter.ts` → `interface/routers/`
- [ ] Move `controllers/` → `interface/controllers/`
- [ ] Move `repos/` → `infrastructure/repositories/`
- [ ] Update import in `boot/routes.ts`

### 2. `assortment`
- [ ] Add `domain/` layer with entities (Assortment, AssortmentItem, AssortmentScope)
- [ ] Add `infrastructure/repositories/` with SQL implementations
- [ ] Move `repos/` contents to `infrastructure/repositories/`

### 3. `b2b`
- [ ] Move `b2bBusinessRouter.ts` → `interface/routers/`
- [ ] Move `b2bCustomerRouter.ts` → `interface/routers/`
- [ ] Move `controllers/` → `interface/controllers/`
- [ ] Add `infrastructure/repositories/`
- [ ] Move `repos/` → `infrastructure/repositories/`
- [ ] Update imports in `boot/routes.ts`

### 4. `basket`
- ✅ Well-aligned, no changes needed

### 5. `brand`
- ✅ Well-aligned
- [ ] Add customer-facing router for brand browsing
- [ ] Register customer router in `boot/routes.ts`

### 6. `business`
- ✅ Well-aligned (uses `interface/http/` convention)

### 7. `channel`
- ✅ Well-aligned

### 8. `checkout`
- ✅ Well-aligned

### 9. `configuration`
- ✅ Well-aligned (uses `interface/http/` convention)

### 10. `content`
- [ ] Move `contentBusinessRouter.ts` → `interface/routers/`
- [ ] Move `controllers/` → `interface/controllers/`
- [ ] Add `infrastructure/repositories/`
- [ ] Move `repos/` → `infrastructure/repositories/`
- [ ] Fix snake_case column references in `contentRepo.ts`
- [ ] Update import in `boot/routes.ts`

### 11. `coupon`
- ✅ Well-aligned
- [ ] Add customer-facing router for coupon validation/redemption
- [ ] Register customer router in `boot/routes.ts`

### 12. `customer`
- [ ] Consolidate `useCases/` at root into `application/useCases/`
- [ ] Move legacy `repos/` → `infrastructure/repositories/` (or consolidate with existing)

### 13. `fulfillment`
- [ ] Move legacy `repos/` → `infrastructure/repositories/`
- [ ] Register `fulfillmentCustomerRouter` in `boot/routes.ts` under `/customer`

### 14. `gdpr`
- [ ] Move `gdprBusinessRouter.ts` → `interface/routers/`
- [ ] Move `gdprCustomerRouter.ts` → `interface/routers/`
- [ ] Update imports in `boot/routes.ts`

### 15. `identity`
- [ ] Consolidate `controllers/` at root into `interface/controllers/`
- [ ] Move legacy `repos/` → `infrastructure/repositories/`
- [ ] Fix `"public"."tableName"` references in `identityRefreshTokenRepo.ts` and `identityTokenBlacklistRepo.ts`

### 16. `inventory`
- [ ] Move legacy `repos/` → `infrastructure/repositories/`

### 17. `localization`
- [ ] Move `localizationBusinessRouter.ts` → `interface/routers/`
- [ ] Move `localizationCustomerRouter.ts` → `interface/routers/`
- [ ] Move `controllers/` → `interface/controllers/`
- [ ] Add `infrastructure/repositories/`
- [ ] Move `repos/` → `infrastructure/repositories/`
- [ ] Update imports in `boot/routes.ts`

### 18. `loyalty`
- [ ] Move `loyaltyBusinessRouter.ts` → `interface/routers/`
- [ ] Move `loyaltyCustomerRouter.ts` → `interface/routers/`
- [ ] Move `controllers/` → `interface/controllers/`
- [ ] Add `infrastructure/repositories/`
- [ ] Move `repos/` → `infrastructure/repositories/`
- [ ] Update imports in `boot/routes.ts`

### 19. `media`
- ✅ Well-aligned (uses `interface/http/` convention)

### 20. `membership`
- [ ] Move `membershipBusinessRouter.ts` → `interface/routers/`
- [ ] Move `membershipCustomerRouter.ts` → `interface/routers/`
- [ ] Move `controllers/` → `interface/controllers/`
- [ ] Add `infrastructure/repositories/`
- [ ] Move `repos/` → `infrastructure/repositories/`
- [ ] Update imports in `boot/routes.ts`

### 21. `merchant`
- [ ] Consolidate `controllers/` at root into `interface/controllers/`
- [ ] Move legacy `repos/` → `infrastructure/repositories/`

### 22. `notification`
- [ ] Move `notificationBusinessRouter.ts` → `interface/routers/`
- [ ] Move `notificationCustomerRouter.ts` → `interface/routers/`
- [ ] Move `controllers/` → `interface/controllers/`
- [ ] Add `infrastructure/repositories/`
- [ ] Move `repos/` → `infrastructure/repositories/`
- [ ] Fix `"public"."tableName"` references in `notificationDeliveryLogRepo.ts` and `notificationTemplateRepo.ts`
- [ ] Update imports in `boot/routes.ts`

### 23. `order`
- [ ] Move legacy `repos/` → `infrastructure/repositories/`
- [ ] Fix `"public"."tableName"` references in `orderReturnRepo.ts`, `orderFulfillmentRepo.ts`, `orderItemRepo.ts`

### 24. `organization`
- [ ] Add `domain/` layer with entities
- ✅ Already has `interface/routers/`

### 25. `payment`
- [ ] Move legacy `repos/` → `infrastructure/repositories/`

### 26. `pricing`
- [ ] Move `pricingBusinessRouter.ts` → `interface/routers/`
- [ ] Move `controllers/` → `interface/controllers/`
- [ ] Add `infrastructure/repositories/`
- [ ] Move `repos/` → `infrastructure/repositories/`
- [ ] Fix snake_case column names in `pricingRuleRepo.ts`
- [ ] Update import in `boot/routes.ts`

### 27. `product`
- [ ] Move legacy `repos/` → `infrastructure/repositories/` (or consolidate)
- [ ] Fix `"public"."tableName"` references in `productMediaRepo.ts`, `productReviewRepo.ts`, `productRelationshipRepo.ts`
- [ ] Fix snake_case column names in `productVariantRepo.ts`

### 28. `promotion`
- [ ] Move `controllers/` at root → `interface/controllers/`
- [ ] Move `repos/` → `infrastructure/repositories/`

### 29. `segment`
- ✅ Well-aligned

### 30. `shipping`
- [ ] Move `shippingBusinessRouter.ts` → `interface/routers/`
- [ ] Move `shippingCustomerRouter.ts` → `interface/routers/`
- [ ] Move `controllers/` → `interface/controllers/`
- [ ] Add `infrastructure/repositories/`
- [ ] Move `repos/` → `infrastructure/repositories/`
- [ ] Update imports in `boot/routes.ts`

### 31. `store`
- [ ] Move legacy `repos/` → `infrastructure/repositories/`
- [ ] Add customer-facing router for store locator
- [ ] Register customer router in `boot/routes.ts`

### 32. `subscription`
- [ ] Add `domain/` layer with entities (SubscriptionPlan, CustomerSubscription)
- [ ] Move `subscriptionBusinessRouter.ts` → `interface/routers/`
- [ ] Move `subscriptionCustomerRouter.ts` → `interface/routers/`
- [ ] Move `controllers/` → `interface/controllers/`
- [ ] Add `infrastructure/repositories/`
- [ ] Move `repos/` → `infrastructure/repositories/`
- [ ] Update imports in `boot/routes.ts`

### 33. `supplier`
- [ ] Move `supplierBusinessRouter.ts` → `interface/routers/`
- [ ] Move `controllers/` → `interface/controllers/`
- [ ] Add `infrastructure/repositories/`
- [ ] Move `repos/` → `infrastructure/repositories/`
- [ ] Fix `"public"."tableName"` references in `purchaseOrderRepo.ts`, `supplierRepo.ts`
- [ ] Update import in `boot/routes.ts`

### 34. `support`
- [ ] Add `domain/` layer with entities (Ticket, Message, FAQ)
- [ ] Move `supportBusinessRouter.ts` → `interface/routers/`
- [ ] Move `supportCustomerRouter.ts` → `interface/routers/`
- [ ] Move `controllers/` → `interface/controllers/`
- [ ] Add `infrastructure/repositories/`
- [ ] Move `repos/` → `infrastructure/repositories/`
- [ ] Update imports in `boot/routes.ts`

### 35. `tax`
- [ ] Move `taxBusinessRouter.ts` → `interface/routers/`
- [ ] Move `taxCustomerRouter.ts` → `interface/routers/`
- [ ] Move `controllers/` → `interface/controllers/`
- [ ] Add `infrastructure/repositories/`
- [ ] Move `repos/` → `infrastructure/repositories/`
- [ ] Fix snake_case column references in `taxQueryRepo.ts`
- [ ] Update imports in `boot/routes.ts`

### 36. `warehouse`
- [ ] Move `warehouseBusinessRouter.ts` → `interface/routers/`
- [ ] Move `warehouseCustomerRouter.ts` → `interface/routers/`
- [ ] Move `controllers/` → `interface/controllers/`
- [ ] Add `infrastructure/repositories/`
- [ ] Move `repos/` → `infrastructure/repositories/`
- [ ] Update imports in `boot/routes.ts`

---

## Migration Changes (Existing Files Only)

> **Rule**: Only modify existing migration files. Do NOT create new migration files unless a new table is needed.

### Files to Update (snake_case → camelCase columns)

| Migration File | Issue | Change |
|---------------|-------|--------|
| `20240805000532_createPricingRuleTable.js` | Likely has snake_case columns (`product_ids`, `customer_ids`, `minimum_quantity`, etc.) | Rename columns to camelCase: `productIds`, `customerIds`, `minimumQuantity`, `maximumQuantity`, `minimumOrderAmount` |
| `20240805000533_createRuleAdjustmentTable.js` | May have snake_case columns | Verify and fix to camelCase |
| `20240805000534_createRuleConditionTable.js` | May have snake_case columns | Verify and fix to camelCase |

### Verification Needed

The following migrations should be checked for snake_case column names (based on repo SQL issues):

| Migration File | Related Repo |
|---------------|-------------|
| `20240805000901_createContentType.js` | `contentRepo.ts` |
| `20240805000909_createContentPage.js` | `contentRepo.ts` |
| `20240805000910_createContentBlock.js` | `contentRepo.ts` |
| `20240805000472_createProductVariant.js` | `productVariantRepo.ts` |
| `20240805000505_createTaxRateTable.js` | `taxQueryRepo.ts` |

---

## New Migration Files Required

These are for **genuinely new tables** that don't exist yet but are needed for missing features:

| Table | Purpose | Module |
|-------|---------|--------|
| None identified | All required tables already exist in the 411 migration files | — |

> **Note**: All tables needed for the platform's features already have migration files. The issue is not missing tables but rather misaligned column naming and missing module code to use them.

---

## Priority & Execution Order

### Phase 1: Critical Fixes (Repository SQL Issues)
**Impact**: Fixes runtime errors and data access failures

1. Fix `"public"."tableName"` → `"tableName"` in 12 repo files
2. Fix snake_case → camelCase column names in 4 repo files
3. Verify and fix corresponding migration files for column naming
4. Remove duplicate payment routes in admin router

### Phase 2: Merchant Portal MVP
**Impact**: Enables merchant self-service

1. Add product CRUD POST handlers to merchant portal
2. Add inventory management controller and views
3. Add order fulfillment controller and views
4. Add financial dashboard controller and views
5. Add merchant settings controller and views

### Phase 3: B2B Portal MVP
**Impact**: Enables B2B self-service

1. Add POST handlers for quotes, approvals, orders
2. Add product catalog with company pricing
3. Add company user management
4. Add company account management

### Phase 4: Storefront Enhancements
**Impact**: Improves customer experience

1. Add wishlist functionality
2. Add product reviews
3. Add customer address management
4. Add order returns
5. Add loyalty/membership dashboards

### Phase 5: Module DDD Alignment
**Impact**: Code quality and maintainability

1. Move routers to `interface/routers/` (14 modules)
2. Move controllers to `interface/controllers/` (14 modules)
3. Move repos to `infrastructure/repositories/` (14 modules)
4. Update all imports in `boot/routes.ts`
5. Add missing `domain/` layers (4 modules)
6. Consolidate duplicate structures (3 modules)

### Phase 6: Cross-Module Integration
**Impact**: Feature completeness

1. Add missing customer-facing routers to `boot/routes.ts`
2. Verify event handler registrations
3. Add missing event emissions in modules

---

## Summary Statistics

| Category | Total Items |
|----------|-------------|
| Repo files needing `"public".` removal | 12 |
| Repo files needing snake_case fix | 4 |
| Modules needing router relocation | 14 (26 router files) |
| Modules needing controller relocation | 14 |
| Modules needing repo relocation | 14 |
| Modules needing `domain/` layer | 4 |
| Modules needing `infrastructure/` layer | 14 |
| Merchant portal controllers to add | 7+ |
| B2B portal controllers to add | 4+ |
| Storefront controllers to add | 7+ |
| Migration files to verify/update | 5-8 |
| New migration files needed | 0 |
| Admin router duplicate routes to remove | 1 block |
| Customer routers missing from `boot/routes.ts` | 4 |

---

**Last Updated**: February 2026
