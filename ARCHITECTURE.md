# Commercefull Architecture Overview

High-level architecture of the Commercefull platform. Detailed standards and patterns live in [`docs/guidelines/`](./docs/guidelines/README.md).

## System Context

Commercefull is an e-commerce platform. A single Express application serves two portals (Admin, Storefront) and two API surfaces (`/customer`, `/business`), backed by PostgreSQL.

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
│   45 bounded contexts organized as DDD:                   │
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

## Modules (45 bounded contexts)

| Category    | Modules                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Catalog     | `product`, `pricing`, `assortment`                                                                                                   |
| Sales       | `order`, `basket`, `checkout`, `payment`, `agentic-checkout`                                                                         |
| Fulfillment | `fulfillment`, `shipping`, `inventory`, `warehouse`, `returns`, `tracking`                                                           |
| Marketing   | `promotion`, `coupon`, `segment`, `recommendation`, `automation`                                                                     |
| Customer    | `customer`, `loyalty`, `membership`, `subscription`, `support`                                                                       |
| Content     | `content`, `media`, `notification`, `pagebuilder`, `theme`                                                                           |
| Commerce    | `store`, `organization`, `supplier`, `marketplace`, `b2b`                                                                            |
| Platform    | `identity`, `configuration`, `localization`, `analytics`, `gdpr`, `tax`, `reporting`, `webhook`, `audit`, `integration`, `migration` |

### Domain Entities as Single Source of Truth

Domain entities (`domain/entities/*.ts`) are the canonical type definitions for each module. Infrastructure and application layers must **import** types from the domain entity — never redefine them. This prevents type drift and ensures the domain remains the single source of truth.

**Pattern** (reference: `support` module):

1. `domain/entities/SupportTicket.ts` defines `SupportTicketProps`, `TicketStatus`, `TicketPriority`, etc.
2. `domain/repositories/SupportRepository.ts` imports types from the entity, defines `type SupportTicket = SupportTicketProps`.
3. `infrastructure/repositories/supportRepo.ts` returns domain entity types. Generated row types from `libs/db/types` may be imported (aliased `X as DbX`) to type `query<T>()` results, then mapped to domain types — generated types never appear in signatures.
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

| Category  | Modules                             |
| --------- | ----------------------------------- |
| Marketing | `referral`, `affiliate`, `preorder` |

## Route Naming Convention

All business routes follow the `/business/{topic}/...` pattern. The topic prefix must match the module name.

| Module        | Path prefix                                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| product       | `/business/products`, `/business/categories`                                                                                        |
| order         | `/business/orders`                                                                                                                  |
| store         | `/business/stores`, `/business/markets`                                                                                             |
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

## Global Commerce

Commercefull is a country-neutral, configuration-driven commerce platform. International expansion is declarative: a new market is configured, validated, and launched — not forked in code. The model is "one commerce platform + global primitives + market configuration + specialist domain services + policy rules where genuinely necessary".

### Commerce Context (`libs/commerceContext`)

Every commerce decision is made against a four-dimensional `CommerceContext`, resolved once per request and propagated through basket → checkout → order:

| Dimension            | Content                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `CustomerContext`    | Who is buying — customer id, home market, tax/VAT identifiers, privacy consents  |
| `MarketContext`      | Where the sale happens — market id/code, country, currency, locale, capabilities |
| `TransactionContext` | What is being transacted — basket/order facts, channel, store, ship-from/to      |
| `LegalContext`       | Who contracts — contracting entity, terms/consent versions                       |

Storefront resolution (`web/storefront/storeResolutionMiddleware`) resolves store **and** market (query param → session → market hostname → default) and exposes the combined context to views and downstream modules.

### Markets (`modules/store` — `Market` aggregate)

The `market` table is a first-class aggregate binding: organization/store, code, selling `countries`, `defaultCurrencyCode` + `supportedCurrencyCodes`, `defaultLocaleCode` + `supportedLocaleCodes`, `catalogAssortmentId`, `defaultPriceListId`, `contractingEntityId`, `taxDisplayMode` (`inclusive_tax`/`exclusive_tax`), FX behavior, `MarketCapabilities`, allowed payment/fulfillment methods, and `hostnames` used for storefront resolution. Lifecycle: `draft → ready → active` (and `disabled`).

- **Capabilities** — `MarketCapabilities.supports(capability)` replaces scattered feature booleans (COD, pickup, coupons, guest checkout, dynamic FX, …).
- **Readiness** — `MarketReadinessEvaluator` audits 12 launch dimensions (locale, currency, catalog, pricing, tax, payments, shipping, returns, legal, compliance, support, fraud) via `MarketReadinessPort`, gathering facts cross-module through `MarketReadinessAdapter` (ACL).
- **Launch gate** — `LaunchMarketUseCase` refuses activation while any blocking dimension is unmet; `GET /business/markets/:id/readiness` reports the live score.

### Global primitives (`libs/`)

- `libs/money` — ISO-4217 minor-unit aware `Money`/`toMinorUnits`/`fromMinorUnits` (0-, 2-, 3-decimal currencies). Never multiply by 100.
- `libs/i18n` — CLDR/ICU locale primitives: numbers, dates, currencies, collation, RTL direction, locale negotiation.
- `libs/address` — `GlobalAddress` + `countryAddressMetadata`: per-country required fields, admin-area/postal labels and patterns, display order. Drives checkout `Address` VO optionality and storefront address forms.
- `libs/geo` — country-group membership (`EU_MEMBER_STATES`, `EEA_MEMBER_STATES`, `EU_VAT_AREA`, `GDPR_REGIONS`, `isEuMember`, …) — the single source for regional logic.
- `libs/rules/policyEngine` — `Facts → Policy → Decision` evaluation producing explainable `PolicyDecisionRecord`s (tax, compliance, privacy consent).

### Explainability & provenance

Orders persist an immutable decision trail so historical behavior can be replayed: `marketId`/`localeCode`/`contractingEntityId`, `exchangeRateSnapshot`, `versionSnapshot` (market/pricing/promotion/tax/returns/terms versions), `decisionLog`, plus `orderDiscount` and `orderTax` provenance rows carrying source rule/policy ids, versions, and decision inputs. `GET /business/orders/:orderId/decisions` returns the full audit payload.

### Specialist services

- **Tax** — `TaxEnginePort` returns a `TaxDecision` (regime, lines, policy version, decision record); `InternalRuleTaxEngine` adapts `CalculateOrderTax` using `libs/geo` instead of hardcoded lists.
- **Payments** — `PaymentCapabilityService` checks method/PSP country + market support; `PSPRoute.supportsCountry()` gates routing.
- **Fulfillment** — shipping rates evaluate ship-from → ship-to lanes (`originCountry` in the conditions context); `DeliveryPromise` expresses the fulfillment commitment.
- **Privacy** — `PrivacyPolicyEvaluator` derives jurisdiction-specific consent requirements (GDPR/CCPA/LGPD/APPI) from `libs/geo` country groups.

New external protocols (a local PSP rail, a domestic carrier API) only require a new adapter behind the existing ports — no changes to checkout, order, pricing, or storefront code. See [`docs/guides/global-expansion.md`](./docs/guides/global-expansion.md) for the store → channel → market progression and [`docs/guides/market-launch.md`](./docs/guides/market-launch.md) for the operational launch procedure.

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
