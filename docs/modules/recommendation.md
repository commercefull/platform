# Recommendation Module (Design Spec)

> **Status**: Proposed — design only, not implemented.
> **Owner module**: `modules/recommendation` (new, optional) + existing curation tables in `modules/product`.
> **Goal**: decent per-product recommendations **without AI, ML models, or an external recommendation engine** — using only merchant curation, simple rules, order co-occurrence counts, catalog similarity, and popularity, all in PostgreSQL.

---

## 1. Goals and Non-Goals

### Goals

- Every published product can show a relevant recommendation set, including on day one with no order history (cold start).
- Merchants can **curate by hand** during product setup, and those links always win.
- The platform **learns "frequently bought together"** from real orders using plain counting.
- Recommendations are **explainable**: each item has a `source` and `reason`, like "Bought together in 42 orders" or "Same brand and category".
- Uses only PostgreSQL, the event bus, and the cron scheduler. No new infrastructure.
- Cheap to serve: one indexed read per placement plus a cache.

### Non-Goals

- Personalised, per-customer ranking (collaborative filtering, embeddings, vector search).
- Real-time model training or A/B optimisation engines.
- The design leaves room for these later. See **§18 Future Work: External Recommendation Engine or AI**.
- Replacing search merchandising (see [Search & Merchandising](../guides/search-and-merchandising.md)).

---

## 2. Review: How Products and Relationships Work Today

### 2.1 Product build flow (summary)

| Step              | Where                                                                                  | Notes                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Create product    | `CreateProductUseCase` (`modules/product/application/useCases/CreateProduct.ts`)       | Creates the product in `draft` with a master variant. Prices go to pricing via `ProductPricingPort`.           |
| Categorise        | `ManageProductCategories`, `productCategoryMap` (`isPrimary`, `position`)              | Many-to-many; one primary category.                                                                            |
| Brand / tags      | `ManageBrands` (`product.brandId`), `ManageProductTags` (`productTag`)                 |                                                                                                                |
| Attributes        | `SetProductAttributes`, `productAttributeValueMap`                                     | Dynamic attributes (colour, size, material…).                                                                  |
| Collections       | `ManageProductCollection(s)`, `productCollectionMap`                                   | `productCollection.isAutomated` exists.                                                                        |
| Bundles           | `ManageBundles`, `productBundle`                                                       | Priced bundles (fixed / dynamic / mix_match).                                                                  |
| **Relationships** | `ManageProductRelationshipsUseCase` (`ManageProductAssets.ts`), table `productRelated` | Types: `related`, `accessory`, `bundle`, `cross_sell`, `up_sell`, `grouped`. Has `position` and `isAutomated`. |
| Publish           | `UpdateProductStatus` → `product.published`                                            |                                                                                                                |

### 2.2 Existing recommendation-adjacent code

| Capability                           | Location                                                                                                 | State                                                                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Manual relationship CRUD (API)       | `POST/GET /business/products/:productId/relationships`, `DELETE /business/relationships/:relationshipId` | Works (integration tests in `tests/integration/product/organization/relationships.test.ts`). **No admin UI.** |
| `productRelated` table               | `migrations/20240805001021_createProductRelatedTable.js`                                                 | Good base for curation. Unique on `(productId, relatedProductId, type)`.                                      |
| Legacy arrays on `product`           | `relatedProducts`, `crossSellProducts`, `upSellProducts` (`uuid[]`)                                      | A **second, parallel** store. Only read by legacy `productRepo.findRelated`.                                  |
| `GET /customer/products/:id/related` | `GetProductUseCase.findRelated` → `ProductRepository.findRelated`                                        | Falls back to "same category". See gap G1.                                                                    |
| `GET /customer/products/:id/similar` | `ProductSearchService.findSimilar`                                                                       | Works. Ranks by count of shared attribute values, then rating.                                                |
| Storefront PDP                       | `storefrontProductController.getProduct` → `product/pdp.ejs`                                             | "You May Also Like" and "Complete the Look" do **not** use relationships (gap G3).                            |
| Analytics "AI recommendations"       | `PredictiveAnalyticsUseCase.generateProductRecommendations`, `/admin/analytics/ai-recommendations`       | Queries snake_case tables that don't exist (gap G5).                                                          |
| Signals available                    | `order.created` (with `items[]`), `order.paid`, `order.cancelled`, `order.refunded`, `basket.item_added` | `product.viewed` is declared and handled but **never emitted** (gap G4).                                      |
| Popularity data                      | `orderItem`, `analyticsProductPerformance` (views, addToCarts, purchases, quantitySold)                  | Available for best-seller fallbacks.                                                                          |

### 2.3 Gaps found during the review (fix before or alongside this work)

| ID  | Gap                                                                                                                                                                                                                                                                | Impact                                                                           | Suggested fix                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| G1  | `ProductRepository.mapToProduct` always sets `categoryId: undefined`, and `buildWhereClause` ignores `filters.categoryId` ("Category filtering not implemented in current schema"). `product` has no `categoryId` column; categories live in `productCategoryMap`. | `findRelated` always returns `[]`. The PDP "related" list is effectively random. | Resolve the primary category through `productCategoryMap` (`isPrimary = true`) and implement the category filter as an `EXISTS` sub-query. |
| G2  | Two relationship stores: the `product.*Products` uuid arrays and the `productRelated` table.                                                                                                                                                                       | Curated links can silently disagree.                                             | Make `productRelated` the single source of truth. Deprecate the arrays; add a copy migration only if existing installs have array data.    |
| G3  | The PDP controller computes "related" by category filter (broken by G1) and "Complete the Look" by text search for `'accessories'`.                                                                                                                                | Merchant curation is never shown.                                                | Replace both with the placement use case (§7).                                                                                             |
| G4  | `product.viewed` is in `libs/events/eventBus.ts` and handled by analytics/tracking, but nothing emits it.                                                                                                                                                          | No view or co-view signal.                                                       | Emit it from the storefront PDP / customer product detail use case with `productId`, `sessionId`, `customerId?`.                           |
| G5  | `PredictiveAnalytics.generateProductRecommendations` uses `order_item`, `product.category`, and `is_active`. The real tables are camelCase `orderItem` and `productCategoryMap`, and there is no `is_active`.                                                      | The admin page shows nothing or errors.                                          | Re-point it at this module's read model (§5), or remove it.                                                                                |
| G6  | `DELETE /business/relationships/:relationshipId` breaks the `/business/{topic}/…` rule.                                                                                                                                                                            | Standards violation.                                                             | Move it to `/business/products/relationships/:relationshipId`.                                                                             |
| G7  | Relationship creation does not check that both products belong to the same `organizationId` / `storeId`.                                                                                                                                                           | Possible cross-tenant linking.                                                   | Validate ownership in the use case.                                                                                                        |
| G8  | `RelationType` / `ProductRelationship` are defined in the infra repo **and** in `ManageProductAssets.ts`, and the port is declared inline in the use case.                                                                                                         | Breaks "domain entities are the single source of truth".                         | Add `domain/entities/ProductRelationship.ts` and `domain/repositories/ProductRelationshipRepository.ts`.                                   |
| G9  | `isBestseller` is a manual flag. Nothing computes it.                                                                                                                                                                                                              | Best-seller fallback is not data driven.                                         | Let the nightly recommendation job compute a popularity rank (§6.4). Optionally sync the flag.                                             |

