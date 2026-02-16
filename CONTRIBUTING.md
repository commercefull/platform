# Contributing to CommerceFull

Thank you for your interest in contributing to CommerceFull! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Architecture](#project-architecture)
- [Coding Standards](#coding-standards)
- [Creating a New Module](#creating-a-new-module)
- [Adding Admin Views](#adding-admin-views)
- [Adding Storefront Views](#adding-storefront-views)
- [Database Migrations](#database-migrations)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. Please be respectful and constructive in all interactions.

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **Yarn** 1.x (Classic)
- **Docker** (for PostgreSQL)
- **Git**

### Setup

```bash
# Fork and clone the repository
git clone https://github.com/<your-username>/platform.git
cd platform

# Install dependencies
yarn install

# Copy environment configuration
cp .env.example .env

# Start PostgreSQL
yarn db

# Run migrations
yarn db:migrate

# Create admin user
yarn job:new:admin

# Seed sample data
yarn db:seed

# Start development server
yarn dev
```

### Verify Your Setup

- Visit http://localhost:3000 (Storefront)
- Visit http://localhost:3000/admin (Admin Panel)
- Run `yarn lint` (should pass with 0 errors)
- Run `yarn test` (should pass)

---

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/my-feature
   # or: git checkout -b fix/bug-description
   ```

2. **Make your changes** following the [coding standards](#coding-standards).

3. **Test your changes**:
   ```bash
   yarn lint          # TypeScript + ESLint check
   yarn test:unit     # Unit tests
   yarn test:int      # Integration tests (requires running server)
   ```

4. **Commit** with a descriptive message:
   ```bash
   git commit -m "feat(product): add bulk import functionality"
   ```

5. **Push** and create a pull request.

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

**Scopes:** Module names (`product`, `order`, `checkout`), `admin`, `storefront`, `libs`, `infra`

**Examples:**
```
feat(checkout): add multi-step checkout flow
fix(inventory): correct stock reservation on concurrent orders
docs(readme): update deployment instructions
refactor(product): extract price calculation to value object
test(order): add integration tests for order cancellation
```

---

## Project Architecture

CommerceFull follows **Domain-Driven Design (DDD)**. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full guide.

### Key Principles

1. **Bounded Contexts** — Each module is a self-contained business domain
2. **Layered Architecture** — Domain → Application → Infrastructure → Interface
3. **Repository Pattern** — Domain defines interfaces, infrastructure implements them
4. **Use Cases** — Application layer orchestrates domain operations
5. **Separation of Concerns** — Web layer (views) is separate from business logic

### Directory Layout

```
modules/<module>/
├── application/useCases/     # Business operations
├── domain/
│   ├── entities/             # Aggregate roots
│   ├── valueObjects/         # Immutable value types
│   ├── events/               # Domain events
│   └── repositories/         # Repository interfaces
├── infrastructure/
│   └── repositories/         # SQL implementations
└── interface/
    ├── controllers/          # HTTP handlers
    └── routers/              # Express routes
```

### Web Layer

```
web/<portal>/
├── controllers/              # View controllers (render EJS)
├── views/                    # EJS templates
│   ├── partials/             # Shared partials (header, footer, etc.)
│   └── <feature>/            # Feature-specific views
└── <portal>Routers.ts        # Route definitions
```

---

## Coding Standards

### TypeScript

- Use **TypeScript** for all source files
- Enable **strict mode** — no `any` types unless absolutely necessary
- Use **interfaces** for data shapes, **types** for unions/intersections
- Prefer **const** over **let**, never use **var**
- Use **async/await** over raw Promises

### Database

- Use **raw SQL** via the `pg` driver (not an ORM)
- Database columns use **camelCase** with PostgreSQL double-quoting
- Always parameterize queries (`$1`, `$2`) — never interpolate user input
- Use the `query()` and `queryOne()` helpers from `libs/db`

```typescript
import { query, queryOne } from '../../../libs/db';

const result = await query(
  `SELECT * FROM "product" WHERE "categoryId" = $1 AND "deletedAt" IS NULL`,
  [categoryId]
);
```

### API Responses

Use the standard response helpers from `libs/api`:

```typescript
import { successResponse, errorResponse } from '../../../libs/api';

// Success
successResponse(res, data);
successResponse(res, data, 201);

// Error
errorResponse(res, 'Error message');
errorResponse(res, 'Not found', 404);
```

### Web Controllers

Use the portal-specific respond helpers:

```typescript
import { adminRespond } from '../../respond';

// Render a view
adminRespond(req, res, 'products/index', {
  pageName: 'Products',
  products,
  pagination,
});
```

### Code Style

- **Indentation:** 2 spaces
- **Semicolons:** Required
- **Quotes:** Single quotes
- **Trailing commas:** ES5 style
- Run `yarn format` before committing

---

## Creating a New Module

1. **Create the directory structure:**
   ```bash
   mkdir -p modules/mymodule/{application/useCases,domain/{entities,events,repositories,valueObjects},infrastructure/repositories,interface/{controllers,routers}}
   ```

2. **Define domain entities** in `domain/entities/`

3. **Define repository interface** in `domain/repositories/`

4. **Implement repository** in `infrastructure/repositories/` using raw SQL

5. **Create use cases** in `application/useCases/`

6. **Create controllers** in `interface/controllers/`

7. **Create routers** in `interface/routers/` and register in `boot/routes.ts`

8. **Create a migration** for the database table:
   ```bash
   yarn db:migrate:new create_mymodule_table
   ```

9. **Add admin views** (see below)

10. **Write tests**

---

## Adding Admin Views

Admin views use **Tabler** (Bootstrap-based) and are rendered via EJS.

### View Pattern

```html
<!-- Page Header -->
<div class="page-header d-print-none">
  <div class="row g-2 align-items-center">
    <div class="col"><h2 class="page-title"><%= pageName %></h2></div>
    <div class="col-auto ms-auto">
      <a href="/admin/mymodule/create" class="btn btn-primary">
        <i class="ti ti-plus"></i> Create
      </a>
    </div>
  </div>
</div>

<section class="content">
  <div class="container-fluid">
    <%- include("../partials/alerts") %>
    <!-- Your content here -->
  </div>
</section>
```

### Steps

1. Create view files in `web/admin/views/<feature>/`
2. Create a controller in `web/admin/controllers/`
3. Add routes in `web/admin/adminRouters.ts`
4. Update the sidebar navigation in `web/admin/views/partials/navbar.ejs`

---

## Adding Storefront Views

Storefront views use **Tailwind CSS** and follow a different pattern:

```html
<%- include("../partials/header") %>

<main class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900"><%= pageName %></h1>
    <!-- Your content here -->
  </div>
</main>

<%- include("../partials/footer") %>
```

### Steps

1. Create view files in `web/storefront/views/<feature>/`
2. Create a controller in `web/storefront/controllers/`
3. Add routes in `web/storefront/storefrontRouter.ts`
4. Run `yarn css:build` if you add new Tailwind classes

---

## Database Migrations

### Creating a Migration

```bash
yarn db:migrate:new create_my_table
```

This creates a file in `migrations/` with a timestamp prefix.

### Migration Template

```typescript
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('myTable', (table) => {
    table.uuid('myTableId').primary().defaultTo(knex.fn.uuid());
    table.string('name').notNullable();
    table.string('status').defaultTo('active');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('deletedAt').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('myTable');
}
```

### Running Migrations

```bash
yarn db:migrate          # Apply pending migrations
yarn db:rollback         # Rollback last batch
yarn db:rollback:all     # Rollback everything
```

---

## Testing

### Unit Tests

Place unit tests next to the source code:

```
modules/product/application/useCases/__tests__/CreateProduct.test.ts
```

### Integration Tests

Place integration tests in `tests/integration/<module>/`:

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000',
  validateStatus: () => true,
});

describe('Product API', () => {
  it('should list products', async () => {
    const res = await client.get('/customer/products');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });
});
```

### Running Tests

```bash
yarn test          # All tests with coverage
yarn test:unit     # Unit tests only
yarn test:int      # Integration tests only
yarn test:e2e      # Cypress E2E tests
```

---

## Pull Request Process

1. **Ensure all checks pass:**
   ```bash
   yarn lint          # 0 errors
   yarn test          # All tests pass
   ```

2. **Fill out the PR template** with:
   - Description of changes
   - Related issue number(s)
   - Screenshots (for UI changes)
   - Testing steps

3. **Keep PRs focused** — one feature or fix per PR

4. **Respond to review feedback** promptly

5. **Squash commits** if requested before merge

### PR Title Format

Follow the same convention as commit messages:
```
feat(product): add bulk import functionality
fix(checkout): handle expired sessions gracefully
```

---

## Reporting Issues

### Bug Reports

Include:
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Environment** (Node.js version, OS, browser)
- **Screenshots** or error logs

### Feature Requests

Include:
- **Use case** — What problem does this solve?
- **Proposed solution** — How should it work?
- **Alternatives considered**

---

## Questions?

- Open a [GitHub Discussion](https://github.com/commercefull/platform/discussions)
- Check existing [Issues](https://github.com/commercefull/platform/issues)
- Review the [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- See [AGENTS.md](./AGENTS.md) for AI coding agent guidelines

Thank you for contributing to CommerceFull!
