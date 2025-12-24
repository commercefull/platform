# Admin Panel Restructure Documentation

## Executive Summary

This document outlines a comprehensive restructuring plan for the CommerceFull Admin Panel to:
1. **Reorganize navigation** with dropdown menus for better UX
2. **Cover all platform modules** with proper admin interfaces
3. **Standardize UI patterns** across all admin views
4. **Identify gaps** between existing modules and admin coverage

---

## 1. Current State Analysis

### 1.1 Existing Admin Controllers (32 controllers)

| Controller | Purpose | Status |
|------------|---------|--------|
| `adminController.ts` | Dashboard, Login, Profile | ✅ Complete |
| `analyticsController.ts` | Analytics dashboards, reports | ✅ Complete |
| `b2bController.ts` | B2B companies, quotes, users | ✅ Complete |
| `basketController.ts` | Abandoned carts, analytics | ✅ Complete |
| `contentBlocksController.ts` | Content blocks management | ✅ Complete |
| `contentController.ts` | Pages, templates, media | ✅ Complete |
| `couponController.ts` | Coupon management | ✅ Complete |
| `customerController.ts` | Customer management | ✅ Complete |
| `fulfillmentController.ts` | Order fulfillment | ✅ Complete |
| `gdprController.ts` | GDPR compliance | ✅ Complete |
| `giftCardController.ts` | Gift card management | ✅ Complete |
| `inventoryController.ts` | Inventory management | ✅ Complete |
| `loyaltyController.ts` | Loyalty programs | ✅ Complete |
| `membershipController.ts` | Membership plans | ✅ Complete |
| `notificationController.ts` | Notification templates | ✅ Complete |
| `operationsController.ts` | Operations dashboard | ✅ Complete |
| `orderController.ts` | Order management | ✅ Complete |
| `paymentController.ts` | Payment gateways | ✅ Complete |
| `productController.ts` | Product management | ✅ Complete |
| `programsController.ts` | Programs dashboard | ✅ Complete |
| `promotionController.ts` | Promotions | ✅ Complete |
| `seoController.ts` | SEO settings | ✅ Complete |
| `settingsController.ts` | Store settings | ✅ Complete |
| `shippingController.ts` | Shipping methods | ✅ Complete |
| `shippingRateController.ts` | Shipping rates | ✅ Complete |
| `shippingZoneController.ts` | Shipping zones | ✅ Complete |
| `subscriptionController.ts` | Subscriptions | ✅ Complete |
| `supplierController.ts` | Supplier management | ✅ Complete |
| `supportController.ts` | Support tickets, FAQs | ✅ Complete |
| `taxController.ts` | Tax settings | ✅ Complete |
| `usersController.ts` | Admin users & roles | ✅ Complete |
| `warehouseController.ts` | Warehouse management | ✅ Complete |

### 1.2 Platform Modules (36 modules)

| Module | Admin Coverage | Notes |
|--------|---------------|-------|
| `analytics` | ✅ Full | Analytics dashboards |
| `assortment` | ❌ Missing | Categories, collections |
| `b2b` | ✅ Full | Companies, quotes |
| `basket` | ✅ Partial | Abandoned carts only |
| `brand` | ❌ Missing | Brand management |
| `business` | ❌ Missing | Business entities |
| `channel` | ❌ Missing | Sales channels |
| `checkout` | ❌ Missing | Checkout configuration |
| `configuration` | ❌ Missing | Platform configuration |
| `content` | ✅ Full | Pages, blocks, templates |
| `coupon` | ✅ Full | Under promotions |
| `customer` | ✅ Full | Customer management |
| `fulfillment` | ✅ Full | Under operations |
| `gdpr` | ✅ Full | Compliance |
| `identity` | ⚠️ Partial | Admin users only |
| `inventory` | ✅ Full | Stock management |
| `localization` | ❌ Missing | Languages, regions |
| `loyalty` | ✅ Full | Under programs |
| `media` | ⚠️ Partial | Basic listing only |
| `membership` | ✅ Full | Under programs |
| `merchant` | ❌ Missing | Merchant management |
| `notification` | ✅ Full | Templates |
| `order` | ✅ Full | Order management |
| `organization` | ❌ Missing | Organization structure |
| `payment` | ✅ Full | Gateways, methods |
| `pricing` | ❌ Missing | Price lists, rules |
| `product` | ✅ Full | Products, variants |
| `promotion` | ✅ Full | Discounts, campaigns |
| `segment` | ❌ Missing | Customer segments |
| `shipping` | ✅ Full | Methods, zones, rates |
| `store` | ⚠️ Partial | Basic settings |
| `subscription` | ✅ Full | Under programs |
| `supplier` | ✅ Full | Under operations |
| `support` | ✅ Full | Tickets, FAQs |
| `tax` | ✅ Full | Tax management |
| `warehouse` | ✅ Full | Under operations |

