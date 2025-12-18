# Admin Hub Implementation Plan

## Overview

The Admin Hub (`/web/hub`) serves as the administrative interface for the CommerceFull e-commerce platform. It provides a web-based UI using AdminLTE v4 (via CDN) that **directly uses the use cases from `/modules`** - sharing the same business logic across REST APIs and Admin UI.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Admin Hub (web/hub)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Controller  │  │   Router     │  │   Views (EJS)         │  │
│  │  (Uses UseCases) │   (Routes)  │  │   + AdminLTE v4       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         │                                                        │
│         │  Direct import (no HTTP)                               │
│         ↓                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Module Use Cases (/modules/*/useCases)        │   │
│  │  (ListProducts, CreateOrder, GetCustomer, etc.)           │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │                                                        │
│         ↓                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Domain Repositories                            │   │
│  │  (ProductRepo, OrderRepo, CustomerRepo, etc.)              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Reusable Use Cases** - Same business logic for REST API and Admin Hub
2. **No HTTP Overhead** - Direct function calls, not API requests
3. **Clean Architecture** - Hub is just another interface to use cases
4. **Missing Use Cases** - Build them in modules, not in Hub

## Module Coverage Map

Based on analysis of `/modules`, here are all features requiring admin UI:

### Core Commerce (Phase 1 - Priority High)
| Module | API Prefix | Admin UI Sections |
|--------|------------|-------------------|
| **Product** | `/business/products` | Products List, Create/Edit Product, Categories, Attributes, Product Types, Bundles |
| **Order** | `/business/orders` | Orders List, Order Details, Status Management, Refunds |
| **Customer** | `/business/customers` | Customer List, Customer Details, Addresses, Customer Groups |
| **Inventory** | `/business/inventory` | Stock Levels, Locations, Adjustments, Reservations |
| **Analytics** | `/business/analytics` | Dashboard Widgets, Sales Reports, Product Performance |

### Pricing & Promotions (Phase 2)
| Module | API Prefix | Admin UI Sections |
|--------|------------|-------------------|
| **Promotion** | `/business/promotions` | Promotions, Coupons, Discounts, Gift Cards |
| **Pricing** | `/business/pricing` | Price Rules, Dynamic Pricing, Price Lists |
| **Tax** | `/business/tax` | Tax Rates, Tax Categories, Tax Zones |

### Payment & Shipping (Phase 3)
| Module | API Prefix | Admin UI Sections |
|--------|------------|-------------------|
| **Payment** | `/business/payments` | Payment Methods, Transactions, Gateway Config |
| **Shipping** | `/business/shipping` | Shipping Methods, Zones, Rates, Carriers |
| **Checkout** | `/business/checkout` | Checkout Settings, Payment Flow |

### Content & Marketing (Phase 4)
| Module | API Prefix | Admin UI Sections |
|--------|------------|-------------------|
| **Content** | `/business/content` | Pages, Templates, Blocks, Media Library |
| **Marketing** | `/business/marketing` | Campaigns, Email Templates, SEO Settings |
| **Notification** | `/business/notifications` | Notification Templates, Channels, History |

### Operations (Phase 5)
| Module | API Prefix | Admin UI Sections |
|--------|------------|-------------------|
| **Warehouse** | `/business/warehouses` | Warehouse Management, Fulfillment |
| **Distribution** | `/business/distribution` | Distribution Centers, Shipping |
| **Supplier** | `/business/suppliers` | Supplier Management, Purchase Orders |
| **Basket** | `/business/baskets` | Abandoned Carts, Cart Analytics |

### Customer Programs (Phase 6)
| Module | API Prefix | Admin UI Sections |
|--------|------------|-------------------|
| **Membership** | `/business/memberships` | Membership Tiers, Benefits, User Memberships |
| **Subscription** | `/business/subscriptions` | Subscription Plans, Active Subscriptions |
| **Loyalty** | `/business/loyalty` | Points Programs, Rewards, Redemptions |
| **B2B** | `/business/b2b` | Companies, Quotes, B2B Users |

### Compliance & Support (Phase 7)
| Module | API Prefix | Admin UI Sections |
|--------|------------|-------------------|
| **GDPR** | `/business/gdpr` | Data Requests, Consent Management |
| **Support** | `/business/support` | Support Tickets, FAQs, Chat |

### Platform Settings (Phase 8)
| Module | API Prefix | Admin UI Sections |
|--------|------------|-------------------|
| **Identity** | `/business/identity` | Admin Users, Roles, Permissions |
| **Merchant** | `/business/merchants` | Store Settings, Business Info |
| **Localization** | `/business/localization` | Languages, Currencies, Countries |

---

## Directory Structure

```
web/hub/
├── hubController.ts          # Main hub controller (renders pages)
├── hubRouters.ts             # Hub route definitions
├── controllers/              # Feature-specific controllers
│   ├── productController.ts
│   ├── orderController.ts
│   ├── customerController.ts
│   ├── inventoryController.ts
│   ├── promotionController.ts
│   ├── contentController.ts
│   ├── analyticsController.ts
│   ├── paymentController.ts
│   ├── shippingController.ts
│   ├── taxController.ts
│   ├── marketingController.ts
│   ├── membershipController.ts
│   ├── subscriptionController.ts
│   ├── loyaltyController.ts
│   ├── b2bController.ts
│   ├── gdprController.ts
│   ├── supportController.ts
│   ├── warehouseController.ts
│   ├── distributionController.ts
│   ├── supplierController.ts
│   ├── settingsController.ts
│   └── ...
├── services/                 # API client services
│   ├── apiClient.ts          # Base HTTP client for business APIs
│   ├── productService.ts
│   ├── orderService.ts
│   └── ...
├── views/
│   ├── layout.ejs            # Base AdminLTE layout
│   ├── dashboard.ejs         # Main dashboard
│   ├── login.ejs             # Admin login
│   ├── error.ejs             # Error pages
│   ├── profile.ejs           # Admin profile
│   ├── partials/
│   │   ├── navbar.ejs
│   │   ├── sidebar.ejs
│   │   ├── footer.ejs
│   │   ├── breadcrumb.ejs
│   │   ├── pagination.ejs
│   │   ├── alerts.ejs
│   │   └── modals/
│   │       ├── confirm-delete.ejs
│   │       └── ...
│   ├── products/
│   │   ├── index.ejs         # Products list
│   │   ├── create.ejs        # Create product
│   │   ├── edit.ejs          # Edit product
│   │   ├── view.ejs          # View product details
│   │   ├── categories/
│   │   │   ├── index.ejs
│   │   │   └── form.ejs
│   │   ├── attributes/
│   │   │   ├── index.ejs
│   │   │   └── form.ejs
│   │   ├── types/
│   │   │   ├── index.ejs
│   │   │   └── form.ejs
│   │   └── bundles/
│   │       ├── index.ejs
│   │       └── form.ejs
│   ├── orders/
│   │   ├── index.ejs         # Orders list
│   │   ├── view.ejs          # Order details
│   │   ├── refund.ejs        # Process refund
│   │   └── statuses.ejs      # Status history
│   ├── customers/
│   │   ├── index.ejs
│   │   ├── create.ejs
│   │   ├── edit.ejs
│   │   ├── view.ejs
│   │   ├── addresses.ejs
│   │   └── groups/
│   │       └── index.ejs
│   ├── inventory/
│   │   ├── index.ejs
│   │   ├── locations/
│   │   │   ├── index.ejs
│   │   │   └── form.ejs
│   │   ├── adjustments.ejs
│   │   └── reservations.ejs
│   ├── promotions/
│   │   ├── index.ejs
│   │   ├── form.ejs
│   │   ├── coupons/
│   │   │   ├── index.ejs
│   │   │   └── form.ejs
│   │   ├── discounts/
│   │   │   ├── index.ejs
│   │   │   └── form.ejs
│   │   └── gift-cards/
│   │       ├── index.ejs
│   │       └── form.ejs
│   ├── analytics/
│   │   ├── dashboard.ejs
│   │   ├── sales.ejs
│   │   ├── products.ejs
│   │   ├── customers.ejs
│   │   └── search.ejs
│   ├── content/
│   │   ├── pages/
│   │   ├── templates/
│   │   ├── blocks/
│   │   └── media/
│   ├── payments/
│   │   ├── methods/
│   │   ├── transactions/
│   │   └── gateways/
│   ├── shipping/
│   │   ├── methods/
│   │   ├── zones/
│   │   └── rates/
│   ├── tax/
│   │   ├── rates/
│   │   ├── categories/
│   │   └── zones/
│   ├── marketing/
│   │   ├── campaigns/
│   │   ├── emails/
│   │   └── seo/
│   ├── memberships/
│   │   ├── tiers/
│   │   ├── benefits/
│   │   └── users/
│   ├── subscriptions/
│   │   ├── plans/
│   │   └── active/
│   ├── loyalty/
│   │   ├── programs/
│   │   ├── rewards/
│   │   └── redemptions/
│   ├── b2b/
│   │   ├── companies/
│   │   ├── quotes/
│   │   └── users/
│   ├── gdpr/
│   │   ├── requests/
│   │   └── consent/
│   ├── support/
│   │   ├── tickets/
│   │   └── faqs/
│   ├── warehouses/
│   │   └── index.ejs
│   ├── suppliers/
│   │   └── index.ejs
│   └── settings/
│       ├── general.ejs
│       ├── users/
│       │   ├── index.ejs
│       │   └── form.ejs
│       ├── roles/
│       │   ├── index.ejs
│       │   └── form.ejs
│       ├── store.ejs
│       └── localization/
│           ├── languages.ejs
│           ├── currencies.ejs
│           └── countries.ejs
└── public/                   # Static assets (if needed)
    ├── js/
    │   ├── app.js            # Main admin JS
    │   ├── datatable-config.js
    │   └── chart-config.js
    └── css/
        └── custom.css        # Custom overrides
```

---

## Implementation Phases

### Phase 1: Core Commerce (Week 1-2)
**Goal:** Complete admin UI for essential e-commerce operations

#### 1.1 Infrastructure Setup
- [ ] Create base API client service (`services/apiClient.ts`)
- [ ] Set up authentication flow with session management
- [ ] Create reusable view components (pagination, alerts, modals)
- [ ] Update sidebar with proper navigation structure

#### 1.2 Products Module
- [ ] Product list page with DataTables (search, filter, sort)
- [ ] Create/Edit product form (basic info, pricing, images)
- [ ] Product categories management
- [ ] Product attributes management
- [ ] Product types configuration
- [ ] Product bundles management

**Routes:**
```
GET  /hub/products                → Product list
GET  /hub/products/create         → Create product form
GET  /hub/products/:id            → View product
GET  /hub/products/:id/edit       → Edit product form
POST /hub/products                → Submit new product
PUT  /hub/products/:id            → Update product
DELETE /hub/products/:id          → Delete product
GET  /hub/products/categories     → Categories list
GET  /hub/products/attributes     → Attributes list
GET  /hub/products/types          → Product types list
GET  /hub/products/bundles        → Bundles list
```

#### 1.3 Orders Module
- [ ] Orders list with filters (status, date, customer)
- [ ] Order detail view with items and timeline
- [ ] Order status update workflow
- [ ] Refund processing interface

**Routes:**
```
GET  /hub/orders                  → Orders list
GET  /hub/orders/:id              → Order details
POST /hub/orders/:id/status       → Update status
POST /hub/orders/:id/refund       → Process refund
POST /hub/orders/:id/cancel       → Cancel order
```

#### 1.4 Customers Module
- [ ] Customer list with search
- [ ] Customer profile view
- [ ] Create/Edit customer
- [ ] Customer addresses management

**Routes:**
```
GET  /hub/customers               → Customer list
GET  /hub/customers/create        → Create customer form
GET  /hub/customers/:id           → Customer details
GET  /hub/customers/:id/edit      → Edit customer
GET  /hub/customers/:id/addresses → Customer addresses
GET  /hub/customers/groups        → Customer groups
```

#### 1.5 Inventory Module
- [ ] Stock levels overview
- [ ] Inventory locations management
- [ ] Stock adjustment form
- [ ] Low stock alerts view

**Routes:**
```
GET  /hub/inventory               → Inventory overview
GET  /hub/inventory/locations     → Inventory locations
GET  /hub/inventory/low-stock     → Low stock items
POST /hub/inventory/adjust        → Adjust stock
```

#### 1.6 Dashboard Enhancement
- [ ] Real dashboard with actual data from APIs
- [ ] Orders widget (recent orders, pending count)
- [ ] Revenue widget (daily/weekly/monthly)
- [ ] Product widget (top sellers, low stock alerts)
- [ ] Customer widget (new registrations)

---

### Phase 2: Pricing & Promotions (Week 3)

#### 2.1 Promotions Module
- [ ] Promotions list and management
- [ ] Create/Edit promotion rules
- [ ] Coupon code management
- [ ] Discount rules configuration
- [ ] Gift cards management

**Routes:**
```
GET  /hub/promotions              → Promotions list
GET  /hub/promotions/create       → Create promotion
GET  /hub/promotions/:id/edit     → Edit promotion
GET  /hub/coupons                 → Coupons list
GET  /hub/coupons/create          → Create coupon
GET  /hub/discounts               → Discounts list
GET  /hub/gift-cards              → Gift cards list
```

#### 2.2 Pricing Module
- [ ] Price rules management
- [ ] Dynamic pricing configuration
- [ ] Price list management

#### 2.3 Tax Module
- [ ] Tax rates configuration
- [ ] Tax categories management
- [ ] Tax zones setup

**Routes:**
```
GET  /hub/tax/rates               → Tax rates
GET  /hub/tax/categories          → Tax categories
GET  /hub/tax/zones               → Tax zones
```

---

### Phase 3: Payment & Shipping (Week 4)

#### 3.1 Payment Module
- [ ] Payment methods configuration
- [ ] Transaction history view
- [ ] Payment gateway settings

**Routes:**
```
GET  /hub/payments/methods        → Payment methods
GET  /hub/payments/transactions   → Transactions
GET  /hub/payments/gateways       → Gateway config
```

#### 3.2 Shipping Module
- [ ] Shipping methods management
- [ ] Shipping zones configuration
- [ ] Shipping rates setup
- [ ] Carrier integrations

**Routes:**
```
GET  /hub/shipping/methods        → Shipping methods
GET  /hub/shipping/zones          → Shipping zones
GET  /hub/shipping/rates          → Shipping rates
```

---

### Phase 4: Content & Marketing (Week 5)

#### 4.1 Content Module
- [ ] Page management
- [ ] Content templates
- [ ] Content blocks/widgets
- [ ] Media library

**Routes:**
```
GET  /hub/content/pages           → Pages list
GET  /hub/content/templates       → Templates
GET  /hub/content/blocks          → Content blocks
GET  /hub/content/media           → Media library
```

#### 4.2 Marketing Module
- [ ] Campaign management
- [ ] Email template editor
- [ ] SEO settings

#### 4.3 Notification Module
- [ ] Notification templates
- [ ] Channel configuration
- [ ] Notification history

---

### Phase 5: Operations (Week 6)

#### 5.1 Warehouse Module
- [ ] Warehouse management
- [ ] Fulfillment tracking

#### 5.2 Distribution Module
- [ ] Distribution centers
- [ ] Shipping logistics

#### 5.3 Supplier Module
- [ ] Supplier management
- [ ] Purchase order creation

#### 5.4 Basket/Cart Module
- [ ] Abandoned cart recovery
- [ ] Cart analytics

---

### Phase 6: Customer Programs (Week 7)

#### 6.1 Membership Module
- [ ] Membership tiers
- [ ] Benefits configuration
- [ ] User membership management

#### 6.2 Subscription Module
- [ ] Subscription plans
- [ ] Active subscriptions view
- [ ] Billing management

#### 6.3 Loyalty Module
- [ ] Points programs
- [ ] Rewards catalog
- [ ] Redemption history

#### 6.4 B2B Module
- [ ] Company management
- [ ] Quote management
- [ ] B2B user administration

---

### Phase 7: Compliance & Support (Week 8)

#### 7.1 GDPR Module
- [ ] Data access requests
- [ ] Data deletion requests
- [ ] Consent management

#### 7.2 Support Module
- [ ] Support ticket system
- [ ] FAQ management

---

### Phase 8: Platform Settings (Week 9)

#### 8.1 Identity/Users Module
- [ ] Admin user management
- [ ] Roles and permissions
- [ ] Access control

#### 8.2 Merchant Settings
- [ ] Store configuration
- [ ] Business information

#### 8.3 Localization
- [ ] Language management
- [ ] Currency configuration
- [ ] Country/region settings

---

## Technical Implementation Details

### Use Case Pattern (Direct Import)

The Hub controllers import and use the same use cases that power the REST APIs:

```typescript
// controllers/productController.ts
import { Request, Response } from 'express';
import ProductRepo from '../../../modules/product/infrastructure/repositories/ProductRepository';
import { ListProductsCommand, ListProductsUseCase } from '../../../modules/product/application/useCases/ListProducts';
import { CreateProductCommand, CreateProductUseCase } from '../../../modules/product/application/useCases/CreateProduct';
import { GetProductCommand, GetProductUseCase } from '../../../modules/product/application/useCases/GetProduct';

/**
 * List products - uses the same ListProductsUseCase as the REST API
 */
export const listProducts = async (req: Request, res: Response) => {
  try {
    const { status, search, limit, offset } = req.query;

    const command = new ListProductsCommand(
      { status, search },
      parseInt(limit as string) || 50,
      parseInt(offset as string) || 0
    );

    const useCase = new ListProductsUseCase(ProductRepo);
    const result = await useCase.execute(command);

    res.render('hub/views/products/index', {
      pageName: 'Products',
      products: result.products,
      pagination: { total: result.total, limit: result.limit, offset: result.offset },
      user: req.user
    });
  } catch (error: any) {
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load products'
    });
  }
};

