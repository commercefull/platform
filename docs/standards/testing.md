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

```typescript
import supertest from 'supertest';
const app = require('../../app');
const request = supertest(app);

describe('Product API', () => {
  let authToken: string;

  beforeAll(async () => {
    const res = await request.post('/customer/login').send({
      email: 'customer@example.com',
      password: 'password123',
    });
    authToken = res.body.token;
  });

  it('should list products', async () => {
    const res = await request.get('/business/products').set('Authorization', `Bearer ${authToken}`).set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.products).toBeDefined();
  });
});
```

## Commands

```bash
yarn test                                    # Full Jest suite with coverage
yarn test:unit                               # Unit tests only
yarn test:int                                # Integration tests only
npx jest tests/integration/product.test.ts   # Single file
yarn test:e2e                                # Cypress E2E suite
```

## Discipline

- Design or update tests **before** major implementation work.
- Never delete or weaken tests without explicit direction.
- Prefer unit tests at the use-case / domain level and integration tests at the router level.
- Integration tests must exercise real SQL against a test database.
