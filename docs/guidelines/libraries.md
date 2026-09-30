# Shared Libraries (`libs/`)

| File / Dir                        | Purpose                                                            |
| --------------------------------- | ------------------------------------------------------------------ |
| `db/`                             | Database connection pool, client, query helpers                    |
| `db/types.ts`                     | Auto-generated Knex table/column types — infra row typing only (`X as DbX`); banned in `domain/` (`domain-no-db-imports`) |
| `db/dataModelTypes.ts`            | Shared data model type definitions                                 |
| `auth.ts`                         | Authentication middleware (JWT + session)                          |
| `apiResponse.ts`                  | Response transport seam (`jsonResponse`/`sendResponse`/`redirectResponse`/`renderResponse`/`setStatus`/`setHeader`/`cookieResponse`) + standard envelope helpers (`successResponse`/`errorResponse`) — controllers never call `res.*` directly |
| `events/`                         | Event bus (EventEmitter-based + durable outbox)                    |
| `events/eventBus.ts`              | EventEmitter-based event bus with error boundaries                 |
| `events/providers/postgres/`      | Postgres provider internals — outbox writer, claim-based dispatcher (retry + DLQ) |
| `events/providers/`               | Event transports: memory, postgres, gcp-pubsub, aws-sqs, azure-servicebus |
| `logger.ts`                       | Winston logger with daily rotation                                 |
| `validation.ts`                   | Input validation utilities                                         |
| `form.ts`                         | EJS form helper functions                                          |
| `hash.ts`                         | Password hashing (scrypt via `node:crypto`)                        |
| `slug.ts`                         | Slug generation utilities                                          |
| `amount.ts`                       | Money/amount formatting (legacy, unused)                           |
| `money.ts`                        | **Shared Kernel** — `Money` value object                           |
| `date.ts`                         | Date formatting utilities                                          |
| `cache/`                          | Shared cache abstraction — Redis or memory (`CACHE_BACKEND` env)   |
| `cookieParser.ts`                 | `Cookie` header parsing + `s:`-signed cookie verification (in-house cookie-parser) |
| `hpp.ts`                          | HTTP Parameter Pollution dedupe with whitelist                     |
| `flash.ts`                        | Session flash middleware (`flashMiddleware`) + `popFlashMessages` — reads flash without dirtying the session |
| `geoip.ts`                        | GeoIP lookup utilities                                             |
| `roles.ts`                        | Role definitions                                                   |
| `uuid.ts`                         | UUIDv7 generation (`generateUUID`, `isUuid`) — matches `uuidv7()` DB defaults; never use `crypto.randomUUID` (v4) for DB identifiers |
| `strings.ts`                      | String manipulation utilities                                      |
| `errors.ts`                       | Custom error classes (`AppError` base)                             |
| `secrets.ts`                      | AES-256-GCM encryption for credential storage                      |
| `session/`                        | Session backends — `identityUserSession` or Redis (`SESSION_BACKEND`) |
| `redisClient.ts`                  | Shared ioredis connection (retry/backoff) + `isRedisConfigured`    |
| `jobs/`                           | Background job utilities                                           |
| `types/`                          | Shared TypeScript types (HTTP types live in `http/` instead)       |
| `moduleRegistry/`                 | Module manifest registry & feature flag system                     |
| `moduleRegistry/types.ts`         | `ModuleManifest`, `RouteDeclaration`, etc.                         |
| `moduleRegistry/registry.ts`      | Singleton registry with `isEnabled()`, `shouldMountRoutes()`, etc. |

> HTTP types and router factories are project-owned under `libs/http/`; Express is confined to the adapter and composition roots. See the [HTTP Framework Abstraction Guide](../guides/http-framework-abstraction.md).

## Rules

- All cross-cutting utilities belong in `libs/`, not in individual modules.
- Libraries must not import from `modules/` or `web/` — dependency flows one way: `web → modules → libs`.
- Avoid circular imports between sibling libraries.

## Third-party dependency seams

Third-party packages must be imported through their designated seam file only — never scattered across modules. This keeps library swaps to a single-file change:

| Package | Sole importer(s) | Seam |
| --- | --- | --- |
| `winston`, `winston-daily-rotate-file` | `libs/logger.ts` | import `logger`/`expressHttpLogger` |
| `ioredis` | `libs/redisClient.ts` | import `getRedisClient`/`createRedisClient`/`type Redis` |
| `pg` | `libs/db/*`, `libs/session/sessionStoreFactory.ts` | import `query`/`queryOne`/`pool` |
| `connect-pg-simple`, `connect-redis`, `express-session` | `libs/session/sessionStoreFactory.ts` (+ `app.ts` mount) | `createSessionStore` |
| `express-rate-limit` | `libs/httpSecurity.ts` | `createRateLimiters` |
| `sharp` | `modules/media/.../SharpImageProcessingService.ts` | image-processing domain port |
| `@aws-sdk/*` | `modules/media/.../S3StorageService.ts` | storage domain port |
| `multer` | `modules/media/.../MediaController.ts` | upload surface |
| `graphql` | `libs/graphqlAuth.ts`, `libs/graphqlSecurity.ts` | modules write SDL strings — never import `graphql` |
| `@apollo/server`, `@as-integrations/express5` | `boot/graphql.ts` | composition root |
| `helmet`, `cors`, `compression`, `i18next`, `swagger-ui-express`, `ejs` | `app.ts` / `boot/routes.ts` | composition root — mount/config only |
| `node:crypto` scrypt | `libs/hash.ts` | `hashString`/`compareString` |

When adding a package that has a plausible alternative, prefer creating or extending a seam over importing it directly from modules.

## Shared Kernel Admission Criteria

The shared kernel (`libs/`) is deliberately tiny. Adding a new shared type requires review and must meet **all** of these criteria:

1. **No dependencies** — the type must not import from `modules/` or external packages.
2. **No I/O** — no database, network, or filesystem access.
3. **No module-specific business rules** — the type must be genuinely universal across contexts.
4. **Stable API** — once admitted, breaking changes require consensus from all consuming contexts.
5. **Agreed by both contexts** — at minimum, the two highest-traffic consumers must agree on the shape.

Current shared kernel types:

| Type    | File            | Consumers                            | Notes                                                                                                                                           |
| ------- | --------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `Money` | `libs/money.ts` | `basket`, `checkout`, `order`, `tax` | Promoted from `basket/domain/valueObjects/Money` and `order/domain/valueObjects/Money`. Merged API supports both positive and negative amounts. |

### What does NOT belong in the shared kernel

- `OrderStatus` / `PaymentStatus` — these are `order`'s domain concepts. Other modules should hold their own vocabulary (e.g. `CheckoutOutcome`) and let an ACL adapter map it.
- `Address` — context-specific validation differs (shipping vs billing vs store location). Promote only if a truly generic geographic value type emerges.
- Aggregate roots, entities, or anything with lifecycle behaviour.
