# AGENTS.md — AI Coding Agent Guidelines

> Working instructions for AI coding agents and contributors. Keep this document short; authoritative details live in the linked standards.

## Start Here

1. Read the high-level architecture: [`ARCHITECTURE.md`](./ARCHITECTURE.md).
2. Consult the standard relevant to your task from the index below.
3. Follow the dependency direction `web → modules → libs`.
4. Prefer minimal, focused edits. Run `yarn lint:errors` and `yarn test` for the affected area before finishing.

## Standards Index

All engineering standards are under [`docs/guidelines/`](./docs/guidelines/README.md):

| Topic                             | Document                                                          |
| --------------------------------- | ----------------------------------------------------------------- |
| Database (naming, SQL helpers)    | [guidelines/database.md](./docs/guidelines/database.md)             |
| Migrations (Knex, file format)    | [guidelines/migrations.md](./docs/guidelines/migrations.md)         |
| Seeds                             | [guidelines/seeds.md](./docs/guidelines/seeds.md)                   |
| Module structure (DDD)            | [guidelines/modules-ddd.md](./docs/guidelines/modules-ddd.md)       |
| Module integration (ACL patterns) | [guidelines/module-integration.md](./docs/guidelines/module-integration.md) |
| Module stability checklist        | [guidelines/module-stability-checklist.md](./docs/guidelines/module-stability-checklist.md) |
| Errors & logging                  | [guidelines/errors-and-logging.md](./docs/guidelines/errors-and-logging.md) |
| Web layer (EJS portals)           | [guidelines/web-layer.md](./docs/guidelines/web-layer.md)           |
| API response patterns             | [guidelines/api-responses.md](./docs/guidelines/api-responses.md)   |
| Authentication & authorization    | [guidelines/authentication.md](./docs/guidelines/authentication.md) |
| Event system                      | [guidelines/events.md](./docs/guidelines/events.md)                 |
| Testing                           | [guidelines/testing.md](./docs/guidelines/testing.md)               |
| Code style & formatting           | [guidelines/code-style.md](./docs/guidelines/code-style.md)         |
| Security                          | [guidelines/security.md](./docs/guidelines/security.md)             |
| Internationalization (i18n)       | [guidelines/i18n.md](./docs/guidelines/i18n.md)                     |
| Shared libraries (`libs/`)        | [guidelines/libraries.md](./docs/guidelines/libraries.md)           |
| Infrastructure & deployment       | [guidelines/infrastructure.md](./docs/guidelines/infrastructure.md) |
| Do's and Don'ts (quick reference) | [guidelines/do-and-dont.md](./docs/guidelines/do-and-dont.md)       |

## Mission

Creating tailor-made commerce solutions — empowering businesses to thrive in the digital marketplace through simple, innovative, user-centric software.

## Getting Started

```bash
yarn install                # Install dependencies
cp .env.example .env        # Configure environment
yarn db                     # Start PostgreSQL via Docker
yarn db:migrate             # Run database migrations
yarn job:new:admin          # Create initial admin user
yarn db:seed                # Seed sample data (optional)
yarn dev                    # Start development server (nodemon)
```

### Access Points

- Admin Panel: `http://localhost:3000/admin`
- Storefront: `http://localhost:3000`
- Customer API: `http://localhost:3000/customer`
- Business API: `http://localhost:3000/business`
- Health Check: `http://localhost:3000/health`

## Common Commands

```bash
# Development
yarn dev                    # Start dev server with hot reload
yarn prd:build              # Build for production (esbuild)
yarn prd                    # Build + run production

# Database
yarn db                     # Start PostgreSQL Docker container
yarn db:stop                # Stop PostgreSQL Docker container
yarn db:migrate             # Run all pending migrations
yarn db:migrate:new <name>  # Create a new migration file
yarn db:rollback            # Rollback last migration batch
yarn db:rollback:all        # Rollback all migrations
yarn db:seed                # Run all seed files
yarn db:types               # Generate Knex types from DB schema

# Testing
yarn test                   # Unit tests (with coverage)
yarn test:unit              # Unit tests
yarn test:int               # Integration tests (requires PostgreSQL)

# Code Quality
yarn lint                   # TypeScript check + ESLint
yarn lint:errors            # ESLint errors only
yarn lint:fix               # ESLint with auto-fix
yarn format                 # Prettier format all files
yarn format:check           # Check formatting
yarn code:lint              # Knip (dead code detection)
yarn sec:audit              # Security audit
yarn sec:check              # Security audit (high severity only)

# CSS
yarn css:build              # Build Tailwind CSS (minified)
yarn css:watch              # Watch mode for Tailwind CSS

# Jobs
yarn job:new:admin          # Create a new admin user
yarn job:new:organization   # Create a new organization
```

> **Note**: `job:new:business` is currently unavailable — the `modules/business/` directory does not exist. Use `job:new:organization` to create a business entity.

## Working Principles for Agents

- **Root-cause, not workarounds** — prefer minimal upstream fixes over downstream patches.
- **One step in progress** — use a concise plan and mark steps as completed when done.
- **Tests first for real changes** — design or update tests before major implementation. Never weaken or delete tests without explicit direction.
- **Direct use-case imports in `web/`** — portals call module use cases directly; no HTTP overhead.
- **No `require()` in TypeScript files** — ES `import` only, always at the top of the file.
- **camelCase everywhere in the database** — tables, columns, JSON fields, and FK columns all use camelCase with double-quoted PostgreSQL identifiers.
- **Parameterized SQL only** — never interpolate user input into query strings.
- **Always use `libs/logger`** in production code — never `console.log`.
- **All `/business` routes must use `isOrganizationLoggedIn`** — except public auth endpoints in `identityBusinessRouter` (login, register, token refresh, password reset).
- **Follow `/business/{topic}/...` route naming** — every business router must include its module topic as a path prefix (e.g. `/business/media/upload`, not `/business/upload`).

## Module & Migration Documentation

- Module specs: [`docs/modules/`](./docs/modules/)
- Migration guides: [`docs/migrations/`](./docs/migrations/) — external migration tool being built separately; `modules/migration` provides in-platform import infrastructure.

---

**Last Updated**: August 2026
