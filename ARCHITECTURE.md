# CommerceFull Architecture Guide

This document provides a deep-dive into the CommerceFull platform architecture for contributors and developers.

## Table of Contents

- [Overview](#overview)
- [Layered Architecture](#layered-architecture)
- [Domain-Driven Design](#domain-driven-design)
- [Module Structure](#module-structure)
- [Web Layer](#web-layer)
- [Database Layer](#database-layer)
- [Authentication & Authorization](#authentication--authorization)
- [Event System](#event-system)
- [API Response Patterns](#api-response-patterns)
- [Route Mounting](#route-mounting)
- [Shared Libraries](#shared-libraries)
- [Error Handling](#error-handling)
- [Internationalization](#internationalization)
- [Import Style](#import-style)

---

## Overview

CommerceFull is a multi-tenant e-commerce platform organized into **36 bounded contexts** (modules), each following Domain-Driven Design principles. The platform serves four distinct user portals through a single Express application.

```
                    ┌─────────────────────────┐
                    │      Express App         │
                    │    (boot/routes.ts)       │
                    └────────┬────────────────┘
                             │
         ┌───────────┬───────┼───────┬──────────┐
         │           │       │       │          │
    ┌────▼───┐ ┌─────▼──┐ ┌─▼──┐ ┌──▼────┐ ┌───▼────┐
    │ Admin  │ │Merchant│ │B2B │ │Store- │ │  API   │
    │/admin  │ │/merchant│ │/b2b│ │front /│ │/customer│
    └────────┘ └────────┘ └────┘ └───────┘ │/business│
                                            └────────┘
```

---

## Layered Architecture

Each request flows through these layers:

```
HTTP Request
    │
    ▼
┌──────────────────────────┐
│  Interface Layer          │  Express routers & controllers
│  (interface/)             │  Input validation, HTTP concerns
├──────────────────────────┤
│  Application Layer        │  Use cases, orchestration
│  (application/)           │  Transaction boundaries
├──────────────────────────┤
│  Domain Layer             │  Business rules, entities
│  (domain/)                │  Pure logic, no I/O
├──────────────────────────┤
│  Infrastructure Layer     │  Database, external services
│  (infrastructure/)        │  SQL queries, API calls
└──────────────────────────┘
```

### Layer Rules

| Layer | Can Depend On | Cannot Depend On |
|-------|--------------|-----------------|
| **Domain** | Nothing (pure) | Application, Infrastructure, Interface |
| **Application** | Domain | Infrastructure (via interfaces), Interface |
| **Infrastructure** | Domain (implements interfaces) | Application, Interface |
| **Interface** | Application, Domain | Infrastructure (directly) |

---

## Domain-Driven Design

### Entities

Entities have identity and lifecycle. They are the core building blocks.

```typescript
// modules/product/domain/entities/Product.ts
export class Product {
  constructor(
    public readonly productId: string,
    public name: string,
    public sku: string,
    public status: ProductStatus,
    public basePrice: number,
    // ...
  ) {}

  publish(): void {
    if (this.status === ProductStatus.DRAFT) {
      this.status = ProductStatus.ACTIVE;
    }
  }

  isAvailable(): boolean {
    return this.status === ProductStatus.ACTIVE;
  }
}
```

### Value Objects

Immutable objects defined by their attributes, not identity.

```typescript
// modules/product/domain/valueObjects/Price.ts
export class Price {
  constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {
    if (amount < 0) throw new Error('Price cannot be negative');
  }

  add(other: Price): Price {
    if (this.currency !== other.currency) throw new Error('Currency mismatch');
    return new Price(this.amount + other.amount, this.currency);
  }
}
```

### Repository Interfaces

Domain defines the contract; infrastructure implements it.

```typescript
// modules/product/domain/repositories/ProductRepository.ts
export interface IProductRepository {
  findById(productId: string): Promise<Product | null>;
  findAll(filters: ProductFilters): Promise<Product[]>;
  save(product: Product): Promise<Product>;
  delete(productId: string): Promise<void>;
}
```

### Use Cases

Application layer orchestrates domain operations.

```typescript
// modules/product/application/useCases/CreateProduct.ts
export class CreateProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(command: CreateProductCommand): Promise<Product> {
    const product = new Product(
      uuid(),
      command.name,
      command.sku,
      ProductStatus.DRAFT,
      command.basePrice,
    );
    return this.productRepo.save(product);
  }
}
```

### Domain Events

Events signal that something important happened in the domain.

```typescript
// modules/product/domain/events/ProductCreated.ts
export class ProductCreatedEvent {
  constructor(
    public readonly productId: string,
    public readonly name: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
```

---

## Module Structure

### Full DDD Module (Reference: `product`)

```
modules/product/
├── application/
│   ├── services/              # Application services
│   └── useCases/
│       ├── CreateProduct.ts
│       ├── GetProduct.ts
│       ├── ListProducts.ts
│       ├── UpdateProduct.ts
│       └── SearchProducts.ts
├── domain/
│   ├── entities/
│   │   ├── Product.ts         # Aggregate root
│   │   ├── ProductVariant.ts
│   │   └── ProductCategory.ts
│   ├── events/
│   │   └── ProductCreated.ts
│   ├── repositories/
│   │   └── ProductRepository.ts  # Interface
│   └── valueObjects/
│       ├── Price.ts
│       ├── Dimensions.ts
│       └── ProductStatus.ts
├── infrastructure/
│   └── repositories/
│       └── ProductRepository.ts  # SQL implementation
├── interface/
│   ├── controllers/
│   │   ├── ProductBusinessController.ts
│   │   └── ProductCustomerController.ts
│   └── routers/
│       ├── productBusinessRouter.ts
│       └── productCustomerRouter.ts
└── utils/
    └── ensureMasterVariants.ts
```

### Legacy Module (pre-DDD)

Some modules use a simpler flat structure:

```
modules/shipping/
├── repos/
│   └── shippingRepo.ts        # Direct SQL repository
├── interface/
│   ├── controllers/
│   │   └── shippingController.ts
│   └── routers/
│       └── shippingRouter.ts
└── services/
    └── shippingService.ts
```

### All 36 Modules

| Category | Modules |
|----------|---------|
| **Catalog** | `product`, `assortment`, `brand`, `pricing` |
| **Sales** | `order`, `basket`, `checkout`, `payment` |
| **Fulfillment** | `fulfillment`, `shipping`, `inventory`, `warehouse` |
| **Marketing** | `promotion`, `coupon`, `segment` |
| **Customer** | `customer`, `loyalty`, `membership`, `subscription` |
| **Content** | `content`, `media`, `notification` |
| **B2B** | `b2b`, `merchant`, `supplier` |
| **Platform** | `identity`, `configuration`, `localization`, `channel`, `store`, `organization`, `analytics`, `gdpr`, `support`, `tax`, `business` |

---

## Web Layer

The web layer is separate from the module business logic. It handles view rendering via EJS templates.

### Portal Architecture

```
web/
├── admin/                     # Tabler UI (Bootstrap-based)
│   ├── controllers/           #   41 controllers
│   ├── views/                 #   ~120 EJS templates
│   └── adminRouters.ts        #   All admin routes
├── merchant/                  # Tabler UI
│   ├── controllers/           #   8 controllers
│   ├── views/                 #   ~22 EJS templates
│   └── merchantRouters.ts
├── b2b/                       # Tabler UI
│   ├── controllers/           #   8 controllers
│   ├── views/                 #   ~22 EJS templates
│   └── b2bRouters.ts
├── storefront/                # Tailwind CSS
│   ├── controllers/           #   16 controllers
│   ├── views/                 #   ~44 EJS templates
│   └── storefrontRouter.ts
└── respond.ts                 # View rendering helpers
```

### View Rendering

Each portal has a respond helper that wraps `res.render()` with the correct layout:

```typescript
// web/respond.ts
export function adminRespond(req, res, view, data) {
  res.render(`admin/views/${view}`, {
    layout: 'admin/views/layout',
    ...data,
  });
}
```

### Admin Views (Tabler Pattern)

```html
<div class="page-header d-print-none">
  <div class="row g-2 align-items-center">
    <div class="col"><h2 class="page-title"><%= pageName %></h2></div>
  </div>
</div>
<section class="content">
  <div class="container-fluid">
    <%- include("../partials/alerts") %>
    <!-- Content -->
  </div>
</section>
```

### Storefront Views (Tailwind Pattern)

```html
<%- include("../partials/header") %>
<main class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    <!-- Content -->
  </div>
</main>
<%- include("../partials/footer") %>
```

---

## Database Layer

### Connection

CommerceFull uses the `pg` driver directly (not an ORM):

```typescript
// libs/db/client.ts — Single connection
import { query, queryOne } from '../../libs/db';

// libs/db/pool.ts — Connection pool
import { query, queryOne } from '../../libs/db/pool';
```

### Naming Convention

- **Database columns:** camelCase with PostgreSQL double-quoting
- **TypeScript properties:** camelCase (matching column names)
- **Table names:** camelCase with double-quoting

```sql
SELECT "productId", "name", "basePrice", "createdAt"
FROM "product"
WHERE "categoryId" = $1 AND "deletedAt" IS NULL
ORDER BY "createdAt" DESC
LIMIT $2 OFFSET $3
```

### Migrations

Migrations use Knex and are located in `migrations/`:

```bash
yarn db:migrate:new create_product_table
yarn db:migrate
yarn db:rollback
```

### Soft Deletes

Most tables use soft deletes via a `deletedAt` column:

```sql
-- "Delete" a record
UPDATE "product" SET "deletedAt" = NOW() WHERE "productId" = $1

-- Query only active records
SELECT * FROM "product" WHERE "deletedAt" IS NULL
```

---

## Authentication & Authorization

### Session-Based (Web Portals)

Web portals use session-based authentication with cookies:

```typescript
import { isAdminLoggedIn, isMerchantLoggedIn, isB2BLoggedIn } from '../../libs/auth';

// Applied as middleware
router.use(isAdminLoggedIn);
```

### Token-Based (API)

API routes use JWT tokens:

```typescript
import { isCustomerLoggedIn } from '../../libs/auth';

// Applied per-route or per-router
router.get('/profile', isCustomerLoggedIn, getProfile);
```

### Auth Middleware

| Middleware | Portal | Method |
|-----------|--------|--------|
| `isAdminLoggedIn` | Admin | Session |
| `isMerchantLoggedIn` | Merchant | Session |
| `isB2BLoggedIn` | B2B | Session |
| `isCustomerLoggedIn` | Storefront/API | Session + JWT |

---

## Event System

Domain events are dispatched via the event system in `libs/events/`:

```typescript
import { emitEvent } from '../../../libs/events';

// Emit an event
emitEvent('order.created', { orderId, customerId, total });

// Register a handler (in libs/events/registerEventHandlers.ts)
registerHandler('order.created', async (data) => {
  await sendOrderConfirmationEmail(data);
  await updateInventory(data);
});
```

---

## API Response Patterns

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error description",
  "message": "Human-readable message"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Route Mounting

Routes are configured in `boot/routes.ts`:

| Prefix | Purpose | Auth |
|--------|---------|------|
| `/` | Storefront (public) | None / `isCustomerLoggedIn` |
| `/admin` | Admin panel | `isAdminLoggedIn` |
| `/merchant` | Merchant dashboard | `isMerchantLoggedIn` |
| `/b2b` | B2B portal | `isB2BLoggedIn` |
| `/customer` | Customer API | `isCustomerLoggedIn` (where needed) |
| `/business` | Merchant API | `isMerchantLoggedIn` |
| `/health` | Health check | None |

---

## Shared Libraries

Located in `libs/`:

| Library | Purpose |
|---------|---------|
| `libs/db` | Database client and pool with query helpers |
| `libs/auth` | Authentication middleware and JWT utilities |
| `libs/events` | Domain event emitter and handler registration |
| `libs/logger` | Winston logger with daily rotation |
| `libs/session` | Session management (Redis or PostgreSQL) |
| `libs/types` | Shared TypeScript types (`TypedRequest`, etc.) |
| `libs/validation` | Input validation helpers |
| `libs/api` | API response helpers (`successResponse`, `errorResponse`) |

---

## Error Handling

### Controller Pattern

```typescript
export const getProduct = async (req: TypedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const product = await productRepo.findById(productId);

    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }

    successResponse(res, product);
  } catch (error: any) {
    logger.error('Error fetching product:', error);
    errorResponse(res, 'Failed to fetch product');
  }
};
```

### Error Cause Chaining

When re-throwing errors, always include the original cause:

```typescript
try {
  await riskyOperation();
} catch (error) {
  throw new Error('Operation failed', { cause: error });
}
```

---

## Internationalization

CommerceFull uses **i18next** with a filesystem backend:

```
locales/
├── en/
│   ├── common.json
│   ├── product.json
│   └── checkout.json
├── de/
│   └── ...
└── fr/
    └── ...
```

Usage in controllers:

```typescript
const message = req.t('checkout.payment_failed');
```

Usage in EJS views:

```html
<h1><%= t('common.welcome') %></h1>
```

---

## Import Style

All TypeScript files in this project must follow these rules:

- **Use ES module `import` syntax exclusively** — `require()` is never allowed in `.ts` files.
- **All imports must appear at the top of the file**, before any other code (no inline or conditional imports).

```typescript
// ✅ CORRECT — top-level ES imports
import { query, queryOne } from '../../libs/db';
import { logger } from '../../libs/logger';
import { successResponse, errorResponse } from '../../libs/apiResponse';

export const myHandler = async (req, res) => { ... };

// ❌ WRONG — require() anywhere
const { query } = require('../../libs/db');

// ❌ WRONG — import inside a function body
export const myHandler = async (req, res) => {
  const { query } = await import('../../libs/db'); // not allowed
};
```

> Note: Migration and seed files are plain JavaScript (`.js`) and use `exports.up` / `exports.seed` — `require()` is acceptable only in those `.js` files.

---

## Further Reading

- [AGENTS.md](./AGENTS.md) — AI coding agent guidelines (comprehensive coding standards, including import rules)
- [CONTRIBUTING.md](./CONTRIBUTING.md) — How to contribute
- [README.md](./README.md) — Project overview and quick start
