# Guidelines Conformance Audit — 2026-11-02

> Mechanical audit of the codebase against the rules in [`docs/guidelines/`](../guidelines/README.md).
> Each finding lists the violated rule, the offender locations, and the suggested fix.
> Baseline: `yarn lint` green (tsc + ESLint + dependency-cruiser + SQL schema check), 0 ESLint warnings.

---

## 1. Violations — direct `res.*` transport calls in controllers

**Rule** ([api-responses](../guidelines/api-responses.md), [do-and-dont](../guidelines/do-and-dont.md)): controllers never call `res.status`/`res.json`/`res.redirect`/`res.render`/`res.send`/`res.cookie`/`res.setHeader` directly — use `libs/apiResponse` helpers; full pages via `adminRespond`/`storefrontRespond`.

| File | Hits | Offense |
|---|---|---|
| `libs/search/searchController.ts` | 16 | `res.status(503).json(...)`, `res.json(...)`, `res.status(500).json(...)` — the only genuine controller offender. Fix with `jsonResponse`, `errorResponse`, `setStatus` |

**Gray area (not controllers, but same helper library applies):**
- `libs/auth.ts` (7), `libs/rbac/middleware.ts` (5), `libs/errorMiddleware.ts` (4), `libs/httpSecurity.ts` (2), `libs/correlationId.ts` (1), `libs/asyncHandler.ts` (1)
- `boot/graphql.ts` (4), `boot/routes.ts` (3), `app.ts` (3), `worker.ts` (2)

**Verified exempt:** `libs/apiResponse.ts`, `libs/adminRespond.ts`, `libs/storefrontRespond.ts`, `web/respond.ts` (the helpers themselves); PSP adapters (`await res.json()` on fetch `Response` — explicitly allowed); test mocks.

## 2. Violations — `throw new Error('...')` in `domain/` / `application/`

**Rule** ([errors-and-logging](../guidelines/errors-and-logging.md) §2.5, do-and-dont): no bare `throw new Error` in `domain/` or `application/` — use typed domain errors with stable `code`, `statusCode`, `severity`.

| File | Line(s) |
|---|---|
| `modules/membership/application/useCases/ManageMembershipSubscriptions.ts` | 74, 81, 106, 111, 116 |
| `modules/integration/application/services/IntegrationEventDispatcher.ts` | 67 |
| `modules/content/application/useCases/ManageContent.ts` | 169 |
| `modules/analytics/application/useCases/GetAnalyticsData.ts` | 72 |

**Gray area (rule scope is domain/application only):** 59 `throw new Error` in `interface/` (mostly controllers — produces untyped 500s) and 13 in `infrastructure/`.

## 3. Violations — `crypto.randomUUID` for DB identifiers

**Rule** (do-and-dont): `crypto.randomUUID` produces UUIDv4 — use `generateUUID()` from `libs/uuid` (v7, matching `uuidv7()` column defaults) for app-generated DB identifiers.

~20 call sites / 14 files:

- **Domain entities:** `b2b/domain/entities/B2BUser.ts:52`, `Quote.ts:61,63,157`, `Company.ts:64`, `ApprovalWorkflow.ts:58,65`; `product/domain/entities/Brand.ts:41`; `fulfillment/domain/entities/Fulfillment.ts:430`; `audit/domain/entities/AuditLog.ts:219-221`; `migration/domain/entities/ImportJob.ts:73`, `ImportMapping.ts:30`, `ImportError.ts:33`
- **Repositories:** `inventory/infrastructure/repositories/inventoryReservationRepo.ts:26,60`; `organization/infrastructure/repositories/organizationRepo.ts:412`
- **Use cases:** `tax/application/useCases/CalculateOrderTax.ts:412`; `store/application/useCases/CreateStore.ts:225`

Verify each call site is a DB identifier (some may be non-persisted tokens); swap to `generateUUID()` where it is.

## 4. Violations — dynamic `import()` inside function bodies

**Rule** ([code-style](../guidelines/code-style.md)): all imports at top of file; dynamic `import()` inside function bodies is forbidden.

| File | Line | Fix |
|---|---|---|
| `modules/webhook/interface/controllers/WebhookBusinessController.ts` | 184 | `await import('crypto')` → top-level `import { createHmac } from 'crypto'` |
| `modules/media/infrastructure/services/S3StorageService.ts` | 70 | `await import('fs')` → top-level `import { promises as fs } from 'fs'` |

