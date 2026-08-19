# Security Standards

## Helmet Security Headers

- Content Security Policy (CSP) with whitelisted sources
- HSTS enabled in production (1 year, `includeSubDomains`, `preload`)
- Cross-Origin Embedder Policy disabled (to allow external resources)

## CORS Configuration

- **Production**: only origins from `ALLOWED_ORIGINS` env var
- **Development**: `localhost:3000`, `localhost:10000`, `127.0.0.1:3000`
- `credentials: true`
- Methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`

## HTTP Parameter Pollution (HPP)

Enabled with a whitelist for common filter parameters: `ids`, `tags`, `categories`, `status`, `types`, `fields`, `include`, `sort`.

## Input Validation & SQL Injection

- Use `express-validator` for request validation.
- **Always** use parameterized SQL queries. Never interpolate user input.
- Body size limits: JSON 1 MB, URL-encoded 10 MB.

```typescript
// ✅ CORRECT — parameterized
const result = await query('SELECT * FROM "product" WHERE "productId" = $1', [productId]);

// ❌ WRONG — SQL injection risk
const result = await query(`SELECT * FROM "product" WHERE "productId" = '${productId}'`);
```

## Password Hashing

- **Algorithm**: bcrypt via `bcryptjs`
- **Salt rounds**: 10

## Session Security

See [authentication.md](./authentication.md) for session cookie settings.

## Security Checklist for New Features

- [ ] SQL queries use parameterized bindings (`$1`, `$2`, …)
- [ ] User input validated before use
- [ ] Auth middleware applied to protected routes
- [ ] All `/business` routes protected with `isOrganizationLoggedIn`
- [ ] No `console.log` of sensitive data (use Winston logger)
- [ ] No hardcoded secrets (use environment variables)
- [ ] File uploads go through secure handling (Sharp for images, S3 for storage)
- [ ] Error responses don't leak stack traces in production

## Route Protection Audit

Every business router mounted under `/business` must apply `isOrganizationLoggedIn` middleware. The only exception is `identityBusinessRouter`, which exposes public auth endpoints (login, register, token refresh, password reset) before the middleware is applied.

### Routers verified as protected

| Router | Middleware |
| ------ | ---------- |
| `identityBusinessRouter` | `isOrganizationLoggedIn` (after public auth routes) |
| `organizationBusinessRouter` | `isOrganizationLoggedIn` |
| `promotionBusinessRouter` | `isOrganizationLoggedIn` |
| `productBusinessRouter` | `isOrganizationLoggedIn` |
| `orderBusinessRouter` | `isOrganizationLoggedIn` |
| `taxBusinessRouter` | `isOrganizationLoggedIn` |
| `customerBusinessRouter` | `isOrganizationLoggedIn` |
| `gdprBusinessRouter` | `isOrganizationLoggedIn` |
| `subscriptionBusinessRouter` | `isOrganizationLoggedIn` |
| `supportBusinessRouter` | `isOrganizationLoggedIn` |
| `analyticsBusinessRouter` | `isOrganizationLoggedIn` |
| `warehouseMerchantRouter` | `isOrganizationLoggedIn` |
| `supplierMerchantRouter` | `isOrganizationLoggedIn` |
| `localizationMerchantRouter` | `isOrganizationLoggedIn` |
| `pricingMerchantRouter` | `isOrganizationLoggedIn` |
| `loyaltyMerchantRouter` | `isOrganizationLoggedIn` |
| `notificationMerchantRouter` | `isOrganizationLoggedIn` |
| `contentRouterAdmin` | `isOrganizationLoggedIn` |
| `membershipBusinessRouter` | `isOrganizationLoggedIn` |
| `shippingBusinessRouter` | `isOrganizationLoggedIn` |
| `inventoryBusinessRouter` | `isOrganizationLoggedIn` |
| `paymentBusinessRouter` | `isOrganizationLoggedIn` |
| `basketBusinessRouter` | `isOrganizationLoggedIn` |
| `attributeBusinessRouter` | `isOrganizationLoggedIn` |
| `webhookBusinessRouter` | `isOrganizationLoggedIn` |
| `reportingBusinessRouter` | `isOrganizationLoggedIn` |
| `fulfillmentLocationRouter` | `isOrganizationLoggedIn` (per-route) |
| `fulfillmentBusinessRouter` | `isOrganizationLoggedIn` |
| `storeRouter` | `isOrganizationLoggedIn` |
| `mediaRouter` | `isOrganizationLoggedIn` |
| `systemConfigurationRouter` | `isOrganizationLoggedIn` |
| `couponBusinessRouter` | `isOrganizationLoggedIn` |
| `userStoreRouter` | Protected via parent `identityBusinessRouter` |
