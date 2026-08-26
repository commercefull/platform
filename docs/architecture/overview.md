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

## Modules (42 bounded contexts)

| Category    | Modules                                                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Catalog     | `product`, `pricing`                                                                                                               |
| Sales       | `order`, `basket`, `checkout`, `payment`, `returns`                                                                               |
| Fulfillment | `fulfillment`, `shipping`, `inventory`, `warehouse`                                                                               |
| Marketing   | `promotion`, `coupon`, `segment`, `automation`                                                                                     |
| Customer    | `customer`, `loyalty`, `membership`, `subscription`                                                                               |
| Content     | `content`, `media`, `notification`, `pagebuilder`, `theme`                                                                        |
| Commerce    | `marketplace`, `supplier`, `organization`                                                                                          |
| Platform    | `identity`, `configuration`, `localization`, `store`, `analytics`, `gdpr`, `support`, `tax`, `tracking`, `audit`, `integration`, `webhook`, `reporting`, `migration`, `compliance`, `b2b` |

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
| audit | `/business/audit` |
| integration | `/business/integration` |
| automation | `/business/automation` |
| returns | `/business/returns` |
| theme | `/business/themes` |
| page builder | `/business/page-builder` |
| segment | `/business/segment` |
| marketplace | `/business/vendors`, `/business/commission-rules`, `/business/payouts` |
| b2b | `/business/b2b` |
| compliance | `/business/compliance` |

## Technology Stack

- Node.js + Express 5 + TypeScript
- PostgreSQL 18, Knex migrations, raw SQL via `pg`
- EJS + Tabler (admin) · EJS + Tailwind (storefront)
- Redis (optional) / PostgreSQL session store
- Durable event bus (transactional outbox with `FOR UPDATE SKIP LOCKED` dispatcher)
- Module registry with feature flags (env vars or DB-backed provider)
- AES-256-GCM encryption for integration credentials (`libs/secrets`)
- Jest (unit/integration) · k6 (performance)
- Stripe · Mailjet/Nodemailer · Winston · i18next

## Module Registry & Feature Flags

Each of the 42 modules declares a manifest in `boot/moduleManifests.ts` with `{ name, description, requirement, dependsOn, routes, graphql, events, tables, featureFlagKey }`.

- **6 required modules**: `identity`, `order`, `product`, `payment`, `configuration`, `organization` — always loaded, cannot be toggled off.
- **36 optional modules**: Toggled via `MODULE_<NAME>_ENABLED=false` env var or a DB-backed feature flag provider.
- **Dependency resolution**: Optional modules with unmet `dependsOn` are auto-disabled.
- The registry controls whether module routes, GraphQL schema, event handlers, and migrations are activated.

See [Module Registry & Feature Flags](#/guides/module-registry) for details.

## Durable Event Bus

The platform uses a transactional outbox pattern for at-least-once event delivery:

1. **Write**: Business operations write events to the `eventOutbox` table within the same DB transaction as the business data.
2. **Dispatch**: A claim-based polling worker (`FOR UPDATE SKIP LOCKED`) picks up pending events and delivers them to registered handlers.
3. **Retry**: Exponential backoff (2s base, 5min max), dead-letter queue after 10 attempts.
4. **Shutdown**: Graceful stop on SIGTERM/SIGINT.

Environment flags: `OUTBOX_DISABLED=1` to skip dispatcher at boot, `CRON_DISABLED=1` to skip scheduled jobs.

## Boot Sequence

```
app.ts
  1. registerModuleManifestsSync()     — initialize module registry (env-var based)
  2. registerAllEventHandlers()        — wire event handlers (gated by module registry)
  3. startOutboxDispatcher()           — start durable event bus worker
  4. initializeScheduledJobs()         — start cron-based jobs
  5. boot/routes.ts                    — mount Express routers (gated by module registry)
  6. boot/graphql.ts                   — merge GraphQL schema (gated by module registry)
```

On shutdown (`SIGTERM`/`SIGINT`): `stopOutboxDispatcher()` → graceful HTTP close → process exit.
