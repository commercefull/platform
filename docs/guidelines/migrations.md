# Migration Standards

> For general DB conventions (naming, types, helpers) see [database.md](./database.md).

## File Format

- **Language**: JavaScript (`.js`) — never TypeScript.
- **Filename**: `YYYYMMDDHHMMSS_<module>_<action><TableName>.js` (timestamp prefix, module prefix, action verb, camelCase table name).
- **Module prefix**: The owning module's lowercase name (e.g. `order`, `product`, `basket`, `customer`). See `docs/migrations/module-tables.md` for the authoritative module→table mapping.
- **Action verb**: `create`, `alter`, or `drop`.
- **Table names**: camelCase (e.g. `product`, `productVariant`, `orderItem`).
- **Column names**: camelCase.
- **Location**: `migrations/` at repo root.

### Examples

```
20260823120000_order_createOrderReturnTable.js
20260823120001_product_alterProductAddSearchVector.js
20260823120002_basket_dropBasketHistory.js
```

### Legacy migrations

Migrations created before the module-prefix convention (dated `2024*` and `2025*`) are grandfathered. Do not rename them. All new migrations must follow the `<module>_<action><TableName>` convention.

```javascript
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('product', t => {
    t.uuid('productId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 255).notNullable();
    t.string('slug', 255).notNullable().unique();
    t.text('description');
    t.decimal('price', 15, 2).notNullable();
    t.boolean('isActive').notNullable().defaultTo(true);
    t.enu('status', ['draft', 'active', 'archived']).notNullable().defaultTo('draft');
    t.uuid('merchantId').references('merchantId').inTable('merchant');
    t.timestamp('deletedAt');
    t.jsonb('customFields');

    t.index('slug');
    t.index('status');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('product');
};
```

## Rules

- **Fold schema changes into the original `create` migration when the create migration has not yet been released**. Keep create migrations as the single source of truth for a table's initial schema; avoid trailing `alter` migrations that patch tables that were just created in the same batch.
- **Use `alter` migrations for post-release schema evolution** — once a migration has run in an environment, changes must go in a new `alter` migration, never by editing the original.
- **Always implement `exports.down`** to allow rollback. Drop indexes, FKs, and columns in reverse order of creation.
- **Avoid `increments()`** — use `t.uuid(...).primary().defaultTo(knex.raw('uuidv7()'))`.
- **Use `knex.fn.now()`** for `createdAt` / `updatedAt` defaults.
- **Soft delete**: add `t.timestamp('deletedAt')` instead of physical deletion.
- **Indexes**: add explicit `t.index(...)` on FK columns and any column used in `WHERE`, `ORDER BY`, or filtering.
- **Defensive guards in alters**: use `hasTable` / `hasColumn` checks when writing alters that may run against diverse environments.

```javascript
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('channel');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('channel', 'isActive');
  if (hasColumn) return;

  await knex.schema.alterTable('channel', t => {
    t.boolean('isActive').notNullable().defaultTo(true);
    t.index(['isActive']);
  });
};
```

## Common Commands

```bash
yarn db:migrate:new create_product_table   # Create new migration file
yarn db:migrate                            # Run all pending migrations
yarn db:rollback                           # Rollback last batch
yarn db:rollback:all                       # Rollback all migrations
yarn db:types                              # Regenerate Knex types from DB schema
```

## Checklist for a New Migration

- [ ] Filename uses `YYYYMMDDHHMMSS_` timestamp prefix
- [ ] Filename includes `<module>_` prefix matching the owning module in `docs/migrations/module-tables.md`
- [ ] Filename includes `<action>` verb (`create`, `alter`, or `drop`)
- [ ] Table and column names are camelCase
- [ ] Primary key is `uuid` with `uuidv7()` default
- [ ] FKs use `.references(...).inTable(...)` and have an index
- [ ] `createdAt` / `updatedAt` timestamps present
- [ ] Soft-delete `deletedAt` column where applicable
- [ ] `exports.down` reverses `exports.up`
- [ ] New or changed columns/indexes are reflected in relevant repositories and TypeScript types
- [ ] Module's `docs/modules/<module>.md` "Owned Tables" section is updated if a new table is introduced

## Expand/Contract Policy

All schema changes that must be deployed without downtime follow the **expand/contract** pattern. This means splitting a breaking change into multiple migrations deployed across two releases.

### Why

In production, the old version of the application continues serving requests while the new version deploys. If a migration removes or renames a column in one step, the old version will crash on queries referencing the old column. Expand/contract avoids this by making the old and new versions compatible during the transition window.

### The Three Phases

#### Phase 1 — Expand (forward-compatible)

Add the new schema alongside the old. Both old and new code can coexist.

```javascript
// Migration 1: Add new column (nullable, no NOT NULL constraint yet)
exports.up = async function (knex) {
  await knex.schema.alterTable('product', t => {
    t.string('sku').nullable();  // New column, old code ignores it
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('product', t => {
    t.dropColumn('sku');
  });
};
```

