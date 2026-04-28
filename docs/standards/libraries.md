# Shared Libraries (`libs/`)

| File / Dir             | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| `db/`                  | Database connection pool, client, query helpers  |
| `db/types.ts`          | Auto-generated Knex table/column types           |
| `db/dataModelTypes.ts` | Shared data model type definitions               |
| `auth.ts`              | Authentication middleware (JWT + session)        |
| `apiResponse.ts`       | Standard API response helpers                    |
| `events/`              | Event bus (EventEmitter-based)                   |
| `logger.ts`            | Winston logger with daily rotation               |
| `validation.ts`        | Input validation utilities                       |
| `form.ts`              | EJS form helper functions                        |
| `hash.ts`              | Password hashing (bcrypt)                        |
| `slug.ts`              | Slug generation utilities                        |
| `amount.ts`            | Money/amount formatting (Dinero.js)              |
| `date.ts`              | Date formatting utilities                        |
| `cache.ts`             | Caching utilities                                |
| `geoip.ts`             | GeoIP lookup utilities                           |
| `roles.ts`             | Role definitions                                 |
| `uuid.ts`              | UUID generation                                  |
| `strings.ts`           | String manipulation utilities                    |
| `errors.ts`            | Custom error classes                             |
| `session/`             | Session store factory (Redis/PostgreSQL)         |
| `jobs/`                | Background job utilities                         |
| `types/`               | Shared TypeScript types (e.g. `TypedRequest`)    |

## Rules

- All cross-cutting utilities belong in `libs/`, not in individual modules.
- Libraries must not import from `modules/` or `web/` — dependency flows one way: `web → modules → libs`.
- Avoid circular imports between sibling libraries.
