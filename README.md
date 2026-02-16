# CommerceFull Platform

> **Creating tailor-made commerce solutions** — Empowering businesses to thrive in the digital marketplace through simple, innovative, and user-centric solutions.

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue.svg)](https://www.postgresql.org)

CommerceFull is an open-source, multi-tenant e-commerce platform built with Node.js, TypeScript, and PostgreSQL. It supports **admin**, **merchant**, **B2B**, and **storefront** portals with 36 business modules covering the full commerce lifecycle.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Access Points](#access-points)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Available Commands](#available-commands)
- [Environment Configuration](#environment-configuration)
- [Architecture](#architecture)
- [Modules](#modules)
- [Web Portals](#web-portals)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Commerce
- **Product Catalog** — Master/variant architecture, dynamic attributes, categories, brands, collections
- **Order Management** — Full lifecycle from placement to fulfillment with status tracking
- **Shopping Cart** — Guest and authenticated carts with session merging
- **Checkout Flow** — Multi-step checkout with address, shipping, payment, and confirmation
- **Payment Processing** — Stripe integration with refunds and webhooks
- **Inventory Management** — Multi-warehouse stock tracking, reservations, low-stock alerts

### Marketing & Sales
- **Promotions** — Cart/category/product promotions with flexible rules
- **Coupons** — Code-based discounts with usage limits and date ranges
- **Gift Cards** — Issue, redeem, reload, and track gift card balances
- **Customer Segments** — Rule-based segmentation for targeted campaigns
- **Pricing Rules** — Price lists, tiered pricing, and dynamic pricing rules

### Customer Programs
- **Loyalty Program** — Points earning/redemption, tiers, and rewards
- **Membership Plans** — Tiered memberships with benefits and billing
- **Subscriptions** — Recurring billing with plan management and renewals

### Multi-Tenant & B2B
- **Merchant Dashboard** — Merchant onboarding, orders, inventory, analytics, settings
- **B2B Portal** — Company accounts, bulk ordering, quotes, credit terms, invoices
- **Multi-Channel** — Sales channel management with channel-specific configuration

### Platform
- **Admin Panel** — Full platform management across all 36 modules
- **Content Management** — Pages, blocks, templates, and media library
- **Notifications** — Email/push templates with event-driven delivery
- **Analytics** — Sales, product, customer, and predictive analytics
- **GDPR Compliance** — Data requests, consent management, and audit trails
- **Support Center** — Ticket management and FAQ system
- **Internationalization** — Multi-locale, multi-currency, multi-region support

---

## Quick Start

### Prerequisites

- **Node.js** 20+ and **Yarn** 1.x
- **Docker** (for PostgreSQL) or a local PostgreSQL 15+ instance

### Development Setup

```bash
# Clone the repository
git clone https://github.com/commercefull/platform.git
cd platform

# Install dependencies
yarn install

# Copy environment configuration
cp .env.example .env

# Start PostgreSQL via Docker
yarn db

# Run database migrations
yarn db:migrate

# Create initial admin user
yarn job:new:admin

# Seed sample data (optional)
yarn db:seed

# Start development server with hot reload
yarn dev
```

### Docker Production Setup

```bash
cp .env.example .env
# Edit .env with production values (strong secrets, etc.)

./scripts/docker-deploy.sh
# Or: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

docker-compose exec app yarn db:migrate
docker-compose exec app yarn db:seed  # optional
```

---

## Access Points

| Portal | URL | Description |
|--------|-----|-------------|
| **Storefront** | http://localhost:3000 | Customer-facing shop |
| **Admin Panel** | http://localhost:3000/admin | Platform administration |
| **Merchant Dashboard** | http://localhost:3000/merchant | Merchant management |
| **B2B Portal** | http://localhost:3000/b2b | Business-to-business portal |
| **Health Check** | http://localhost:3000/health | Application health endpoint |

---

## Project Structure

```
platform/
├── boot/                      # Application bootstrap (routes, middleware)
├── libs/                      # Shared libraries
│   ├── auth/                  #   Authentication & authorization
│   ├── db/                    #   Database client (pg) & pool
│   ├── events/                #   Domain event system
│   ├── logger/                #   Winston logging
│   ├── session/               #   Session management
│   ├── types/                 #   Shared TypeScript types
│   └── validation/            #   Input validation helpers
├── modules/                   # 36 business modules (DDD)
│   ├── product/               #   Example: Product module
│   │   ├── application/       #     Use cases
│   │   ├── domain/            #     Entities, value objects, events
│   │   ├── infrastructure/    #     Repository implementations
│   │   └── interface/         #     HTTP controllers & routers
│   └── ...                    #   (see Modules section below)
├── web/                       # Web layer (EJS views + controllers)
│   ├── admin/                 #   Admin panel (Tabler UI)
│   ├── merchant/              #   Merchant dashboard (Tabler UI)
│   ├── b2b/                   #   B2B portal (Tabler UI)
│   ├── storefront/            #   Customer storefront (Tailwind CSS)
│   └── respond.ts             #   View rendering helpers
├── migrations/                # Knex database migrations
├── seeds/                     # Database seed files
├── tests/                     # Test suites
│   ├── integration/           #   Integration tests (Jest + Axios)
│   └── e2e/                   #   End-to-end tests (Cypress)
├── scripts/                   # Utility scripts
├── infra/                     # Infrastructure (Docker, Ansible, Terraform)
├── locales/                   # i18n translation files
├── docs/                      # Documentation
├── AGENTS.md                  # AI coding agent guidelines
├── CONTRIBUTING.md            # Contribution guide
├── ARCHITECTURE.md            # Architecture deep-dive
└── package.json
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 20+, TypeScript 5.x |
| **Framework** | Express 5 |
| **Database** | PostgreSQL 18, Knex (migrations), raw SQL via `pg` driver |
| **Admin/Merchant/B2B UI** | EJS templates, Tabler (Bootstrap-based) |
| **Storefront UI** | EJS templates, Tailwind CSS |
| **Payments** | Stripe |
| **Email** | Mailjet / Nodemailer |
| **Cache** | Redis (optional, falls back to PostgreSQL sessions) |
| **Logging** | Winston with daily rotation |
| **i18n** | i18next with filesystem backend |
| **Testing** | Jest (unit/integration), Cypress (E2E) |
| **Build** | esbuild |
| **Deployment** | Docker, Docker Compose, Ansible, Terraform |

---

## Available Commands

### Development
```bash
yarn dev                    # Start dev server with hot reload (nodemon)
yarn prd:build              # Build for production (esbuild)
yarn prd                    # Build + run production
```

### Database
```bash
yarn db                     # Start PostgreSQL Docker container
yarn db:stop                # Stop PostgreSQL Docker container
yarn db:migrate             # Run all pending migrations
yarn db:migrate:new <name>  # Create a new migration file
yarn db:rollback            # Rollback last migration batch
yarn db:rollback:all        # Rollback all migrations
yarn db:seed                # Run all seed files
yarn db:types               # Generate TypeScript types from DB schema
```

### Testing
```bash
yarn test                   # Full Jest suite with coverage
yarn test:unit              # Unit tests (modules/ directory)
yarn test:int               # Integration tests (tests/integration/)
yarn test:e2e               # Cypress E2E suite
```

### Code Quality
```bash
yarn lint                   # TypeScript check + ESLint
yarn lint:errors            # ESLint errors only (no warnings)
yarn lint:fix               # ESLint with auto-fix
yarn format                 # Prettier format all files
yarn format:check           # Check formatting without writing
yarn code:lint              # Knip (dead code detection)
yarn sec:audit              # Security audit
```

### CSS
```bash
yarn css:build              # Build Tailwind CSS (minified)
yarn css:watch              # Watch mode for Tailwind CSS
```

### Admin Jobs
```bash
yarn job:new:admin          # Create a new admin user
yarn job:new:merchant       # Create a new merchant
yarn job:new:business       # Create a new B2B business
```

---

## Environment Configuration

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (`development`, `production`) | `development` |
| `BASE_URL` | Public URL | `http://localhost:3000` |
| `POSTGRES_HOST` | PostgreSQL host | `localhost` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_USER` | Database user | `commercefull` |
| `POSTGRES_PASSWORD` | Database password | — |
| `POSTGRES_DB` | Database name | `commercefull` |
| `SESSION_SECRET` | Session encryption key (64+ chars) | — |
| `CUSTOMER_JWT_SECRET` | Customer JWT signing key | — |
| `MERCHANT_JWT_SECRET` | Merchant JWT signing key | — |
| `COOKIE_SECRET` | Cookie signing key | — |
| `REDIS_URL` | Redis connection URL (optional) | — |
| `STRIPE_SECRET_KEY` | Stripe API secret key | — |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | — |
| `MAILJET_API_KEY` | Mailjet API key | — |
| `MAILJET_SECRET_KEY` | Mailjet secret key | — |

> **Security:** Always generate strong random values for secrets in production. Never commit `.env` files.

---

## Architecture

CommerceFull follows **Domain-Driven Design (DDD)** with a layered architecture:

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
│  Each: domain → application → infrastructure → interface │
├──────────────────────────────────────────────────────────┤
│                    libs/ (Shared)                         │
│  db, auth, events, logger, validation, session, types    │
├──────────────────────────────────────────────────────────┤
│                 infra/ (Deployment)                       │
│  Docker, Ansible, Terraform (AWS/GCP/Azure)              │
└──────────────────────────────────────────────────────────┘
```

Each DDD module follows this structure:

```
modules/<module>/
├── application/           # Use cases (orchestration)
│   └── useCases/
├── domain/                # Core business logic
│   ├── entities/          #   Aggregate roots & entities
│   ├── events/            #   Domain events
│   ├── repositories/      #   Repository interfaces (contracts)
│   └── valueObjects/      #   Value objects
├── infrastructure/        # External adapters
│   └── repositories/      #   SQL repository implementations
└── interface/             # HTTP layer
    ├── controllers/       #   Express controllers
    └── routers/           #   Express routers
```

For a detailed architecture guide, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Modules

CommerceFull includes 36 business modules:

| Module | Description |
|--------|-------------|
| `analytics` | Sales, product, customer, and predictive analytics |
| `assortment` | Categories, collections, and product assortment |
| `b2b` | B2B companies, quotes, credit terms |
| `basket` | Shopping cart management |
| `brand` | Brand management |
| `business` | Business entity management |
| `channel` | Sales channel configuration |
| `checkout` | Checkout session and flow |
| `configuration` | System-wide configuration |
| `content` | CMS pages, blocks, and templates |
| `coupon` | Coupon codes and validation |
| `customer` | Customer profiles and groups |
| `fulfillment` | Order fulfillment and shipping |
| `gdpr` | GDPR compliance and data requests |
| `identity` | Authentication and authorization (IAM) |
| `inventory` | Stock levels, reservations, and lot tracking |
| `localization` | Countries, currencies, and locales |
| `loyalty` | Loyalty programs, points, and tiers |
| `media` | File and media management (S3/local) |
| `membership` | Membership plans and subscriptions |
| `merchant` | Merchant onboarding and management |
| `notification` | Email/push notification templates |
| `order` | Order lifecycle management |
| `organization` | Organization hierarchy |
| `payment` | Payment processing (Stripe) |
| `pricing` | Price lists, rules, and dynamic pricing |
| `product` | Product catalog with master/variant architecture |
| `promotion` | Promotions, discounts, and gift cards |
| `segment` | Customer segmentation |
| `shipping` | Shipping methods, zones, and rates |
| `store` | Store management |
| `subscription` | Recurring subscription billing |
| `supplier` | Supplier and purchase order management |
| `support` | Support tickets and FAQ |
| `tax` | Tax calculation, zones, and classes |
| `warehouse` | Warehouse and distribution management |

---

## Web Portals

### Admin Panel (`/admin`)
Full platform management with 41 controllers covering all modules. Built with Tabler (Bootstrap-based) UI framework.

**Key sections:** Dashboard, Products, Orders, Customers, Inventory, Promotions, Payments, Shipping, Content, Analytics, Programs (Membership, Subscription, Loyalty, B2B), Operations (Warehouses, Fulfillment, Suppliers), Settings, Users & Roles, GDPR, Support.

### Merchant Dashboard (`/merchant`)
Self-service portal for merchants to manage their business.

**Key sections:** Dashboard, Products, Orders, Inventory, Fulfillment, Analytics (Sales, Products, Customers), Settings (Profile, Store, Notifications).

### B2B Portal (`/b2b`)
Business-to-business portal for company accounts.

**Key sections:** Dashboard, Catalog, Orders, Quotes, Company Management (Profile, Users, Addresses), Invoices, Approvals.

### Storefront (`/`)
Customer-facing shop built with Tailwind CSS.

**Key sections:** Home, Product Listing/Detail, Categories, Shopping Cart, Checkout (multi-step), Order History/Tracking, Account (Profile, Addresses), Wishlist, Returns, Subscriptions, Membership, Loyalty Rewards, Notifications.

---

## Testing

### Unit Tests
```bash
yarn test:unit
```
Located in `modules/*/` alongside the source code.

### Integration Tests
```bash
yarn test:int
```
Located in `tests/integration/`. Tests API endpoints with a running server.

### E2E Tests
```bash
yarn test:e2e
```
Cypress-based end-to-end tests for critical user flows.

### Coverage
```bash
yarn test  # Runs all tests with coverage report
```

---

## Deployment

### Docker (Recommended)
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Manual
```bash
yarn prd:build   # Build with esbuild
yarn prd         # Start production server
```

### Infrastructure
The `infra/` directory contains deployment configurations for:
- **Docker** — Dockerfile and Compose files
- **Ansible** — Server provisioning playbooks
- **Terraform** — Cloud infrastructure (AWS, GCP, Azure)

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Quick summary:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Follow the [coding standards](./AGENTS.md)
4. Write tests for new functionality
5. Ensure `yarn lint` and `yarn test` pass
6. Submit a pull request

---

## License

This project is licensed under the [Apache License 2.0](./LICENSE).