/**
 * Create product - uses the same CreateProductUseCase as the REST API
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const command = new CreateProductCommand(
      req.body.name,
      req.body.description,
      req.body.productTypeId,
      // ... other fields
    );

    const useCase = new CreateProductUseCase(ProductRepo);
    const product = await useCase.execute(command);

    res.redirect(`/hub/products/${product.productId}?success=Product created`);
  } catch (error: any) {
    res.render('hub/views/products/create', {
      pageName: 'Create Product',
      error: error.message,
      formData: req.body
    });
  }
};
```

### Benefits of Direct Use Case Usage

1. **No network latency** - Direct function calls
2. **Shared business logic** - Same validation, same rules
3. **Single source of truth** - Fix once, works everywhere
4. **Type safety** - Full TypeScript support
5. **Testability** - Mock repositories, not HTTP

### View Components

#### DataTable Integration
```ejs
<!-- Using AdminLTE DataTables plugin -->
<table id="products-table" class="table table-bordered table-striped">
  <thead>
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>SKU</th>
      <th>Price</th>
      <th>Stock</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <% products.forEach(product => { %>
    <tr>
      <td><%= product.id %></td>
      <td><%= product.name %></td>
      <td><%= product.sku %></td>
      <td>$<%= product.price.toFixed(2) %></td>
      <td><%= product.stock %></td>
      <td>
        <span class="badge badge-<%= product.status === 'active' ? 'success' : 'warning' %>">
          <%= product.status %>
        </span>
      </td>
      <td>
        <a href="/hub/products/<%= product.id %>" class="btn btn-sm btn-info">
          <i class="fas fa-eye"></i>
        </a>
        <a href="/hub/products/<%= product.id %>/edit" class="btn btn-sm btn-primary">
          <i class="fas fa-edit"></i>
        </a>
        <button class="btn btn-sm btn-danger" onclick="deleteProduct('<%= product.id %>')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
    <% }); %>
  </tbody>
</table>
```

---

## Sidebar Navigation Structure

```ejs
<!-- Updated sidebar.ejs structure -->
<nav class="mt-2">
  <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview">
    <!-- Dashboard -->
    <li class="nav-item">
      <a href="/hub" class="nav-link">
        <i class="nav-icon fas fa-tachometer-alt"></i>
        <p>Dashboard</p>
      </a>
    </li>

    <!-- Catalog -->
    <li class="nav-header">CATALOG</li>
    <li class="nav-item has-treeview">
      <a href="#" class="nav-link">
        <i class="nav-icon fas fa-shopping-bag"></i>
        <p>Products<i class="fas fa-angle-left right"></i></p>
      </a>
      <ul class="nav nav-treeview">
        <li class="nav-item"><a href="/hub/products" class="nav-link">All Products</a></li>
        <li class="nav-item"><a href="/hub/products/create" class="nav-link">Add Product</a></li>
        <li class="nav-item"><a href="/hub/products/categories" class="nav-link">Categories</a></li>
        <li class="nav-item"><a href="/hub/products/attributes" class="nav-link">Attributes</a></li>
        <li class="nav-item"><a href="/hub/products/bundles" class="nav-link">Bundles</a></li>
      </ul>
    </li>
    <li class="nav-item">
      <a href="/hub/inventory" class="nav-link">
        <i class="nav-icon fas fa-warehouse"></i>
        <p>Inventory</p>
      </a>
    </li>

    <!-- Sales -->
    <li class="nav-header">SALES</li>
    <li class="nav-item has-treeview">
      <a href="#" class="nav-link">
        <i class="nav-icon fas fa-shopping-cart"></i>
        <p>Orders<i class="fas fa-angle-left right"></i></p>
      </a>
      <ul class="nav nav-treeview">
        <li class="nav-item"><a href="/hub/orders" class="nav-link">All Orders</a></li>
        <li class="nav-item"><a href="/hub/orders?status=pending" class="nav-link">Pending</a></li>
        <li class="nav-item"><a href="/hub/orders?status=processing" class="nav-link">Processing</a></li>
      </ul>
    </li>
    <li class="nav-item">
      <a href="/hub/baskets" class="nav-link">
        <i class="nav-icon fas fa-cart-arrow-down"></i>
        <p>Abandoned Carts</p>
      </a>
    </li>

    <!-- Customers -->
    <li class="nav-header">CUSTOMERS</li>
    <li class="nav-item has-treeview">
      <a href="#" class="nav-link">
        <i class="nav-icon fas fa-users"></i>
        <p>Customers<i class="fas fa-angle-left right"></i></p>
      </a>
      <ul class="nav nav-treeview">
        <li class="nav-item"><a href="/hub/customers" class="nav-link">All Customers</a></li>
        <li class="nav-item"><a href="/hub/customers/groups" class="nav-link">Groups</a></li>
      </ul>
    </li>
    <li class="nav-item">
      <a href="/hub/b2b" class="nav-link">
        <i class="nav-icon fas fa-building"></i>
        <p>B2B Companies</p>
      </a>
    </li>

    <!-- Promotions -->
    <li class="nav-header">PROMOTIONS</li>
    <li class="nav-item"><a href="/hub/promotions" class="nav-link"><i class="nav-icon fas fa-percent"></i><p>Promotions</p></a></li>
    <li class="nav-item"><a href="/hub/coupons" class="nav-link"><i class="nav-icon fas fa-ticket-alt"></i><p>Coupons</p></a></li>
    <li class="nav-item"><a href="/hub/discounts" class="nav-link"><i class="nav-icon fas fa-tags"></i><p>Discounts</p></a></li>
    <li class="nav-item"><a href="/hub/gift-cards" class="nav-link"><i class="nav-icon fas fa-gift"></i><p>Gift Cards</p></a></li>

    <!-- Customer Programs -->
    <li class="nav-header">PROGRAMS</li>
    <li class="nav-item"><a href="/hub/memberships" class="nav-link"><i class="nav-icon fas fa-id-card"></i><p>Memberships</p></a></li>
    <li class="nav-item"><a href="/hub/subscriptions" class="nav-link"><i class="nav-icon fas fa-sync-alt"></i><p>Subscriptions</p></a></li>
    <li class="nav-item"><a href="/hub/loyalty" class="nav-link"><i class="nav-icon fas fa-star"></i><p>Loyalty</p></a></li>

    <!-- Content -->
    <li class="nav-header">CONTENT</li>
    <li class="nav-item has-treeview">
      <a href="#" class="nav-link">
        <i class="nav-icon fas fa-file-alt"></i>
        <p>Content<i class="fas fa-angle-left right"></i></p>
      </a>
      <ul class="nav nav-treeview">
        <li class="nav-item"><a href="/hub/content/pages" class="nav-link">Pages</a></li>
        <li class="nav-item"><a href="/hub/content/templates" class="nav-link">Templates</a></li>
        <li class="nav-item"><a href="/hub/content/media" class="nav-link">Media</a></li>
      </ul>
    </li>

    <!-- Marketing -->
    <li class="nav-header">MARKETING</li>
    <li class="nav-item"><a href="/hub/marketing/campaigns" class="nav-link"><i class="nav-icon fas fa-bullhorn"></i><p>Campaigns</p></a></li>
    <li class="nav-item"><a href="/hub/marketing/emails" class="nav-link"><i class="nav-icon fas fa-envelope"></i><p>Email Templates</p></a></li>
    <li class="nav-item"><a href="/hub/notifications" class="nav-link"><i class="nav-icon fas fa-bell"></i><p>Notifications</p></a></li>

    <!-- Analytics -->
    <li class="nav-header">ANALYTICS</li>
    <li class="nav-item has-treeview">
      <a href="#" class="nav-link">
        <i class="nav-icon fas fa-chart-line"></i>
        <p>Reports<i class="fas fa-angle-left right"></i></p>
      </a>
      <ul class="nav nav-treeview">
        <li class="nav-item"><a href="/hub/analytics/sales" class="nav-link">Sales</a></li>
        <li class="nav-item"><a href="/hub/analytics/products" class="nav-link">Products</a></li>
        <li class="nav-item"><a href="/hub/analytics/customers" class="nav-link">Customers</a></li>
        <li class="nav-item"><a href="/hub/analytics/search" class="nav-link">Search</a></li>
      </ul>
    </li>

    <!-- Configuration -->
    <li class="nav-header">CONFIGURATION</li>
    <li class="nav-item has-treeview">
      <a href="#" class="nav-link">
        <i class="nav-icon fas fa-cog"></i>
        <p>Settings<i class="fas fa-angle-left right"></i></p>
      </a>
      <ul class="nav nav-treeview">
        <li class="nav-item"><a href="/hub/settings/general" class="nav-link">General</a></li>
        <li class="nav-item"><a href="/hub/settings/store" class="nav-link">Store</a></li>
        <li class="nav-item"><a href="/hub/settings/users" class="nav-link">Users</a></li>
        <li class="nav-item"><a href="/hub/settings/roles" class="nav-link">Roles</a></li>
      </ul>
    </li>
    <li class="nav-item has-treeview">
      <a href="#" class="nav-link">
        <i class="nav-icon fas fa-credit-card"></i>
        <p>Payments<i class="fas fa-angle-left right"></i></p>
      </a>
      <ul class="nav nav-treeview">
        <li class="nav-item"><a href="/hub/payments/methods" class="nav-link">Methods</a></li>
        <li class="nav-item"><a href="/hub/payments/transactions" class="nav-link">Transactions</a></li>
        <li class="nav-item"><a href="/hub/payments/gateways" class="nav-link">Gateways</a></li>
      </ul>
    </li>
    <li class="nav-item has-treeview">
      <a href="#" class="nav-link">
        <i class="nav-icon fas fa-truck"></i>
        <p>Shipping<i class="fas fa-angle-left right"></i></p>
      </a>
      <ul class="nav nav-treeview">
        <li class="nav-item"><a href="/hub/shipping/methods" class="nav-link">Methods</a></li>
        <li class="nav-item"><a href="/hub/shipping/zones" class="nav-link">Zones</a></li>
        <li class="nav-item"><a href="/hub/shipping/rates" class="nav-link">Rates</a></li>
      </ul>
    </li>
    <li class="nav-item has-treeview">
      <a href="#" class="nav-link">
        <i class="nav-icon fas fa-receipt"></i>
        <p>Tax<i class="fas fa-angle-left right"></i></p>
      </a>
      <ul class="nav nav-treeview">
        <li class="nav-item"><a href="/hub/tax/rates" class="nav-link">Rates</a></li>
        <li class="nav-item"><a href="/hub/tax/categories" class="nav-link">Categories</a></li>
        <li class="nav-item"><a href="/hub/tax/zones" class="nav-link">Zones</a></li>
      </ul>
    </li>
    <li class="nav-item"><a href="/hub/localization" class="nav-link"><i class="nav-icon fas fa-globe"></i><p>Localization</p></a></li>

    <!-- Operations -->
    <li class="nav-header">OPERATIONS</li>
    <li class="nav-item"><a href="/hub/warehouses" class="nav-link"><i class="nav-icon fas fa-warehouse"></i><p>Warehouses</p></a></li>
    <li class="nav-item"><a href="/hub/suppliers" class="nav-link"><i class="nav-icon fas fa-truck-loading"></i><p>Suppliers</p></a></li>
    <li class="nav-item"><a href="/hub/distribution" class="nav-link"><i class="nav-icon fas fa-shipping-fast"></i><p>Distribution</p></a></li>

    <!-- Support -->
    <li class="nav-header">SUPPORT</li>
    <li class="nav-item"><a href="/hub/support/tickets" class="nav-link"><i class="nav-icon fas fa-ticket-alt"></i><p>Tickets</p></a></li>
    <li class="nav-item"><a href="/hub/gdpr" class="nav-link"><i class="nav-icon fas fa-shield-alt"></i><p>GDPR</p></a></li>

  </ul>
</nav>
```

---

## Getting Started

### Prerequisites
- AdminLTE v4 loaded via CDN (already configured in layout.ejs)
- Business APIs functional at `/business/*` endpoints
- Merchant authentication working

### Quick Start for Phase 1
1. Create `services/apiClient.ts` for API communication
2. Create `controllers/productController.ts` with product CRUD
3. Create `views/products/` views for product management
4. Update `hubRouters.ts` to include product routes
5. Update sidebar navigation with working links

### Testing
```bash
# Start the dev server
yarn dev

# Access Admin Hub
http://localhost:10000/hub

# Test login
http://localhost:10000/hub/login
```

---

## Summary

This plan provides a structured approach to building a complete admin UI that:

1. **Covers all 27 modules** in the platform
2. **Uses AdminLTE v4** for consistent, professional UI
3. **Leverages existing business APIs** - no duplicate logic
4. **Follows phased implementation** - delivers value incrementally
5. **Maintains clean architecture** - separation of concerns

Total estimated timeline: **9 weeks** for full implementation

Priority for immediate implementation:
1. **Products** - Core catalog management
2. **Orders** - Sales processing
3. **Customers** - Customer management
4. **Inventory** - Stock control
5. **Dashboard** - Real-time overview

This plan ensures the Admin Hub becomes the fully functional management interface for the CommerceFull platform.
