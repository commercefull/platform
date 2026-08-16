# API Reference

> Auto-generated OpenAPI 3.0 specification for the CommerceFull REST API.

The full interactive API explorer is available at **`/docs/api`** when the server is running.

## Specification

The OpenAPI JSON spec is generated at `docs/generated/openapi.json` by running:

```bash
yarn docs:openapi
```

## Using the API Explorer

1. Start the server: `yarn dev`
2. Navigate to `http://localhost:3000/docs/api`
3. Browse endpoints by module tag
4. Click "Try it out" to test any endpoint

## Authentication

Most `/business/*` endpoints require a merchant JWT (`isMerchantLoggedIn`).
Most `/customer/*` endpoints require a customer session or JWT.

To authenticate via the API:

```bash
# Customer login (returns JWT)
curl -X POST http://localhost:3000/customer/identity/token \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Business/merchant login (returns JWT)
curl -X POST http://localhost:3000/business/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"merchant@example.com","password":"password123"}'

# Use the returned accessToken as Bearer token in subsequent requests
```

## GraphQL

CommerceFull also exposes a GraphQL endpoint at `/graphql` alongside the REST API. See `boot/graphql.ts` for the schema configuration.
