# AGENTS.md — AI Coding Agent Guidelines

> Working instructions for AI coding agents and contributors. Keep this document short; authoritative details live in the linked standards.

## Start Here

1. Read the high-level architecture: [`ARCHITECTURE.md`](./ARCHITECTURE.md).
2. Consult the standard relevant to your task from the index below.
3. Follow the dependency direction `web → modules → libs`.
4. Prefer minimal, focused edits. Run `yarn lint:errors` and `yarn test` for the affected area before finishing.

## Standards Index

All engineering standards are under [`docs/standards/`](./docs/standards/README.md):

| Topic                             | Document                                                          |
| --------------------------------- | ----------------------------------------------------------------- |
| Database (naming, SQL helpers)    | [standards/database.md](./docs/standards/database.md)             |
| Migrations (Knex, file format)    | [standards/migrations.md](./docs/standards/migrations.md)         |
| Seeds                             | [standards/seeds.md](./docs/standards/seeds.md)                   |
| Module structure (DDD)            | [standards/modules-ddd.md](./docs/standards/modules-ddd.md)       |
| Web layer (EJS portals)           | [standards/web-layer.md](./docs/standards/web-layer.md)           |
| API response patterns             | [standards/api-responses.md](./docs/standards/api-responses.md)   |
| Authentication & authorization    | [standards/authentication.md](./docs/standards/authentication.md) |
| Event system                      | [standards/events.md](./docs/standards/events.md)                 |
| Testing                           | [standards/testing.md](./docs/standards/testing.md)               |
| Code style & formatting           | [standards/code-style.md](./docs/standards/code-style.md)         |
| Security                          | [standards/security.md](./docs/standards/security.md)             |
| Internationalization (i18n)       | [standards/i18n.md](./docs/standards/i18n.md)                     |
| Shared libraries (`libs/`)        | [standards/libraries.md](./docs/standards/libraries.md)           |
| Infrastructure & deployment       | [standards/infrastructure.md](./docs/standards/infrastructure.md) |
| Do's and Don'ts (quick reference) | [standards/do-and-dont.md](./docs/standards/do-and-dont.md)       |

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
- Merchant Dashboard: `http://localhost:3000/merchant`
- B2B Portal: `http://localhost:3000/b2b`
- Storefront: `http://localhost:3000`
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
yarn test                   # Full Jest suite with coverage
yarn test:unit              # Unit tests
yarn test:int               # Integration tests
yarn test:e2e               # Cypress E2E

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
yarn job:new:merchant       # Create a new merchant
yarn job:new:business       # Create a new business
```

## Working Principles for Agents

- **Root-cause, not workarounds** — prefer minimal upstream fixes over downstream patches.
- **One step in progress** — use a concise plan and mark steps as completed when done.
- **Tests first for real changes** — design or update tests before major implementation. Never weaken or delete tests without explicit direction.
- **Direct use-case imports in `web/`** — portals call module use cases directly; no HTTP overhead.
- **No `require()` in TypeScript files** — ES `import` only, always at the top of the file.
- **camelCase everywhere in the database** — tables, columns, JSON fields, and FK columns all use camelCase with double-quoted PostgreSQL identifiers.
- **Parameterized SQL only** — never interpolate user input into query strings.
- **Always use `libs/logger`** in production code — never `console.log`.

## Module & Migration Documentation

- Module specs: [`docs/modules/`](./docs/modules/)
- Migration guides (Shopify, WooCommerce, Magento 2, PrestaShop, BigCommerce, Squarespace, Wix, custom, quick-start): [`docs/migrations/`](./docs/migrations/)

---

**Last Updated**: April 2026
