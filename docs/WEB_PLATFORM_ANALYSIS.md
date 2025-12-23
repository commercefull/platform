# Web Platform Analysis & Implementation Guide

## Document Version: 2.0 (Implemented)

## Date: December 23, 2024

### Implementation Status (Updated December 23, 2024)

#### Phase 1: Authentication Overhaul ✅ COMPLETE

- ✅ **Admin Authentication**: Dedicated `isAdminLoggedIn` middleware in `libs/auth.ts`
- ✅ **Session Management**: Database-backed `SessionService` in `libs/session/`
- ✅ **Admin Repository**: `AdminRepository` for admin user operations
- ✅ **Admin Use Cases**: `LoginAdmin`, `RegisterAdmin` in `modules/identity/application/useCases/admin/`
- ✅ **Event Types**: Admin and B2B events added to `eventBus.ts`

#### Phase 2: Missing Use Cases ✅ COMPLETE

- ✅ **Order Use Cases**: Created `ListOrders`, `GetOrder`, `UpdateOrderStatus`, `CancelOrder`, `ProcessRefund`, `GetCustomerOrders`
- ✅ **Identity Use Cases**: Customer, Merchant, Admin, and Token use cases all created
- ✅ **Dashboard Query Repository**: `DashboardQueryRepository` for admin/merchant/B2B dashboards
- ✅ **Barrel Exports**: Index files created for all use case directories

#### Phase 3: Merchant Hub ✅ COMPLETE

- ✅ **Directory Structure**: `/web/merchant/` with controllers, views, partials
- ✅ **Merchant Auth**: Session-based authentication with `merchantId` scoping
- ✅ **Controllers**: Dashboard, Product, Order, Auth controllers
- ✅ **Views**: AdminLTE v4 themed views with reusable partials
- ✅ **Routes**: Mounted at `/merchant` in `boot/routes.ts`

#### Phase 4: B2B Portal ✅ COMPLETE

- ✅ **Directory Structure**: `/web/b2b/` with controllers, views, partials
- ✅ **B2B Auth**: Session-based authentication with `companyId` scoping
- ✅ **Controllers**: Dashboard, Quote, Order, Approval, Auth controllers
- ✅ **Role-Based UI**: Sidebar shows Approvals/Users based on user role
- ✅ **Views**: AdminLTE v4 themed views with reusable partials
- ✅ **Routes**: Mounted at `/b2b` in `boot/routes.ts`

#### Phase 5: Admin Portal Alignment ✅ COMPLETE

- ✅ **Route Fix**: Changed from `/hub` to `/admin` throughout
- ✅ **AdminLTE v4**: Consistent theme across all portals
- ✅ **Partials**: Reusable head, navbar, sidebar, footer, scripts partials

#### Remaining Work (Future Phases)

