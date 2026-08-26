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
- Use `isOrganizationLoggedIn` for all `/business` routers (except public auth endpoints in identity).
- Follow the `/business/{topic}/...` route naming convention for all business routes.
- Use the Winston logger (`logger.error()`, `logger.info()`) instead of `console.log`.
- Write use cases as classes with an `execute()` method.
- Create domain entities with `create()` and `reconstitute()` factory methods.
- Check for existing data before inserting in seed files.
- Use `t.timestamp('deletedAt')` for soft deletes.
- Keep migrations as JavaScript files (not TypeScript).
- Use `knex.fn.now()` for default timestamps.
- Follow the master variant architecture for products.
- Use `t('namespace:key')` for all user-facing text in EJS templates (labels, buttons, headings, placeholders, alerts, fallbacks).
- Use ES module `import` syntax for all imports in TypeScript files.
- Place all imports at the top of the file.
- Fold schema changes into the original `create` migration when it hasn't been released yet; otherwise add a new `alter` migration.
- Register new modules in `boot/moduleManifests.ts` with a manifest.
- Gate route mounting with `moduleRegistry.shouldMountRoutes()` in `boot/routes.ts`.
- Gate event handler registration with `moduleRegistry.shouldRegisterEvents()`.
- Use `writeToOutbox()` for events that must survive process crashes (within a DB transaction).
- Encrypt credentials at rest using `libs/secrets` (AES-256-GCM).
- Write domain errors with stable `code`, `statusCode`, and `severity` — never `throw new Error('...')` in `domain/` or `application/`.
- Write integration tests for every router, including an auth rejection test.
- Create `docs/modules/<moduleName>.md` for every new module.

## ❌ DON'T

- Use snake_case for database columns.
- Use an ORM — use raw SQL with `libs/db` helpers.
- Put business logic in controllers (use domain entities and use cases).
- Hard-code API endpoints or secrets.
- Hard-code user-facing text in EJS templates — always use `t('namespace:key')` and add keys to locale JSON files.
- Use `console.log` in production code.
- Skip error handling in controllers.
- Delete seed data without checking FK constraints.
- Use `t.increments()` for primary keys (use UUIDv7).
- Create TypeScript migration files (use JavaScript).
- Skip auth middleware on protected routes.
- Leave any `/business` router without `isOrganizationLoggedIn` middleware.
- Use bare route paths without a topic prefix (e.g. `/business/upload` instead of `/business/media/upload`).
- Expose stack traces in production error responses.
- Use inline SQL string interpolation (SQL injection risk).
- Import from `web/` into `modules/` (dependency flows: `web → modules → libs`).
- Create circular dependencies between modules.
- Use `require()` in any TypeScript file — always use `import`.
- Place imports inside functions or conditionally — all imports must be top-level.
- Edit a migration that has already been released; write an `alter` migration instead.
- Store plaintext credentials in the database — use `libs/secrets` encryption.
- Log decrypted credential values or sensitive PII.
- Use `throw new Error('...')` in `domain/` or `application/` — use typed domain errors.
- Add a module without registering it in `boot/moduleManifests.ts`.
- Mount routes without checking `moduleRegistry.shouldMountRoutes()`.
- Use `emitEvent()` for events that must survive crashes — use `writeToOutbox()` within a transaction instead.
- Add a new module without writing module documentation and integration tests.
