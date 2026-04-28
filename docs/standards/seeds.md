# Seed Data Standards

## File Format

- **Language**: JavaScript (`.js`).
- **Filename**: `YYYYMMDDHHMMSS_seedDescription.js`.
- **Location**: `seeds/`.
- **Pattern**: check-before-insert to avoid duplicates and FK constraint errors.

```javascript
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  const existing = await knex('tableName').where({ uniqueField: 'value' }).first();
  if (existing) return;

  await knex('tableName').insert({
    fieldName: 'value',
    createdAt: knex.fn.now(),
    updatedAt: knex.fn.now(),
  });
};
```

## Up/Down Pattern (for seeds with FK dependencies)

```javascript
exports.up = async function (knex) {
  const parent = await knex('parentTable').where({ slug: 'parent-slug' }).first('parentId');
  if (!parent) throw new Error('Required seed data not found');

  await knex('childTable').insert({
    parentId: parent.parentId,
    name: 'Child Record',
  });
};

exports.down = async function (knex) {
  await knex('childTable').where({ name: 'Child Record' }).delete();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
```

## Seed Ordering

Seeds run in filename order. Use the timestamp prefix to control execution order.

| Prefix Range    | Category                       |
| --------------- | ------------------------------ |
| `000100-000199` | Users & identity               |
| `000200-000299` | Currencies, locales, countries |
| `000300-000399` | Merchants & notifications      |
| `000400-000499` | Customer segments & loyalty    |
| `000500-000599` | Orders & payments              |
| `000900-000999` | Content & CMS                  |
| `001000-001099` | Products, pricing, inventory   |
| `001100-001199` | Merchant stores & marketplace  |
| `001200-001299` | Notification templates         |
| `001300-001399` | GDPR & compliance              |
| `001400-001499` | Marketing                      |
| `001500-001599` | B2B                            |
| `001600-001699` | Shipping                       |
| `001700-001799` | Subscriptions & support        |
| `001800-001899` | Supplier & distribution        |
| `001900-001999` | Analytics                      |
| `002000-002199` | Tax, warehouse, integration    |

## Rules

- Never `DELETE FROM` without considering FK constraints — prefer idempotent upserts.
- Never hard-code UUIDs; look up records by stable keys (slug, code, email).
- Use `knex.fn.now()` for timestamps.
- Keep seeds safe to re-run (`yarn db:seed`).