---

## 2. Proposed Navigation Structure

### 2.1 New Navbar with Dropdowns

The navigation should be restructured from a flat list to organized dropdown menus:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Dashboard │ Catalog ▼ │ Sales ▼ │ Marketing ▼ │ Operations ▼ │ Settings ▼ │
└─────────────────────────────────────────────────────────────────────────────┘

CATALOG DROPDOWN:
├── Products
├── Categories (NEW)
├── Brands (NEW)
├── Collections (NEW)
├── Inventory
└── Pricing (NEW)

SALES DROPDOWN:
├── Orders
├── Customers
├── Abandoned Carts
├── Segments (NEW)
├── B2B
│   ├── Companies
│   └── Quotes
└── Subscriptions

MARKETING DROPDOWN:
├── Promotions
│   ├── Discounts
│   ├── Coupons
│   └── Gift Cards
├── Loyalty
│   ├── Programs
│   ├── Tiers
│   └── Rewards
├── Content
│   ├── Pages
│   ├── Blocks
│   └── Templates
├── Notifications
└── SEO

OPERATIONS DROPDOWN:
├── Fulfillment
├── Warehouses
├── Suppliers
├── Shipping
│   ├── Methods
│   ├── Zones
│   └── Rates
├── Payments
│   ├── Gateways
│   ├── Methods
│   └── Transactions
└── Tax

SETTINGS DROPDOWN:
├── Store
├── Business Info
├── Localization (NEW)
│   ├── Languages
│   ├── Currencies
│   └── Regions
├── Channels (NEW)
├── Users & Roles
├── GDPR
├── Support
└── Analytics
```

---

## 3. Missing Admin Components

### 3.1 Assortment Module (Categories, Collections)

**Controller:** `assortmentController.ts`

```typescript
// Required functions:
listCategories()
createCategoryForm()
createCategory()
viewCategory()
editCategoryForm()
updateCategory()
deleteCategory()
reorderCategories()

listCollections()
createCollectionForm()
createCollection()
viewCollection()
editCollectionForm()
updateCollection()
deleteCollection()
```

**Routes:**
```typescript
// Categories
router.get('/catalog/categories', assortmentController.listCategories);
router.get('/catalog/categories/create', assortmentController.createCategoryForm);
router.post('/catalog/categories', assortmentController.createCategory);
router.get('/catalog/categories/:categoryId', assortmentController.viewCategory);
router.get('/catalog/categories/:categoryId/edit', assortmentController.editCategoryForm);
router.post('/catalog/categories/:categoryId', assortmentController.updateCategory);
router.delete('/catalog/categories/:categoryId', assortmentController.deleteCategory);
router.post('/catalog/categories/reorder', assortmentController.reorderCategories);

// Collections
router.get('/catalog/collections', assortmentController.listCollections);
router.get('/catalog/collections/create', assortmentController.createCollectionForm);
router.post('/catalog/collections', assortmentController.createCollection);
router.get('/catalog/collections/:collectionId', assortmentController.viewCollection);
router.get('/catalog/collections/:collectionId/edit', assortmentController.editCollectionForm);
router.post('/catalog/collections/:collectionId', assortmentController.updateCollection);
router.delete('/catalog/collections/:collectionId', assortmentController.deleteCollection);
```

**Views:**
```
views/catalog/categories/
├── index.ejs
├── create.ejs
├── edit.ejs
└── view.ejs

