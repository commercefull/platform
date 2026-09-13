# CommerceFull Architecture Overview

High-level architecture of the CommerceFull platform. Detailed standards and patterns live in [`docs/guidelines/`](./docs/guidelines/README.md).

## System Context

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
│   31 bounded contexts organized as DDD:                   │
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

### Composition Root (`boot/`)

`boot/` is the application's composition root — it wires modules together at startup. It is exempt from the deep-import and `no-restricted-imports` rules that apply to `web/` and `modules/`. `boot/` may import directly from `modules/*/infrastructure/repositories/` for wiring purposes (e.g., `boot/scheduledJobs.ts`, `boot/registerEventHandlers.ts`).

### Enforcement

All dependency rules are enforced by [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) via `yarn lint` (which runs `tsc --noEmit && eslint && dependency-cruiser`). Violations are **errors**, not warnings — the build fails on any violation. See `.dependency-cruiser.cjs` for the full rule set.

## Route Mounting

Routes are configured in `boot/routes.ts`:

| Prefix      | Purpose                 | Auth                                  |
| ----------- | ----------------------- | ------------------------------------- |
| `/`         | Storefront (public)     | None / `isCustomerLoggedIn` if needed |
| `/admin`    | Admin panel (EJS)       | `isAdminLoggedIn`                     |
| `/customer` | Customer-facing API     | `isCustomerLoggedIn` where needed     |
| `/business` | Business / merchant API | `isOrganizationLoggedIn`              |
| `/health`   | Health check            | None                                  |

## Modules (31 bounded contexts)

| Category    | Modules                                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog     | `product`, `pricing`                                                                                                                            |
| Sales       | `order`, `basket`, `checkout`, `payment`                                                                                                        |
| Fulfillment | `fulfillment`, `shipping`, `inventory`, `warehouse`                                                                                             |
| Marketing   | `promotion`, `coupon`                                                                                                                           |
| Customer    | `customer`, `loyalty`, `membership`, `subscription`                                                                                             |
| Content     | `content`, `media`, `notification`                                                                                                              |
| Commerce    | `supplier`                                                                                                                                      |
| Platform    | `identity`, `configuration`, `localization`, `store`, `organization`, `analytics`, `gdpr`, `support`, `tax`, `reporting`, `webhook`, `tracking` |

### Domain Entities as Single Source of Truth

Domain entities (`domain/entities/*.ts`) are the canonical type definitions for each module. Infrastructure and application layers must **import** types from the domain entity — never redefine them. This prevents type drift and ensures the domain remains the single source of truth.

**Pattern** (reference: `support` module):

1. `domain/entities/SupportTicket.ts` defines `SupportTicketProps`, `TicketStatus`, `TicketPriority`, etc.
2. `domain/repositories/SupportRepository.ts` imports types from the entity, defines `type SupportTicket = SupportTicketProps`.
3. `infrastructure/repositories/supportRepo.ts` imports types from the domain entity (not from `libs/db/types`).
4. `application/wired.ts` imports types from the domain entity and domain repository.
5. `index.ts` exports the domain entity so it is reachable from the entry point.

**Anti-pattern**: Infrastructure files that define their own `interface SupportTicket { ... }` instead of importing from `domain/entities/` create duplicate types and orphan the domain entity.

### Module Barrel Exports (`index.ts`)

Every module's `index.ts` must export its domain entities alongside its use cases, repository interfaces, and errors. This ensures domain entities are reachable from the entry point and do not trigger `no-orphans` violations.

```typescript
// modules/support/index.ts
export * from './application/useCases';
export * from './domain/repositories/SupportRepository';
export * from './domain/errors/SupportErrors';
export * from './domain/entities/SupportTicket'; // ← domain entity export
```

### Planned modules (not yet implemented)

| Category  | Modules                                                            |
| --------- | ------------------------------------------------------------------ |
| Catalog   | `assortment`, `brand`, `segment`                                   |
| Commerce  | `merchant`, `business`, `channel`                                  |
| Marketing | `b2b`, `marketplace`, `referral`, `affiliate`, `fraud`, `preorder` |

## Route Naming Convention

All business routes follow the `/business/{topic}/...` pattern. The topic prefix must match the module name.

| Module        | Path prefix                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| product       | `/business/products`, `/business/categories`                                                                                        |
| order         | `/business/orders`                                                                                                                  |
| store         | `/business/stores`                                                                                                                  |
| media         | `/business/media`                                                                                                                   |
| fulfillment   | `/business/fulfillments`, `/business/fulfillment/locations`, `/business/fulfillment/partners`                                       |
| configuration | `/business/configuration`                                                                                                           |
| coupon        | `/business/coupons`                                                                                                                 |
| identity      | `/business/auth` (login, register, user-store management), `/business/sso` (SAML/OIDC SSO), `/business/scim/v2` (SCIM provisioning) |
| inventory     | `/business/inventory`                                                                                                               |
| content       | `/business/content`                                                                                                                 |
| webhook       | `/business/webhooks`                                                                                                                |
| reporting     | `/business/reports`                                                                                                                 |
| basket        | `/business/basket`                                                                                                                  |
| tracking      | `/business/tracking`                                                                                                                |

## Technology Stack (at a glance)

- Node.js + Express 5 + TypeScript
- PostgreSQL 18, Knex migrations, raw SQL via `pg`
- EJS + Tabler (admin) · EJS + Tailwind (storefront)
- Redis (optional) / PostgreSQL session store
- Jest (unit/integration) · k6 (performance)
- Stripe · Mailjet/Nodemailer · Winston · i18next

## Where to Go Next

- **Working guide for AI agents / contributors** → [`AGENTS.md`](./AGENTS.md)
- **Standards (database, migrations, DDD, web, security, …)** → [`docs/guidelines/`](./docs/guidelines/README.md)
- **Module specifications** → [`docs/modules/`](./docs/modules/)
- **Migration guides** → [`docs/migrations/`](./docs/migrations/) — external migration tool being built separately; `modules/migration` provides in-platform import infrastructure.
- **Documentation website & autogeneration strategy** → [`docs/DOCUMENTATION-STRATEGY.md`](./docs/DOCUMENTATION-STRATEGY.md)