**Exception candidates:** `libs/events/providers/index.ts` (3) and `libs/events/eventTransport.ts` (1) — intentional lazy-loading of optional cloud SDK transports (GCP Pub/Sub, AWS SQS, Azure SB). Dynamic import is the correct mechanism for optional deps; either document the exception or keep as-is.

## 5. Violations — `require()` in TypeScript files

**Rule** (code-style): no `require()` in `.ts` files (`.js` migrations/seeds exempt).

| File | Line | Fix |
|---|---|---|
| `scripts/generate-knex-types.ts` | 7 | `require('../knexfile')` → `import` |

(Test-file usage in `tests/integration/pricing/currency.test.ts` is acceptable.)

## 6. Violations — status derivation via `message.includes(...)`

**Rule** (errors-and-logging §6): flag `message.includes(...)` for status derivation; domain errors carry `code`/`statusCode`, callers never string-match.

| File | Line | Offense |
|---|---|---|
| `modules/media/interface/http/MediaController.ts` | 25 | `CLIENT_ERROR_PATTERNS.some(p => message.includes(p))` — should branch on `error.code` |

## 7. Violations — module barrels missing domain entity exports

**Rule** (do-and-dont, module-stability-checklist): export domain entities from the module's `index.ts` so they are reachable from the entry point.

Dependency-cruiser `no-orphans` stays green because these entities are reachable transitively, but the explicit barrel rule is unmet for ~38 entity files across 24 modules:

| Module | Entities not exported from `index.ts` |
|---|---|
| analytics | `AnalyticsReport` |
| basket | `Basket`, `BasketItem` |
| checkout | `CheckoutSession` |
| configuration | `SystemConfiguration` |
| coupon | `Coupon` |
| customer | `Customer` |
| fulfillment | `Fulfillment`, `FulfillmentItem` |
| gdpr | `GdprCookieConsent`, `GdprDataRequest` |
| identity | `SocialAccount`, `User`, `UserStoreAssignment` |
| inventory | `Inventory`, `InventoryAllocationRule`, `InventoryItem`, `StoreDispatch` |
| localization | `Translation` |
| media | `Media` |
| order | `OrderAddress`, `OrderItem` |
| payment | `PaymentRefund`, `PaymentTransaction` |
| product | `ProductVariant` |
| returns | `ReturnRule` |
| shipping | `ShippingMethod`, `ShippingSurcharge`, `ShippingZone` |
| subscription | `Subscription` |
| supplier | `Supplier` |
| tax | `TaxExemption` |
| tracking | `TrackingConfig`, `TrackingEvent` |
| warehouse | `Warehouse` |
| webhook | `WebhookDelivery`, `WebhookEndpoint` |

**Fix:** add explicit `export { X } from './domain/entities/X';` lines to each module's `index.ts` (or a wildcard `export * from './domain/entities'` where the directory has an index barrel).

## 8. Violations — untyped `SELECT *` / `RETURNING *` queries

**Rule** (do-and-dont, database): `SELECT *`/`RETURNING *` must be typed `Db{Table}` from `libs/db/types`; column projections use `*Row` types — never domain types, never untyped.

**≥59 same-line hits** of `query<Record<string, unknown>>`, `query<unknown[]>`, `queryOne<Record<string, unknown>>`, `queryOne<unknown>` on `SELECT *`/`RETURNING *` statements (lower bound — only same-line matches counted across 214 files containing star queries).

Proper `Db*`/`Row` typing is the majority pattern; these are the non-conforming remainder, concentrated in older repos.

## 9. Violations — log severity policy

**Rule** (errors-and-logging §1): `error` = the system failed to keep a promise (5xx-class). 4xx outcomes (not-found, validation, auth, conflict, business-rule rejection) are **not** errors.

| File | Offense |
|---|---|
| `modules/tracking/application/eventHandlers/trackingEventHandlers.ts:110` | Catch-all logs `logger.error('Tracking event handler error', …)` for *any* failure — including expected `TrackingConfigNotFoundError`/`TrackingEventNotMappedError` (4xx-class). Produced ~50 error entries per integration run; silenced at the data level by seeding disabled configs, but the severity bug remains for unmapped events and dynamically-created stores |