views/catalog/collections/
├── index.ejs
├── create.ejs
├── edit.ejs
└── view.ejs
```

---

### 3.2 Brand Module

**Controller:** `brandController.ts`

```typescript
listBrands()
createBrandForm()
createBrand()
viewBrand()
editBrandForm()
updateBrand()
deleteBrand()
```

**Routes:**
```typescript
router.get('/catalog/brands', brandController.listBrands);
router.get('/catalog/brands/create', brandController.createBrandForm);
router.post('/catalog/brands', brandController.createBrand);
router.get('/catalog/brands/:brandId', brandController.viewBrand);
router.get('/catalog/brands/:brandId/edit', brandController.editBrandForm);
router.post('/catalog/brands/:brandId', brandController.updateBrand);
router.delete('/catalog/brands/:brandId', brandController.deleteBrand);
```

**Views:**
```
views/catalog/brands/
├── index.ejs
├── create.ejs
├── edit.ejs
└── view.ejs
```

---

### 3.3 Pricing Module

**Controller:** `pricingController.ts`

```typescript
listPriceLists()
createPriceListForm()
createPriceList()
viewPriceList()
editPriceListForm()
updatePriceList()
deletePriceList()

listPriceRules()
createPriceRuleForm()
createPriceRule()
viewPriceRule()
editPriceRuleForm()
updatePriceRule()
deletePriceRule()
```

**Routes:**
```typescript
// Price Lists
router.get('/catalog/pricing', pricingController.listPriceLists);
router.get('/catalog/pricing/lists/create', pricingController.createPriceListForm);
router.post('/catalog/pricing/lists', pricingController.createPriceList);
router.get('/catalog/pricing/lists/:listId', pricingController.viewPriceList);
router.get('/catalog/pricing/lists/:listId/edit', pricingController.editPriceListForm);
router.post('/catalog/pricing/lists/:listId', pricingController.updatePriceList);
router.delete('/catalog/pricing/lists/:listId', pricingController.deletePriceList);

// Price Rules
router.get('/catalog/pricing/rules', pricingController.listPriceRules);
router.get('/catalog/pricing/rules/create', pricingController.createPriceRuleForm);
router.post('/catalog/pricing/rules', pricingController.createPriceRule);
router.get('/catalog/pricing/rules/:ruleId', pricingController.viewPriceRule);
router.get('/catalog/pricing/rules/:ruleId/edit', pricingController.editPriceRuleForm);
router.post('/catalog/pricing/rules/:ruleId', pricingController.updatePriceRule);
router.delete('/catalog/pricing/rules/:ruleId', pricingController.deletePriceRule);
```

**Views:**
```
views/catalog/pricing/
├── index.ejs
├── lists/
│   ├── index.ejs
│   ├── create.ejs
│   ├── edit.ejs
│   └── view.ejs
└── rules/
    ├── index.ejs
    ├── create.ejs
    ├── edit.ejs
    └── view.ejs
```

---

### 3.4 Channel Module

**Controller:** `channelController.ts`

```typescript
listChannels()
createChannelForm()
createChannel()
viewChannel()
editChannelForm()
updateChannel()
deleteChannel()
activateChannel()
deactivateChannel()
```

**Routes:**
```typescript
router.get('/settings/channels', channelController.listChannels);
router.get('/settings/channels/create', channelController.createChannelForm);
router.post('/settings/channels', channelController.createChannel);
router.get('/settings/channels/:channelId', channelController.viewChannel);
router.get('/settings/channels/:channelId/edit', channelController.editChannelForm);
router.post('/settings/channels/:channelId', channelController.updateChannel);
router.delete('/settings/channels/:channelId', channelController.deleteChannel);
router.post('/settings/channels/:channelId/activate', channelController.activateChannel);
router.post('/settings/channels/:channelId/deactivate', channelController.deactivateChannel);
```

**Views:**
```
views/settings/channels/
├── index.ejs
├── create.ejs
├── edit.ejs
└── view.ejs
```

---

### 3.5 Localization Module

**Controller:** `localizationController.ts`

```typescript
// Languages
listLanguages()
createLanguageForm()
createLanguage()
editLanguageForm()
updateLanguage()
deleteLanguage()