---

## 3. Decision: Same Module or Separate Module?

| Option                                         | Pros                                                                                                                                                                                                                                | Cons                                                                                                                                                   |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A. Everything inside `product`                 | No new module; direct access to catalog tables.                                                                                                                                                                                     | `product` is `requirement: 'required'` and already large. It would need to subscribe to order events and own order-derived data. Can't be toggled off. |
| B. Everything in a new `recommendation` module | Clean bounded context; optional and toggleable.                                                                                                                                                                                     | Curation during product setup would sit apart from the product editor.                                                                                 |
| **C. Hybrid (recommended)**                    | **Curation stays in `product`** (it is catalog data entered at setup time). **Computed signals, rules, blending, and serving live in `recommendation`.** Product works on its own. Recommendation is optional and degrades cleanly. | Needs two ACL ports (catalog and order).                                                                                                               |

**Chosen: Option C.**

- `product` owns `productRelated`: manual links created during product setup. Fixing G1, G2, G7, and G8 makes it the curation store.
- `recommendation` (new, `requirement: 'optional'`, `dependsOn: ['product', 'order']`) owns:
  - order co-occurrence counts ("bought together")
  - optional co-view counts
  - category/brand/tag rules
  - exclusions (hidden suggestions)
  - the precomputed candidate table
  - the placement/blending use cases and APIs
- Dependency direction: `web → recommendation → (ports) → product/order`. `product` never imports `recommendation`.

---

## 4. Recommendation Sources (Signals)

Six sources, all non-AI. Each produces `(productId → candidateProductId, score, reason)`.

| #   | Source                     | Key       | Needs history? | Owner          | Best for                              |
| --- | -------------------------- | --------- | -------------- | -------------- | ------------------------------------- |
| S1  | Manual links (setup time)  | `manual`  | No             | product        | Everything. Always ranks first.       |
| S2  | Rule-based links           | `rule`    | No             | recommendation | Accessories/add-ons at catalog scale. |
| S3  | Frequently bought together | `fbt`     | Yes (orders)   | recommendation | Cross-sell, cart add-ons.             |
| S4  | Similar products (content) | `similar` | No             | recommendation | "You may also like", alternatives.    |
| S5  | Viewed together (optional) | `coView`  | Yes (views)    | recommendation | Alternatives when orders are sparse.  |
| S6  | Popularity (best sellers)  | `popular` | Yes (orders)   | recommendation | Fallback and empty states.            |

### S1 — Manual links (curation during product setup)

- Stored in `productRelated` with a type:
  - `related` → alternatives ("You may also like")
  - `accessory` / `cross_sell` → complements ("Complete your purchase")
  - `up_sell` → better or more expensive version ("Upgrade")
  - `grouped` → already used for grouped products; **not** used for recommendations
  - `bundle` → reserved for the bundles feature; **not** used for recommendations
- `position` gives the merchant's order.
- Optional **bidirectional** creation (`createBidirectional` already exists). The admin UI shows it as a "Link both ways" checkbox.
- `isAutomated = true` marks a link the merchant **accepted from a suggestion** (§8.2). It is still a manual link and is never auto-deleted.

### S2 — Rule-based links (setup-time, catalog-wide)

Merchants define rules once instead of linking thousands of products by hand:

> "Products in category **Cameras** → recommend top sellers from **Memory Cards** and **Camera Bags** as **accessories** (max 4)."
> "Products tagged **espresso-machine** → recommend tag **coffee-beans** as **cross_sell**."
> "Brand **Acme** → recommend brand **Acme** in the same primary category as **related**."

| Field          | Meaning                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `sourceType`   | `category` \| `tag` \| `brand` \| `collection` \| `productType`                                                                  |
| `sourceId`     | The id matched against the viewed product                                                                                        |
| `targetType`   | `category` \| `tag` \| `brand` \| `collection`                                                                                   |
| `targetId`     | Where candidates come from                                                                                                       |
| `relationType` | `related` \| `accessory` \| `cross_sell` \| `up_sell`                                                                            |
| `targetSort`   | How candidates in the target set are ordered: `bestSelling` (default), `newest`, `rating`, `manual` (uses `categoryManualOrder`) |
| `maxItems`     | Cap per rule (default 4)                                                                                                         |
| `priority`     | Rule order when several rules match                                                                                              |
| `priceBand`    | Optional: `any` \| `cheaper` \| `similar` \| `pricier` relative to the source product (useful for `up_sell`)                     |

Rules are resolved in the **nightly job** into the candidate table (§5), so they cost nothing to serve.

### S3 — Frequently bought together (order co-occurrence)

Plain counting over paid orders. There is no model.

For every paid order, take the set of **distinct `productId`s** (variants roll up to the product). For each unordered pair `{A, B}`, add 1 to `coCount(A,B)` in both directions. Also add 1 to `orderCount(A)` for each product and to the tenant's `totalOrders`.

Metrics (computed nightly):

```
support(A,B)     = coCount(A,B)                          -- how many orders had both
confidence(A→B)  = coCount(A,B) / orderCount(A)          -- P(B | A)
lift(A,B)        = coCount(A,B) * totalOrders / (orderCount(A) * orderCount(B))
```

Ranking rule for "bought with A":

1. Keep pairs with `support ≥ minSupport` (default **3**) **and** `lift ≥ minLift` (default **1.0**). The lift filter drops items that are in every basket anyway, such as gift wrap or shipping protection.
2. Order by `confidence DESC`, then `support DESC`.
3. Keep the top `N` (default **20**) per product in the candidate table.

Worked example (last 180 days, 1,000 orders):

| Pair                | coCount | orderCount(A) | orderCount(B) | confidence | lift | Kept?            |
| ------------------- | ------- | ------------- | ------------- | ---------- | ---- | ---------------- |
| Camera → SD Card    | 42      | 120           | 300           | 0.35       | 1.17 | Yes              |
| Camera → Tote Bag   | 30      | 120           | 400           | 0.25       | 0.63 | No (lift < 1)    |
| Camera → Lens Cloth | 2       | 120           | 15            | 0.02       | 1.11 | No (support < 3) |

Noise controls:

- **Large-order cap**: orders with more than `maxItemsPerOrder` distinct products (default **20**) are skipped. B2B bulk orders and wholesale carts produce meaningless pairs and O(n²) writes.
- **Time decay** (keeps it fresh without re-reading history): the nightly job multiplies every `coCount`, `orderCount`, and `totalOrders` by `decay = 0.5^(1/halfLifeDays)` (default half-life **90 days**). Rows that fall below `0.5` are deleted. This is a single `UPDATE`.
- **Cancellations/refunds** subtract the same increments (§6.2).

