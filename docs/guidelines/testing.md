# Testing Standards

## Test Layout

```
tests/
└── integration/               # API-level integration tests
    ├── helpers/
    ├── product/
    ├── order/
    └── ...

modules/[module]/
├── application/
│   └── useCases/
│       └── __tests__/         # Unit tests for use cases
└── domain/
    └── __tests__/             # Unit tests for domain logic
```

## Jest Configuration

- **Preset**: `ts-jest`
- **Test timeout**: 30 seconds
- **Coverage from**: `features/**/*.ts`
- **Coverage reporters**: text + lcov
- **Force exit**: true (to handle open handles)

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

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });
});
```

### Test utilities (`tests/integration/testUtils.ts`)

| Utility | Description |
| ------- | ----------- |
| `createTestClient()` | Creates an Axios instance with `X-Test-Database` and `X-Test-Request` headers |
| `loginTestAdmin(client)` | Logs in as `merchant@example.com` / `password123`, returns access token |
| `loginTestUser(client)` | Logs in as `testcustomer@example.com` / `password123`, returns access token |
| `expectStatus(response, code)` | Asserts HTTP status with detailed error logging |
| `clearTokenCache()` | Clears cached tokens (for testing auth flows) |

### Auth requirements for integration tests

- **All `/business` route tests** must call `loginTestAdmin(client)` in `beforeAll` and pass `authHeaders()` with every request.
- **All `/customer` route tests** that hit protected endpoints must call `loginTestUser(client)` and pass the customer token.
- Tests for public endpoints (e.g. customer basket, product listing) do not need auth headers.
- Include an auth rejection test (`it('should reject requests without auth token')`) for each protected router.

## Commands

```bash
yarn test                                    # Full Jest suite with coverage
yarn test:unit                               # Unit tests only
yarn test:int                                # Integration tests only
npx jest tests/integration/product.test.ts   # Single file
```

## Discipline

- Design or update tests **before** major implementation work.
- Never delete or weaken tests without explicit direction.
- Prefer unit tests at the use-case / domain level and integration tests at the router level.
- Integration tests must exercise real SQL against a test database.
- All business API tests must authenticate via `loginTestAdmin` and pass `authHeaders()`.
- Include auth rejection tests for protected routes.

## Route Naming Convention

All business routes follow the `/business/{topic}/...` pattern:

| Topic | Path prefix | Example |
| ----- | ----------- | ------- |
| Products | `/business/products` | `GET /business/products/:id` |
| Orders | `/business/orders` | `POST /business/orders` |
| Stores | `/business/stores` | `PUT /business/stores/:id/pickup` |
| Media | `/business/media` | `POST /business/media/upload` |
| Fulfillment | `/business/fulfillments` | `POST /business/fulfillments/:id/ship` |
| Fulfillment locations | `/business/fulfillment/locations` | `GET /business/fulfillment/locations` |
| Fulfillment partners | `/business/fulfillment/partners` | `POST /business/fulfillment/partners` |
| Configuration | `/business/configuration` | `GET /business/configuration/active` |
| Coupons | `/business/coupons` | `POST /business/coupons` |
| Identity (auth) | `/business/auth` | `POST /business/auth/login` |
| Identity (user-store) | `/business/auth/users` | `GET /business/auth/users/:userId/stores` |