// Currencies
listCurrencies()
createCurrencyForm()
createCurrency()
editCurrencyForm()
updateCurrency()
deleteCurrency()

// Regions
listRegions()
createRegionForm()
createRegion()
editRegionForm()
updateRegion()
deleteRegion()
```

**Routes:**
```typescript
// Languages
router.get('/settings/localization', localizationController.localizationDashboard);
router.get('/settings/localization/languages', localizationController.listLanguages);
router.get('/settings/localization/languages/create', localizationController.createLanguageForm);
router.post('/settings/localization/languages', localizationController.createLanguage);
router.get('/settings/localization/languages/:languageId/edit', localizationController.editLanguageForm);
router.post('/settings/localization/languages/:languageId', localizationController.updateLanguage);
router.delete('/settings/localization/languages/:languageId', localizationController.deleteLanguage);

// Currencies
router.get('/settings/localization/currencies', localizationController.listCurrencies);
router.get('/settings/localization/currencies/create', localizationController.createCurrencyForm);
router.post('/settings/localization/currencies', localizationController.createCurrency);
router.get('/settings/localization/currencies/:currencyId/edit', localizationController.editCurrencyForm);
router.post('/settings/localization/currencies/:currencyId', localizationController.updateCurrency);
router.delete('/settings/localization/currencies/:currencyId', localizationController.deleteCurrency);

// Regions
router.get('/settings/localization/regions', localizationController.listRegions);
router.get('/settings/localization/regions/create', localizationController.createRegionForm);
router.post('/settings/localization/regions', localizationController.createRegion);
router.get('/settings/localization/regions/:regionId/edit', localizationController.editRegionForm);
router.post('/settings/localization/regions/:regionId', localizationController.updateRegion);
router.delete('/settings/localization/regions/:regionId', localizationController.deleteRegion);
```

**Views:**
```
views/settings/localization/
├── index.ejs
├── languages/
│   ├── index.ejs
│   ├── create.ejs
│   └── edit.ejs
├── currencies/
│   ├── index.ejs
│   ├── create.ejs
│   └── edit.ejs
└── regions/
    ├── index.ejs
    ├── create.ejs
    └── edit.ejs
