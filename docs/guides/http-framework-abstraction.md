# HTTP Framework Abstraction Guide

> **Status:** Implemented
>
> The platform's Express dependency is centralized behind a lightweight, project-owned HTTP facade under `libs/http/`. Application code uses `HttpRequest`, `HttpResponse`, `HttpNext`, `HttpHandler`, and `createHttpRouter` instead of importing those types and factories directly from `express`.

## 1. Overview

The facade intentionally preserves the Express programming model:

```ts
req.body;
req.params;
req.query;
req.user;

res.status(201).json({ success: true });
router.get('/resource', handler);
```

This is a lightweight dependency boundary, not a fully framework-neutral controller architecture. Express remains the runtime HTTP implementation.

### Why this approach

- Consistent, project-owned HTTP vocabulary across all modules.
- Centralizes request extensions and authenticated-user types.
- Prevents Express imports from spreading through modules.
- Creates one place to inventory and adapt the HTTP API if another framework is evaluated.
- Avoids introducing response DTOs, declarative routes, or controller adapters before they are needed.

### Explicit limitation

Changing the facade's TypeScript aliases from Express to another framework will **not**, by itself, switch the runtime framework. Frameworks differ in router construction, middleware execution, response methods, rendering, sessions, uploads, and ecosystem integrations. A future framework migration will require a runtime adapter or selected controller changes — the facade's value is that those differences are addressed at a controlled boundary rather than through direct imports spread across the repository.

---

## 2. Architecture

### 2.1 Dependency flow

```text
modules/*/interface ───────┐
web/*                      │
libs/auth.ts               ├──> libs/http ───> Express
libs/apiResponse.ts        │
libs/errorMiddleware.ts ───┘

app.ts / boot/* ─────────────────────────────> Express
```

