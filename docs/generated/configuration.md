# Configuration Reference

> Auto-generated from `.env.example`. Do not edit manually.
> Run `yarn docs:env` to regenerate.

## Core Application

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | ============================================================================ Core Application ============================================================================ |
| `SERVERLESS` | `0` | — |
| `NODE_ENV` | `development` | — |

## Default organization ID (used by admin controllers as fallback)

| Variable | Default | Description |
|---|---|---|
| `DEFAULT_ORGANIZATION_ID` | `01911000-0000-7000-8000-000000000001` | Default organization ID (used by admin controllers as fallback) |

## Default storefront store slug (multi-store: 'us' or 'uk')

| Variable | Default | Description |
|---|---|---|
| `DEFAULT_STORE_SLUG` | `us` | Default storefront store slug (multi-store: 'us' or 'uk') |

## Logging level (error | warn | info | debug)

| Variable | Default | Description |
|---|---|---|
| `LOG_LEVEL` | `debug` | Logging level (error | warn | info | debug) |

## but explicit values make sessions stable across restarts.

| Variable | Default | Description |
|---|---|---|
| `CUSTOMER_JWT_SECRET` | `generate-a-secure-random-string-at-least-32-chars-long` | ============================================================================ Required Secrets — ephemeral dev secrets are auto-generated if missing, but explicit values make sessions stable across restarts. ============================================================================ |
| `ORGANIZATION_JWT_SECRET` | `generate-a-secure-random-string-at-least-32-chars-long` | — |
| `ADMIN_JWT_SECRET` | `generate-a-secure-random-string-at-least-32-chars-long` | — |
| `B2B_JWT_SECRET` | `generate-a-secure-random-string-at-least-32-chars-long` | — |
| `SESSION_SECRET` | `bb90e8b58596c55070ee88b25ff01627ab0c227cd11d6f876af9e81a0...` | — |

## JWT token expiry

| Variable | Default | Description |
|---|---|---|
| `JWT_EXPIRES_IN` | `7d` | JWT token expiry |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | — |

## Payment webhook signature verification

| Variable | Default | Description |
|---|---|---|
| `PAYMENT_WEBHOOK_SECRET` | `test-secret-key` | Payment webhook signature verification |

## SCIM API bearer token (for SSO/identity provisioning)

| Variable | Default | Description |
|---|---|---|
| `SCIM_BEARER_TOKEN` | `generate-a-secure-random-string-for-scim-api` | SCIM API bearer token (for SSO/identity provisioning) |

## Integration encryption key (for storing third-party API keys encrypted in DB)

| Variable | Default | Description |
|---|---|---|
| `INTEGRATION_ENCRYPTION_KEY` | `generate-32-byte-encryption-key` | Integration encryption key (for storing third-party API keys encrypted in DB) |

## Database (PostgreSQL 18)

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_PORT` | `5432` | ============================================================================ Database (PostgreSQL 18) ============================================================================ |
| `POSTGRES_HOST` | `127.0.0.1` | — |
| `POSTGRES_USER` | `ecomm-user` | — |
| `POSTGRES_PASSWORD` | `ecomm-password` | — |
| `POSTGRES_DB` | `ecomm-db` | — |

## Alternative: single connection URL

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgres://ecomm-user:ecomm-password@127.0.0.1:5432/ecomm-db` | Alternative: single connection URL |

## CORS and Cookies

| Variable | Default | Description |
|---|---|---|
| `ALLOWED_ORIGINS` | `https://yourdomain.com` | ============================================================================ CORS and Cookies ============================================================================ |
| `COOKIE_SECRET` | `—` | — |
| `COOKIE_DOMAIN` | `—` | — |

## File Storage

| Variable | Default | Description |
|---|---|---|
| `STORAGE_TYPE` | `local` | ============================================================================ File Storage ============================================================================ |
| `STORAGE_LOCAL_DIR` | `uploads` | — |
| `STORAGE_LOCAL_URL` | `http://127.0.0.1:3000/uploads` | — |

