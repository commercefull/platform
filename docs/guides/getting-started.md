# Getting Started

This guide walks you through setting up CommerceFull for local development.

## Prerequisites

- **Node.js** 18+ (tested on Node 20+)
- **Yarn** (classic or berry)
- **Docker** (for PostgreSQL container)
- **Git**

## 1. Clone the repository

```bash
git clone <your-repo-url> platform
cd platform
```

## 2. Install dependencies

```bash
yarn install
```

## 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

| Variable | Value | Notes |
|---|---|---|
| `SESSION_SECRET` | A random 32+ char string | Required in production |
| `POSTGRES_PASSWORD` | `ecomm-password` | Matches the Docker container default |
| `STRIPE_PRIVATE_KEY` | Your Stripe test key | Only if testing payments |

See the [Configuration Reference](#/generated/configuration) for the full list.

## 4. Start PostgreSQL

```bash
yarn db
```

This starts a PostgreSQL 18 Alpine container on port `5433` (mapped to 5432 inside the container).

## 5. Run migrations

```bash
yarn db:migrate
```

This creates all tables via Knex migrations.

## 6. Create an admin user

```bash
yarn job:new:admin
```

Follow the prompts to set email and password. This user can access the Admin Panel.

## 7. (Optional) Seed sample data

```bash
yarn db:seed
```

Seeds currencies, countries, locales, product types, test users, and sample products.

## 8. Start the development server

```bash
yarn dev
```

The server starts with hot reload via nodemon.

## Access Points

| Portal | URL | Auth |
|---|---|---|
| Storefront | `http://localhost:3000` | Public |
| Admin Panel | `http://localhost:3000/admin` | `isAdminLoggedIn` |
| Customer API | `http://localhost:3000/customer/*` | Session or JWT |
| Business API | `http://localhost:3000/business/*` | `isMerchantLoggedIn` |
| Health Check | `http://localhost:3000/health` | None |
| **Docs** | `http://localhost:3000/docs` | None |

## Common commands

```bash
yarn dev              # Start dev server with hot reload
yarn db               # Start PostgreSQL Docker container
yarn db:stop          # Stop PostgreSQL Docker container
yarn db:migrate       # Run all pending migrations
yarn db:migrate:new <name>  # Create a new migration file
yarn db:rollback      # Rollback last migration batch
yarn db:seed          # Run all seed files
yarn db:types         # Generate Knex types from DB schema
yarn test             # Full Jest suite with coverage
yarn test:unit        # Unit tests
yarn test:int         # Integration tests
yarn lint             # TypeScript check + ESLint
yarn lint:fix         # ESLint with auto-fix
yarn format           # Prettier format all files
yarn css:build        # Build Tailwind CSS (minified)
yarn job:new:admin    # Create a new admin user
yarn job:new:organization # Create a new organization
yarn job:new:business # Create a new business
```

## Next steps

- [Configuration](#/guides/configuration) — all environment variables explained
- [Deployment](#/guides/deployment) — deploy to production
- [Architecture Overview](#/architecture/overview) — understand the system
- [API Reference](#/generated/api-reference) — explore the REST API
