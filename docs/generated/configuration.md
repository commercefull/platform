# Configuration Reference

> Auto-generated from `.env.example`. Do not edit manually.
> Run `yarn docs:env` to regenerate.

## General

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | — |
| `SERVERLESS` | `0` | — |
| `BASE_URL` | `http://127.0.0.1:3000` | — |
| `SESSION_SECRET` | `bb90e8b58596c55070ee88b25ff01627ab0c227cd11d6f876af9e81a0...` | — |
| `APP_EMAIL` | `"hello@example.com"` | — |
| `STRIPE_PRIVATE_KEY` | `your_stripe_private_key` | — |

## Postgres

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_PORT` | `5432` | Postgres |
| `POSTGRES_HOST` | `127.0.0.1` | — |
| `POSTGRES_USER` | `ecomm-user` | — |
| `POSTGRES_PASSWORD` | `ecomm-password` | — |
| `POSTGRES_DB` | `ecomm-db` | — |

## Migration

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgres://ecomm-user:ecomm-password@127.0.0.1:5432/ecomm-db` | Migration |

## Mailjet

| Variable | Default | Description |
|---|---|---|
| `MJ_APIKEY_PUBLIC` | `pubkey-1234567890` | Mailjet |
| `MJ_APIKEY_PRIVATE` | `privkey-1234567890` | — |
| `CUSTOMER_JWT_SECRET` | `your-secret-key-should-be-in-env` | — |
| `ORGANIZATION_JWT_SECRET` | `your-secret-key-should-be-in-env` | — |
| `SESSION_SECRET` | `—` | — |
| `COOKIE_SECRET` | `—` | — |
| `COOKIE_DOMAIN` | `—` | — |
| `ALLOWED_ORIGINS` | `—` | — |
| `PAYMENT_WEBHOOK_SECRET` | `test-secret-key` | — |

## SSO / SCIM

| Variable | Default | Description |
|---|---|---|
| `SCIM_BEARER_TOKEN` | `generate-a-secure-random-string-for-scim-api` | Bearer token for SCIM 2.0 API authentication |
| `JWT_EXPIRES_IN` | `7d` | JWT token expiration duration |