```

---

### 3.6 Segment Module

**Controller:** `segmentController.ts`

```typescript
listSegments()
createSegmentForm()
createSegment()
viewSegment()
editSegmentForm()
updateSegment()
deleteSegment()
viewSegmentCustomers()
refreshSegment()
```

**Routes:**
```typescript
router.get('/sales/segments', segmentController.listSegments);
router.get('/sales/segments/create', segmentController.createSegmentForm);
router.post('/sales/segments', segmentController.createSegment);
router.get('/sales/segments/:segmentId', segmentController.viewSegment);
router.get('/sales/segments/:segmentId/edit', segmentController.editSegmentForm);
router.post('/sales/segments/:segmentId', segmentController.updateSegment);
router.delete('/sales/segments/:segmentId', segmentController.deleteSegment);
router.get('/sales/segments/:segmentId/customers', segmentController.viewSegmentCustomers);
router.post('/sales/segments/:segmentId/refresh', segmentController.refreshSegment);
```

**Views:**
```
views/sales/segments/
├── index.ejs
├── create.ejs
├── edit.ejs
└── view.ejs
```

---

### 3.7 Merchant Module

**Controller:** `merchantController.ts`

```typescript
listMerchants()
createMerchantForm()
createMerchant()
viewMerchant()
editMerchantForm()
updateMerchant()
deleteMerchant()
approveMerchant()
suspendMerchant()
```

**Routes:**
```typescript
router.get('/operations/merchants', merchantController.listMerchants);
router.get('/operations/merchants/create', merchantController.createMerchantForm);
router.post('/operations/merchants', merchantController.createMerchant);
router.get('/operations/merchants/:merchantId', merchantController.viewMerchant);
router.get('/operations/merchants/:merchantId/edit', merchantController.editMerchantForm);
router.post('/operations/merchants/:merchantId', merchantController.updateMerchant);
router.delete('/operations/merchants/:merchantId', merchantController.deleteMerchant);
router.post('/operations/merchants/:merchantId/approve', merchantController.approveMerchant);
router.post('/operations/merchants/:merchantId/suspend', merchantController.suspendMerchant);
```

**Views:**
```
views/operations/merchants/
├── index.ejs
├── create.ejs
├── edit.ejs
└── view.ejs
```

---

### 3.8 Media Module (Enhanced)

**Controller:** `mediaController.ts`

```typescript
listMedia()
uploadMediaForm()
uploadMedia()
viewMedia()
editMediaForm()
updateMedia()
deleteMedia()
bulkDeleteMedia()
createFolder()
```

**Routes:**
```typescript
router.get('/content/media', mediaController.listMedia);
router.get('/content/media/upload', mediaController.uploadMediaForm);
router.post('/content/media', mediaController.uploadMedia);
router.get('/content/media/:mediaId', mediaController.viewMedia);
router.get('/content/media/:mediaId/edit', mediaController.editMediaForm);
router.post('/content/media/:mediaId', mediaController.updateMedia);
router.delete('/content/media/:mediaId', mediaController.deleteMedia);
router.post('/content/media/bulk-delete', mediaController.bulkDeleteMedia);
router.post('/content/media/folders', mediaController.createFolder);
```

**Views:**
```
views/content/media/
├── index.ejs
├── upload.ejs
├── edit.ejs
└── view.ejs
```

---

### 3.9 Checkout Configuration Module

**Controller:** `checkoutController.ts`

```typescript
checkoutSettings()
updateCheckoutSettings()
listPaymentMethods()
updatePaymentMethodOrder()
listShippingOptions()
updateShippingOptionOrder()
```

**Routes:**
```typescript
router.get('/settings/checkout', checkoutController.checkoutSettings);
router.post('/settings/checkout', checkoutController.updateCheckoutSettings);
router.get('/settings/checkout/payment-methods', checkoutController.listPaymentMethods);
router.post('/settings/checkout/payment-methods/reorder', checkoutController.updatePaymentMethodOrder);
router.get('/settings/checkout/shipping-options', checkoutController.listShippingOptions);
router.post('/settings/checkout/shipping-options/reorder', checkoutController.updateShippingOptionOrder);
```

**Views:**
```
views/settings/checkout/
├── index.ejs
├── payment-methods.ejs
└── shipping-options.ejs
```

---

## 4. Navbar Implementation

### 4.1 Updated navbar.ejs

The navbar should be restructured with dropdown menus. Here's the implementation pattern:

```html
<header class="navbar-expand-md">
  <div class="collapse navbar-collapse" id="navbar-menu">
    <div class="navbar">
      <div class="container-xl">
        <ul class="navbar-nav">
          <!-- Dashboard -->
          <li class="nav-item">
            <a class="nav-link" href="/admin">
              <span class="nav-link-icon"><!-- icon --></span>
              <span class="nav-link-title">Dashboard</span>
            </a>
          </li>

          <!-- Catalog Dropdown -->
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
              <span class="nav-link-icon"><!-- icon --></span>
              <span class="nav-link-title">Catalog</span>
            </a>
            <div class="dropdown-menu">
              <a class="dropdown-item" href="/admin/products">Products</a>
              <a class="dropdown-item" href="/admin/catalog/categories">Categories</a>
              <a class="dropdown-item" href="/admin/catalog/brands">Brands</a>
              <a class="dropdown-item" href="/admin/catalog/collections">Collections</a>
              <div class="dropdown-divider"></div>
              <a class="dropdown-item" href="/admin/inventory">Inventory</a>
              <a class="dropdown-item" href="/admin/catalog/pricing">Pricing</a>
            </div>
          </li>

          <!-- Sales Dropdown -->
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
              <span class="nav-link-icon"><!-- icon --></span>
              <span class="nav-link-title">Sales</span>
            </a>
            <div class="dropdown-menu">
              <a class="dropdown-item" href="/admin/orders">Orders</a>
              <a class="dropdown-item" href="/admin/customers">Customers</a>
              <a class="dropdown-item" href="/admin/baskets/abandoned">Abandoned Carts</a>
              <a class="dropdown-item" href="/admin/sales/segments">Segments</a>
              <div class="dropdown-divider"></div>
              <span class="dropdown-header">B2B</span>
              <a class="dropdown-item" href="/admin/b2b/companies">Companies</a>
              <a class="dropdown-item" href="/admin/b2b/quotes">Quotes</a>
            </div>
          </li>

          <!-- Marketing Dropdown -->
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
              <span class="nav-link-icon"><!-- icon --></span>
              <span class="nav-link-title">Marketing</span>
            </a>
            <div class="dropdown-menu dropdown-menu-columns">
              <div class="dropdown-menu-column">
                <span class="dropdown-header">Promotions</span>
                <a class="dropdown-item" href="/admin/promotions">Discounts</a>
                <a class="dropdown-item" href="/admin/promotions/coupons">Coupons</a>
                <a class="dropdown-item" href="/admin/promotions/gift-cards">Gift Cards</a>
              </div>
              <div class="dropdown-menu-column">
                <span class="dropdown-header">Loyalty</span>
                <a class="dropdown-item" href="/admin/loyalty/tiers">Tiers</a>
                <a class="dropdown-item" href="/admin/loyalty/rewards">Rewards</a>
                <a class="dropdown-item" href="/admin/loyalty/customers">Customer Points</a>
              </div>
              <div class="dropdown-menu-column">
                <span class="dropdown-header">Content</span>
                <a class="dropdown-item" href="/admin/content/pages">Pages</a>
                <a class="dropdown-item" href="/admin/content/blocks">Blocks</a>
                <a class="dropdown-item" href="/admin/content/media">Media</a>
              </div>
            </div>
          </li>

          <!-- Operations Dropdown -->
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
              <span class="nav-link-icon"><!-- icon --></span>
              <span class="nav-link-title">Operations</span>
            </a>
            <div class="dropdown-menu">
              <a class="dropdown-item" href="/admin/fulfillments">Fulfillment</a>
              <a class="dropdown-item" href="/admin/warehouses">Warehouses</a>
              <a class="dropdown-item" href="/admin/suppliers">Suppliers</a>
              <div class="dropdown-divider"></div>
              <span class="dropdown-header">Shipping</span>
              <a class="dropdown-item" href="/admin/shipping">Methods</a>
              <a class="dropdown-item" href="/admin/shipping/zones">Zones</a>
              <a class="dropdown-item" href="/admin/shipping/rates">Rates</a>
              <div class="dropdown-divider"></div>
              <span class="dropdown-header">Payments</span>
              <a class="dropdown-item" href="/admin/payments">Gateways</a>
              <a class="dropdown-item" href="/admin/payments/methods">Methods</a>
              <a class="dropdown-item" href="/admin/payments/transactions">Transactions</a>
              <div class="dropdown-divider"></div>
              <a class="dropdown-item" href="/admin/tax">Tax Settings</a>
            </div>
          </li>

          <!-- Settings Dropdown -->
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
              <span class="nav-link-icon"><!-- icon --></span>
              <span class="nav-link-title">Settings</span>
            </a>
            <div class="dropdown-menu dropdown-menu-end">
              <a class="dropdown-item" href="/admin/settings/store">Store</a>
              <a class="dropdown-item" href="/admin/settings/business">Business Info</a>
              <a class="dropdown-item" href="/admin/settings/localization">Localization</a>
              <a class="dropdown-item" href="/admin/settings/channels">Channels</a>
              <div class="dropdown-divider"></div>
              <a class="dropdown-item" href="/admin/users">Users & Roles</a>
              <a class="dropdown-item" href="/admin/gdpr">GDPR</a>
              <a class="dropdown-item" href="/admin/support">Support</a>
              <div class="dropdown-divider"></div>
              <a class="dropdown-item" href="/admin/analytics">Analytics</a>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</header>
