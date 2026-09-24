# Database Standards

## Connection

- **Driver**: `pg` (node-postgres) with connection pooling
- **Pool**: Max 20 connections, 30s idle timeout, 2s connection timeout
- **Migrations**: Knex (files in `migrations/`)
- **Queries**: Raw SQL via `libs/db` helpers (`query<T>()` and `queryOne<T>()`)
- **No ORM**: Direct SQL with parameterized queries only

## Column Naming Convention

**All database columns use camelCase.** PostgreSQL requires double quotes around camelCase identifiers.

```sql
-- ✅ CORRECT
SELECT "productId", "createdAt", "orderNumber" FROM "product" WHERE "deletedAt" IS NULL

-- ❌ WRONG (snake_case)
SELECT product_id, created_at FROM product
```

## Primary Keys

- **Always use UUIDv7** for chronological ordering.
- **Naming**: table name (camelCase) + `Id` suffix.

```javascript
t.uuid('productId').primary().defaultTo(knex.raw('uuidv7()'));
t.uuid('customerId').primary().defaultTo(knex.raw('uuidv7()'));
```

## Standard Column Patterns

| Pattern           | Type           | Example                                                             |
| ----------------- | -------------- | ------------------------------------------------------------------- |
| Primary key       | `uuid`         | `t.uuid('productId').primary().defaultTo(knex.raw('uuidv7()'))`     |
| Foreign key       | `uuid`         | `t.uuid('merchantId').references('merchantId').inTable('merchant')` |
| Created timestamp | `timestamp`    | `t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now())`   |
| Updated timestamp | `timestamp`    | `t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now())`   |
| Soft delete       | `timestamp`    | `t.timestamp('deletedAt')`                                          |
| Boolean flags     | `boolean`      | `t.boolean('isActive').notNullable().defaultTo(true)`               |
| Enum/Status       | `enu`          | `t.enu('status', ['draft', 'active']).defaultTo('draft')`           |
| Money             | `bigint`       | `t.bigInteger('priceCents')` — integer cents, never floats         |
| Flexible data     | `jsonb`        | `t.jsonb('customFields')`                                           |
| UUID arrays       | `specificType` | `t.specificType('relatedProducts', 'uuid[]')`                       |

## Boolean Naming

Use `is`, `has`, `can` prefixes: `isActive`, `isFeatured`, `hasVariants`, `isVerified`.

## Data Types

| Type            | Use Case                              |
| --------------- | ------------------------------------- |
| `uuid`          | All primary and foreign keys (UUIDv7) |
| `timestamp`     | All date/time fields                  |
| `bigint`        | Monetary amounts (integer cents)      |
| `decimal(10,2)` | Weights, dimensions                   |
| `decimal(5,2)`  | Rates, percentages                    |
| `jsonb`         | Structured flexible data              |
| `text`          | Long text (descriptions)              |
| `string(N)`     | Short text with max length            |
| `integer`       | Counts, quantities                    |
| `boolean`       | Flags                                 |
| `enu`           | Inline enums (status, type)           |

## Money

Monetary amounts are stored as **integer cents** in `bigint` columns named `*Cents`
(e.g. `priceCents`, `salePriceCents`, `unitPriceCents`). Rationale: floats and
`numeric(15,2)` drift on arithmetic; integer cents are exact and sortable.

- Column names carry the `Cents` suffix so units are unambiguous.
- `libs/db` registers a `bigint` type parser so `*Cents` columns arrive as
  JavaScript `number` — no `parseFloat`/`Number` mapping is needed on reads.
- Convert to decimal strings (`(cents / 100).toFixed(2)`) only at the view/API
  presentation boundary — never inside domain entities, use cases, or
  repositories.
- `libs/money` `Money` stores integer cents internally: `Money.create(49.99)`
  takes major units, `Money.fromCents(4999)` takes cents, `.cents` returns the
  integer.
- `decimal` money columns are not allowed — use `bigint` `*Cents` for all
  monetary values. Polymorphic operands (e.g. a percent-or-amount coupon
  `discountAmount`, rule JSON `rate`/`value` fields) may remain `decimal` where
  the same column holds a percentage.

## Currency

The canonical `currency` table is the single reference for ISO codes. Any column
storing a currency must be named `currencyCode` (`string(3)`) and must reference
`currency.code`:

```ts
t.string('currencyCode', 3).notNullable().defaultTo('USD').references('code').inTable('currency');
```

- Transactional tables (`order`, `paymentTransaction`, `paymentRefund`, `basket`,
  `taxCalculation`, …) keep `currencyCode` as the immutable snapshot of the
  currency used at the time. Do not rename or "fix" these on currency changes —
  they are historical.
- Currency membership is store-scoped via the `storeCurrency` join table
  (`storeId` + `currencyId`, `isDefault`, `isActive`) — a store sells only in
  the currencies it supports, and exactly one is the default. Per-store currency
  behavior (base/display currency, rounding, rate updates) lives in
  `storeCurrencySettings` (one row per `storeId`).
- Do not add `supportedCurrencies`/`defaultCurrency` columns or `text[]` code
  lists to `store` or other tables — use `storeCurrency` membership rows and
  `*Id`/`currencyCode` references instead.
- Payment-gateway `supportedCurrencies` lists are a different concept (gateway
  capability, not store configuration) and are exempt.

## Soft Deletes

Most tables use a `deletedAt` column instead of physical deletes.

```sql
-- "Delete" a record
UPDATE "product" SET "deletedAt" = NOW() WHERE "productId" = $1;

-- Query only active records
SELECT * FROM "product" WHERE "deletedAt" IS NULL;
```

## SQL Query Helpers (`libs/db`)

```typescript
import { query, queryOne } from '../../libs/db';

// Query multiple rows
const products = await query<Product[]>(
  `SELECT * FROM "product"
   WHERE "status" = $1 AND "deletedAt" IS NULL
   ORDER BY "createdAt" DESC
   LIMIT $2 OFFSET $3`,
  ['active', limit, offset],
);

// Query single row
const product = await queryOne<Product>(`SELECT * FROM "product" WHERE "productId" = $1 AND "deletedAt" IS NULL`, [productId]);
```

Always use parameterized queries (`$1`, `$2`, …). Never interpolate user input into SQL strings.

## Search & Indexing

- **Substring search (`ILIKE '%…%'`)** uses `pg_trgm` GIN indexes (`idx_product_*_trgm`,
  `idx_productVariant_*_trgm`). Btree and `to_tsvector` GIN indexes do not serve `ILIKE`.
- **Never OR predicates across a join boundary** (e.g. `product` cols OR `productVariant`
  cols) — PostgreSQL can't BitmapOr across it and the query scans. Split into per-table
  arms combined with `UNION`, or `UNION` inside an `IN`/`EXISTS` subquery. See
  `ProductSearchService.buildSearchQuery` for the reference implementation.
- **Don't add a plain btree index on a column that already has a unique constraint** —
  the unique index covers the same lookups (e.g. `orderNumber`, `store.slug`).
- Evaluate indexes with `EXPLAIN (ANALYZE, BUFFERS)` and `pg_stat_user_indexes` against
  realistic volume (`scripts/perf-seed.sql`), not the tiny fixture seeds.
- New indexes on large tables use `CREATE INDEX CONCURRENTLY` (non-transactional
  migration) — see [migrations.md](./migrations.md).

Full background: [Database Performance Tuning](../guides/database-performance-tuning.md).
