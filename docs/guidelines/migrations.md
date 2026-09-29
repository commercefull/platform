# Migration Standards

> For general DB conventions (naming, types, helpers) see [database.md](./database.md).

## File Format

- **Language**: JavaScript (`.js`) — never TypeScript.
- **Location**: `migrations/` at repo root.
- **Filename**: `YYYYMMDDHHMMSS_<module>_<action><TableName>.js`
  - `<module>` — owning module's lowercase name (`order`, `product`, `basket`…). See `docs/migrations/module-tables.md` for the authoritative module→table mapping. Use `platform_` for libs-level schema with no owning module.
  - `<action>` — `create`, `alter`, or `drop`.
  - `<TableName>` — the camelCase table the migration creates/alters/drops.
- **One table per migration.** A `create` migration contains exactly one `createTable` call whose name matches `<TableName>` in the filename. If a feature needs several tables, write several migration files — never `createXxxTables.js` batches.
- **Table/column names**: camelCase.

### Examples

```
20260823120000_order_createOrderReturnTable.js
20260823120001_product_alterProductAddSearchVector.js
20260823120002_basket_dropBasketHistory.js
```

### Legacy migrations

Migrations dated `2024*`/`2025*` predate the module-prefix convention and are grandfathered — do not rename them. All new migrations must follow the convention.

## Rules

- **Fold unreleased changes into the original `create` migration.** A create migration is the single source of truth for a table's initial schema; do not add a trailing `alter` for a table created in the same unreleased batch.
- **Once a migration has run in a shared environment, never edit it** — write a new `alter`/`drop` migration instead. (Locally you may sync `knexMigrations` names if a file was renamed before release.)
- **Always implement `exports.down`** — reverse `up` in reverse order.
- **Guard everything.** Wrap `createTable` in `hasTable` and alters in `hasColumn`/`hasTable` so every migration is idempotent.
- **Primary key**: `t.uuid('xId').primary().defaultTo(knex.raw('uuidv7()'))`. Exception: a natural PK whose value is another entity's id (`themeAssignment.storeId`, `recommendationProcessedOrder.orderId`) uses `t.uuid('xId').primary()` with **no** default — generating a fresh id would be a bug.
- **FKs**: `.references(...).inTable(...)` plus an index on the FK column. Index every column used in `WHERE`, `ORDER BY`, or lookups.
- **Timestamps**: `createdAt` / `updatedAt` with `knex.fn.now()` defaults; `deletedAt` for soft delete.
- **Parameterized SQL only** in `knex.raw` — never interpolate values.

```javascript
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('product');
  if (hasTable) return;

  await knex.schema.createTable('product', t => {
    t.uuid('productId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 255).notNullable();
    t.string('slug', 255).notNullable().unique();
    t.uuid('merchantId').references('merchantId').inTable('merchant');
    t.timestamp('deletedAt');

    t.index('slug');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('product');
};
```

## Checklist for a New Migration

- [ ] Filename is `YYYYMMDDHHMMSS_<module>_<action><TableName>.js`
- [ ] Exactly one `createTable`/`alterTable`/`dropTable` per file, matching the filename
- [ ] `hasTable`/`hasColumn` guards present
- [ ] PK is `uuid` + `uuidv7()` (natural-key exception noted above)
- [ ] FKs use `.references(...).inTable(...)` and are indexed
- [ ] `createdAt`/`updatedAt` present; `deletedAt` where applicable
- [ ] `exports.down` reverses `exports.up`
- [ ] `docs/migrations/module-tables.md` updated for any new table; module doc's table list updated
- [ ] Repositories/types updated (`yarn db:types`)

## Expand/Contract Policy

Breaking schema changes must deploy without downtime: expand first, contract only after old code is retired.

**Not needed for:** new tables, new nullable columns, new indexes (`CONCURRENTLY`), unreleased migrations (fold them in).

**Needed for:** renaming or retyping a column, adding `NOT NULL` to a populated column, dropping a column, renaming a table. Split into:

1. **Expand** — add new column/table alongside the old (nullable/safe default). Old and new code coexist.
2. **Backfill** — populate the new column via a separate migration or one-off script (`knex.raw` UPDATE).
3. **Contract** — after no running code references the old schema, enforce constraints / drop the old column in a later release.

**Production is forward-only.** `down` exists for dev rollback and emergencies — never rely on it in production. If a migration breaks prod, write a forward fix; roll back only as a last resort before data lands in the new schema.

## Zero-Downtime Checklist (production)

- [ ] New columns nullable or safely defaulted; no `NOT NULL` + populate in one step
- [ ] `CREATE INDEX CONCURRENTLY` for large tables (raw SQL, non-transactional)
- [ ] Drops only after code no longer references the column/index/FK
- [ ] Type widening OK; narrowing requires expand/contract
- [ ] Idempotent (guards) — safe to run twice
- [ ] No `DROP TABLE` unless the table is confirmed unused
- [ ] >100K-row tables: test on a prod copy; consider `lock_timeout`

## Smoke Test

Run in CI or locally to verify migrations against a fresh DB:

```bash
yarn db:migrate:smoke          # fresh DB: all migrations + every table queried
yarn db:migrate:smoke:seeded   # fresh DB + seeds
```

## Common Commands

```bash
yarn db:migrate:new <name>   # Create a new migration file
yarn db:migrate              # Run pending migrations
yarn db:rollback             # Rollback last batch
yarn db:types                # Regenerate Knex types from DB schema
```