- ⏳ **RBAC System**: Role-based access control with permissions
- ⏳ **Additional Views**: Create/Edit forms for products, orders
- ⏳ **Integration Tests**: E2E tests for portal flows
- ⏳ **Security Audit**: Review authentication flows

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Web Directory Structure](#2-current-web-directory-structure)
3. [Admin Portal Analysis](#3-admin-portal-analysis)
4. [Storefront Analysis](#4-storefront-analysis)
5. [Authentication System Issues](#5-authentication-system-issues)
6. [Controller to Use Case Mapping](#6-controller-to-use-case-mapping)
7. [Missing Use Cases Analysis](#7-missing-use-cases-analysis)
8. [New Platform Requirements](#8-new-platform-requirements)
9. [Implementation Plan](#9-implementation-plan)
10. [Technical Specifications](#10-technical-specifications)

---

## 1. Executive Summary

### Current State ✅ IMPLEMENTED

The CommerceFull platform now has four web interfaces:

| Portal           | Location          | Status                         | Purpose                          |
| ---------------- | ----------------- | ------------------------------ | -------------------------------- |
| **Admin**        | `/web/admin`      | ✅ Functional with AdminLTE v4 | Platform operators, all features |
| **Storefront**   | `/web/storefront` | ✅ Functional                  | End customers, shopping          |
| **Merchant Hub** | `/web/merchant`   | ✅ Implemented                 | Marketplace sellers              |
| **B2B Portal**   | `/web/b2b`        | ✅ Implemented                 | B2B company users, buyers        |

### Issues Resolved ✅

1. ~~**Authentication Mismatch**~~: Admin portal now uses dedicated `isAdminLoggedIn` middleware
2. ~~**Session Management**~~: Database-backed `SessionService` with proper session handling
3. ~~**No Multi-Tenant Isolation**~~: Merchant Hub scopes by `merchantId`, B2B Portal scopes by `companyId`
4. ~~**Missing Portals**~~: Merchant Hub and B2B Portal created and functional
5. ~~**Controller-UseCase Gap**~~: Controllers use `DashboardQueryRepository` and use cases

### Remaining Enhancements (Optional)

1. **RBAC System**: Add role-based permissions for finer access control
2. **MFA Support**: Multi-factor authentication for admin users
3. **Feature Flags**: Per-tenant feature enablement

---

## 2. Current Web Directory Structure

```
web/
├── admin/                          # Platform Admin Portal
│   ├── adminRouters.ts             # 557 lines, 170+ routes
│   ├── controllers/                # 32 controller files
│   │   ├── adminController.ts      # Dashboard, login, profile
│   │   ├── analyticsController.ts  # Analytics & reporting
│   │   ├── b2bController.ts        # B2B management
│   │   ├── basketController.ts     # Cart analytics
│   │   ├── contentController.ts    # CMS management
│   │   ├── couponController.ts     # Coupon management
│   │   ├── customerController.ts   # Customer management
│   │   ├── fulfillmentController.ts# Fulfillment ops
│   │   ├── gdprController.ts       # GDPR compliance
│   │   ├── giftCardController.ts   # Gift cards
│   │   ├── inventoryController.ts  # Inventory management
│   │   ├── loyaltyController.ts    # Loyalty programs
│   │   ├── membershipController.ts # Memberships
│   │   ├── notificationController.ts# Notifications
│   │   ├── orderController.ts      # Order management
│   │   ├── paymentController.ts    # Payment config
│   │   ├── productController.ts    # Product catalog
│   │   ├── promotionController.ts  # Promotions
│   │   ├── settingsController.ts   # Platform settings
│   │   ├── shippingController.ts   # Shipping methods
│   │   ├── shippingRateController.ts
│   │   ├── shippingZoneController.ts
│   │   ├── subscriptionController.ts
│   │   ├── supplierController.ts   # Supplier management
│   │   ├── supportController.ts    # Support center
│   │   ├── taxController.ts        # Tax configuration
│   │   ├── usersController.ts      # Admin users
│   │   └── warehouseController.ts  # Warehouse ops
│   └── views/                      # 75 EJS templates
│       ├── layout.ejs
│       ├── login.ejs
│       ├── dashboard.ejs
│       ├── products/
│       ├── orders/
│       ├── customers/
│       └── ...
│
├── storefront/                     # Customer-facing Store
│   ├── storefrontRouter.ts         # 195 lines
│   ├── controllers/                # 7 controller files
│   │   ├── authController.ts       # Customer auth
│   │   ├── basketController.ts     # Shopping cart
│   │   ├── categoryController.ts   # Category browsing
│   │   ├── checkoutController.ts   # Checkout flow
│   │   ├── orderController.ts      # Order history
│   │   ├── pageCustomerController.ts# Static pages
│   │   └── productController.ts    # Product display
│   └── views/                      # 27 EJS templates
│
└── respond.ts                      # Response utilities
```

---

## 3. Admin Portal Analysis

### 3.1 Current Controllers & Their Module Mappings

| Admin Controller            | Module Used             | Use Cases Available                                       | Gap Status            |
| --------------------------- | ----------------------- | --------------------------------------------------------- | --------------------- |
| `productController.ts`      | `modules/product`       | ✅ ListProducts, CreateProduct, GetProduct, UpdateProduct | ✅ Aligned            |
| `orderController.ts`        | `modules/order`         | ⚠️ Uses repos directly                                    | ❌ Needs use cases    |
| `customerController.ts`     | `modules/customer`      | ⚠️ Uses repos directly                                    | ❌ Needs use cases    |
| `inventoryController.ts`    | `modules/inventory`     | ⚠️ Partial use cases                                      | ⚠️ Needs more         |
| `fulfillmentController.ts`  | `modules/fulfillment`   | ✅ Has use cases                                          | ✅ Aligned            |
| `promotionController.ts`    | `modules/promotion`     | ⚠️ Uses repos                                             | ❌ Needs use cases    |
| `couponController.ts`       | `modules/coupon`        | ✅ Has use cases                                          | ✅ Aligned            |
| `paymentController.ts`      | `modules/payment`       | ⚠️ Uses repos                                             | ⚠️ Partial            |
| `shippingController.ts`     | `modules/shipping`      | ⚠️ Uses repos                                             | ❌ Needs use cases    |
| `membershipController.ts`   | `modules/membership`    | ✅ Has use cases                                          | ✅ Aligned            |
| `subscriptionController.ts` | `modules/subscription`  | ✅ Has use cases                                          | ✅ Aligned            |
| `loyaltyController.ts`      | `modules/loyalty`       | ✅ Has use cases                                          | ✅ Aligned            |
| `b2bController.ts`          | `modules/b2b`           | ✅ Has use cases                                          | ⚠️ Partial            |
| `supplierController.ts`     | `modules/supplier`      | ⚠️ Uses repos                                             | ❌ Needs use cases    |
| `warehouseController.ts`    | `modules/warehouse`     | ⚠️ Uses repos                                             | ❌ Needs use cases    |
| `taxController.ts`          | `modules/tax`           | ⚠️ Uses repos                                             | ❌ Needs use cases    |
| `contentController.ts`      | `modules/content`       | ✅ Has use cases                                          | ✅ Aligned            |
| `notificationController.ts` | `modules/notification`  | ✅ Has use cases                                          | ✅ Aligned            |
| `analyticsController.ts`    | `modules/analytics`     | ✅ Has use cases                                          | ✅ Aligned            |
| `usersController.ts`        | N/A (internal)          | ❌ Raw SQL                                                | ❌ Needs admin module |
| `settingsController.ts`     | `modules/configuration` | ⚠️ Partial                                                | ⚠️ Needs alignment    |
| `gdprController.ts`         | `modules/gdpr`          | ⚠️ Uses repos                                             | ❌ Needs use cases    |
| `supportController.ts`      | `modules/support`       | ⚠️ Uses repos                                             | ❌ Needs use cases    |

### 3.2 Admin Route Categories

```
Route Category              | Route Count | Description
----------------------------|-------------|---------------------------
Products                    | 11          | Full CRUD + status
Orders                      | 6           | View, status, cancel, refund
Customers                   | 10          | View, edit, addresses
Inventory                   | 5           | Stock, locations, low-stock
Tax                         | 10          | Rates, zones, classes
Programs Dashboard          | 4           | Membership, Subscription, Loyalty, B2B
Operations Dashboard        | 1           | Operations overview
GDPR Compliance             | 6           | Requests, consent
Support Center              | 7           | Tickets, FAQs
Promotions                  | 8           | CRUD + status
Coupons                     | 9           | CRUD + validation
Gift Cards                  | 11          | Full lifecycle
Payments                    | 7           | Gateways, methods, transactions
Shipping Methods            | 10          | CRUD + status
Shipping Zones              | 9           | CRUD + status
Shipping Rates              | 11          | CRUD + calculation
Content/Pages               | 12          | Pages, templates, media
SEO                         | 4           | Settings, robots, sitemap
Notifications               | 12          | Templates management
Content Blocks              | 7           | Block management
Warehouses                  | 10          | CRUD + status
Fulfillments                | 8           | Status, shipping, delivery
Suppliers                   | 12          | CRUD + approval
Abandoned Carts             | 7           | Recovery, analytics
Membership Plans            | 13          | Plans, benefits, operations
Subscriptions               | 11          | Plans, billing
Loyalty                     | 9           | Tiers, rewards, customers
B2B                         | 24          | Companies, quotes, users
Analytics                   | 11          | Dashboard, reports
Users/Roles                 | 7           | Admin user management
Settings                    | 9           | Store, business, localization
----------------------------|-------------|---------------------------
TOTAL                       | ~170        | Routes
```

---

## 4. Storefront Analysis

### 4.1 Current Controllers & Their Module Mappings

| Storefront Controller       | Module Used        | Use Cases Available | Gap Status                     |
| --------------------------- | ------------------ | ------------------- | ------------------------------ |
| `authController.ts`         | `modules/identity` | ✅ Customer auth    | ⚠️ Uses repos, needs use cases |
| `basketController.ts`       | `modules/basket`   | ✅ Full use cases   | ✅ Aligned                     |
| `productController.ts`      | `modules/product`  | ✅ Has use cases    | ✅ Aligned                     |
| `categoryController.ts`     | `modules/product`  | ⚠️ Uses repos       | ❌ Needs use cases             |
| `checkoutController.ts`     | `modules/checkout` | ✅ Has use cases    | ✅ Aligned                     |
| `orderController.ts`        | `modules/order`    | ⚠️ Uses repos       | ❌ Needs use cases             |
| `pageCustomerController.ts` | `modules/content`  | ✅ Has use cases    | ✅ Aligned                     |

### 4.2 Storefront Routes

```
Route Category          | Routes
------------------------|------------------------------------------
Static Pages            | /, about-us, shipping-policy, careers, contact-us, faq, returns, support
Products                | /products, /products/category/:slug, /products/:slug/:id, /search
Categories              | /api/categories, /categories/:slug
Basket                  | /basket, /basket/add, /basket/item (update/delete), /basket/clear
Authentication          | /signin, /signup, /profile, /signout
Checkout                | /checkout, /order-confirmation/:id
Orders                  | /orders, /orders/:id, /track/:orderNumber
Content                 | /pages, /pages/:slug, /types
```

---

## 5. Authentication System Issues

### 5.1 Current Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENT AUTH FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Admin Portal (/admin)                                          │
│  ├─ Uses: isMerchantLoggedIn() middleware                       │
│  ├─ Login: POST /admin/login → MerchantRepo.authenticateMerchant│
│  ├─ Session: Sets (req as any).user = {...}                     │
│  └─ Problem: No session store, no JWT, no refresh tokens        │
│                                                                 │
│  Storefront (/customer)                                         │
│  ├─ Uses: isCustomerLoggedIn() middleware                       │
│  ├─ Login: Uses modules/identity routes                         │
│  └─ Works with JWT but separate from admin                      │
│                                                                 │
│  API Routes (/business)                                         │
│  ├─ Uses: isMerchantLoggedIn() with JWT                         │
│  └─ Expects Bearer token in Authorization header                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Identified Issues

| Issue                        | Description                              | Impact                   | Priority |
| ---------------------------- | ---------------------------------------- | ------------------------ | -------- |
| **No Session Store**         | `(req as any).user = {}` doesn't persist | Sessions lost on restart | CRITICAL |
| **Mixed Auth Methods**       | Form login vs JWT inconsistent           | Confusing security model | HIGH     |
| **No Refresh Tokens**        | Short-lived tokens without refresh       | Poor UX                  | HIGH     |
| **No Role/Permission Check** | Only checks "is logged in"               | No RBAC                  | HIGH     |
| **Single User Type**         | Admin uses merchant auth                 | No admin users           | HIGH     |
| **No Multi-Tenant**          | All merchants see everything             | Data leak risk           | CRITICAL |
| **Hardcoded Redirects**      | `/hub/login`, `/admin/login`, etc.       | Inflexible               | MEDIUM   |

### 5.3 Required Auth Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   PROPOSED AUTH ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Types:                                                    │
│  ├─ ADMIN: Platform operators (super admin, support, ops)       │
│  ├─ MERCHANT: Marketplace sellers                               │
│  ├─ B2B_USER: Company buyers with approval workflows            │
│  └─ CUSTOMER: End consumers                                     │
│                                                                 │
│  Authentication:                                                │
│  ├─ Identity Module handles all user types                      │
│  ├─ JWT with refresh token rotation                             │
│  ├─ Session stored in Redis or database                         │
│  └─ Multi-factor auth support                                   │
│                                                                 │
│  Authorization:                                                 │
│  ├─ Role-Based Access Control (RBAC)                            │
│  ├─ Per-merchant data isolation                                 │
│  ├─ Per-company B2B isolation                                   │
│  └─ Feature flags per plan/tier                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Controller to Use Case Mapping

### 6.1 Admin Controllers - Detailed Mapping

#### Products (✅ Well Aligned)

| Controller Method | Use Case                               | Status |
| ----------------- | -------------------------------------- | ------ |
| `listProducts`    | `ListProductsUseCase`                  | ✅     |
| `createProduct`   | `CreateProductUseCase`                 | ✅     |
| `viewProduct`     | `GetProductUseCase`                    | ✅     |
| `updateProduct`   | `UpdateProductUseCase`                 | ✅     |
| `deleteProduct`   | `DeleteProductUseCase`                 | ✅     |
| `publishProduct`  | `UpdateProductUseCase` (status change) | ✅     |

#### Orders (❌ Needs Use Cases)

| Controller Method   | Required Use Case          | Status     |
| ------------------- | -------------------------- | ---------- |
| `listOrders`        | `ListOrdersUseCase`        | ❌ Missing |
| `viewOrder`         | `GetOrderUseCase`          | ❌ Missing |
| `updateOrderStatus` | `UpdateOrderStatusUseCase` | ❌ Missing |
| `cancelOrder`       | `CancelOrderUseCase`       | ❌ Missing |
| `processRefund`     | `ProcessRefundUseCase`     | ❌ Missing |

#### Customers (❌ Needs Use Cases)

| Controller Method    | Required Use Case           | Status                 |
| -------------------- | --------------------------- | ---------------------- |
| `listCustomers`      | `ListCustomersUseCase`      | ❌ Missing             |
| `viewCustomer`       | `GetCustomerUseCase`        | ⚠️ Exists but not used |
| `updateCustomer`     | `UpdateCustomerUseCase`     | ⚠️ Exists but not used |
| `deactivateCustomer` | `DeactivateCustomerUseCase` | ⚠️ Exists but not used |
| `reactivateCustomer` | `ReactivateCustomerUseCase` | ⚠️ Exists but not used |

#### Inventory (⚠️ Partial)

| Controller Method | Required Use Case           | Status     |
| ----------------- | --------------------------- | ---------- |
| `listInventory`   | `ListInventoryItemsUseCase` | ❌ Missing |
| `adjustStock`     | `AdjustStockUseCase`        | ❌ Missing |
| `listLocations`   | `ListLocationsUseCase`      | ❌ Missing |
| `lowStockReport`  | `GetLowStockItemsUseCase`   | ❌ Missing |

#### Shipping (❌ Needs Use Cases)

| Controller Method      | Required Use Case             | Status     |
| ---------------------- | ----------------------------- | ---------- |
| `listShippingMethods`  | `ListShippingMethodsUseCase`  | ❌ Missing |
| `createShippingMethod` | `CreateShippingMethodUseCase` | ❌ Missing |
| `updateShippingMethod` | `UpdateShippingMethodUseCase` | ❌ Missing |
| `deleteShippingMethod` | `DeleteShippingMethodUseCase` | ❌ Missing |

#### Tax (❌ Needs Use Cases)

| Controller Method | Required Use Case            | Status     |
| ----------------- | ---------------------------- | ---------- |
| `listTaxSettings` | `GetTaxConfigurationUseCase` | ❌ Missing |
| `createTaxRate`   | `CreateTaxRateUseCase`       | ❌ Missing |
| `updateTaxRate`   | `UpdateTaxRateUseCase`       | ❌ Missing |
| `createTaxZone`   | `CreateTaxZoneUseCase`       | ❌ Missing |

### 6.2 Storefront Controllers - Detailed Mapping

| Controller Method | Use Case                   | Status                  |
| ----------------- | -------------------------- | ----------------------- |
| `signIn`          | `LoginCustomerUseCase`     | ⚠️ Exists, needs wiring |
| `signUp`          | `RegisterCustomerUseCase`  | ⚠️ Exists, needs wiring |
| `viewBasket`      | `GetBasketUseCase`         | ✅                      |
| `addToBasket`     | `AddToBasketUseCase`       | ✅                      |
| `checkout`        | `StartCheckoutUseCase`     | ✅                      |
| `processCheckout` | `CompleteCheckoutUseCase`  | ✅                      |
| `orderHistory`    | `GetCustomerOrdersUseCase` | ❌ Missing              |
| `orderDetails`    | `GetOrderUseCase`          | ❌ Missing              |

---

## 7. Missing Use Cases Analysis

### 7.1 By Priority

#### CRITICAL (Required for Core Functions)

| Module      | Use Case                    | Purpose                |
| ----------- | --------------------------- | ---------------------- |
| `order`     | `ListOrdersUseCase`         | Admin order list       |
| `order`     | `GetOrderUseCase`           | Admin order view       |
| `order`     | `UpdateOrderStatusUseCase`  | Status management      |
| `order`     | `CancelOrderUseCase`        | Order cancellation     |
| `order`     | `GetCustomerOrdersUseCase`  | Customer order history |
| `customer`  | `ListCustomersUseCase`      | Admin customer list    |
| `inventory` | `ListInventoryItemsUseCase` | Stock management       |
| `inventory` | `AdjustStockUseCase`        | Stock adjustments      |

#### HIGH (Required for Operations)

| Module      | Use Case                      | Purpose             |
| ----------- | ----------------------------- | ------------------- |
| `shipping`  | `ListShippingMethodsUseCase`  | Shipping config     |
| `shipping`  | `CreateShippingMethodUseCase` | Method creation     |
| `shipping`  | `CreateShippingZoneUseCase`   | Zone management     |
| `shipping`  | `CreateShippingRateUseCase`   | Rate configuration  |
| `tax`       | `GetTaxConfigurationUseCase`  | Tax settings        |
| `tax`       | `CreateTaxRateUseCase`        | Tax rate CRUD       |
| `warehouse` | `ListWarehousesUseCase`       | Warehouse list      |
| `warehouse` | `CreateWarehouseUseCase`      | Warehouse CRUD      |
| `supplier`  | `ListSuppliersUseCase`        | Supplier management |
| `support`   | `ListTicketsUseCase`          | Support center      |

#### MEDIUM (Required for Complete Feature Set)

| Module      | Use Case                     | Purpose              |
| ----------- | ---------------------------- | -------------------- |
| `gdpr`      | `CreateGdprRequestUseCase`   | GDPR compliance      |
| `gdpr`      | `ProcessGdprRequestUseCase`  | Request handling     |
| `promotion` | `ListPromotionsUseCase`      | Promotion management |
| `promotion` | `CreatePromotionUseCase`     | Promotion creation   |
| `giftCard`  | `ListGiftCardsUseCase`       | Gift card management |
| `payment`   | `ListPaymentGatewaysUseCase` | Gateway config       |

---

## 8. New Platform Requirements

### 8.1 Merchant Hub (`/web/merchant`)

#### Purpose

Self-service portal for marketplace sellers to manage their products, orders, and finances.

#### Target Users

- Marketplace merchants
- Seller staff members
- Store managers

#### Required Features

| Category      | Features                                                         |
| ------------- | ---------------------------------------------------------------- |
| **Dashboard** | Sales overview, pending orders, low stock alerts, revenue charts |
| **Products**  | CRUD (own products only), variants, pricing, images              |
| **Orders**    | View orders (their products), fulfill, track                     |
| **Inventory** | Stock levels (own products), alerts                              |
| **Finances**  | Settlements, payouts, commission tracking                        |
| **Settings**  | Store profile, shipping preferences, payment info                |
| **Reports**   | Sales reports, product performance                               |

#### Required Use Cases (from modules)

```
modules/merchant/application/useCases/
├── GetMerchantDashboard.ts     # NEW
├── GetMerchantProfile.ts       # NEW
├── UpdateMerchantProfile.ts    # NEW
├── GetMerchantOrders.ts        # NEW
├── GetMerchantProducts.ts      # NEW
├── GetMerchantSettlements.ts   # EXISTS (CalculateSettlement)
├── GetMerchantPayouts.ts       # EXISTS (ProcessPayout)
└── GetMerchantAnalytics.ts     # NEW

modules/product/ (filtered by merchantId)
├── ListMerchantProducts.ts     # NEW (or filter existing)
├── CreateMerchantProduct.ts    # NEW (or extend existing)
└── UpdateMerchantProduct.ts    # NEW (or extend existing)

modules/order/ (filtered by merchantId)
├── ListMerchantOrders.ts       # NEW
└── UpdateMerchantOrderItem.ts  # NEW
```

#### Directory Structure

```
web/merchant/
├── merchantRouters.ts
├── controllers/
│   ├── dashboardController.ts
│   ├── productController.ts
│   ├── orderController.ts
│   ├── inventoryController.ts
│   ├── financeController.ts
│   ├── settingsController.ts
│   └── authController.ts
└── views/
    ├── layout.ejs
    ├── login.ejs
    ├── dashboard.ejs
    ├── products/
    │   ├── index.ejs
    │   ├── create.ejs
    │   ├── edit.ejs
    │   └── view.ejs
    ├── orders/
    │   ├── index.ejs
    │   └── view.ejs
    ├── finances/
    │   ├── settlements.ejs
    │   └── payouts.ejs
    └── settings/
        ├── profile.ejs
        └── shipping.ejs
```

### 8.2 B2B Vendor Portal (`/web/b2b`)

#### Purpose

Self-service portal for B2B company users to browse, quote, and order products with approval workflows.

#### Target Users

- B2B Company Admins (manage users, set budgets)
- B2B Buyers (create orders, request quotes)
- B2B Approvers (approve/reject purchase requests)

#### Required Features

| Category               | Features                                       |
| ---------------------- | ---------------------------------------------- |
| **Dashboard**          | Pending approvals, recent orders, budget usage |
| **Catalog**            | Browse products with company pricing           |
| **Quotes**             | Request quotes, negotiate, accept              |
| **Orders**             | Create orders, track, reorder                  |
| **Approval Workflows** | Submit for approval, approve/reject            |
| **Users**              | Manage company users, roles                    |
| **Account**            | Company profile, addresses, payment terms      |
| **Budgets**            | View budgets, spending limits                  |

#### Required Use Cases (from modules)

```
modules/b2b/application/useCases/
├── company/
│   ├── GetCompanyProfile.ts        # NEW
│   ├── UpdateCompanyProfile.ts     # NEW
│   ├── ListCompanyUsers.ts         # NEW
│   ├── InviteCompanyUser.ts        # NEW
│   └── ManageCompanyAddresses.ts   # NEW
├── quote/
│   ├── CreateQuote.ts              # EXISTS
│   ├── GetQuote.ts                 # NEW
│   ├── ListQuotes.ts               # NEW
│   └── AcceptQuote.ts              # EXISTS
├── workflow/
│   ├── SubmitForApproval.ts        # EXISTS
│   ├── ApproveRequest.ts           # EXISTS
│   ├── RejectRequest.ts            # EXISTS
│   ├── GetPendingApprovals.ts      # EXISTS
│   └── GetApprovalHistory.ts       # NEW
├── order/
│   ├── CreateB2BOrder.ts           # NEW
│   ├── ListB2BOrders.ts            # NEW
│   └── ReorderFromHistory.ts       # NEW
└── pricing/
    ├── GetCompanyPricing.ts        # NEW
    └── GetVolumeDiscounts.ts       # NEW
```

#### Directory Structure

```
web/b2b/
├── b2bRouters.ts
├── controllers/
│   ├── dashboardController.ts
│   ├── catalogController.ts
│   ├── quoteController.ts
│   ├── orderController.ts
│   ├── approvalController.ts
│   ├── userController.ts
│   ├── accountController.ts
│   └── authController.ts
└── views/
    ├── layout.ejs
    ├── login.ejs
    ├── dashboard.ejs
    ├── catalog/
    │   ├── index.ejs
    │   └── product.ejs
    ├── quotes/
    │   ├── index.ejs
    │   ├── create.ejs
    │   └── view.ejs
    ├── orders/
    │   ├── index.ejs
    │   ├── create.ejs
    │   └── view.ejs
    ├── approvals/
    │   ├── pending.ejs
    │   └── history.ejs
    ├── users/
    │   ├── index.ejs
    │   └── invite.ejs
    └── account/
        ├── profile.ejs
        └── addresses.ejs
```

---

## 9. Implementation Plan

### Phase 1: Authentication Overhaul (Week 1-2)

| Task | Description                          | Files                                      |
| ---- | ------------------------------------ | ------------------------------------------ |
| 1.1  | Create unified auth middleware       | `libs/auth/middleware/`                    |
| 1.2  | Implement session store (Redis/DB)   | `libs/session/`                            |
| 1.3  | Add refresh token support            | `modules/identity/`                        |
| 1.4  | Create admin user type               | `modules/identity/`                        |
| 1.5  | Implement RBAC system                | `libs/auth/rbac/`                          |
| 1.6  | Update admin login to use admin auth | `web/admin/controllers/adminController.ts` |

### Phase 2: Missing Use Cases (Week 2-4)

| Task | Description                                         | Priority |
| ---- | --------------------------------------------------- | -------- |
| 2.1  | Create Order use cases (List, Get, Status, Cancel)  | CRITICAL |
| 2.2  | Create Customer list use case                       | CRITICAL |
| 2.3  | Create Inventory use cases (List, Adjust, LowStock) | CRITICAL |
| 2.4  | Create Shipping use cases (Methods, Zones, Rates)   | HIGH     |
| 2.5  | Create Tax use cases (Config, Rates, Zones)         | HIGH     |
| 2.6  | Create Warehouse use cases                          | HIGH     |
| 2.7  | Create Supplier use cases                           | HIGH     |
| 2.8  | Create GDPR use cases                               | MEDIUM   |
| 2.9  | Create Support use cases                            | MEDIUM   |

### Phase 3: Merchant Hub (Week 4-6)

| Task | Description                                      |
| ---- | ------------------------------------------------ |
| 3.1  | Create merchant-specific use cases               |
| 3.2  | Set up `/web/merchant/` directory structure      |
| 3.3  | Implement merchant auth (multi-tenant)           |
| 3.4  | Create merchant dashboard controller             |
| 3.5  | Create merchant product controller (filtered)    |
| 3.6  | Create merchant order controller (filtered)      |
| 3.7  | Create merchant finance controller               |
| 3.8  | Create all merchant views (reuse admin template) |
| 3.9  | Add merchant routes to boot/routes.ts            |

### Phase 4: B2B Portal (Week 6-8)

| Task | Description                                     |
| ---- | ----------------------------------------------- |
| 4.1  | Create B2B-specific use cases                   |
| 4.2  | Set up `/web/b2b/` directory structure          |
| 4.3  | Implement B2B auth (company-scoped)             |
| 4.4  | Create B2B dashboard controller                 |
| 4.5  | Create B2B catalog controller (company pricing) |
| 4.6  | Create B2B quote controller                     |
| 4.7  | Create B2B order controller                     |
| 4.8  | Create B2B approval workflow controller         |
| 4.9  | Create B2B user management controller           |
| 4.10 | Create all B2B views (reuse admin template)     |
| 4.11 | Add B2B routes to boot/routes.ts                |

### Phase 5: Admin Portal Alignment (Week 8-9)

| Task | Description                                            |
| ---- | ------------------------------------------------------ |
| 5.1  | Migrate admin controllers to use new use cases         |
| 5.2  | Implement admin-specific auth (separate from merchant) |
| 5.3  | Add RBAC checks to admin routes                        |
| 5.4  | Update admin views for role-based visibility           |

### Phase 6: Testing & Polish (Week 9-10)

| Task | Description                       |
| ---- | --------------------------------- |
| 6.1  | Integration tests for all portals |
| 6.2  | E2E tests for critical flows      |
| 6.3  | Security audit                    |
| 6.4  | Performance optimization          |
| 6.5  | Documentation                     |

---

## 10. Technical Specifications

### 10.1 Shared UI Template System

All portals should share the same base template for consistency:

```
libs/ui/
├── layouts/
│   ├── base.ejs              # Base HTML structure
│   ├── sidebar.ejs           # Collapsible sidebar
│   └── navbar.ejs            # Top navigation
├── components/
│   ├── tables/
│   │   ├── data-table.ejs
│   │   └── pagination.ejs
│   ├── forms/
│   │   ├── input.ejs
│   │   ├── select.ejs
│   │   └── date-picker.ejs
│   ├── cards/
│   │   ├── stat-card.ejs
│   │   └── info-card.ejs
│   └── modals/
│       ├── confirm.ejs
│       └── form-modal.ejs
└── themes/
    ├── admin.css
    ├── merchant.css
    └── b2b.css
```

### 10.2 Authentication Tokens

```typescript
// JWT Token Structure
interface AuthToken {
  sub: string; // User ID
  type: 'admin' | 'merchant' | 'b2b' | 'customer';
  email: string;
  name: string;

  // For merchants
  merchantId?: string;
  storeId?: string;

  // For B2B
  companyId?: string;
  companyRole?: 'admin' | 'buyer' | 'approver';

  // RBAC
  roles: string[];
  permissions: string[];

  // Token metadata
  iat: number;
  exp: number;
  jti: string; // Token ID for revocation
}
```

### 10.3 Route Protection Middleware

```typescript
// New middleware structure
libs/auth/middleware/
├── authenticate.ts       # Verify JWT, attach user
├── requireRole.ts        # Check user has role
├── requirePermission.ts  # Check specific permission
├── requireMerchant.ts    # Merchant-specific with data filter
├── requireB2B.ts         # B2B-specific with company filter
├── requireAdmin.ts       # Admin-only access
└── index.ts              # Export all
```

### 10.4 Data Isolation Patterns

```typescript
// Merchant data isolation
class MerchantProductController {
  async listProducts(req: AuthenticatedRequest, res: Response) {
    const merchantId = req.user.merchantId; // From JWT

    const useCase = new ListProductsUseCase(ProductRepo);
    const result = await useCase.execute({
      merchantId, // Filter by merchant
      ...req.query,
    });

    res.render('merchant/products/index', { products: result.products });
  }
}

// B2B data isolation
class B2BOrderController {
  async listOrders(req: AuthenticatedRequest, res: Response) {
    const companyId = req.user.companyId; // From JWT

    const useCase = new ListB2BOrdersUseCase(OrderRepo);
    const result = await useCase.execute({
      companyId, // Filter by company
      ...req.query,
    });

    res.render('b2b/orders/index', { orders: result.orders });
  }
}
```

---

## Summary

### Total Estimated Effort

| Phase                      | Duration     | Team Size | Effort         |
| -------------------------- | ------------ | --------- | -------------- |
| Phase 1: Auth Overhaul     | 2 weeks      | 2 devs    | 80 hours       |
| Phase 2: Missing Use Cases | 2 weeks      | 2 devs    | 80 hours       |
| Phase 3: Merchant Hub      | 2 weeks      | 2 devs    | 80 hours       |
| Phase 4: B2B Portal        | 2 weeks      | 2 devs    | 80 hours       |
| Phase 5: Admin Alignment   | 1 week       | 1 dev     | 40 hours       |
| Phase 6: Testing           | 1 week       | 2 devs    | 40 hours       |
| **TOTAL**                  | **10 weeks** | -         | **~400 hours** |

### Key Deliverables

1. ✅ Unified authentication system with RBAC
2. ✅ Complete set of use cases for all modules
3. ✅ Merchant self-service portal (`/merchant`)
4. ✅ B2B vendor portal (`/b2b`)
5. ✅ Updated admin portal with proper auth
6. ✅ Shared UI component library
7. ✅ Comprehensive test coverage

---

_Document generated: December 23, 2024_
_Author: Cascade AI Assistant_