### S4 — Similar products (content-based, no history)

A weighted feature-overlap score between two products in the **same tenant**:

| Feature                       | Weight              | Notes                                                                |
| ----------------------------- | ------------------- | -------------------------------------------------------------------- |
| Same primary category         | 4                   | From `productCategoryMap.isPrimary`                                  |
| Any shared secondary category | 1                   |                                                                      |
| Same brand                    | 2                   |                                                                      |
| Shared tags                   | 1 each, max 3       |                                                                      |
| Shared attribute values       | 1 each, max 4       | Reuses `productAttributeValueMap` (the same data `findSimilar` uses) |
| Same product type             | 1                   |                                                                      |
| Price within ±25% / ±50%      | 2 / 1               | Base price from pricing (via catalog port)                           |
| Rating bonus                  | `averageRating / 5` | Tie-breaker only                                                     |

`similarityScore = Σ weights`. Candidates must score at least `minSimilarity` (default **5**, which in practice means same category plus one more signal).

To avoid O(n²), candidates are only compared **within the same primary category bucket** (plus same-brand pairs across categories). This keeps the nightly job linear-ish for typical catalogs.

**Phase 1 shortcut**: call the existing `/similar` logic (`ProductSearchService.findSimilar`) at request time through the catalog port and cache it. Move to the precomputed score in Phase 2.

### S5 — Viewed together (optional, Phase 3)

Needs G4 fixed. Keep a short rolling session window per `sessionId` (last 10 viewed product ids, in `libs/cache`/Redis with a 30-minute TTL). On each `product.viewed`, increment `coViewCount(A,B)` for the new product against the others in the window. Apply the same decay, thresholds (`minSupport` default **5**), and top-N as S3. Store no `customerId`, only aggregate counts.

### S6 — Popularity fallback

Computed nightly from the same increments (`orderCount` decayed = "trending"). Two ranked lists per tenant:

- `popularInCategory(categoryId)`: top 50 by decayed `orderCount` in that primary category
- `popularOverall`: top 50

For brand-new stores with no orders, fall back to `isFeatured DESC, isBestseller DESC, averageRating DESC, publishedAt DESC`.

---

## 5. Data Model

All tables use camelCase with double-quoted identifiers, `uuidv7()` PKs, `createdAt`/`updatedAt`, and are **tenant-scoped by `organizationId`** (plus `storeId` where the storefront is store-scoped). See [database.md](../guidelines/database.md) and [migrations.md](../guidelines/migrations.md).

### 5.1 Owned by `product` (existing, to be hardened)

`productRelated` (exists). Proposed changes:

- Ownership validation in the use case (G7).
- Optional column `note` (`varchar(255)`) for merchant context. Nice to have.
- The legacy `product.*Products` arrays are deprecated — no longer read by new code. A copy migration is only needed if an existing install has array data (ours are empty; seeds write `productRelated` directly) (G2).

### 5.2 Owned by `recommendation` (new)

```
recommendationCoPurchase
  recommendationCoPurchaseId  uuid PK
  organizationId              uuid NOT NULL
  storeId                     uuid NULL
  productId                   uuid NOT NULL
  relatedProductId            uuid NOT NULL
  coCount                     numeric(12,4) NOT NULL DEFAULT 0   -- decayed
  lifetimeCoCount             integer NOT NULL DEFAULT 0          -- raw, for display ("42 orders")
  lastOrderedAt               timestamptz
  createdAt, updatedAt
  UNIQUE (organizationId, storeId, productId, relatedProductId)  -- NULLS NOT DISTINCT
  INDEX (organizationId, productId, coCount DESC)

recommendationProductStat
  recommendationProductStatId uuid PK
  organizationId, storeId
  productId                   uuid NOT NULL
  primaryCategoryId           uuid NULL        -- denormalised at update time for popularity lists
  orderCount                  numeric(12,4)    -- decayed
  lifetimeOrderCount          integer
  lastOrderedAt               timestamptz
  UNIQUE (organizationId, storeId, productId)
  INDEX (organizationId, primaryCategoryId, orderCount DESC)

recommendationTenantStat
  organizationId, storeId     -- UNIQUE
  totalOrders                 numeric(14,4)    -- decayed, used for lift
  lastRebuiltAt               timestamptz

recommendationProcessedOrder                    -- idempotency ledger
  orderId                     uuid PK
  organizationId, storeId
  productIds                  uuid[] NOT NULL   -- exactly what was counted, so it can be reversed
  status                      varchar(20)       -- 'counted' | 'reversed' | 'skipped'
  createdAt, updatedAt

recommendationCoView                            -- Phase 3, same shape as recommendationCoPurchase

recommendationRule
  recommendationRuleId        uuid PK
  organizationId, storeId
  name                        varchar(255)
  sourceType, sourceId, targetType, targetId
  relationType                varchar(20)
  targetSort                  varchar(20) DEFAULT 'bestSelling'
  priceBand                   varchar(10) DEFAULT 'any'
  maxItems                    integer DEFAULT 4
  priority                    integer DEFAULT 0
  isActive                    boolean DEFAULT true
  INDEX (organizationId, sourceType, sourceId, isActive)

recommendationExclusion                          -- "never recommend B on A" (merchant hides a suggestion)
  recommendationExclusionId   uuid PK
  organizationId, storeId
  productId                   uuid NOT NULL
  excludedProductId           uuid NULL        -- NULL + scope='global' = never recommend excludedProductId anywhere
  scope                       varchar(10)      -- 'pair' | 'global'
  reason                      varchar(255)
  UNIQUE (organizationId, productId, excludedProductId)

recommendationCandidate                          -- serving read model, rebuilt nightly
  recommendationCandidateId   uuid PK
  organizationId, storeId
  productId                   uuid NOT NULL
  candidateProductId          uuid NOT NULL
  source                      varchar(10)      -- 'rule' | 'fbt' | 'similar' | 'coView'
  relationType                varchar(20)      -- related | accessory | cross_sell | up_sell
  score                       numeric(10,4)
  reason                      jsonb            -- { "support": 42, "confidence": 0.35 } / { "shared": ["brand","category"] } / { "ruleId": "…" }
  computedAt                  timestamptz
  UNIQUE (organizationId, storeId, productId, candidateProductId, source)
  INDEX (organizationId, storeId, productId, relationType, score DESC)

recommendationPopular                            -- serving read model for S6, rebuilt nightly
  organizationId, storeId, scope ('overall'|'category'), categoryId NULL,
  productId, rank, score
  INDEX (organizationId, storeId, scope, categoryId, rank)
```

Why keep raw counts separate from the candidate table: the raw tables are updated **incrementally** in real time. The candidate table is a **ranked, filtered snapshot**, which makes serving a single indexed range scan.

---

## 6. Data Pipeline

### 6.1 Events consumed (Published Language)

