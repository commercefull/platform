# Architecture Overview

> This is a symlinked copy of [ARCHITECTURE.md](../../ARCHITECTURE.md) rendered for the docs site.

CommerceFull is an e-commerce platform. A single Express application serves two portals (Admin, Storefront) and two API surfaces (`/customer`, `/business`), backed by PostgreSQL.

```
                    ┌─────────────────────────┐
                    │      Express App         │
                    │    (boot/routes.ts)       │
                    └────────┬────────────────┘
                             │
         ┌───────────┬───────┼──────────┐
         │           │       │          │
    ┌────▼───┐ ┌─────▼──┐ ┌──▼────┐ ┌───▼────┐
    │ Admin  │ │Store-  │ │  API   │        │
    │/admin  │ │front / │ │/customer│        │
    └────────┘ └───────┘ │/business│        │
                         └────────┘
```

## Top-Level Layout

```
┌──────────────────────────────────────────────────────────┐
│                     web/ (UI Layer)                       │
│   admin (Tabler)  ·  storefront (Tailwind)                │
├──────────────────────────────────────────────────────────┤
│                  modules/ (Business Logic)                │
│   37 bounded contexts organized as DDD:                   │
│   domain → application → infrastructure → interface       │
├──────────────────────────────────────────────────────────┤
│                    libs/ (Shared)                         │
│   db · auth · events · logger · validation · form · ...   │
├──────────────────────────────────────────────────────────┤
│                   infra/ (Deployment)                     │
│   Docker · Ansible · Terraform (AWS/GCP/Azure)            │
└──────────────────────────────────────────────────────────┘
```

## Request Flow

```
HTTP Request
   │
   ▼
Interface     →  Express routers & controllers (HTTP concerns)
Application   →  Use cases, orchestration, transaction boundaries
Domain        →  Entities, value objects, business rules (pure)
Infrastructure→  SQL repositories, external adapters
```

### Dependency Rules

| Layer          | Can depend on                  | Cannot depend on                       |
| -------------- | ------------------------------ | -------------------------------------- |
| Domain         | Nothing (pure)                 | Application, Infrastructure, Interface |
| Application    | Domain                         | Infrastructure (directly), Interface   |
| Infrastructure | Domain (implements interfaces) | Application, Interface                 |
| Interface      | Application, Domain            | Infrastructure (directly)              |

Overall project dependency direction: `web → modules → libs`.

## Route Mounting

Routes are configured in `boot/routes.ts`:

| Prefix      | Purpose                  | Auth                                  |
| ----------- | ------------------------ | ------------------------------------- |
| `/`         | Storefront (public)      | None / `isCustomerLoggedIn` if needed |
| `/admin`    | Admin panel (EJS)        | `isAdminLoggedIn`                     |
| `/customer` | Customer-facing API      | `isCustomerLoggedIn` where needed     |
| `/business` | Business / merchant API  | `isOrganizationLoggedIn`              |
| `/health`   | Health check             | None                                  |
| `/docs`     | Documentation site       | None                                  |

## Modules (36 bounded contexts)

| Category    | Modules                                                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Catalog     | `product`, `assortment`, `brand`, `pricing`                                                                                        |
| Sales       | `order`, `basket`, `checkout`, `payment`                                                                                           |
| Fulfillment | `fulfillment`, `shipping`, `inventory`, `warehouse`                                                                                |
| Marketing   | `promotion`, `coupon`, `segment`                                                                                                   |
| Customer    | `customer`, `loyalty`, `membership`, `subscription`                                                                                |
| Content     | `content`, `media`, `notification`                                                                                                 |
| Commerce   | `merchant`, `supplier`, `business`                                                                                                 |
| Platform    | `identity`, `configuration`, `localization`, `channel`, `store`, `organization`, `analytics`, `gdpr`, `support`, `tax`, `tracking`             |

## Route Naming Convention

All business routes follow the `/business/{topic}/...` pattern. The topic prefix must match the module name.

| Module | Path prefix |
| ------ | ----------- |
| product | `/business/products`, `/business/categories` |
| order | `/business/orders` |
| store | `/business/stores` |
| media | `/business/media` |
| fulfillment | `/business/fulfillments`, `/business/fulfillment/locations`, `/business/fulfillment/partners` |
| configuration | `/business/configuration` |
| coupon | `/business/coupons` |
| identity | `/business/auth` (login, register, user-store management), `/business/sso` (SAML/OIDC SSO), `/business/scim/v2` (SCIM provisioning) |
| inventory | `/business/inventory` |
| content | `/business/content` |
| webhook | `/business/webhooks` |
| reporting | `/business/reports` |
| basket | `/business/basket` |
| tracking | `/business/tracking` |

## Technology Stack

- Node.js + Express 5 + TypeScript
- PostgreSQL 18, Knex migrations, raw SQL via `pg`
- EJS + Tabler (admin) · EJS + Tailwind (storefront)
- Redis (optional) / PostgreSQL session store
- Jest (unit/integration) · k6 (performance)
- Stripe · Mailjet/Nodemailer · Winston · i18next
