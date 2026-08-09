# Do's and Don'ts

Quick reference. For the full rules, see the individual standards documents.

## ✅ DO

- Use UUIDv7 for all primary keys (`defaultTo(knex.raw('uuidv7()'))`).
- Use camelCase for all database column names.
- Double-quote camelCase identifiers in SQL (`"productId"`, `"createdAt"`).
- Use parameterized queries (`$1`, `$2`) for all SQL.
- Follow the DDD structure for new modules (`domain → application → infrastructure → interface`).
- Use the `query<T>()` / `queryOne<T>()` helpers from `libs/db`.
- Use `successResponse()` / `errorResponse()` for API responses.
- Use `adminRespond()` / `merchantRespond()` / `b2bRespond()` / `storefrontRespond()` for portal views.
- Apply auth middleware at the router level.
- Use the Winston logger (`logger.error()`, `logger.info()`) instead of `console.log`.
- Write use cases as classes with an `execute()` method.
- Create domain entities with `create()` and `reconstitute()` factory methods.
- Check for existing data before inserting in seed files.
- Use `t.timestamp('deletedAt')` for soft deletes.
- Keep migrations as JavaScript files (not TypeScript).
- Use `knex.fn.now()` for default timestamps.
- Follow the master variant architecture for products.
- Use ES module `import` syntax for all imports in TypeScript files.
- Place all imports at the top of the file.
- Fold schema changes into the original `create` migration when it hasn't been released yet; otherwise add a new `alter` migration.

## ❌ DON'T

- Use snake_case for database columns.
- Use an ORM — use raw SQL with `libs/db` helpers.
- Put business logic in controllers (use domain entities and use cases).
- Hard-code API endpoints or secrets.
- Use `console.log` in production code.
- Skip error handling in controllers.
- Delete seed data without checking FK constraints.
- Use `t.increments()` for primary keys (use UUIDv7).
- Create TypeScript migration files (use JavaScript).
- Skip auth middleware on protected routes.
- Expose stack traces in production error responses.
- Use inline SQL string interpolation (SQL injection risk).
- Import from `web/` into `modules/` (dependency flows: `web → modules → libs`).
- Create circular dependencies between modules.
- Use `require()` in any TypeScript file — always use `import`.
- Place imports inside functions or conditionally — all imports must be top-level.
- Edit a migration that has already been released; write an `alter` migration instead.