```

---

## 5. Implementation Priority

### Phase 1: Navigation Restructure (Immediate)
1. ✅ Update `navbar.ejs` with dropdown structure
2. ✅ Group existing routes under logical sections
3. ✅ Add visual dividers and section headers

### Phase 2: Critical Missing Modules (High Priority)
1. **Assortment Module** - Categories and Collections management
2. **Brand Module** - Brand management for products
3. **Pricing Module** - Price lists and pricing rules
4. **Segment Module** - Customer segmentation

### Phase 3: Enhanced Modules (Medium Priority)
1. **Media Module** - Full media library management
2. **Localization Module** - Languages, currencies, regions
3. **Channel Module** - Multi-channel configuration
4. **Checkout Module** - Checkout flow configuration

### Phase 4: Additional Modules (Lower Priority)
1. **Merchant Module** - Multi-merchant support
2. **Organization Module** - Organization structure
3. **Business Module** - Business entity management
4. **Configuration Module** - Platform-wide settings

---

## 6. View Template Standards

All new views should follow these standards:

### 6.1 Index/List View Template
```html
<!-- Page Header -->
<div class="page-header d-print-none pb-3">
  <div class="row g-2 align-items-center">
    <div class="col">
      <h2 class="page-title">[Entity] Management</h2>
    </div>
    <div class="col-auto">
      <a href="/admin/[path]/create" class="btn btn-primary">
        <i class="fas fa-plus"></i> Add [Entity]
      </a>
    </div>
  </div>