| Event                                                          | Payload used                       | Action                                                                                                              |
| -------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `order.paid`                                                   | `orderId`                          | Load order lines via `OrderLinesPort`. If not in `recommendationProcessedOrder`, count pairs (§4 S3).               |
| `order.cancelled`                                              | `orderId`                          | If `counted`, subtract the stored `productIds` pairs and mark `reversed`.                                           |
| `order.refunded`                                               | `orderId` (full refund only)       | Same as cancelled. Partial refunds are ignored (still bought together).                                             |
| `product.deleted` / `product.unpublished` / `product.archived` | `productId`                        | Delete candidate rows where it is `productId` or `candidateProductId`. Raw counts are kept, filtered at serve time. |
| `product.viewed`                                               | `productId`, `sessionId` (Phase 3) | Update the session window and `recommendationCoView`.                                                               |

Why `order.paid` rather than `order.created`: unpaid or failed orders are noise. `order.paid` can be emitted by more than one path (webhook plus sync, see comments in `fulfillment/application/eventHandlers.ts`), so the **`recommendationProcessedOrder` ledger is mandatory** for idempotency. The same applies to at-least-once outbox delivery ([events.md](../guidelines/events.md)).

### 6.2 Incremental update (per paid order)

```
onOrderPaid(orderId):
  if ledger.exists(orderId): return
  lines = orderLinesPort.getLines(orderId)            // [{ productId, organizationId, storeId }]
  ids   = distinct(lines.productId).filter(notNull)
  if ids.length < 1: ledger.insert(orderId, [], 'skipped'); return
  if ids.length > maxItemsPerOrder: ledger.insert(orderId, ids, 'skipped'); return
  in one transaction:
    upsert recommendationProductStat  (+1 each id)
    upsert recommendationTenantStat   (+1)
    upsert recommendationCoPurchase   (+1 for each ordered pair A≠B)   -- single INSERT … SELECT FROM unnest() … ON CONFLICT DO UPDATE
    ledger.insert(orderId, ids, 'counted')
```

A 20-item order produces 380 pair rows in one statement. Typical 2–4 item orders produce 2–12 rows.

### 6.3 Nightly job (`modules/recommendation/scheduledJobs.ts`, registered in `boot/scheduledJobs.ts`)

Runs per tenant. Each step is idempotent:

1. **Decay**: `UPDATE … SET coCount = coCount * :decay`, the same for `orderCount` and `totalOrders`, then delete rows below `0.5`.
2. **Rebuild FBT candidates**: one `INSERT … SELECT` that joins `recommendationCoPurchase` with `recommendationProductStat` for confidence/lift, applies thresholds, and uses `ROW_NUMBER() OVER (PARTITION BY productId ORDER BY confidence DESC)` to keep the top N.
3. **Rebuild similar candidates** (Phase 2): page through catalog features via `CatalogPort.listFeatures(organizationId, cursor)` and score within category buckets (§4 S4).
4. **Resolve rules**: for each active rule, find matching source products, pick top targets by `targetSort` (using `recommendationPopular` for `bestSelling`), and write `source = 'rule'` candidates.
5. **Rebuild popularity lists** (S6).
6. Record `recommendationTenantStat.lastRebuiltAt`. Emit `recommendation.rebuilt` (optional, for audit).

Use `DELETE … WHERE source = X AND computedAt < :runStart` after the insert so the swap is atomic per source.

### 6.4 Backfill (one-off job)

`yarn job:recommendation:backfill [--days=180]` pages through paid orders via `OrderLinesPort.listPaidOrderIdsSince(date, cursor)` and runs the same `onOrderPaid` logic, then runs the nightly job once. Because of the ledger, it is safe to re-run.

---

## 7. Serving: Placements and Blending

A **placement** is a named slot on a page. Each placement has an ordered **waterfall** of sources. The blender fills slots from the first source, dedupes, then moves to the next source until `limit` is reached.

| Placement       | Where                                 | Waterfall (in order)                                                                   | Default limit |
| --------------- | ------------------------------------- | -------------------------------------------------------------------------------------- | ------------- |
| `pdpAlsoLike`   | PDP "You may also like"               | manual `related` → rule `related` → `similar` → `coView` → popular in category         | 8             |
| `pdpBoughtWith` | PDP "Frequently bought together"      | manual `accessory`+`cross_sell` → rule `accessory`/`cross_sell` → `fbt`                | 3             |
| `pdpUpgrade`    | PDP "Upgrade / premium option"        | manual `up_sell` → rule `up_sell` → `similar` filtered to price > current and ≤ 2×     | 3             |
| `cartAddOns`    | Basket/checkout "Complete your order" | aggregate over basket items: manual `cross_sell`/`accessory` → `fbt` → popular overall | 4             |
| `emptyState`    | Home, 404, empty search/cart          | popular overall (store)                                                                | 8             |
| `postPurchase`  | Order confirmation page and email     | same as `cartAddOns`, seeded with the order's products                                 | 4             |

Placement definitions are code constants with config overrides (§10), so merchants can reorder or disable sources per placement without a deploy.

### 7.1 Multi-product (basket) aggregation

For `cartAddOns`, score each candidate as `Σ score over all basket products that recommend it`. A candidate suggested by 2 of 3 cart items therefore outranks one suggested by a single item. Exclude products already in the basket.

### 7.2 Eligibility filters (applied after blending, before limit)

A candidate is dropped if any of these is true:

