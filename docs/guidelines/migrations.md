# Migration Standards

> For general DB conventions (naming, types, helpers) see [database.md](./database.md).

## File Format

- **Language**: JavaScript (`.js`) — never TypeScript.
- **Filename**: `YYYYMMDDHHMMSS_createTableName.js` (timestamp prefix, camelCase description).
- **Table names**: camelCase (e.g. `product`, `productVariant`, `orderItem`).
- **Column names**: camelCase.
- **Location**: `migrations/` at repo root.

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
- [ ] Table and column names are camelCase
- [ ] Primary key is `uuid` with `uuidv7()` default
- [ ] FKs use `.references(...).inTable(...)` and have an index
- [ ] `createdAt` / `updatedAt` timestamps present
- [ ] Soft-delete `deletedAt` column where applicable
- [ ] `exports.down` reverses `exports.up`
- [ ] New or changed columns/indexes are reflected in relevant repositories and TypeScript types
