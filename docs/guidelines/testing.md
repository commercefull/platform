# Testing Standards

## Test Layout

```
tests/
└── integration/               # API-level integration tests
    ├── testUtils.ts           # Shared test harness (createTestClient, loginTestAdmin, etc.)
    ├── audit/
    ├── automation/
    ├── basket/
    ├── checkout/
    ├── integration/
    ├── marketplace/
    ├── order/
    ├── pagebuilder/
    ├── product/
    ├── returns/
    ├── segment/
    ├── theme/
    ├── tracking/
    ├── webhook/
    └── ...

modules/[module]/
├── application/useCases/
│   ├── AddItem.ts
│   └── AddItem.test.ts        # Unit tests co-located with the use case
├── domain/entities/
│   ├── Basket.ts
│   └── Basket.test.ts         # Domain unit tests co-located with the entity
└── tests/
    └── testUtils.ts           # Shared unit-test helpers (factories, boundary mocks)
```

> **Reference implementation**: `modules/basket/` — see [`modules/basket/tests/testUtils.ts`](../../modules/basket/tests/testUtils.ts) and the use-case tests in `modules/basket/application/useCases/`. All unit tests must follow this pattern.

## Jest Configuration

- **Transform**: `@swc/jest` (hoists `jest.mock` calls, so mocks can be registered from a shared helper)
- **Test timeout**: 30 seconds
- **Coverage from**: `features/**/*.ts`, `modules/**/*.ts`, `libs/**/*.ts`
- **Coverage reporters**: text + lcov
- **Force exit**: true (to handle open handles)
- **Unit test roots**: `modules/`, `libs/`, `features/`
- **Integration test roots**: `tests/integration/`

## Unit Test Pattern

Unit tests follow the Kent Beck style: test behavior through the public interface, mock only the boundaries, use real domain objects.

### Location

- `*.test.ts` files are **co-located** with the code under test (`AddItem.ts` next to `AddItem.test.ts`).
- **One use case per file** — each `*.ts` under `useCases/` defines exactly one `*UseCase` class, and the file is named after it (`ManageThemesUseCase` → `ManageThemes.ts`). Its `Command`/`Query`/`Response` types may live in the same file. The test file mirrors the name (`ManageThemes.test.ts`) and covers only that use case.
- Shared helpers live in `modules/<module>/tests/testUtils.ts`. The `tests/` directory name matters: it is excluded by the dependency-cruiser config and is unreachable from `app.ts`, so it stays out of both the dependency graph and the production `esbuild` bundle. Do **not** use `__tests__/` — it does not match the dependency-cruiser `tests/` exclusion.

### Shared `testUtils.ts`

Each module's `tests/testUtils.ts` owns three things:

```typescript
// 1. Boundary mocks — registered once, applied to every importing test file.
//    Import testUtils FIRST so mocks register before the use case is evaluated,
//    and USE at least one imported symbol (emitMock, queryMock, a factory) —
//    an unused named import may be elided, so the module never evaluates and
//    its jest.mock registrations silently never run.
jest.mock('../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

export const emitMock = jest.mocked(eventBus.emit);

beforeEach(() => emitMock.mockClear());

// 2. Real domain factories — never hand-build entity-shaped object literals.
export function createBasket(options: BasketOptions = {}): Basket { /* ... */ }

// 3. Typed port mocks — jest.Mocked<Interface>, never `as never` casts.
export function createBasketRepository(basket: Basket | null = null): jest.Mocked<BasketRepository> { /* ... */ }
```

### Naming

Every test reads as a behavioral specification: `it('should <outcome> when <condition>')`.

```typescript
it('should increase the quantity when the product is already in the basket', ...);
it('should emit basket.item_added when an item is added', ...);
it('should throw BasketNotFoundError when the basket does not exist', ...);
```

### What to assert

- **Outcome** — the returned response or entity state, not merely that a mock was called.
- **Persistence contract** — repository calls that must happen (`save`, `updateItem`) or must not (`addItem` when merging quantities).
- **Events** — `emitMock` assertions for every event the use case emits, including payload fields other modules rely on.
- **Errors** — domain errors for every guard, including input validation that must happen *before* any repository access (`expect(repository.findById).not.toHaveBeenCalled()`).

### What not to do

- Don't mock domain entities (`Basket`, `BasketItem`, `Money`) — use the real objects.
- Don't mock `infrastructure/` implementations — inject a mock of the domain port.
- Don't use `Record<string, jest.Mock>` + `as never` casts — they bypass type checking.
- Don't assert only `result.id === mock.id` — the value comes from the mock itself and proves nothing.
- Don't leave `eventBus` unmocked — always import the shared `testUtils` so emissions cannot trigger real handlers.

## Integration Test Pattern

Integration tests use a **shared test harness** that connects to a globally running application instance (typically `localhost:3000`). Each test file gets an isolated database via `X-Test-Database` headers.

### Shared harness setup

```typescript
import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

describe('Product API', () => {
  let client: AxiosInstance;
  let adminToken: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  it('should list products', async () => {
    const res = await client.get('/business/products', {
      headers: authHeaders(),
    });

    expectStatus(res, 200);
    expect(res.data.success).toBe(true);
  });
});
```

### Test utilities (`tests/integration/testUtils.ts`)