- `logger.error(` appears in ~20 `interface/` controller files (41 calls). Most are genuine 5xx catch-alls, but each should be reviewed so expected domain errors (`isExpected`) don't reach `error` level.
- Long-term: the doc targets a central error middleware + `asyncHandler` (Phase 2/3) so controllers stop hand-rolling `try/catch` (~1,300 catch blocks) — aspirational, tracked here for completeness.

## 10. Gray areas / watchlist

- **`console.*` in `.ejs` views** — 36 hits across 17 `web/admin/views/*.ejs` files (client-side browser JS, not the Node-code `no-console` rule). Likely leftover debug logging in `<script>` blocks.
- **`console.*` in module jobs** — `identity/interface/jobs/new-admin.ts` (19), `organization/interface/jobs/new-organization.ts` (17), `recommendation/interface/jobs/backfill-co-purchase.ts` (2). Jobs are the documented `console.*` exception — acceptable, but consider logger for consistency.
- **Untyped errors thrown in `interface/`/`infrastructure/`** — see §2 gray area (72 sites).

## Verified clean (rules checked, no offenders)

- `isOrganizationLoggedIn` present on **every** `*usinessRouter.ts`
- `/business/{topic}` route prefixes — all router paths topic-scoped
- `manifest.ts` exists for every module; `docs/modules/<module>.md` for every module
- No `import * as ns` on internal modules
- No `export * as ns`
- No `new XRepo()`/`new XUseCase()` in `interface/` files
- No `interface/` → `infrastructure/repositories` imports
- No `eventBus.emit`/`writeToOutbox` in `interface/` (events emitted from use cases)
- No `emitEvent()` phantom API misuse (automation's `effects.emitEvent` is a domain port method — legitimate)
- No `t.increments()` in migrations
- No `console.*` in `libs/` or non-job `modules/` TypeScript
- No empty `catch` blocks (single-line scan)
- No `SELECT *` typed with domain entity types
- Dependency direction `web → modules → libs` clean (dependency-cruiser)

## Suggested remediation order

1. **Quick wins** (behavior-safe, ~1-2h): `searchController` → apiResponse helpers; 8 `throw new Error` → domain errors; `crypto.randomUUID` → `generateUUID` (verify DB-identifier semantics per site); 2 dynamic imports → top-level; `MediaController` → `error.code` check; `generate-knex-types.ts` → `import`
2. **Barrel exports** (~38 entities across 24 modules) — mechanical additions; re-run `yarn lint` to confirm no dependency-cruiser cycles
3. **`SELECT *` typing** (≥59 sites) — add `Db*`/`*Row` types; needs per-repo care
4. **Severity fixes** — tracking handler downgrade for expected errors; audit the 41 interface `logger.error` sites
5. **Backlog (doc roadmap)** — asyncHandler + RFC 7807 error shape; catch-block reduction; EJS console cleanup

---

*Generated by Devin — mechanical scan + manual triage. Counts may include minor false positives in gray-area categories.*

---

## Addendum — latent bugs uncovered during remediation (2026-11-02)

Typing `SELECT *` queries with generated `Db{Table}` types (§8) surfaced SQL that
references schema objects which no longer exist — these code paths fail at
runtime and should be treated as dead or broken:

| Query site | Referenced object | Actual schema object |
|---|---|---|
| `fulfillment/adminOperationsRepo.ts` ×2 | `"warehouse"` | `distributionWarehouse` |
| `subscription/storefrontSubscriptionQueries.ts` | `"subscriptionBilling"` | — (no such table) |
| `gdpr/adminGdprRepo.ts` ×3 | `"gdprRequest"` | `gdprDataRequest` |
| `membership/adminProgramsRepo.ts` ×4 | `"userMembership"`, `"membershipTier"`, `"subscription"` | `membershipSubscription`, `membershipPlan`, `customerSubscription` |
| `customer/storefrontWishlistRepo.ts` | `"wishlistItem"` | `customerWishlistItem` |
| `tax/taxQueryRepo.ts:244` | `"customerTaxExemption"."taxCategoryId"` | column is `applicableTaxCategoryIds` (jsonb) — fixed in this PR |

Also observed: `modules/tax` domain types (`TaxRate.rate`, `TaxZone.createdAt`,
`CustomerTaxExemption.startDate`) declare `number` where the DB/driver returns
`string`/`Date` — repositories bridge with `as unknown as` casts. Domain type
definitions should be corrected in a follow-up.

## Resolution status

Fixed in the associated PR:

- §1 searchController `res.*` → `libs/apiResponse` helpers (16 calls)
- §2 `throw new Error` in domain/application → typed domain/`InternalServerError` (8 sites)
- §3 `crypto.randomUUID` → `libs/uuid` `generateUUID()` (~35 sites)
- §4 `await import()` → top-level imports (webhook controller, S3 service)
- §5 `require()` → `createRequire` for CommonJS knexfile (generator script)
- §6 `message.includes` status derivation → typed `MediaValidationError` (+ sharp error wrap)
- §7 domain entities exported from module barrels (24 modules)
- §8 `SELECT *`/`RETURNING *` typed `Db{Table}` (79 sites); projection/join queries left for per-site `*Row` types
- §9 tracking event handler logs expected domain errors at `debug`

Follow-up resolution (2026-11-03), all previously-deferred items except the
deliberate watchlist:

- **Stale-table queries** — all broken SQL paths remapped to real schema tables:
  `"warehouse"`→`distributionWarehouse`, `"gdprRequest"`→`gdprDataRequest`
  (incl. `gdprDataRequestId`/`deadlineAt`/`reason`/`adminNotes` columns),
  `"userMembership"`/`"membershipTier"`/`"subscription"`→`membershipSubscription`/
  `membershipPlan`/`customerSubscription`, `"wishlistItem"`→`customerWishlistItem`
  +`customerWishlist`, `"subscriptionBilling"`→`subscriptionOrder`,
  `"shipment"`→`fulfillment`, `"productVariantAttribute"`→
  `productAttributeValueMap`+`productAttribute`, `inventoryItem`/`quantity`/
  `reserved`→`inventoryLocation` (`quantity - reservedQuantity`). The missing
  `adminUser`/`user`/`adminUserRole` identity tables (admin login + `job:new:admin`
  were dead paths) were created via `migrations/20261102130000_identity_createAdminUserTables.js`
  and `libs/db/types.ts` regenerated. Stale-table refs remaining: **0**.
- **Tax domain types** — epoch-`number` timestamps (already inconsistent: seconds
  vs milliseconds across call sites) changed to `Date`; `rate`/`exemptionPercent`
  converted with `Number()` at the repo boundary; `as unknown as` casts removed.
- **Projection/join `*Row` typing** — all remaining `Record<string, unknown>`/
  `unknown` query generics typed (~116 sites): `Db{Table}` for full-row,
  per-site `*Row` intersections for `t.*`+joined-column queries, `Pick<Db{Table}>`
  for column projections. Latent bugs fixed: GDPR export selected non-existent
  `cookieCategory`/`consentGiven`/`consentDate` (now exports real consent-flag
  columns via typed `*ExportRow` interfaces on the `GdprService` port);
  localization `TABLE_MAP.category` → `localizationCategoryTranslation`;
  payment method `displayName` dead `row.type` fallback removed.
- **Interface-layer `logger.error` audit** — added `logCaughtError` in
  `libs/errors.ts` (logs `AppError` at declared severity, unexpected at `error`)
  and applied it at all 35 catch sites across 17 interface files.
- **`TranslatableEntityType` dead paths** — `TABLE_MAP` and the port types
  narrowed to the four implemented entity types (`product`, `category`,
  `contentPage`, `notificationTemplate`); `collection`/`attribute`/
  `attributeOption` no longer compile at the call site instead of failing
  against non-existent tables at runtime.
- **EJS `console.*`** — all ~36 client-side debug calls removed from the 17
  `web/admin/views/*.ejs` files. Jobs `console.*` remains the documented
  CLI-output exception.
- **Controller catch blocks → central middleware** — ~370 subsumed catches
  removed across API-mounted controllers; Express 5 forwards rejections to
  `errorMiddleware` (RFC 7807 + legacy `{ success:false, error }` fields).
  Remaining ~229 catches are genuine recovery: admin-mount JSON responses,
  redirects/flash renders, SCIM protocol branches, webhook 200-acks,
  storefront fallbacks, and supplier validation-array responses.