</div>

<!-- Main content -->
<section class="content">
  <%- include("../partials/alerts") %>
  
  <!-- Filters Card (optional) -->
  <div class="card mb-3">...</div>
  
  <!-- Data Table Card -->
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">[Entity] List (<%= pagination.total %>)</h3>
    </div>
    <div class="card-body table-responsive p-0">
      <table class="table table-hover">...</table>
    </div>
    <!-- Pagination -->
    <div class="card-footer">...</div>
  </div>
</section>
```

### 6.2 Create/Edit Form Template
```html
<!-- Page Header -->
<div class="page-header d-print-none pb-3">
  <div class="row g-2 align-items-center">
    <div class="col">
      <h2 class="page-title">Create/Edit [Entity]</h2>
    </div>
  </div>
</div>

<!-- Main content -->
<section class="content">
  <%- include("../partials/alerts") %>
  
  <form method="POST" action="/admin/[path]">
    <div class="row">
      <div class="col-lg-8">
        <!-- Main form fields -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Details</h3>
          </div>
          <div class="card-body">
            <!-- Form fields -->
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <!-- Sidebar (status, metadata) -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Status</h3>
          </div>
          <div class="card-body">
            <!-- Status toggles, dates -->
          </div>
          <div class="card-footer">
            <button type="submit" class="btn btn-primary">Save</button>
            <a href="/admin/[path]" class="btn btn-secondary">Cancel</a>
          </div>
        </div>
      </div>
    </div>
  </form>