| Utility                        | Description                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `createTestClient()`           | Creates an Axios instance with `X-Test-Database` and `X-Test-Request` headers |
| `loginTestAdmin(client)`       | Logs in as `merchant@example.com` / `password123`, returns access token       |
| `loginTestUser(client)`        | Logs in as `testcustomer@example.com` / `password123`, returns access token   |
| `expectStatus(response, code)` | Asserts HTTP status with detailed error logging                               |
| `clearTokenCache()`            | Clears cached tokens (for testing auth flows)                                 |

### Auth requirements for integration tests

- **All `/business` route tests** must call `loginTestAdmin(client)` in `beforeAll` and pass `authHeaders()` with every request.
- **All `/customer` route tests** that hit protected endpoints must call `loginTestUser(client)` and pass the customer token.
- Tests for public endpoints (e.g. customer basket, product listing) do not need auth headers.
- Include an auth rejection test (`it('should reject requests without auth token')`) for each protected router.
- Guard tests with `if (!orgToken) return;` to skip gracefully if login fails (e.g. no DB running).

### Cleanup pattern

Tests that create resources should clean up in `afterAll`:

```typescript
afterAll(async () => {
  if (orgToken && createdId) {
    await client.delete(`/business/items/${createdId}`, {
      headers: { Authorization: `Bearer ${orgToken}` },
    });
  }
});
```

### Status code flexibility

For endpoints that may return different status codes depending on DB state (e.g. missing seed data), accept multiple valid codes:

```typescript
expect([200, 400, 404]).toContain(resp.status);
```

## Module Integration Test Coverage

| Module      | Test File                                           | Coverage                                                    |
| ----------- | --------------------------------------------------- | ----------------------------------------------------------- |
| audit       | `tests/integration/audit/audit.test.ts`             | List, stats, verify chain, correlation ID, single log, auth |
| automation  | `tests/integration/automation/automation.test.ts`   | Rule CRUD, trigger, logs, delete, auth                      |
| integration | `tests/integration/integration/integration.test.ts` | CRUD, credentials, subscriptions, logs, auth                |
| marketplace | `tests/integration/marketplace/marketplace.test.ts` | Vendor CRUD + lifecycle, commission rules, payouts, auth    |
| pagebuilder | `tests/integration/pagebuilder/pagebuilder.test.ts` | Block types, draft CRUD, block ops, publish, preview, auth  |
| returns     | `tests/integration/returns/returns.test.ts`         | List, create, workflow transitions, store credit, auth      |
| segment     | `tests/integration/segment/segment.test.ts`         | Segment CRUD, evaluation, members, profiles, auth           |
| theme       | `tests/integration/theme/theme.test.ts`             | Theme CRUD, overrides, assignment, resolution, auth         |
| tracking    | `tests/integration/tracking/tracking.test.ts`       | Config CRUD, GTM, Meta CAPI, mappings, lifecycle, auth      |
| webhook     | `tests/integration/webhook/webhook.test.ts`         | Endpoint CRUD, delivery attempts, auth                      |

## Commands

```bash
yarn test                                    # Full Jest suite with coverage
yarn test:unit                               # Unit tests only
yarn test:int                                # Integration tests only
npx jest tests/integration/product.test.ts   # Single file
npx jest --testPathPattern=audit             # Run by pattern
```

## Discipline

- Design or update tests **before** major implementation work.
- Never delete or weaken tests without explicit direction.
- Prefer unit tests at the use-case / domain level and integration tests at the router level.
- Unit tests must follow the [Unit Test Pattern](#unit-test-pattern) — `modules/basket/` is the reference implementation.
- Integration tests must exercise real SQL against a test database.
- All business API tests must authenticate via `loginTestAdmin` and pass `authHeaders()`.
- Include auth rejection tests for protected routes.
- Clean up created resources in `afterAll` to avoid test pollution.

## Route Naming Convention

All business routes follow the `/business/{topic}/...` pattern:

| Topic                 | Path prefix                       | Example                                   |
| --------------------- | --------------------------------- | ----------------------------------------- |
| Products              | `/business/products`              | `GET /business/products/:id`              |
| Orders                | `/business/orders`                | `POST /business/orders`                   |
| Stores                | `/business/stores`                | `PUT /business/stores/:id/pickup`         |
| Media                 | `/business/media`                 | `POST /business/media/upload`             |
| Fulfillment           | `/business/fulfillments`          | `POST /business/fulfillments/:id/ship`    |
| Fulfillment locations | `/business/fulfillment/locations` | `GET /business/fulfillment/locations`     |
| Fulfillment partners  | `/business/fulfillment/partners`  | `POST /business/fulfillment/partners`     |
| Configuration         | `/business/configuration`         | `GET /business/configuration/active`      |
| Coupons               | `/business/coupons`               | `POST /business/coupons`                  |
| Identity (auth)       | `/business/auth`                  | `POST /business/auth/login`               |
| Identity (user-store) | `/business/auth/users`            | `GET /business/auth/users/:userId/stores` |
| Audit                 | `/business/audit`                 | `GET /business/audit/logs`                |
| Integration           | `/business/integration`           | `POST /business/integration`              |
| Automation            | `/business/automation`            | `POST /business/automation/rules`         |
| Returns               | `/business/returns`               | `POST /business/returns/requests`         |
| Themes                | `/business/themes`                | `GET /business/themes`                    |
| Page Builder          | `/business/page-builder`          | `POST /business/page-builder/drafts`      |
| Segment               | `/business/segment`               | `GET /business/segment`                   |
| Marketplace           | `/business/vendors`               | `POST /business/vendors`                  |
| Tracking              | `/business/tracking`              | `GET /business/tracking/config`           |