#### Phase 2 — Migrate data (separate migration or backfill script)

Populate the new column from existing data. This can be a separate migration or a one-off script.

```javascript
// Migration 2: Backfill data
exports.up = async function (knex) {
  await knex.raw('UPDATE "product" SET "sku" = "slug" WHERE "sku" IS NULL');
};

exports.down = async function (knex) {
  // No-op — leaving data in the new column is harmless
};
```

#### Phase 3 — Contract (after old version is retired)

Once no running code references the old schema, enforce constraints and remove the old column.

```javascript
// Migration 3: Add NOT NULL constraint, drop old column
exports.up = async function (knex) {
  await knex.schema.alterTable('product', t => {
    t.string('sku').notNullable().alter();
    // Only drop old columns after confirming no code references them
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('product', t => {
    t.string('sku').nullable().alter();
  });
};
```

### When expand/contract is NOT needed

- **New tables**: No existing code references them, so a single migration is safe.
- **New nullable columns with no constraint**: Adding a nullable column is always forward-compatible.
- **New indexes**: `CREATE INDEX CONCURRENTLY` (see below) is safe online.
- **Pre-release migrations**: If the migration has never run in any shared environment, fold changes into the original.

### When expand/contract IS needed

- **Renaming a column**: Add new → backfill → update code → drop old.
- **Changing a column type**: Add new typed column → backfill → update code → drop old.
- **Adding NOT NULL constraint**: Add nullable → backfill → add constraint in separate migration.
- **Dropping a column**: Deploy code that stops referencing it → drop in next release.
- **Renaming a table**: Create new table → backfill → update code → drop old table.

## Forward-Only in Production

**Production migrations are forward-only.** The `down` function exists for development rollback and emergency fixes, but the standard deployment flow never rolls back in production.

### Rationale

- Rollback can cause data loss (e.g., dropping a backfilled column).
- The old schema may not be compatible with data created by the new code.
- Forward-only means every migration must be designed to be safe to apply on a live database.

### Emergency rollback

If a migration breaks production:
1. **Prefer a forward fix** — write a new migration that corrects the issue.
2. **Rollback only as last resort** — and only if no data has been written to the new schema.
3. **Never rollback past a data migration** — rolling back a schema migration after its companion data migration has run will lose data.

## Zero-Downtime Migration Checklist

Before deploying a migration to production, verify:

### Adding columns
- [ ] New column is **nullable** or has a **safe default** (use `defaultTo`)
- [ ] No `NOT NULL` constraint in the same migration as the column addition (add it in a follow-up contract migration)
- [ ] Existing rows will not violate any new constraints

### Adding indexes
- [ ] Use `CREATE INDEX CONCURRENTLY` for large tables to avoid locking
- [ ] Knex: `knex.raw('CREATE INDEX CONCURRENTLY "idx_name" ON "table" ("col")')`
- [ ] Cannot run inside a transaction — use `knex.schema.alterTable` with `transacting: false` or raw SQL

### Dropping columns
- [ ] No running code references the column (check repositories, raw SQL, views)
- [ ] Column is not used in any index (drop indexes first)
- [ ] Column is not referenced by any FK constraint (drop FKs first)
- [ ] Deployed as a separate migration **after** the code that stops using it has been released

### Altering columns
- [ ] Type widening (e.g., `int` → `bigint`) is safe; type narrowing requires expand/contract
- [ ] Adding a default to an existing column is safe in PostgreSQL 11+
- [ ] Removing a default is safe if the application handles `null`

### Large tables (> 100K rows)
- [ ] Test the migration against a copy of production data
- [ ] Estimate migration duration — migrations taking > 30s should be split
- [ ] Consider `SET lock_timeout = '5s'` to avoid blocking writes
- [ ] Use `CREATE INDEX CONCURRENTLY` for all new indexes

### General
- [ ] Migration is **idempotent** — safe to run twice (use `hasTable` / `hasColumn` guards)
- [ ] `down` function is implemented and tested locally
- [ ] No `DROP TABLE` in production unless the table is confirmed unused
- [ ] Migration does not depend on application code being updated (schema must be backward-compatible)

## CI Migration Smoke Test

Run `yarn db:migrate:smoke` in CI to verify migrations against both a fresh DB and a seeded DB.

```bash
# Fresh DB: apply all migrations from scratch
yarn db:migrate:smoke:fresh

# Seeded DB: apply migrations on top of seeded data
yarn db:migrate:smoke:seeded
```

The smoke test:
1. Creates a temporary database
2. Runs all migrations from zero
3. Verifies the `knexMigrations` table shows all migrations as applied
4. Runs all seeds (for seeded variant)
5. Runs a sample query against every table to verify schema integrity
6. Drops the temporary database

This catches: broken migrations, missing dependencies, non-idempotent alters, and schema/data mismatches.