</section>
```

---

## 7. Route Reorganization

### 7.1 Recommended Route Structure

```
/admin
├── /                           # Dashboard
├── /profile                    # Admin profile
│
├── /catalog                    # Catalog section
│   ├── /categories             # Categories CRUD
│   ├── /brands                 # Brands CRUD
│   ├── /collections            # Collections CRUD
│   └── /pricing                # Pricing management
│
├── /products                   # Products (keep at root for backward compat)
├── /inventory                  # Inventory management
│
├── /sales                      # Sales section
│   ├── /segments               # Customer segments
│   └── /subscriptions          # Move from programs
│
├── /orders                     # Orders (keep at root)
├── /customers                  # Customers (keep at root)
├── /baskets                    # Abandoned carts
│
├── /b2b                        # B2B section
│   ├── /companies
│   └── /quotes
│
├── /marketing                  # Marketing section
│   ├── /seo
│   └── /notifications
│
├── /promotions                 # Promotions section
│   ├── /                       # Discounts list
│   ├── /coupons
│   └── /gift-cards
│
├── /loyalty                    # Loyalty section
│   ├── /tiers
│   ├── /rewards
│   └── /customers
│
├── /membership                 # Membership section
│   ├── /plans
│   └── /memberships
│
├── /content                    # Content section
│   ├── /pages
│   ├── /blocks
│   ├── /templates
│   └── /media
│
├── /operations                 # Operations section
│   ├── /dashboard
│   └── /merchants
│
├── /fulfillments               # Fulfillment
├── /warehouses                 # Warehouses
├── /suppliers                  # Suppliers
│
├── /shipping                   # Shipping section
│   ├── /                       # Methods
│   ├── /zones
│   └── /rates
│
├── /payments                   # Payments section
│   ├── /                       # Gateways
│   ├── /methods
│   └── /transactions
│
├── /tax                        # Tax settings
│
├── /settings                   # Settings section
│   ├── /store
│   ├── /business
│   ├── /localization
│   ├── /channels
│   └── /checkout
│
├── /users                      # Users & roles
├── /roles                      # Role management
├── /gdpr                       # GDPR compliance
├── /support                    # Support center
└── /analytics                  # Analytics dashboards
```

---

## 8. Summary of Required Changes

### 8.1 New Controllers to Create
1. `assortmentController.ts` - Categories & Collections
2. `brandController.ts` - Brand management
3. `pricingController.ts` - Pricing management
4. `channelController.ts` - Channel management
5. `localizationController.ts` - Localization settings
6. `segmentController.ts` - Customer segments
7. `merchantController.ts` - Merchant management (if multi-merchant)
8. `mediaController.ts` - Enhanced media library
9. `checkoutController.ts` - Checkout configuration

### 8.2 New View Directories
```
views/
├── catalog/
│   ├── categories/
│   ├── brands/
│   ├── collections/
│   └── pricing/
├── sales/
│   └── segments/
├── settings/
│   ├── localization/
│   ├── channels/
│   └── checkout/
└── operations/
    └── merchants/
```

### 8.3 Router Updates
- Update `adminRouters.ts` with new routes
- Organize routes by section with clear comments
- Add redirect routes for backward compatibility

### 8.4 Navbar Update
- Replace flat navigation with dropdown structure
- Add icons for each section
- Include section headers and dividers

---

## 9. Acceptance Criteria

- [ ] Navbar restructured with dropdown menus
- [ ] All existing routes still functional
- [ ] New routes added for missing modules
- [ ] Controllers created for new functionality
- [ ] Views follow consistent template patterns
- [ ] No broken links in navigation
- [ ] Mobile-responsive dropdown menus
- [ ] Logical grouping of related features
- [ ] Documentation updated

---

## 10. Appendix: Icon Reference

Use Tabler Icons (already included in admin template):

| Section | Icon |
|---------|------|
| Dashboard | `home` |
| Catalog | `package` |
| Sales | `shopping-cart` |
| Marketing | `speakerphone` |
| Operations | `truck` |
| Settings | `settings` |
| Products | `box` |
| Orders | `receipt` |
| Customers | `users` |
| Content | `file-text` |
| Analytics | `chart-bar` |

---

*Document Version: 1.0*
*Last Updated: December 24, 2024*
*Author: Claude (AI Assistant)*
