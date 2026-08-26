# Shared Libraries (`libs/`)

| File / Dir             | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| `db/`                  | Database connection pool, client, query helpers |
| `db/types.ts`          | Auto-generated Knex table/column types          |
| `db/dataModelTypes.ts` | Shared data model type definitions              |
| `auth.ts`              | Authentication middleware (JWT + session)       |
| `apiResponse.ts`       | Standard API response helpers                   |
| `events/`              | Event bus (EventEmitter-based + durable outbox) |
| `events/eventBus.ts`   | EventEmitter-based event bus with error boundaries |
| `events/outboxWriter.ts` | Transactional outbox writer (within DB transaction) |
| `events/outboxDispatcher.ts` | Claim-based polling dispatcher with retry + dead-letter |
| `events/registerEventHandlers.ts` | Central event handler registration (gated by module registry) |
| `logger.ts`            | Winston logger with daily rotation              |
| `validation.ts`        | Input validation utilities                      |
| `form.ts`              | EJS form helper functions                       |
| `hash.ts`              | Password hashing (bcrypt)                       |
| `slug.ts`              | Slug generation utilities                       |
| `amount.ts`            | Money/amount formatting (legacy, unused)        |
| `money.ts`             | **Shared Kernel** — `Money` value object        |
| `date.ts`              | Date formatting utilities                       |
| `cache.ts`             | Caching utilities                               |
| `geoip.ts`             | GeoIP lookup utilities                          |
| `roles.ts`             | Role definitions                                |
| `uuid.ts`              | UUID generation                                 |
| `strings.ts`           | String manipulation utilities                   |
| `errors.ts`            | Custom error classes (`AppError` base)          |
| `secrets.ts`           | AES-256-GCM encryption for credential storage   |
| `session/`             | Session store factory (Redis/PostgreSQL)        |
| `jobs/`                | Background job utilities                        |
| `types/`               | Shared TypeScript types (e.g. `TypedRequest`)   |
| `moduleRegistry/`      | Module manifest registry & feature flag system  |
| `moduleRegistry/types.ts` | `ModuleManifest`, `RouteDeclaration`, etc.   |
| `moduleRegistry/registry.ts` | Singleton registry with `isEnabled()`, `shouldMountRoutes()`, etc. |

## Rules

- All cross-cutting utilities belong in `libs/`, not in individual modules.
- Libraries must not import from `modules/` or `web/` — dependency flows one way: `web → modules → libs`.
- Avoid circular imports between sibling libraries.

## Shared Kernel Admission Criteria

The shared kernel (`libs/`) is deliberately tiny. Adding a new shared type requires review and must meet **all** of these criteria:

1. **No dependencies** — the type must not import from `modules/` or external packages.
2. **No I/O** — no database, network, or filesystem access.
3. **No module-specific business rules** — the type must be genuinely universal across contexts.
4. **Stable API** — once admitted, breaking changes require consensus from all consuming contexts.
5. **Agreed by both contexts** — at minimum, the two highest-traffic consumers must agree on the shape.

Current shared kernel types:

| Type       | File          | Consumers                          | Notes                                    |
| ---------- | ------------- | ---------------------------------- | ---------------------------------------- |
| `Money`    | `libs/money.ts` | `basket`, `checkout`, `order`, `tax` | Promoted from `basket/domain/valueObjects/Money` and `order/domain/valueObjects/Money`. Merged API supports both positive and negative amounts. |

### What does NOT belong in the shared kernel

- `OrderStatus` / `PaymentStatus` — these are `order`'s domain concepts. Other modules should hold their own vocabulary (e.g. `CheckoutOutcome`) and let an ACL adapter map it.
- `Address` — context-specific validation differs (shipping vs billing vs store location). Promote only if a truly generic geographic value type emerges.
- Aggregate roots, entities, or anything with lifecycle behaviour.