- it is the source product, or in the basket/order
- it is not `status = 'active'`, not `visibility IN ('visible','catalog')`, is soft-deleted, or not approved (`approvalStatus`, marketplace)
- it belongs to a different `organizationId` / `storeId` than the request context
- it is out of stock and the product manages inventory (via the catalog port's availability flag; configurable `hideOutOfStock`, default `true`)
- it matches a `recommendationExclusion` (pair or global)
- it is a child of the same `grouped` parent as the source (siblings are variants, not recommendations)

Eligibility is resolved in **one batched call**: `CatalogPort.getCards(ids[], context)` returns card DTOs (name, slug, image, price cents, availability). The storefront partial `product-card.ejs` renders them directly.

### 7.3 Pseudocode

```ts
async execute({ placement, productIds, context, limit }) {
  const plan = placements[placement];
  const seen = new Set(productIds);
  const picked: Pick[] = [];
  for (const step of plan.sources) {
    const candidates = await this.fetch(step, productIds, context);   // manual via CatalogPort, others via repo
    for (const c of rankAndAggregate(candidates)) {
      if (seen.has(c.productId)) continue;
      seen.add(c.productId);
      picked.push(c);
    }
    if (picked.length >= limit * 2) break;                             // over-fetch to survive filtering
  }
  const cards = await this.catalog.getCards(picked.map(p => p.productId), context);
  return applyEligibility(picked, cards, exclusions).slice(0, limit);  // keeps source + reason on each item
}
```

### 7.4 Response shape

Follows [api-responses.md](../guidelines/api-responses.md):

```json
{
  "success": true,
  "data": {
    "placement": "pdpBoughtWith",
    "productId": "0191…",
    "items": [
      {
        "productId": "0192…",
        "name": "64GB SD Card",
        "slug": "64gb-sd-card",
        "imageUrl": "…",
        "effectivePriceCents": 1999,
        "currency": "USD",
        "source": "fbt",
        "reason": { "support": 42, "confidence": 0.35 }
      }
    ]
  }
}
```

### 7.5 Caching

- Key: `rec:{organizationId}:{storeId}:{placement}:{sortedProductIds}:{limit}` in `libs/cache` (Redis if configured, otherwise memory).
- TTL **15 minutes** for PDP placements and **2 minutes** for `cartAddOns`.
- Invalidate by tenant prefix after the nightly rebuild, and by product on manual link or exclusion changes.
- If the candidate tables are empty (new store or module just enabled), the waterfall falls through to manual → similar (request-time) → popular. It never errors.

---

## 8. Merchant Experience

### 8.1 During product setup (product editor → new **Recommendations** tab)

- Three lists with product search and drag-to-reorder:
  - **Related / alternatives** (`related`)
  - **Accessories & add-ons** (`accessory` + `cross_sell`)
  - **Upgrades** (`up_sell`)
- "Link both ways" checkbox → `createBidirectional`.
- Uses the existing `/business/products/:productId/relationships` endpoints (after G6 route fix). The admin portal calls `manageProductRelationshipsUseCase` directly ([web-layer.md](../guidelines/web-layer.md)).

### 8.2 Suggestions panel (only when the recommendation module is enabled)

On the same tab, a read-only **"Suggested for this product"** list from `recommendationCandidate`, with its source and reason ("Bought together in 42 orders", "Same brand and category"):

- **Accept**: creates a manual `productRelated` link with `isAutomated = true`, which pins it.
- **Hide**: creates a `recommendationExclusion` (pair).
- **Hide everywhere**: creates a global exclusion (for example, for a gift card).

### 8.3 Rules screen

Under Admin → Marketing → Recommendations:

- CRUD for rules, with a "Preview on product…" picker that shows the resolved result.
- Global exclusions list.
- Per-placement config (source order, limits, `hideOutOfStock`).
- "Rebuild now" button, which queues the nightly job for this tenant.
- A small stats card: products with ≥1 FBT candidate, last rebuild, orders counted.

### 8.4 Analytics page

Re-point `/admin/analytics/ai-recommendations` (G5) to read `recommendationCandidate` (source `fbt`) and `recommendationPopular`. Rename it to "Recommendation Insights", since nothing here is AI.

---

## 9. Module Structure

Follows [modules-ddd.md](../guidelines/modules-ddd.md) and [module-integration.md](../guidelines/module-integration.md). Unit tests follow the basket pattern ([testing.md](../guidelines/testing.md)).

```
modules/recommendation/
├── manifest.ts
├── index.ts                                   # exports entities, use cases, ports, errors, routers
├── scheduledJobs.ts                           # nightly rebuild
├── domain/
│   ├── entities/
│   │   ├── RecommendationRule.ts
│   │   ├── RecommendationExclusion.ts
│   │   └── RecommendationCandidate.ts         # Source, RelationType, Reason value types
│   ├── valueObjects/Placement.ts              # placement ids + default waterfalls
│   ├── services/
│   │   ├── CoOccurrenceScorer.ts              # pure: support/confidence/lift/threshold/rank
│   │   ├── SimilarityScorer.ts                # pure: weighted feature overlap
│   │   └── RecommendationBlender.ts           # pure: waterfall, aggregation, dedupe, eligibility
│   ├── repositories/
│   │   ├── CoPurchaseRepository.ts
│   │   ├── CandidateRepository.ts
│   │   ├── RuleRepository.ts
│   │   └── ExclusionRepository.ts
│   ├── events/RecommendationEvents.ts
│   └── errors/RecommendationErrors.ts         # recommendation.rule_not_found, recommendation.validation_error
├── application/
│   ├── ports/
│   │   ├── CatalogPort.ts                     # getCards, getManualLinks, listFeatures, getPrimaryCategory
│   │   ├── OrderLinesPort.ts                  # getLines(orderId), listPaidOrderIdsSince(date, cursor)
│   │   └── RecommendationConfigPort.ts        # thresholds and placement overrides
│   ├── useCases/
│   │   ├── GetRecommendations.ts              # placement serving (§7)
│   │   ├── RecordOrderCoPurchase.ts           # §6.2 (+ reverse)
│   │   ├── RebuildRecommendations.ts          # §6.3
│   │   ├── BackfillCoPurchase.ts              # §6.4
│   │   ├── ManageRecommendationRules.ts       # grouped facade
│   │   ├── ManageRecommendationExclusions.ts
│   │   ├── ListProductSuggestions.ts          # §8.2
│   │   └── wired.ts
│   └── eventHandlers.ts                       # order.paid / cancelled / refunded / product.*
├── infrastructure/
│   ├── repositories/…                          # parameterised SQL only
│   └── acl/
│       ├── ProductCatalogAdapter.ts            # imports only from modules/product/index.ts
│       ├── ProductCatalogAdapter.contract.test.ts
│       ├── OrderLinesAdapter.ts                # imports only from modules/order/index.ts
│       └── OrderLinesAdapter.contract.test.ts
├── interface/
│   ├── controllers/{RecommendationCustomerController,RecommendationBusinessController}.ts
│   └── routers/{recommendationCustomerRouter,recommendationBusinessRouter}.ts
└── tests/testUtils.ts
```

Ports budget: 3 outbound ports, within the 5-port limit. The `product` and `order` modules may need small **public** use cases to back these ports, for example `GetProductCards(ids, context)`, `ListCatalogFeatures(orgId, cursor)`, and `GetOrderLines(orderId)`. Expose them through each module's `index.ts`, never via deep imports.

### 9.1 Manifest

```ts
export const manifest: ModuleManifest = {
  name: 'recommendation',
  description: 'Rule-, co-purchase- and similarity-based product recommendations (no AI)',
  requirement: 'optional',
  dependsOn: ['product', 'order'],
  routes: [
    { path: '/customer/recommendation', auth: 'customer' }, // public read; optional auth
    { path: '/business/recommendation', auth: 'organization' },
  ],
  graphql: { enabled: false },
  events: {
    subscribes: [
      'order.paid',
      'order.cancelled',
      'order.refunded',
      'product.deleted',
      'product.unpublished',
      'product.archived',
      'product.viewed',
    ],
    publishes: ['recommendation.rebuilt', 'recommendation.rule_created', 'recommendation.rule_updated', 'recommendation.rule_deleted'],
  },
  tables: {
    names: [
      'recommendationCoPurchase',
      'recommendationProductStat',
      'recommendationTenantStat',
      'recommendationProcessedOrder',
      'recommendationRule',
      'recommendationExclusion',
      'recommendationCandidate',
      'recommendationPopular',
    ],
  },
  featureFlagKey: 'module.recommendation.enabled',
};
```

### 9.2 Degradation when disabled

- The storefront checks the module registry. If `recommendation` is disabled, the PDP uses product's `GET /customer/products/:id/related` (manual links, then the fixed category fallback from G1) and `/similar`.
- `product` has no knowledge of `recommendation`.

---

## 10. Configuration

Via the configuration module (see [configuration.md](./configuration.md)). All values are per organization, with store override.

| Key                                      | Default | Description                                       |
| ---------------------------------------- | ------- | ------------------------------------------------- |
| `recommendation.fbt.minSupport`          | `3`     | Minimum decayed co-purchase count                 |
| `recommendation.fbt.minLift`             | `1.0`   | Drop pairs bought together no more than by chance |
| `recommendation.fbt.maxItemsPerOrder`    | `20`    | Skip larger orders                                |
| `recommendation.decay.halfLifeDays`      | `90`    | Time decay for all counters                       |
| `recommendation.candidates.topN`         | `20`    | Candidates kept per product per source            |
| `recommendation.similar.minScore`        | `5`     | Minimum similarity score                          |
| `recommendation.similar.priceBandPct`    | `25`    | "Similar price" band                              |
| `recommendation.coView.enabled`          | `false` | Phase 3                                           |
| `recommendation.hideOutOfStock`          | `true`  |                                                   |
| `recommendation.cache.ttlSeconds`        | `900`   | PDP placements                                    |
| `recommendation.placements.<id>.sources` | see §7  | Override source order                             |
| `recommendation.placements.<id>.limit`   | see §7  |                                                   |

---

## 11. API

### 11.1 Customer (public; `optionalCustomerAuth`; store context from the request)

| Method | Endpoint                                                                     | Description                                                    |
| ------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| GET    | `/customer/recommendation/products/:productId?placement=pdpAlsoLike&limit=8` | Placement for one product                                      |
| GET    | `/customer/recommendation/basket/:basketId?placement=cartAddOns&limit=4`     | Placement for a basket (ownership checked)                     |
| POST   | `/customer/recommendation/products`                                          | Body `{ productIds[], placement, limit }` for headless clients |
| GET    | `/customer/recommendation/popular?categoryId=&limit=`                        | Popular overall or in a category                               |

### 11.2 Business (`isOrganizationLoggedIn`, `/business/recommendation/...`)

| Method | Endpoint                                                          | Description                                                  |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| GET    | `/business/recommendation/products/:productId/suggestions`        | Candidates with source and reason (§8.2)                     |
| POST   | `/business/recommendation/products/:productId/suggestions/accept` | `{ candidateProductId, relationType }` → creates manual link |
| GET    | `/business/recommendation/products/:productId/preview?placement=` | Exactly what the storefront would render                     |
| GET    | `/business/recommendation/rules`                                  | List rules                                                   |
| POST   | `/business/recommendation/rules`                                  | Create rule                                                  |
| PUT    | `/business/recommendation/rules/:ruleId`                          | Update rule                                                  |
| DELETE | `/business/recommendation/rules/:ruleId`                          | Delete rule                                                  |
| GET    | `/business/recommendation/exclusions`                             | List exclusions                                              |
| POST   | `/business/recommendation/exclusions`                             | Create (pair or global)                                      |
| DELETE | `/business/recommendation/exclusions/:exclusionId`                | Remove                                                       |
| POST   | `/business/recommendation/rebuild`                                | Queue a tenant rebuild                                       |
| GET    | `/business/recommendation/stats`                                  | Coverage and last-rebuild stats                              |

### 11.3 Product module (existing, after fixes)

| Method | Endpoint                                              | Change                                                        |
| ------ | ----------------------------------------------------- | ------------------------------------------------------------- |
| GET    | `/business/products/:productId/relationships`         | unchanged                                                     |
| POST   | `/business/products/:productId/relationships`         | + ownership validation, + `bidirectional` flag                |
| PUT    | `/business/products/:productId/relationships/reorder` | **new**, backed by existing `bulkReorder`                     |
| DELETE | `/business/products/relationships/:relationshipId`    | **moved** from `/business/relationships/:id` (G6)             |
| GET    | `/customer/products/:productId/related`               | Uses `productRelated` first, then the fixed category fallback |

---

## 12. Storefront Integration

- `storefrontProductController.getProduct` calls `getRecommendationsUseCase` directly (no HTTP) for `pdpAlsoLike`, `pdpBoughtWith`, and optionally `pdpUpgrade`. The results replace today's `relatedProducts` / `complementaryProducts` (G3).
- `pdp.ejs`: keep the "You May Also Like" and "Complete the Look" sections, fed by the new data. Add an optional "Frequently bought together" block with an "Add all to cart" button that calls the existing basket add-item endpoints.
- The basket page and order confirmation use `cartAddOns` / `postPurchase`.
- All new UI strings go through i18n ([i18n.md](../guidelines/i18n.md)), for example `storefront:recommendations.boughtTogether`.
- To keep PDP time-to-first-byte low, the PDP may render recommendations after load via the customer endpoint (progressive enhancement, [vanilla-javascript-standards.md](../guidelines/vanilla-javascript-standards.md)).

---

## 13. Performance and Scale

| Concern             | Approach                                                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Write amplification | ≤ n(n−1) rows per order with an n ≤ 20 cap, single batched upsert, asynchronous via the event handler                                                                      |
| Table growth        | Decay plus pruning keeps `recommendationCoPurchase` bounded by _active_ pairs, not history                                                                                 |
| Serving             | One index range scan on `(organizationId, storeId, productId, relationType, score DESC)` + one batched card lookup + cache                                                 |
| Nightly job         | Per-tenant, set-based SQL; similarity bucketed by category; `FOR UPDATE SKIP LOCKED`-style tenant claim if multi-node (reuse the cron scheduler's single-runner semantics) |
| Cold start          | Manual → rules → similar → popular; never empty for a product with a category                                                                                              |

---

## 14. Security, Privacy, Multi-Tenancy

- Every query filters by `organizationId` (and `storeId` when present). Candidates are never computed across tenants.
- Parameterised SQL only. Pair upserts use `unnest($1::uuid[])`, never string-built `IN` lists of user input.
- Co-purchase and co-view tables hold **aggregates only**: no `customerId`, no `sessionId`. They are out of scope for GDPR export/erasure. The `recommendationProcessedOrder` ledger holds `orderId` + product ids only. It is deleted with the order (FK `ON DELETE CASCADE` is not possible across modules, so handle `order.deleted`/GDPR erasure events if the order module emits them).
- The basket placement checks basket ownership (customer or session) before reading basket contents.
- Business routes use `isOrganizationLoggedIn`. Rule/exclusion ids are validated against the caller's organization.

---

## 15. Testing Plan

| Layer               | Tests                                                                                                                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain (pure)       | `CoOccurrenceScorer` (support/confidence/lift, thresholds, lift filter, ties), `SimilarityScorer` (weights, caps, price band), `RecommendationBlender` (waterfall order, dedupe, basket aggregation, exclusion, self/basket exclusion, limit, over-fetch) |
| Use cases           | `RecordOrderCoPurchase`: idempotent on a duplicate `order.paid`, skips large orders, reverses on cancel. `GetRecommendations`: empty tables fall back to popular; manual always first. `ManageRecommendationRules`: validation, ownership                 |
| ACL contract tests  | `ProductCatalogAdapter`, `OrderLinesAdapter`: translation both ways, provider-unavailable outcomes                                                                                                                                                        |
| Integration         | `tests/integration/recommendation/…`: seed orders → backfill → rebuild → `GET /customer/recommendation/products/:id?placement=pdpBoughtWith` returns the expected pair; exclusion hides it; accept creates a `productRelated` row                         |
| Product regressions | G1 category fallback, G6 route move, G7 cross-tenant link rejected                                                                                                                                                                                        |

Naming follows `it('should … when …')`, with shared factories in `modules/recommendation/tests/testUtils.ts`.

---

## 16. Rollout Plan

| Phase | Scope                                                                                                                                                                                                                       | Value                                                      |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 0     | Product fixes: G1, G2, G3 (PDP uses manual links plus fixed category fallback), G6, G7, G8. Admin **Recommendations tab** for manual links.                                                                                 | Curation works end to end. No new module yet.              |
| 1     | `recommendation` module: co-purchase counters, ledger, backfill, nightly FBT + popular rebuild, `GetRecommendations` with manual → fbt → similar (request-time) → popular, customer API, PDP + cart placements, exclusions. | "Frequently bought together" and data-driven best sellers. |
| 2     | Rules (S2), precomputed similarity (S4), suggestions panel with Accept/Hide, rules admin screen, re-pointed analytics page (G5).                                                                                            | Scales curation to large catalogs.                         |
| 3     | `product.viewed` emission (G4) and co-view (S5); post-purchase email placement; optional sync of `isBestseller` (G9).                                                                                                       | Better alternatives for low-order catalogs.                |

---

## 17. Open Questions

1. Should FBT be scoped per **store** or shared across all stores of an organization? The proposal counts per `(organizationId, storeId)` and falls back to organization-wide when a store has fewer than `minSupport` pairs.
2. Marketplace: should cross-vendor recommendations be allowed on a vendor's PDP? The proposal says yes on the platform storefront and same-vendor only on vendor storefronts, via a placement config flag.
3. Should accepted suggestions (`isAutomated = true`) be reviewed periodically, for example flagged when their FBT support decays to zero?
4. B2B: should customer-group catalog visibility (b2b module) filter recommendations? If so, add it to `CatalogPort.getCards(context)`.

---

## 18. Future Work: External Recommendation Engine or AI

> **Status**: Future work — **not part of the phases above**. This section is kept so a later team can add a third-party recommendation engine or an AI/ML approach **without redesigning the module**. Nothing here is needed for the built-in, non-AI recommendations.

### 18.1 Principle: the engine is just another source

An external engine or AI model plugs in as **one more source in the placement waterfall** (§7), with the key `external`. Everything else stays in the platform:

| Stays in the platform (always)                                            | Delegated to the engine                              |
| ------------------------------------------------------------------------- | ---------------------------------------------------- |
| Manual links (S1) rank first; merchant pins and exclusions always win     | Ranking candidates (personalised or not)             |
| Eligibility filters (§7.2): tenant, status, visibility, stock, exclusions | Learning from interactions (views, carts, purchases) |
| Product cards, prices, i18n (via `CatalogPort.getCards`)                  | Optional "reason" text                               |
| Fallback to built-in sources when the engine is slow, down, or disabled   |                                                      |

The engine therefore **never decides on its own what is shown**. It proposes product ids, and the platform filters and renders them. If the engine returns a product that is archived, out of stock, or from another tenant, the platform drops it.

### 18.2 Provider port (same pattern as the search adapter)

This mirrors `libs/search` (`SearchAdapter` + `SEARCH_BACKEND`, see [Search & Merchandising](../guides/search-and-merchandising.md)) and the ACL rules in [module-integration.md](../guidelines/module-integration.md):

```ts
// modules/recommendation/application/ports/RecommendationProviderPort.ts
export interface RecommendationProviderPort {
  readonly name: string; // 'builtin' | 'vendorX' | 'pgvector' | …
  recommend(req: ProviderRequest): Promise<ProviderResult>;
  syncCatalogItem?(item: CatalogFeatureDto): Promise<void>; // push catalog changes
  removeCatalogItem?(productId: string): Promise<void>;
  recordInteraction?(event: InteractionDto): Promise<void>; // view / addToCart / purchase
  forgetUser?(pseudonymousUserId: string): Promise<void>; // GDPR erasure
  health(): Promise<{ healthy: boolean; details?: Record<string, unknown> }>;
}

export interface ProviderRequest {
  organizationId: string;
  storeId?: string;
  placement: PlacementId;
  productIds: string[]; // PDP product or basket contents
  pseudonymousUserId?: string; // only with consent (§18.5)
  limit: number;
}

export type ProviderResult =
  | { status: 'ok'; items: Array<{ productId: string; score: number; reason?: string }>; modelVersion?: string }
  | { status: 'unavailable'; reason: 'timeout' | 'error' | 'disabled' | 'notConfigured' };
```

- Adapters live in `modules/recommendation/infrastructure/providers/<Name>ProviderAdapter.ts`. Each has a contract test, including the `unavailable` paths.
- `unavailable` is a **documented outcome, not an exception**. The blender skips the `external` step and continues with the built-in sources (rule 7 of module-integration: optional providers degrade, they do not crash).
- The existing `GetRecommendations` use case does not change shape. It receives the provider through `wired.ts` like any other port.

### 18.3 Two integration modes

| Mode                         | How it works                                                                                                                                                                                                                                         | When to choose                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **A. Batch (offline)**       | The nightly job (§6.3) asks the provider for the top N per product and writes the results into `recommendationCandidate` with `source = 'external'`. Serving is unchanged: one indexed read plus cache.                                              | Start here. Non-personalised ("people also bought" / "similar"), no latency risk, cost is predictable.         |
| **B. Online (request-time)** | `GetRecommendations` calls `provider.recommend()` within a strict **time budget** (default 150 ms) with a **circuit breaker** (open after 5 consecutive failures, retry after 60 s). Responses are cached briefly (60 s) per user and placement key. | Only when **personalisation** is needed (results depend on the visitor), and the provider's latency is proven. |

Both modes can run at the same time: batch for PDP placements, online for `cartAddOns` or a personalised home page.

### 18.4 Data feeds to the engine

External engines need a catalog feed and an interaction feed. Both can reuse existing platform plumbing:

| Feed                    | Source in the platform                                                                                              | Delivery                                                                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog items           | `product.created/updated/published/unpublished/deleted` events + `CatalogPort.listFeatures` (already needed for S4) | Event handler calls `syncCatalogItem` / `removeCatalogItem`. Initial full sync with a one-off job using the same paging as the backfill (§6.4).                                                                                     |
| Interactions            | `product.viewed` (needs G4), `basket.item_added`, `order.paid` (already consumed in §6.1)                           | Event handler calls `recordInteraction`. Alternatively, add the provider as a destination in the **tracking** module, which already maps platform events to external providers with consent categories (`defaultEventMappings.ts`). |
| Recommendation outcomes | New `recommendation.impression` / `recommendation.clicked` events (see §18.6)                                       | Sent as interactions so the engine can learn from what was shown and clicked.                                                                                                                                                       |

Delivery goes through the durable outbox ([events.md](../guidelines/events.md)), so an engine outage delays the feed but loses nothing.

### 18.5 Privacy, consent, and security guardrails

- **Consent**: personalised mode (online with `pseudonymousUserId`) is only used when the visitor has granted the relevant consent category (the same model the tracking module uses). Without consent, fall back to non-personalised requests (product ids only).
- **Pseudonymous ids only**: send a keyed hash of `customerId`/`visitorId` (per-organization secret), never emails, names, addresses, or raw ids.
- **GDPR erasure**: on the gdpr module's erasure event, call `provider.forgetUser()`. Record provider-side data residency and retention in the gdpr documentation.
- **Credentials**: store API keys via `libs/secrets` (or the integration module's credential storage). Never log them ([security.md](../guidelines/security.md)).
- **Tenant isolation**: one provider dataset/namespace per organization (or strict tenant filtering on the provider side). The local eligibility filter (§7.2) remains the final safety net.
- **Cost control**: batch mode by default. For online mode, rate-limit per tenant and rely on the cache.

### 18.6 Measure before switching

Don't switch from built-in to external without evidence. Before adding any engine, add:

1. **Impression and click events**: `recommendation.impression` (`placement`, `source`, `productIds[]`, `requestId`) and `recommendation.clicked` (`placement`, `source`, `productId`, `requestId`). Attribute add-to-cart and purchases that happen within the session.
2. **A/B split**: assign visitors deterministically (hash of `visitorId` mod 100) to `builtin` or `external` per placement, configured as a percentage.
3. **Metrics per placement and source**: click-through rate, add-to-cart rate, attributed revenue (integer cents), and coverage (share of products with ≥ N recommendations).

These events are also useful for the built-in engine (for example, tuning `minSupport`), so they could be pulled forward into Phase 3 if wanted.

### 18.7 AI options that fit this design

| Option                                                         | What it adds                                                                                                                           | How it plugs in                                                                                                                                                                                                                                                          |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Managed recommendation service** (cloud or SaaS recommender) | Collaborative filtering, personalisation, trending, handled by the vendor                                                              | Provider adapter (§18.2) + feeds (§18.4). Batch mode first, then online for personalised placements.                                                                                                                                                                     |
| **Embeddings + pgvector (self-hosted)**                        | Better "similar products" from product text and/or images (semantic similarity instead of attribute overlap). Stays inside PostgreSQL. | Nightly job computes an embedding per product (on `product.updated`) into a `recommendationProductEmbedding` table (`vector` column). Nearest neighbours are written as `source = 'similar'` or `'external'` candidates. Aligns with the future pgvector search adapter. |
| **LLM-assisted curation (offline)**                            | Suggests complementary products ("what goes with this?") and short human-readable reasons, especially for new catalogs with no orders  | Runs in the nightly job or on demand in the admin. Output goes to the **suggestions panel** (§8.2) for merchant approval, never straight to the storefront. Accepted items become manual links.                                                                          |
| **Learned ranking on built-in signals**                        | Blends S1–S6 scores with weights learned from click/purchase data (§18.6) instead of a fixed waterfall                                 | Replaces the fixed order inside `RecommendationBlender` with a weighted score. Weights are stored per tenant and placement. No external service needed.                                                                                                                  |

### 18.8 What would change

| Area          | Change                                                                                                                                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ports         | +1 outbound port (`RecommendationProviderPort`), 4 of the 5-port budget                                                                                                                                                                                                         |
| Tables        | `recommendationCandidate.source` gains `'external'`. Optional: `recommendationProductEmbedding`, `recommendationExperiment` (A/B config)                                                                                                                                        |
| Events        | Publishes `recommendation.impression`, `recommendation.clicked`. Subscribes to product lifecycle events for catalog sync                                                                                                                                                        |
| Configuration | `recommendation.provider` (`builtin` default), `recommendation.provider.mode` (`batch` \| `online`), `recommendation.provider.timeoutMs` (150), `recommendation.experiment.<placement>.externalPercent` (0), and `external` allowed in `recommendation.placements.<id>.sources` |
| Admin UI      | Provider settings page (connection test via `health()`), experiment results per placement                                                                                                                                                                                       |
| Unchanged     | Customer/business APIs and response shape (`source` becomes `external`), manual curation, rules, exclusions, eligibility, caching, storefront templates                                                                                                                         |

### 18.9 Suggested order if this is ever picked up

1. Impression/click events and A/B assignment (§18.6). This is useful even without an engine.
2. `RecommendationProviderPort` + one adapter in **batch mode** for a single placement, at 10% of traffic.
3. Compare against built-in for a few weeks. Expand only if the metrics improve.
4. Online/personalised mode, with consent gating, for the placements that benefit.


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/recommendation/exclusions` | `asyncHandler(controller.listExclusions)` | — |
| POST | `/recommendation/exclusions` | `asyncHandler(controller.createExclusion)` | — |
| DELETE | `/recommendation/exclusions/:exclusionId` | `asyncHandler(controller.deleteExclusion)` | — |
| GET | `/recommendation/popular` | `asyncHandler(controller.getPopular)` | — |
| POST | `/recommendation/products` | `asyncHandler(controller.postProductRecommendations)` | — |
| GET | `/recommendation/products/:productId` | `asyncHandler(controller.getProductRecommendations)` | — |
| GET | `/recommendation/products/:productId/preview` | `asyncHandler(controller.previewPlacement)` | — |
| GET | `/recommendation/products/:productId/suggestions` | `asyncHandler(controller.listSuggestions)` | — |
| POST | `/recommendation/products/:productId/suggestions/accept` | `asyncHandler(controller.acceptSuggestion)` | — |
| POST | `/recommendation/products/:productId/suggestions/hide` | `asyncHandler(controller.hideSuggestion)` | — |
| POST | `/recommendation/rebuild` | `asyncHandler(controller.rebuild)` | — |
| GET | `/recommendation/rules` | `asyncHandler(controller.listRules)` | — |
| POST | `/recommendation/rules` | `asyncHandler(controller.createRule)` | — |
| PUT | `/recommendation/rules/:ruleId` | `asyncHandler(controller.updateRule)` | — |
| DELETE | `/recommendation/rules/:ruleId` | `asyncHandler(controller.deleteRule)` | — |
| GET | `/recommendation/stats` | `asyncHandler(controller.getStats)` | — |

<!-- GENERATED:ENDPOINTS:END -->
