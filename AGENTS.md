# AGENTS.md - AI Coding Agent Guidelines

> **This document provides context and instructions for AI coding agents working on the CommerceFull platform.**

## Table of Contents

1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Architecture Standards](#architecture-standards)
4. [Module Structure (DDD)](#module-structure-ddd)
5. [Web Layer (UI)](#web-layer-ui)
6. [Database Standards](#database-standards)
7. [Seed Data Standards](#seed-data-standards)
8. [Internationalization (i18n)](#internationalization-i18n)
9. [Shared Libraries](#shared-libraries)
10. [Infrastructure & Deployment](#infrastructure--deployment)
11. [API Response Patterns](#api-response-patterns)
12. [Authentication & Authorization](#authentication--authorization)
13. [Event System](#event-system)
14. [Testing Standards](#testing-standards)
15. [Code Style & Formatting](#code-style--formatting)
16. [Security Standards](#security-standards)
17. [Common Patterns & Examples](#common-patterns--examples)
18. [Do's and Don'ts](#dos-and-donts)

---

## Project Overview

CommerceFull is a multi-tenant e-commerce platform built with:

- **Backend**: Node.js + Express 5 + TypeScript
- **Database**: PostgreSQL 18 with Knex migrations and plain SQL queries (via `pg` driver)
- **Frontend**: EJS templates + Tailwind CSS (storefront) + Tabler (admin)
- **Testing**: Jest (unit/integration) + Cypress (E2E)
- **Payments**: Stripe
- **Email**: Mailjet / Nodemailer
- **Cache**: Redis (optional, falls back to PostgreSQL for sessions)
- **Logging**: Winston with daily rotate
- **i18n**: i18next with filesystem backend

### Mission

Creating tailor-made commerce solutions — empowering businesses to thrive in the digital marketplace through simple, innovative, and user-centric solutions.

### Key Capabilities

- Multi-tenant marketplace with merchant, B2B, and direct-to-consumer models
- Admin panel, merchant dashboard, B2B portal, and customer storefront
- 36 business modules covering the full commerce lifecycle
- Domain-Driven Design with use cases, aggregates, and domain events
- Master variant product architecture
- Multi-currency, multi-locale support

---

## Getting Started

```bash
yarn install                # Install dependencies
cp .env.example .env        # Configure environment
yarn db                     # Start PostgreSQL via Docker
yarn db:migrate             # Run database migrations
yarn job:new:admin          # Create initial admin user
yarn db:seed                # Seed sample data (optional)
yarn dev                    # Start development server (nodemon)
```

### Common Commands

```bash
# Development
yarn dev                    # Start dev server with hot reload
yarn prd:build              # Build for production (esbuild)
yarn prd                    # Build + run production

# Database
yarn db                     # Start PostgreSQL Docker container
yarn db:stop                # Stop PostgreSQL Docker container
yarn db:migrate             # Run all pending migrations
yarn db:migrate:new <name>  # Create a new migration file
yarn db:rollback            # Rollback last migration batch
yarn db:rollback:all        # Rollback all migrations
yarn db:seed                # Run all seed files
yarn db:types               # Generate Knex types from DB schema

# Testing
yarn test                   # Full Jest suite with coverage
yarn test:unit              # Unit tests (features/ directory)
yarn test:int               # Integration tests (tests/integration/)
yarn test:e2e               # Cypress E2E suite

# Code Quality
yarn lint                   # TypeScript check + ESLint
yarn lint:errors            # ESLint errors only (no warnings)
yarn lint:fix               # ESLint with auto-fix
yarn format                 # Prettier format all files
yarn format:check           # Check formatting without writing
yarn code:lint              # Knip (dead code detection)
yarn sec:audit              # Security audit
yarn sec:check              # Security audit (high severity only)

# CSS
yarn css:build              # Build Tailwind CSS (minified)
yarn css:watch              # Watch mode for Tailwind CSS

# Jobs
yarn job:new:admin          # Create a new admin user
yarn job:new:merchant       # Create a new merchant
yarn job:new:business       # Create a new business
```

### Access Points

- **Admin Panel**: http://localhost:3000/admin
- **Merchant Dashboard**: http://localhost:3000/merchant
- **B2B Portal**: http://localhost:3000/b2b
- **Storefront**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

---

## Architecture Standards

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     web/ (UI Layer)                       │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐  │
│  │  admin/   │ │merchant/ │ │  b2b/  │ │ storefront/  │  │
│  │ (Tabler)  │ │ (Tabler) │ │(Tabler)│ │ (Tailwind)   │  │
│  └──────────┘ └──────────┘ └────────┘ └──────────────┘  │
├──────────────────────────────────────────────────────────┤
│                  modules/ (Business Logic)                │
│  36 bounded contexts with DDD structure                  │
│  Each module: domain → application → infrastructure →    │
│               interface (controllers + routers)          │
├──────────────────────────────────────────────────────────┤
│                    libs/ (Shared)                         │
│  db, auth, events, logger, validation, form helpers      │
├──────────────────────────────────────────────────────────┤
│                 infra/ (Deployment)                       │
│  Docker, Ansible, Terraform (AWS/GCP/Azure)              │
└──────────────────────────────────────────────────────────┘
```

### Route Mounting

Routes are configured in `boot/routes.ts`:

| Prefix       | Purpose                        | Auth Middleware        |
| ------------ | ------------------------------ | ---------------------- |
| `/`          | Storefront (public website)    | None / `isCustomerLoggedIn` for protected pages |
| `/admin`     | Admin panel (EJS views)        | `isAdminLoggedIn`      |
| `/merchant`  | Merchant dashboard (EJS views) | `isMerchantLoggedIn`   |
| `/b2b`       | B2B portal (EJS views)         | `isB2BLoggedIn`        |
| `/customer`  | Customer-facing API routes     | `isCustomerLoggedIn` (where needed) |
| `/business`  | Business/Merchant API routes   | `isMerchantLoggedIn`   |
| `/health`    | Health check endpoint          | None                   |

### Layer Responsibilities

| Layer              | Purpose                                     | Location                                  |
| ------------------ | ------------------------------------------- | ----------------------------------------- |
| **Domain**         | Core business logic, aggregates, invariants | `modules/[mod]/domain/`                   |
| **Application**    | Orchestrate domain operations (use cases)   | `modules/[mod]/application/`              |
| **Infrastructure** | Data persistence, external adapters         | `modules/[mod]/infrastructure/`           |
| **Interface**      | HTTP controllers and routers                | `modules/[mod]/interface/`                |
| **Repos (legacy)** | Direct SQL repositories (pre-DDD modules)   | `modules/[mod]/repos/`                    |
| **Web**            | EJS views and web controllers               | `web/[portal]/`                           |

---

## Module Structure (DDD)

### All 36 Modules

```
modules/
├── analytics/          # Sales, product, customer analytics
├── assortment/         # Product assortment management
├── b2b/                # B2B companies, quotes, credit
├── basket/             # Shopping cart management
├── brand/              # Brand management
├── business/           # Business entity management
├── channel/            # Sales channel management
├── checkout/           # Checkout session & flow
├── configuration/      # System configuration
├── content/            # CMS pages, blocks, templates
├── coupon/             # Coupon management
├── customer/           # Customer profiles & groups
├── fulfillment/        # Order fulfillment
├── gdpr/               # GDPR compliance & data requests
├── identity/           # Authentication & authorization (IAM)
├── inventory/          # Stock levels, reservations, lots
├── localization/       # Countries, currencies, locales
├── loyalty/            # Loyalty programs, points, tiers
├── media/              # Media/file management
├── membership/         # Membership plans & subscriptions
├── merchant/           # Merchant management
├── notification/       # Notifications, templates, devices
├── order/              # Order lifecycle management
├── organization/       # Organization hierarchy
├── payment/            # Payment processing (Stripe)
├── pricing/            # Pricing rules, price lists
├── product/            # Product catalog (DDD reference)
├── promotion/          # Promotions, discounts, gift cards
├── segment/            # Customer segmentation
├── shipping/           # Shipping methods & rates
├── store/              # Store management
├── subscription/       # Recurring subscriptions
├── supplier/           # Supplier & purchase orders
├── support/            # Support tickets & FAQ
├── tax/                # Tax calculation & rules
└── warehouse/          # Warehouse & distribution
```

### DDD Module Structure (Reference: `product`)

Modules that have been aligned to DDD follow this structure:

```
modules/[module-name]/
├── application/
│   ├── services/              # Application services
│   └── useCases/              # Use case classes
│       ├── CreateProduct.ts
│       ├── GetProduct.ts
│       ├── ListProducts.ts
│       ├── UpdateProduct.ts
│       └── index.ts
├── domain/
│   ├── entities/              # Aggregate roots & entities
│   │   ├── Product.ts         # Aggregate root
│   │   ├── ProductVariant.ts
│   │   └── ProductCategory.ts
│   ├── events/                # Domain events
│   ├── repositories/          # Repository interfaces (contracts)
│   │   └── ProductRepository.ts
│   └── valueObjects/          # Value objects
│       ├── Price.ts
│       ├── Dimensions.ts
│       ├── ProductStatus.ts
│       └── ProductVisibility.ts
├── infrastructure/
│   └── repositories/          # Repository implementations (SQL)
│       └── ProductRepository.ts
├── interface/
│   ├── controllers/           # HTTP controllers
│   │   ├── ProductBusinessController.ts
│   │   └── ProductCustomerController.ts
│   ├── routers/               # Express routers
│   │   ├── productBusinessRouter.ts
│   │   └── productCustomerRouter.ts
│   └── jobs/                  # Background jobs (optional)
├── repos/                     # Legacy direct SQL repos (pre-DDD)
└── utils/                     # Module-specific utilities
```

### Legacy Module Structure

Modules not yet aligned to DDD use a simpler flat structure:

```
modules/[module-name]/
├── [module]CustomerRouter.ts      # Customer-facing routes
├── [module]BusinessRouter.ts      # Business/admin routes
├── [module]CustomerController.ts  # Customer controller
├── [module]BusinessController.ts  # Business controller
└── repos/
    └── [module]Repo.ts            # Direct SQL repository
```

### Use Case Pattern

```typescript
export class ListProductsCommand {
  constructor(
    public readonly filters?: { status?: string; search?: string },
    public readonly limit: number = 20,
    public readonly offset: number = 0,
    public readonly orderBy: string = 'createdAt',
    public readonly orderDirection: 'asc' | 'desc' = 'desc',
  ) {}
}

export interface ListProductsResponse {
  products: ProductListItemResponse[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(command: ListProductsCommand): Promise<ListProductsResponse> {
    // 1. Build filters from command
    // 2. Call repository
    // 3. Map domain entities to response DTOs
    // 4. Return response
  }
}
```

### Domain Entity Pattern (Aggregate Root)

```typescript
export class Product {
  private props: ProductProps;

  private constructor(props: ProductProps) {
    this.props = props;
  }

  // Factory method for new entities
  static create(props: CreateProductProps): Product {
    // Validate invariants
    // Set defaults
    return new Product({ ...props, status: ProductStatus.DRAFT });
  }

  // Factory method for reconstituting from persistence
  static reconstitute(props: ProductProps): Product {
    return new Product(props);
  }

  // Domain methods that enforce business rules
  publish(): void {
    if (this.props.status !== ProductStatus.ACTIVE) {
      throw new Error('Product must be active to publish');
    }
    this.props.publishedAt = new Date();
    this.props.visibility = ProductVisibility.VISIBLE;
    this.touch();
  }

  // Getters (no setters — mutations go through domain methods)
  get productId(): string { return this.props.productId; }
  get name(): string { return this.props.name; }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
```

### Master Variant Architecture

Every product must have a master variant:

1. Every product automatically has a master variant created with it
2. The master variant contains the default configuration (price, inventory)
3. The master variant is marked with `isDefault: true`
4. The master variant cannot be removed
5. When adding items to the basket without a specific variant, the master variant is used

---

## Web Layer (UI)

### Structure

```
web/
├── admin/                     # Admin panel
│   ├── adminRouters.ts        # All admin routes (single file)
│   ├── controllers/           # 41 feature controllers
│   │   ├── adminController.ts # Dashboard, login, profile
│   │   ├── productController.ts
│   │   ├── orderController.ts
│   │   └── ...
│   └── views/                 # EJS templates
│       ├── layout.ejs         # Main layout wrapper
│       ├── layout-public.ejs  # Public pages (login)
│       ├── dashboard.ejs
│       ├── login.ejs
│       ├── partials/          # Shared partials (navbar, sidebar)
│       ├── products/          # Product views
│       ├── orders/            # Order views
│       └── ...
├── merchant/                  # Merchant dashboard
│   ├── merchantRouters.ts
│   ├── controllers/
│   └── views/
├── b2b/                       # B2B portal
│   ├── b2bRouters.ts
│   ├── controllers/
│   └── views/
├── storefront/                # Customer-facing store
│   ├── storefrontRouter.ts
│   ├── controllers/
│   └── views/
└── respond.ts                 # Response helpers for all portals
```

### Web Controller Pattern

Web controllers import use cases directly from modules (no HTTP overhead):

```typescript
import { ListProductsUseCase } from '../../../modules/product/application/useCases/ListProducts';
import ProductRepo from '../../../modules/product/infrastructure/repositories/ProductRepository';
import { adminRespond } from '../../respond';

export const listProducts = async (req: Request, res: Response) => {
  const useCase = new ListProductsUseCase(ProductRepo);
  const result = await useCase.execute(command);
  adminRespond(req, res, 'products/index', { products: result.products });
};
```

### Response Helpers (`web/respond.ts`)

| Helper              | Portal     | Layout                |
| ------------------- | ---------- | --------------------- |
| `adminRespond`      | Admin      | `admin/views/layout`  |
| `merchantRespond`   | Merchant   | `merchant/views/layout` |
| `b2bRespond`        | B2B        | `b2b/views/layout`    |
| `storefrontRespond` | Storefront | Direct render         |

### EJS Template Conventions

- Views are relative to `web/` directory
- Layouts wrap content via `body` variable
- Flash messages available as `successMsg` and `errorMsg`
- User data available as `user` and `session`
- i18n available via `t('key')` function

---

## Database Standards

### Connection

- **Driver**: `pg` (node-postgres) with connection pooling
- **Pool**: Max 20 connections, 30s idle timeout, 2s connection timeout
- **Migrations**: Knex (migration files in `migrations/`)
- **Queries**: Raw SQL via `libs/db` helpers (`query<T>()` and `queryOne<T>()`)
- **No ORM**: Direct SQL with parameterized queries

### Column Naming Convention

**All database columns use camelCase.** PostgreSQL requires double quotes around camelCase identifiers.

```sql
-- ✅ CORRECT
SELECT "productId", "createdAt", "orderNumber" FROM "product" WHERE "deletedAt" IS NULL

-- ❌ WRONG (snake_case)
SELECT product_id, created_at FROM product
```

### Primary Keys

- **Always use UUIDv7** for chronological ordering
- **Naming**: Table name (camelCase) + `Id` suffix

```javascript
t.uuid('productId').primary().defaultTo(knex.raw('uuidv7()'));
t.uuid('customerId').primary().defaultTo(knex.raw('uuidv7()'));
```

### Migration File Format

- **Filename**: `YYYYMMDDHHMMSS_createTableName.js` (JavaScript, not TypeScript)
- **Table names**: camelCase (e.g., `product`, `productVariant`, `orderItem`)
- **Column names**: camelCase (e.g., `createdAt`, `productId`, `isActive`)

```javascript
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('product', t => {
    t.uuid('productId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 255).notNullable();
    t.string('slug', 255).notNullable().unique();
    t.text('description');
    t.decimal('price', 15, 2).notNullable();
    t.boolean('isActive').notNullable().defaultTo(true);
    t.enu('status', ['draft', 'active', 'archived']).notNullable().defaultTo('draft');
    t.uuid('merchantId').references('merchantId').inTable('merchant');
    t.timestamp('deletedAt');
    t.jsonb('customFields');

    // Indexes
    t.index('slug');
    t.index('status');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('product');
};
```

### Standard Column Patterns

| Pattern              | Type          | Example                                                    |
| -------------------- | ------------- | ---------------------------------------------------------- |
| Primary key          | `uuid`        | `t.uuid('productId').primary().defaultTo(knex.raw('uuidv7()'))` |
| Foreign key          | `uuid`        | `t.uuid('merchantId').references('merchantId').inTable('merchant')` |
| Created timestamp    | `timestamp`   | `t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now())` |
| Updated timestamp    | `timestamp`   | `t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now())` |
| Soft delete          | `timestamp`   | `t.timestamp('deletedAt')`                                 |
| Boolean flags        | `boolean`     | `t.boolean('isActive').notNullable().defaultTo(true)`       |
| Enum/Status          | `enu`         | `t.enu('status', ['draft', 'active']).defaultTo('draft')`  |
| Money                | `decimal`     | `t.decimal('price', 15, 2)`                                |
| Flexible data        | `jsonb`       | `t.jsonb('customFields')`                                  |
| UUID arrays          | `specificType`| `t.specificType('relatedProducts', 'uuid[]')`              |

### Boolean Naming

- Use `is`, `has`, `can` prefixes: `isActive`, `isFeatured`, `hasVariants`, `isVerified`

### Data Types

| Type            | Use Case                              |
| --------------- | ------------------------------------- |
| `uuid`          | All primary and foreign keys (UUIDv7) |
| `timestamp`     | All date/time fields                  |
| `decimal(15,2)` | Monetary amounts                      |
| `decimal(10,2)` | Weights, dimensions                   |
| `decimal(5,2)`  | Rates, percentages                    |
| `jsonb`         | Structured flexible data              |
| `text`          | Long text (descriptions)              |
| `string(N)`     | Short text with max length            |
| `integer`       | Counts, quantities                    |
| `boolean`       | Flags                                 |
| `enu`           | Inline enums (status, type)           |

### SQL Query Helpers (`libs/db`)

```typescript
import { query, queryOne } from '../../libs/db';

// Query multiple rows
const products = await query<Product[]>(
  `SELECT * FROM "product" WHERE "status" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
  ['active', limit, offset],
);

// Query single row
const product = await queryOne<Product>(
  `SELECT * FROM "product" WHERE "productId" = $1 AND "deletedAt" IS NULL`,
  [productId],
);
```

---

## Seed Data Standards

### File Format

- **Filename**: `YYYYMMDDHHMMSS_seedDescription.js` (JavaScript)
- **Location**: `seeds/`
- **Pattern**: Check-before-insert to avoid duplicates

```javascript
/**
 * Seed description
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Check if data already exists (don't delete to avoid FK issues)
  const existing = await knex('tableName').where({ uniqueField: 'value' }).first();

  if (!existing) {
    await knex('tableName').insert({
      fieldName: 'value',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    });
  }
};
```

### Seed with Up/Down Pattern

For seeds that reference other tables:

```javascript
exports.up = async function (knex) {
  const parent = await knex('parentTable').where({ slug: 'parent-slug' }).first('parentId');
  if (!parent) throw new Error('Required seed data not found');

  await knex('childTable').insert({
    parentId: parent.parentId,
    name: 'Child Record',
  });
};

exports.down = async function (knex) {
  await knex('childTable').where({ name: 'Child Record' }).delete();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
```

### Seed Ordering

Seeds are executed in filename order. Use the timestamp prefix to control execution order:

| Prefix Range     | Category                    |
| ---------------- | --------------------------- |
| `000100-000199`  | Users & identity            |
| `000200-000299`  | Currencies, locales, countries |
| `000300-000399`  | Merchants & notifications   |
| `000400-000499`  | Customer segments & loyalty |
| `000500-000599`  | Orders & payments           |
| `000900-000999`  | Content & CMS               |
| `001000-001099`  | Products, pricing, inventory |
| `001100-001199`  | Merchant stores & marketplace |
| `001200-001299`  | Notification templates      |
| `001300-001399`  | GDPR & compliance           |
| `001400-001499`  | Marketing                   |
| `001500-001599`  | B2B                         |
| `001600-001699`  | Shipping                    |
| `001700-001799`  | Subscriptions & support     |
| `001800-001899`  | Supplier & distribution     |
| `001900-001999`  | Analytics                   |
| `002000-002199`  | Tax, warehouse, integration |

---

## Internationalization (i18n)

### Structure

```
locales/
├── de/          # German
├── el/          # Greek
├── en/          # English (fallback)
├── es/          # Spanish
├── fr/          # French
├── it/          # Italian
├── pt/          # Portuguese
└── sq/          # Albanian
```

### Namespaces

Each locale directory contains JSON files per namespace:

| Namespace      | Purpose                    |
| -------------- | -------------------------- |
| `shared`       | Common strings (default)   |
| `auth`         | Authentication strings     |
| `basket`       | Shopping cart strings       |
| `checkout`     | Checkout flow strings      |
| `customer`     | Customer-facing strings    |
| `distribution` | Shipping/distribution      |
| `merchant`     | Merchant dashboard strings |
| `order`        | Order management strings   |
| `product`      | Product catalog strings    |
| `promotion`    | Promotion strings          |
| `tax`          | Tax-related strings        |

### Usage

```typescript
// In EJS templates
<%= t('shared:welcome') %>
<%= t('product:addToCart') %>

// In TypeScript (via app.locals.t)
app.locals.t = function (key: string) {
  return i18next.t(key);
};
```

### Configuration

- **Fallback language**: `en`
- **Detection order**: querystring (`?lang=de`) → cookie (`lang`)
- **Preloaded languages**: en, de, es, fr, it, el, sq

---

## Shared Libraries

### `libs/` Directory

| File/Dir          | Purpose                                        |
| ----------------- | ---------------------------------------------- |
| `db/`             | Database connection pool, client, query helpers |
| `db/types.ts`     | Auto-generated Knex table/column types          |
| `db/dataModelTypes.ts` | Shared data model type definitions         |
| `auth.ts`         | Authentication middleware (JWT + session)       |
| `apiResponse.ts`  | Standard API response helpers                  |
| `events/`         | Event bus (EventEmitter-based)                 |
| `logger.ts`       | Winston logger with daily rotation             |
| `validation.ts`   | Input validation utilities                     |
| `form.ts`         | EJS form helper functions                      |
| `hash.ts`         | Password hashing (bcrypt)                      |
| `slug.ts`         | Slug generation utilities                      |
| `amount.ts`       | Money/amount formatting (Dinero.js)            |
| `date.ts`         | Date formatting utilities                      |
| `cache.ts`        | Caching utilities                              |
| `geoip.ts`        | GeoIP lookup utilities                         |
| `roles.ts`        | Role definitions                               |
| `uuid.ts`         | UUID generation                                |
| `strings.ts`      | String manipulation utilities                  |
| `errors.ts`       | Custom error classes                           |
| `session/`        | Session store factory (Redis/PostgreSQL)        |
| `jobs/`           | Background job utilities                       |

---

## Infrastructure & Deployment

### `infra/` Directory

| Directory      | Strategy                          | Use Case                    |
| -------------- | --------------------------------- | --------------------------- |
| `ansible-vps/` | Ansible on traditional VPS        | Simple, full control        |
| `docker/`      | Docker Compose (local/staging)    | Development, CI             |
| `docker-gcp/`  | Terraform + Cloud Run             | Google Cloud deployment     |
| `docker-azure/`| Terraform + Container Apps        | Azure deployment            |
| `ecs-aws/`     | AWS CDK + ECS Fargate + RDS       | High availability, enterprise |

### Docker Development

```bash
# Start all services
docker-compose up -d

# Production build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Health Check

```
GET /health → { "status": "ok", "timestamp": "2026-02-16T..." }
```

---

## API Response Patterns

### Standard JSON Response

```typescript
import { successResponse, errorResponse, validationErrorResponse } from '../../libs/apiResponse';

// Success (200)
successResponse(res, data);
// → { success: true, data: { ... } }

// Success with custom status (201)
successResponse(res, data, 201);

// Error (500)
errorResponse(res, 'Something went wrong');
// → { success: false, error: { message: '...', statusCode: 500 } }

// Error with custom status (404)
errorResponse(res, 'Not found', 404);

// Validation error (400)
validationErrorResponse(res, ['Name is required', 'Email is invalid']);
// → { success: false, error: { message: 'Validation failed', statusCode: 400, errors: [...] } }
```

### Content Negotiation in Controllers

Controllers support both JSON and HTML responses:

```typescript
function respond(req: Request, res: Response, data: any, statusCode = 200, htmlTemplate?: string): void {
  const acceptHeader = req.get('Accept') || 'application/json';
  if (acceptHeader.includes('text/html') && htmlTemplate) {
    res.status(statusCode).render(htmlTemplate, { data, success: true });
  } else {
    res.status(statusCode).json({ success: true, data });
  }
}
```

---

## Authentication & Authorization

### Dual Authentication Strategy

The platform supports both **session-based** (web portals) and **token-based** (API) authentication:

```typescript
// Middleware auto-detects based on Accept header
export const isAdminLoggedIn = async (req, res, next) => {
  if (req.xhr || req.headers.accept?.indexOf('json') !== -1) {
    return authenticateToken(req, res, next, ADMIN_JWT_SECRET);  // JWT for API
  }
  return authenticateSession(req, res, next, 'admin', '/admin/login');  // Session for web
};
```

### Auth Middleware

| Middleware             | User Type  | JWT Secret           | Login Redirect     |
| ---------------------- | ---------- | -------------------- | ------------------ |
| `isAdminLoggedIn`      | Admin      | `ADMIN_JWT_SECRET`   | `/admin/login`     |
| `isMerchantLoggedIn`   | Merchant   | `MERCHANT_JWT_SECRET`| `/merchant/login`  |
| `isB2BLoggedIn`        | B2B User   | `B2B_JWT_SECRET`     | `/b2b/login`       |
| `isCustomerLoggedIn`   | Customer   | `CUSTOMER_JWT_SECRET`| `/login`           |

### Session Configuration

- **Cookie name**: `sid` (not default `connect.sid`)
- **Max age**: 3 hours
- **Store**: Redis (if `REDIS_URL` set) or PostgreSQL
- **httpOnly**: true
- **sameSite**: lax
- **secure**: true in production

### Required Environment Variables

```bash
SESSION_SECRET=<64-char-hex>         # Session encryption
CUSTOMER_JWT_SECRET=<secure-secret>  # Customer JWT signing
MERCHANT_JWT_SECRET=<secure-secret>  # Merchant JWT signing
ADMIN_JWT_SECRET=<secure-secret>     # Admin JWT signing
B2B_JWT_SECRET=<secure-secret>       # B2B JWT signing
COOKIE_SECRET=<secure-secret>        # Cookie signing
```

---

## Event System

### Event Bus (`libs/events/eventBus.ts`)

The platform uses a Node.js `EventEmitter`-based event bus for cross-module communication.

### Event Types

Events follow the `domain.action` naming convention:

| Domain       | Events                                                                |
| ------------ | --------------------------------------------------------------------- |
| `order`      | created, paid, shipped, completed, cancelled, refunded, delivered     |
| `product`    | created, updated, deleted, published, unpublished, price_changed, viewed |
| `basket`     | created, item_added, item_removed, abandoned, converted_to_order     |
| `checkout`   | started, updated, completed, abandoned                               |
| `customer`   | registered, verified, profile_updated, deactivated                   |
| `payment`    | initiated, completed, failed, refunded                               |
| `inventory`  | stock_updated, low_stock, out_of_stock, reserved, released           |
| `review`     | created, approved, rejected                                          |
| `membership` | subscribed, renewed, cancelled, upgraded, downgraded                 |
| `loyalty`    | points_earned, points_redeemed, tier_changed                         |

### Analytics Event Handlers

Event handlers are registered in `boot/analyticsEventHandler.ts` and automatically track events for analytics dashboards.

---

## Testing Standards

### Test Structure

```
tests/
└── integration/           # Integration tests (API-level)
    ├── helpers/            # Test utilities
    ├── product/            # Product tests
    ├── order/              # Order tests
    └── ...

modules/[module]/
├── application/
│   └── useCases/
│       └── __tests__/     # Unit tests for use cases
└── domain/
    └── __tests__/         # Unit tests for domain logic
```

### Jest Configuration

- **Preset**: `ts-jest`
- **Test timeout**: 30 seconds
- **Coverage from**: `features/**/*.ts`
- **Coverage reporters**: text + lcov
- **Force exit**: true (to handle open handles)

### Integration Test Pattern

```typescript
import supertest from 'supertest';
const app = require('../../app');
const request = supertest(app);

describe('Product API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Login and get token
    const res = await request.post('/customer/login').send({
      email: 'customer@example.com',
      password: 'password123',
    });
    authToken = res.body.token;
  });

  it('should list products', async () => {
    const res = await request
      .get('/business/products')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.products).toBeDefined();
  });
});
```

### Test Commands

```bash
yarn test                                    # Full suite
yarn test:unit                               # Unit tests only
yarn test:int                                # Integration tests only
npx jest tests/integration/product.test.ts   # Single test file
yarn test:e2e                                # Cypress E2E
```

---

## Code Style & Formatting

### TypeScript Configuration

- **Target**: ES2023
- **Module**: NodeNext
- **Strict mode**: Enabled
- **Module resolution**: NodeNext

### ESLint Rules

```javascript
{
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 140,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### File Naming Conventions

| Type                | Convention     | Example                          |
| ------------------- | -------------- | -------------------------------- |
| Domain entities     | PascalCase     | `Product.ts`, `ProductVariant.ts`|
| Value objects       | PascalCase     | `Price.ts`, `ProductStatus.ts`   |
| Use cases           | PascalCase     | `CreateProduct.ts`, `ListProducts.ts` |
| Controllers         | camelCase      | `productBusinessController.ts`   |
| Routers             | camelCase      | `productBusinessRouter.ts`       |
| Repositories        | camelCase      | `productRepo.ts`                 |
| Infra repositories  | PascalCase     | `ProductRepository.ts`           |
| Migrations          | timestamp prefix | `20240805000468_createProduct.js` |
| Seeds               | timestamp prefix | `20240805001026_seedSampleProduct.js` |
| EJS views           | kebab-case     | `product-list.ejs`, `order-detail.ejs` |
| Locale files        | camelCase      | `product.json`, `shared.json`    |

### Directory Naming

- **Module directories**: camelCase (`product/`, `orderItem/`)
- **DDD layers**: camelCase (`application/`, `domain/`, `infrastructure/`, `interface/`)
- **Sub-directories**: camelCase (`useCases/`, `valueObjects/`, `entities/`)

---

## Security Standards

### Helmet Security Headers

- Content Security Policy (CSP) with whitelisted sources
- HSTS enabled in production (1 year, includeSubDomains, preload)
- Cross-Origin Embedder Policy disabled (for external resources)

### CORS Configuration

- Production: Only `ALLOWED_ORIGINS` env var
- Development: `localhost:3000`, `localhost:10000`, `127.0.0.1:3000`
- Credentials: enabled
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS

### HTTP Parameter Pollution (HPP)

Enabled with whitelist for common filter parameters: `ids`, `tags`, `categories`, `status`, `types`, `fields`, `include`, `sort`.

### Input Validation

- Use `express-validator` for request validation
- Always use parameterized SQL queries (never string interpolation)
- Body size limits: JSON 1MB, URL-encoded 10MB

```typescript
// ✅ CORRECT - Parameterized
const result = await query('SELECT * FROM "product" WHERE "productId" = $1', [productId]);

// ❌ WRONG - SQL Injection risk
const result = await query(`SELECT * FROM "product" WHERE "productId" = '${productId}'`);
```

### Password Hashing

- **Algorithm**: bcrypt via `bcryptjs`
- **Salt rounds**: 10

### Session Security

| Setting          | Value          | Reason                        |
| ---------------- | -------------- | ----------------------------- |
| `httpOnly`       | `true`         | Prevents XSS cookie access   |
| `secure`         | `true` (prod)  | HTTPS only in production      |
| `sameSite`       | `lax`          | CSRF protection               |
| `maxAge`         | 3 hours        | Session expiry                |
| `name`           | `sid`          | Don't reveal tech stack       |
| `saveUninitialized` | `false`     | GDPR compliance               |

### Security Checklist for New Features

- [ ] SQL queries use parameterized bindings (`$1`, `$2`, etc.)
- [ ] User input validated before use
- [ ] Auth middleware applied to protected routes
- [ ] No `console.log` of sensitive data (use Winston logger)
- [ ] No hardcoded secrets (use environment variables)
- [ ] File uploads use secure handling (Sharp for images, S3 for storage)
- [ ] Error responses don't leak stack traces in production

---

## Common Patterns & Examples

### Controller Pattern (API)

```typescript
export const listProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, limit, offset } = req.query;

    const command = new ListProductsCommand(
      { status: status as string, search: search as string },
      parseInt(limit as string) || 50,
      parseInt(offset as string) || 0,
    );

    const useCase = new ListProductsUseCase(ProductRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 200);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to list products', 500);
  }
};
```

### Router Pattern

```typescript
import express from 'express';
import * as controller from '../controllers/ProductBusinessController';
import { isMerchantLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isMerchantLoggedIn);

router.get('/products', controller.listProducts);
router.post('/products', controller.createProduct);
router.get('/products/:productId', controller.getProduct);
router.put('/products/:productId', controller.updateProduct);
router.delete('/products/:productId', controller.deleteProduct);

export const productBusinessRouter = router;
```

### Repository Pattern (Direct SQL)

```typescript
import { query, queryOne } from '../../libs/db';

export interface Product {
  productId: string;
  name: string;
  status: string;
  createdAt: Date;
}

export const getById = async (productId: string): Promise<Product | null> => {
  return queryOne<Product>(
    `SELECT * FROM "product" WHERE "productId" = $1 AND "deletedAt" IS NULL`,
    [productId],
  );
};

export const getAll = async (limit: number, offset: number): Promise<Product[] | null> => {
  return query<Product[]>(
    `SELECT * FROM "product" WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
};

export const create = async (data: Partial<Product>): Promise<Product | null> => {
  return queryOne<Product>(
    `INSERT INTO "product" ("name", "status") VALUES ($1, $2) RETURNING *`,
    [data.name, data.status || 'draft'],
  );
};
```

### Web Admin Controller Pattern

```typescript
import { Request, Response } from 'express';
import { adminRespond } from '../../respond';
import { ListProductsUseCase } from '../../../modules/product/application/useCases/ListProducts';
import ProductRepo from '../../../modules/product/infrastructure/repositories/ProductRepository';

export const listProducts = async (req: Request, res: Response) => {
  try {
    const useCase = new ListProductsUseCase(ProductRepo);
    const result = await useCase.execute(new ListProductsCommand());

    adminRespond(req, res, 'products/index', {
      products: result.products,
      total: result.total,
      pageName: 'Products',
    });
  } catch (error: any) {
    adminRespond(req, res, 'error', { message: error.message });
  }
};
```

---

## Do's and Don'ts

### ✅ DO

- Use UUIDv7 for all primary keys (`defaultTo(knex.raw('uuidv7()'))`)
- Use camelCase for all database column names
- Double-quote camelCase identifiers in SQL (`"productId"`, `"createdAt"`)
- Use parameterized queries (`$1`, `$2`) for all SQL
- Follow the DDD structure for new modules (domain → application → infrastructure → interface)
- Use the `query<T>()` and `queryOne<T>()` helpers from `libs/db`
- Use `successResponse()` / `errorResponse()` for API responses
- Use `adminRespond()` / `merchantRespond()` for web portal views
- Apply auth middleware at the router level
- Use Winston logger (`logger.error()`, `logger.info()`) instead of `console.log`
- Write use cases as classes with `execute()` method
- Create domain entities with `create()` and `reconstitute()` factory methods
- Check for existing data before inserting in seed files
- Use `t.timestamp('deletedAt')` for soft deletes
- Keep migrations as JavaScript files (not TypeScript)
- Use `knex.fn.now()` for default timestamps
- Follow the master variant architecture for products

### ❌ DON'T

- Use snake_case for database columns (the platform uses camelCase)
- Use an ORM — use raw SQL with `libs/db` helpers
- Put business logic in controllers (use domain entities and use cases)
- Hard-code API endpoints or secrets
- Use `console.log` in production code
- Skip error handling in controllers
- Delete seed data without checking FK constraints
- Use `t.increments()` for primary keys (use UUIDv7)
- Create TypeScript migration files (use JavaScript)
- Skip auth middleware on protected routes
- Expose stack traces in production error responses
- Use inline SQL string interpolation (SQL injection risk)
- Import from `web/` into `modules/` (dependency flows: web → modules → libs)
- Create circular dependencies between modules

---

## Quick Reference

### File Locations

| Type                | Location                                        |
| ------------------- | ----------------------------------------------- |
| Module domain       | `modules/[mod]/domain/`                         |
| Module use cases    | `modules/[mod]/application/useCases/`           |
| Module repos (DDD)  | `modules/[mod]/infrastructure/repositories/`    |
| Module repos (legacy)| `modules/[mod]/repos/`                         |
| Module controllers  | `modules/[mod]/interface/controllers/`          |
| Module routers      | `modules/[mod]/interface/routers/`              |
| Admin views         | `web/admin/views/`                              |
| Admin controllers   | `web/admin/controllers/`                        |
| Merchant views      | `web/merchant/views/`                           |
| Storefront views    | `web/storefront/views/`                         |
| B2B views           | `web/b2b/views/`                                |
| Shared libs         | `libs/`                                         |
| Database helpers    | `libs/db/`                                      |
| Auth middleware      | `libs/auth.ts`                                  |
| Event bus           | `libs/events/eventBus.ts`                       |
| Migrations          | `migrations/`                                   |
| Seeds               | `seeds/`                                        |
| Locale files        | `locales/[lang]/[namespace].json`               |
| Integration tests   | `tests/integration/`                            |
| Route configuration | `boot/routes.ts`                                |
| App entry point     | `app.ts`                                        |
| Infra configs       | `infra/`                                        |

### Module Documentation

All module specifications are documented in `docs/modules/`:

| Doc File            | Module                          |
| ------------------- | ------------------------------- |
| `analytics.md`      | Analytics & reporting           |
| `b2b.md`            | B2B companies & quotes          |
| `basket.md`         | Shopping cart                   |
| `checkout.md`       | Checkout flow                   |
| `content.md`        | CMS & content management        |
| `customer.md`       | Customer profiles               |
| `distribution.md`   | Distribution & shipping         |
| `gdpr.md`           | GDPR compliance                 |
| `identity.md`       | Authentication & authorization  |
| `inventory.md`      | Inventory management            |
| `localization.md`   | i18n & localization             |
| `loyalty.md`        | Loyalty programs                |
| `marketing.md`      | Marketing & campaigns           |
| `membership.md`     | Membership plans                |
| `merchant.md`       | Merchant management             |
| `notification.md`   | Notifications                   |
| `order.md`          | Order lifecycle                 |
| `payment.md`        | Payment processing              |
| `pricing.md`        | Pricing rules                   |
| `product.md`        | Product catalog                 |
| `promotion.md`      | Promotions & discounts          |
| `shipping.md`       | Shipping methods                |
| `subscription.md`   | Recurring subscriptions         |
| `supplier.md`       | Supplier management             |
| `support.md`        | Support tickets                 |
| `tax.md`            | Tax calculation                 |
| `warehouse.md`      | Warehouse management            |

### Migration Guides

Platform migration guides are in `docs/migrations/`:

- Shopify, WooCommerce, Magento 2, PrestaShop, BigCommerce
- Squarespace, Wix, Custom Platform
- Quick Start Guide

### Environment Variables

```bash
# Application
PORT=3000
NODE_ENV=development
BASE_URL=http://127.0.0.1:3000
SERVERLESS=0

# Database
POSTGRES_PORT=5432
POSTGRES_HOST=127.0.0.1
POSTGRES_USER=ecomm-user
POSTGRES_PASSWORD=ecomm-password
POSTGRES_DB=ecomm-db

# Authentication
SESSION_SECRET=<64-char-hex>
CUSTOMER_JWT_SECRET=<secure-secret>
MERCHANT_JWT_SECRET=<secure-secret>
ADMIN_JWT_SECRET=<secure-secret>
B2B_JWT_SECRET=<secure-secret>
COOKIE_SECRET=<secure-secret>
COOKIE_DOMAIN=

# External Services
STRIPE_PRIVATE_KEY=<stripe-key>
MJ_APIKEY_PUBLIC=<mailjet-public>
MJ_APIKEY_PRIVATE=<mailjet-private>
APP_EMAIL=hello@example.com

# Redis (optional)
# REDIS_URL=redis://localhost:6379

# CORS
ALLOWED_ORIGINS=https://yourdomain.com
```

---

**Last Updated**: February 2026
**Version**: 1.0