Modules and web code depend on `libs/http`. Express is imported directly only by the facade itself, application bootstrap, and composition code (see [§4](#4-approved-express-boundaries)).

### 2.2 File structure

```text
libs/http/
├── index.ts                 # Public API barrel
├── types.ts                 # Express-backed project type aliases and generic request types
├── user.ts                  # Project-owned authenticated user and request-context types
├── expressAugmentation.ts   # Global Express augmentation for middleware and dependencies
└── expressAdapter.ts        # Runtime Express factories (createHttpRouter, httpRaw)
```

### 2.3 Public vocabulary

| Project type/factory | Implementation                          |
| -------------------- | --------------------------------------- |
| `HttpUser`           | Project-owned interface                 |
| `HttpRequest`        | Extends Express `Request`               |
| `HttpResponse`       | Alias of Express `Response`             |
| `HttpNext`           | Alias of Express `NextFunction`         |
| `HttpHandler`        | Express-compatible request handler type |
| `HttpRouter`         | Alias of Express `Router`               |
| `HttpApplication`    | Alias of Express `Express`              |
| `HttpRequestBody`    | `Record<string, unknown>`               |
| `createHttpRouter`   | Calls `express.Router()`                |
| `httpRaw`            | Calls `express.raw()`                   |

Do not export project types under generic names such as `Request`, `Response`, or `Router`. The `Http` prefix prevents confusion with Fetch, Node, Express, and domain request/response objects.

---

## 3. Facade API

### 3.1 Authenticated user

```ts
// libs/http/user.ts
export interface HttpUser {
  userId?: string;
  id?: string;
  _id?: string;
  customerId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: string;
  roles?: Roles;
  type?: 'admin' | 'organization' | 'b2b' | 'customer';
  status?: boolean;
  organizationId?: string;
  companyId?: string;
  storeId?: string;
  storeRole?: string;
  storeIds?: string[];
  facilityId?: string;
  providerId?: string;
  gender?: string;
  defaultCurrencyId?: string;
  defaultFacilityId?: string;
  permissions?: string[];
}

export interface HttpCompanyUser {
  companyId?: string;
  userId?: string;
  [key: string]: unknown;
}
export interface HttpCustomerContext {
  customerId?: string;
  [key: string]: unknown;
}
```

Application code never references `Express.User` — `req.user` resolves to `HttpUser` via the global augmentation.

### 3.2 Request and response types

```ts
// libs/http/types.ts
export interface HttpRequest<
  Params = Record<string, string>,
  ResponseBody = unknown,
  RequestBody = unknown,
  Query = Record<string, string>,
  Locals extends Record<string, unknown> = Record<string, unknown>,
> extends ExpressRequest<Params, ResponseBody, RequestBody, Query, Locals> {
  params: Params;
  user?: HttpUser;
  rawBody?: Buffer;
  companyUser?: HttpCompanyUser;
  b2bCompanyUserId?: string;
  customer?: HttpCustomerContext;
}

export type HttpResponse<Body, Locals> = ExpressResponse<Body, Locals>;
export type HttpNext = NextFunction;
export type HttpHandler = RequestHandler;
export type HttpRouter = Router;
export type HttpApplication = Express;
export type HttpRequestBody = Record<string, unknown>;
```

### 3.3 Express augmentation

`libs/http/expressAugmentation.ts` declares `Express.Request`/`Express.User` extensions globally so third-party middleware (`passport`, `express-session`, `connect-flash`, `multer`) and the platform's own fields (`req.rawBody`, `req.companyUser`, `req.customer`) stay typed:

```ts
declare global {
  namespace Express {
    interface User extends HttpUser {}
    interface Request {
      user?: User;
      rawBody?: Buffer;
      companyUser?: HttpCompanyUser;
      b2bCompanyUserId?: string;
      customer?: HttpCustomerContext;
    }
  }
}
```

It is loaded automatically by `libs/http/index.ts` — consumers never import it directly.

**Consequence:** because `@types/express-session`, `@types/connect-flash`, `@types/multer`, and `@types/passport` also augment `Express.Request`/`Express.Response` globally, `HttpRequest` inherits `req.session`, `req.flash()`, `req.file`/`req.files`, and `HttpResponse` inherits `res.render`. Portal and upload code compiles against facade types without extra imports.

### 3.4 Runtime adapter

```ts
// libs/http/expressAdapter.ts
import express from 'express';

export function createHttpRouter(): HttpRouter {
  return express.Router();
}

export function httpRaw(options: Parameters<typeof express.raw>[0]) {
  return express.raw(options);
}
```

Only add wrappers with active consumers. Do not reproduce the full Express API speculatively.

---

## 4. Approved Express boundaries

Direct `from 'express'` imports are allowed only in:

| Location       | What lives there                                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `libs/http/**` | The adapter itself (`expressAdapter.ts`, `types.ts` aliases)                                                                |
| `app.ts`       | Composition root: `express()`, `express.static`, `express.json`, `express.urlencoded`                                       |
| `boot/**`      | Composition wiring: `express.raw()` for webhooks, `express.static()` for docs, Apollo `RequestHandler` type in `graphql.ts` |

Everything else — all `modules/`, all `web/`, all other `libs/` — uses the facade.

### Express-family packages are separate packages

The ban targets the literal `express` package only. These remain legitimate imports anywhere (they are distinct packages, not Express itself):

- `express-session`, `connect-flash`, `express-winston`, `express-validator`
- `swagger-ui-express`, `@as-integrations/express5`, `passport`, `multer`

---

## 5. Usage conventions

### 5.1 Controllers

```ts
import type { HttpRequest, HttpResponse } from 'libs/http';

export async function list(req: HttpRequest, res: HttpResponse): Promise<void> {
  res.json({ success: true });
}
```

### 5.2 Routers

```ts
import { createHttpRouter } from 'libs/http';

const router = createHttpRouter();
```

Type-only router references use `HttpRouter`:

```ts
import type { HttpRouter } from 'libs/http';

const routers: HttpRouter[] = [];
```

### 5.3 Middleware

```ts
import type { HttpNext, HttpRequest, HttpResponse } from 'libs/http';

export async function middleware(req: HttpRequest, res: HttpResponse, next: HttpNext) { ... }
```

**`HttpHandler` vs `HttpRequest` caveat:** `HttpRequest`'s default `Query` is `Record<string, string>`, while Express's `RequestHandler` expects `ParsedQs`. A handler typed `(req: HttpRequest) => ...` is **not** assignable to an Express `RequestHandler` parameter (e.g. `app.use`, third-party middleware factories). For middleware exported to be mounted on Express routers, type it as `HttpHandler` — see `modules/content/validator.ts` and `boot/graphql.ts`.

### 5.4 Request bodies and narrowing

`HttpRequestBody` is `Record<string, unknown>` — destructured fields are `unknown` and need explicit narrowing at the boundary:

```ts
const { name, status } = req.body as { name: string; status: ProductStatus };
```

Prefer domain entity types for casts. If the needed enum/union lives in `infrastructure/` (which `interface-no-infra` forbids importing), use an inline literal union or derive it:

```ts
type: body.type as 'percent' | 'fixed' | 'free_shipping',
// or
params: body as Parameters<typeof useCase.create>[0],
```

`|| undefined` vs `|| null`: match the use case's parameter type. Where a use case re-coalesces falsy to `null`, passing `undefined` is behavior-equivalent.

### 5.5 Portals (web layer)

Admin and storefront controllers use the same facade types while remaining explicitly Express-backed at runtime. `res.render`, `res.locals`, `req.flash`, `req.session`, redirects, and view callbacks work unchanged (see [§3.3](#33-express-augmentation)). The facade does **not** promise these portals can run unchanged on another framework.

---

## 6. Special surfaces

| Surface               | Where it lives                         | Notes                                                                                          |
| --------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Raw webhook bodies    | `boot/routes.ts` (`express.raw()`)     | Raw-body parsing is a composition-root concern; controllers read `req.body as Buffer`.         |
| File uploads          | `modules/media/.../MediaController.ts` | `import multer` is the upload adapter surface; `req.file`/`req.files` via global augmentation. |
| Sessions/flash/render | `web/` portal controllers              | Typed via global augmentation; Express-specific by design.                                     |
| GraphQL               | `boot/graphql.ts`                      | Apollo `expressMiddleware`; handler typed as `express.RequestHandler` (see §5.3 caveat).       |
| Sessions store        | `libs/session/sessionStoreFactory.ts`  | Imports `express-session` directly — a distinct package, not the banned `express`.             |
| Validation            | `modules/content/validator.ts`         | Imports `express-validator` (distinct package); handlers exported as `HttpHandler`.            |

---

## 7. Enforcement

ESLint blocks new direct Express imports — `yarn lint` fails on regressions.

- `no-restricted-imports` bans `express` for both value and type imports (`import express`, `import { Request }`, `import type { Request }`).
- `no-restricted-syntax` bans `import('express')` dynamic imports globally.
- `@typescript-eslint/no-require-imports` already covers `require('express')`.
- Override in `eslint.config.mjs` exempts `boot/**/*.ts`, `app.ts`, and `libs/http/**/*.ts`.

dependency-cruiser intentionally carries no Express rule: `node_modules/` is in both `exclude.path` and `doNotFollow`, so external package dependencies never enter its module graph — a forbidden rule there would never fire.

---

## 8. Testing

- Facade tests (`libs/http/expressAdapter.test.ts`) cover only facade-owned behavior — router creation and wrapper forwarding. Do not duplicate Express's own test suite.
- Integration tests are the primary protection: route/method, auth result, status code, JSON body, validation errors, error-middleware output.
- Special-path coverage: webhook signatures (valid + invalid), raw bodies, multipart uploads, sessions, flash/redirects, EJS rendering, GraphQL HTTP, downloads.

```bash
yarn lint        # tsc + eslint + dependency-cruiser
yarn test:unit
yarn test:int    # requires PostgreSQL + running app
yarn docs:check
```

---

## 9. Future framework evaluation (Restify)

The facade prepares for, but does not implement, a framework swap. When evaluated:

### 9.1 Inventory the consumed facade

Determine which APIs application code actually uses — request properties, response methods, router methods, middleware signatures, cookies/sessions, rendering, uploads, streams. Do not design an adapter against the entire Express API.

### 9.2 Choose a migration boundary

Preferred first boundary: `/customer`, `/business`, `/health`, JSON webhooks. Keep Express for Admin, Storefront, EJS, sessions, Passport, and static files unless there is a separate reason to migrate them.

### 9.3 Select an adapter strategy

1. **Compatibility wrapper** — wrap the new framework's request/response/routing APIs to satisfy the consumed `libs/http` surface.
2. **Structural facade** — replace Express aliases with project-owned structural interfaces, then implement adapters per framework.
3. **Neutral controllers** — convert controllers to return framework-neutral response values.

Choose only after measuring the actual compatibility gap. The current facade does not commit the platform to one of these designs.

### 9.4 Prove parity

Run the same API integration tests against both frameworks: routing and path params, query parsing, body parsing, authentication, error propagation, status codes, headers, JSON serialization, raw webhook bodies, uploads. Do not switch production traffic until behavior is equivalent for the selected route surface.

---

## 10. Rules for new code

1. New module controllers import `HttpRequest` and `HttpResponse` from `libs/http`.
2. New module middleware imports `HttpNext` (or exports `HttpHandler` if mounted via `app.use`-style signatures) from `libs/http`.
3. New module routers use `createHttpRouter()`.
4. Direct Express imports require a framework-boundary justification and are enforced by ESLint.
5. Do not add methods to the facade without a real consumer.
6. Do not put module-specific user or request fields into the shared facade without cross-module need.
7. Use `import type` for type-only imports.
8. Keep endpoint behavior changes separate from facade work.
9. Treat a future framework replacement as a runtime-adapter project, not a TypeScript alias edit.

---

## Appendix: Migration history

Completed 2026-09-19 → 2026-09-20. Direct `from 'express'` imports went from 258 total to zero outside approved boundaries (`modules/`: 234 → 0; `web/`: 5 → 0; `libs/`: 12 → confined to `libs/http`; `boot/`: 3 → composition roots only).

Key outcomes:

- All controllers, routers, and middleware use facade types; `libs/types/express.ts` compatibility layer (`TypedRequest`, `RequestBody`) was removed after reaching zero importers.
- 520 unit suites (3,665 tests) and all module integration suites pass unchanged; generated route docs (1,215 routes) and OpenAPI (826 paths, 162 schemas) stayed stable throughout.
- 18 EJS templates with pre-existing delimiter/TDZ bugs were discovered and fixed during portal verification.
- Notable patterns preserved: `interface-no-infra` forces inline literal-union or `Parameters<>` casts where enum types live in `infrastructure/`; `HttpHandler` is used where `HttpRequest`'s narrower `Query` default breaks assignability to Express `RequestHandler` signatures.
