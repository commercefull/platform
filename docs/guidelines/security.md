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
- [ ] No `console.log` of sensitive data (use Winston logger)
- [ ] No hardcoded secrets (use environment variables)
- [ ] File uploads go through secure handling (Sharp for images, S3 for storage)
- [ ] Error responses don't leak stack traces in production
