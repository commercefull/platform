# Database Performance Tuning

How the database and query layer is tuned for realistic catalog volume, how to investigate
regressions, and the conventions established by the first tuning pass (September 2026).

## Investigation toolkit

### `pg_stat_statements` (enabled on `yarn db`)

The dev database container preloads `pg_stat_statements` via `package.json`'s `db` script:

```
postgres:18-alpine -c shared_preload_libraries=pg_stat_statements -c pg_stat_statements.track=all
```

After running a workload, pull the hot queries:

```sql
SELECT calls, round(mean_exec_time::numeric,1) AS mean_ms, round(total_exec_time::numeric,0) AS total_ms,
       left(query, 120) AS q
FROM pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 15;

SELECT pg_stat_statements_reset();  -- reset between runs
```

Then `EXPLAIN (ANALYZE, BUFFERS)` the offenders. Index usage lives in `pg_stat_user_indexes`
(`idx_scan`); sequential-scan pressure in `pg_stat_user_tables` (`seq_scan`, `seq_tup_read`).

### Realistic seed data — `scripts/perf-seed.sql`

The default seeds are tiny (~36 products) — at that size every plan looks fine and seq scans
are legitimately optimal. `scripts/perf-seed.sql` generates bulk data idempotently:

```bash
docker exec -i commerce-db psql -U ecomm-user -d ecomm-db < scripts/perf-seed.sql
# ~20k products / 30k variants / 40k images / 5k customers / 50k orders / 100k order items
# Tunable: psql -v perf_products=50000 ...
```

Always evaluate plans and `pg_stat_statements` against this volume, not the fixture seeds.

### k6 suites

`tests/performance/` — see its README. `yarn perf:load:browse` exercises the product search
path specifically. Baseline at 20k products before tuning: p95 ≈ 347ms, p99 ≈ 927ms.

## What was tuned (September 2026)

### Trigram indexes for `ILIKE` search

`migrations/20260921000001_addTrgmSearchIndexes.js` creates `pg_trgm` plus GIN trigram
indexes on `product(name, description, shortDescription, sku, slug)` and
`productVariant(sku, barcode)`.

- `ILIKE '%term%'` cannot use btree indexes, and the existing `to_tsvector` GIN indexes only
  serve `@@ tsquery` predicates — trigram GIN is what substring search needs.
- `CREATE INDEX CONCURRENTLY` cannot run inside a transaction, so the migration uses
  Knex `transaction: false`. See `docs/guidelines/migrations.md`.
- The FTS path (`SEARCH_STRATEGY=fts` in `libs/db/searchHelpers.ts`) still exists for
  `@@`-style queries; `ilike` remains the default strategy.

### Cross-table OR → UNION

The product search ORed across `product` columns _and_ `productVariant` columns through a
`LEFT JOIN`. PostgreSQL cannot BitmapOr across a join boundary, so it scanned ~18k products
with a nested-loop variant lookup per row (~184ms mean at 20k products).

`ProductSearchService.buildSearchQuery` now emits two arms — product-column matches and
variant-column matches via `EXISTS` — combined with `UNION`, letting each arm use its own
trigram indexes. Same approach inside `ProductRepository.findAll`'s `search` filter
(GraphQL path): `"productId" IN (SELECT … product OR … UNION SELECT … productVariant …)`.

**Result:** ~184–188ms mean → ~55ms for high-cardinality terms, ~3ms for rare terms.

### Index hygiene

- Removed `order_ordernumber_index` from `20240805000490_createOrderTable.js` — a plain
  btree duplicating `order_ordernumber_unique`. The unique index serves all identical
  lookups. **Already-migrated databases keep the index** — drop it manually with
  `DROP INDEX CONCURRENTLY order_ordernumber_index` if needed.
- ~60 more same-column btree+unique duplicates exist schema-wide (`store_slug`,
  `currency_code`, `product_sku`, …) — same removal pattern, deliberately deferred.
- Boolean indexes (`product_isfeatured_index`, `_isnew_`, `_isbestseller_`) were **kept**:
  the planner skips them under `ORDER BY createdAt LIMIT` but uses them for unordered
  filters and counts at ~5–10% selectivity.

### Per-request lookups → shared cache abstraction

Every storefront request ran `store WHERE slug`, `themeAssignment WHERE storeId`, and
`productCategory WHERE includeInMenu` — ~3k calls each per 3.5-minute browse run.

