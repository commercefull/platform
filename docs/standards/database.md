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

| Pattern              | Type          | Example                                                    |
| -------------------- | ------------- | ---------------------------------------------------------- |
| Primary key          | `uuid`        | `t.uuid('productId').primary().defaultTo(knex.raw('uuidv7()'))` |
| Foreign key          | `uuid`        | `t.uuid('merchantId').references('merchantId').inTable('merchant')` |
| Created timestamp    | `timestamp`   | `t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now())` |
| Updated timestamp    | `timestamp`   | `t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now())` |
| Soft delete          | `timestamp`   | `t.timestamp('deletedAt')`                                 |
| Boolean flags        | `boolean`     | `t.boolean('isActive').notNullable().defaultTo(true)`       |
| Enum/Status          | `enu`         | `t.enu('status', ['draft', 'active']).defaultTo('draft')`  |
| Money                | `decimal`     | `t.decimal('price', 15, 2)`                                |
| Flexible data        | `jsonb`       | `t.jsonb('customFields')`                                  |
| UUID arrays          | `specificType`| `t.specificType('relatedProducts', 'uuid[]')`              |

## Boolean Naming

Use `is`, `has`, `can` prefixes: `isActive`, `isFeatured`, `hasVariants`, `isVerified`.

## Data Types

| Type            | Use Case                              |
| --------------- | ------------------------------------- |
| `uuid`          | All primary and foreign keys (UUIDv7) |
| `timestamp`     | All date/time fields                  |
| `decimal(15,2)` | Monetary amounts                      |
| `decimal(10,2)` | Weights, dimensions                   |
| `decimal(5,2)`  | Rates, percentages                    |
| `jsonb`         | Structured flexible data              |
| `text`          | Long text (descriptions)              |
| `string(N)`     | Short text with max length            |
| `integer`       | Counts, quantities                    |
| `boolean`       | Flags                                 |
| `enu`           | Inline enums (status, type)           |

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
const product = await queryOne<Product>(
  `SELECT * FROM "product" WHERE "productId" = $1 AND "deletedAt" IS NULL`,
  [productId],
);
```

Always use parameterized queries (`$1`, `$2`, …). Never interpolate user input into SQL strings.
