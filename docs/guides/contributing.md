# Contributing

## Development workflow

1. **Fork & clone** the repository
2. **Create a branch**: `git checkout -b feature/your-feature`
3. **Make changes** following the standards below
4. **Run checks**:
   ```bash
   yarn lint:errors    # ESLint errors only
   yarn test           # Full test suite
   yarn format:check   # Prettier check
   ```
5. **Commit** with a clear message
6. **Open a pull request**

## Standards

All engineering standards are in [`docs/guidelines/`](#/guidelines/modules-ddd):

- **[Module Structure (DDD)]** — domain → application → infrastructure → interface
- **[Database]** — camelCase columns, parameterized SQL, double-quoted identifiers
- **[Migrations]** — Knex format, file naming convention
- **[Web Layer]** — EJS portals, direct use-case imports
- **[API Responses]** — consistent JSON response patterns
- **[Authentication]** — session-based + JWT, `isOrganizationLoggedIn` for business routes
- **[Events]** — EventBus for decoupled communication
- **[Testing]** — Jest unit/integration, shared test harness with `createTestClient` and `loginTestAdmin`
- **[Code Style]** — TypeScript strict, Prettier, ESLint
- **[Security]** — Helmet, CORS, HPP, parameterized SQL
- **[i18n]** — i18next with locale files under `locales/`

## Key principles

- **Root-cause, not workarounds** — prefer minimal upstream fixes
- **No `require()` in TypeScript** — ES `import` only, at the top of the file
- **Always use `libs/logger`** — never `console.log` in production code
- **Parameterized SQL only** — never interpolate user input
- **Direct use-case imports in `web/`** — no HTTP overhead for portal controllers

## Documentation

- Hand-written guides live in `docs/guides/`
- Module specs live in `docs/modules/` (endpoint/event tables are auto-generated)
- Generated content lives in `docs/generated/` — never hand-edit
- If a route or env var changes, run `yarn docs:generate` to update generated docs
- CI runs `yarn docs:check` to fail if generated docs are stale

## Creating a new module

1. Create the directory structure under `modules/<name>/`:
   ```
   domain/           # Entities, value objects, repository interfaces
   application/      # Use cases, services
   infrastructure/   # SQL repositories, external adapters
   interface/        # Controllers, routers
   ```
2. Create a migration: `yarn db:migrate:new create<Name>Table`
3. Implement domain entities (pure, no dependencies)
4. Implement repository interface in domain, SQL impl in infrastructure
5. Implement use cases in application
6. Implement controllers and routers in interface
7. Mount the router in `boot/routes.ts`
8. Add a module spec in `docs/modules/<name>.md`
9. Run `yarn docs:generate` to update route tables