`libs/cache/` provides a `Cache` port (`get`/`set`/`getOrSet`/`del`/`clear`) with two
backends selected by `createCache({ namespace, ttlMs })`:

- **`RedisCache`** — used when `REDIS_URL`/`REDIS_HOST` is configured (same convention as
  the session store). Keys are namespaced `cache:<namespace>:*`, values JSON-serialized,
  TTL via `PX`. Shares one ioredis connection across namespaces. Fails open: Redis errors
  degrade to direct loader calls, never request failures. Use this in multi-instance
  deployments so all app instances share the same cache.
- **`MemoryCache`** — in-process `TtlCache` backend; automatic fallback and the choice for
  single-instance deployments and tests (`type: 'memory'` to force).

Applied with a 30s TTL to:

- `web/storefront/storeResolutionMiddleware.ts` — store by slug
- `web/storefront/themeMiddleware.ts` — resolved theme by storeId
- `modules/product/interface/controllers/storefrontCategoryController.ts` — menu categories

TTL-only invalidation: store/theme/menu changes propagate within 30 seconds. Verified:
20 storefront requests → 1 call per lookup.

### Anonymous session-write churn

`req.flash()` lazily writes `session.flash` on every call. `storefrontRespond`,
`adminRespond`, `web/respond.ts`, and the `res.locals` middleware in `app.ts` all called it
unconditionally → a session row + `sid` cookie for **every anonymous page view**
(~1 upsert per request).

Fix: `libs/flash.ts` `popFlashMessages(req)` only touches `req.flash` when
`session.flash` already exists — anonymous browsing now performs **zero session writes**.
Additionally, `storeResolutionMiddleware` only persists `session.store` on an explicit
`?store=` choice (hostname/geo/default resolution is deterministic and needs no stickiness).

`rolling: true` session config was left unchanged — sliding expiry is a product decision.

**Session storage abstraction:** `libs/session/` now mirrors `libs/cache`. The
`SessionBackend` port covers the full `SessionService` surface (create/get/update/
invalidate/user-sessions/extend/cleanup) with two implementations:
`PostgresSessionBackend` (`identityUserSession` table — the "table" backend) and
`RedisSessionBackend` (JSON keys `isession:<sid>` with native `PX` expiry plus a
per-user sid SET `isession:user:<type>:<id>`). Backend selection is explicit via env —
`SESSION_BACKEND=postgres|redis` (default `postgres`, fails fast if `redis` is chosen
without `REDIS_URL`/`REDIS_HOST`) and `CACHE_BACKEND=memory|redis` for `libs/cache`.
`SessionService` delegates to the selected backend, so callers (`libs/auth.ts`, admin
controllers, login use cases) are unchanged. Both backends share one ioredis connection
via `libs/redisClient.ts`, which reconnects with capped exponential backoff.

### Error visibility

`ProductSearchService.search` silently swallowed errors into `{products: [], total: 0}` —
this masked a broken facet query (`pav` alias bug, fixed) for an unknown period: the endpoint
always returned empty success responses, and the integration tests pass on shape alone.
The catch now logs via `libs/logger` and rethrows so the use case returns `success: false`.

### Pool

`libs/db/pool.ts` stays at `max: 20` — no connection waits observed at 50 VUs. Revisit only
if `pg_stat_activity` shows client backends waiting on connections under load.

## Rules for future work

- **Cross-table search ORs don't scale.** Split into per-table arms (`UNION`, or
  `UNION` inside an `IN`/`EXISTS` subquery) so each arm can use its own index.
- **`ILIKE '%…%'` needs `pg_trgm`**, not btree and not `to_tsvector` GIN.
- **Don't index a column that already has a unique constraint** — the unique btree covers it.
- **Don't judge indexes on tiny seeds.** Check `EXPLAIN` and `pg_stat_user_indexes` against
  `perf-seed.sql` volume; boolean indexes may still be used for unordered queries.
- **Never return fake-empty results on SQL errors.** Log and rethrow (or map to a proper
  error) — silent catches make failures indistinguishable from "no rows".
- **Don't touch `req.flash`/`req.session` in render paths** unless content exists — lazy
  writers dirty the session and create rows for anonymous traffic.
- **Stable per-request lookups → `createCache` from `libs/cache`** rather than adding DB
  round-trips — it automatically uses Redis in multi-instance deployments and in-process
  memory otherwise.
