# Configuration

CommerceFull is configured entirely through environment variables. Copy `.env.example` to `.env` and adjust as needed.

> The full machine-generated reference with every variable, its default, and description is in the [Configuration Reference](#/generated/configuration).

## Core variables

### Application

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | `development` or `production` |
| `BASE_URL` | `http://127.0.0.1:3000` | Public base URL (used for emails, webhooks) |
| `APP_EMAIL` | `hello@example.com` | From-address for outgoing emails |

### Database (PostgreSQL)

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_HOST` | `127.0.0.1` | Database host |
| `POSTGRES_PORT` | `5432` | Database port (Docker maps to 5433) |
| `POSTGRES_USER` | `ecomm-user` | Database user |
| `POSTGRES_PASSWORD` | `ecomm-password` | Database password |
| `POSTGRES_DB` | `ecomm-db` | Database name |
| `DATABASE_URL` | `postgres://...` | Connection string (used by Knex) |

### Session & Security

| Variable | Default | Description |
|---|---|---|
| `SESSION_SECRET` | — | **Required** in production (min 32 chars) |
| `CUSTOMER_JWT_SECRET` | — | JWT signing key for customer tokens |
| `MERCHANT_JWT_SECRET` | — | JWT signing key for merchant tokens |
| `COOKIE_SECRET` | — | Cookie signing secret |
| `COOKIE_DOMAIN` | — | Cookie domain (production only) |
| `ALLOWED_ORIGINS` | — | Comma-separated CORS origins |

### Redis (optional)

If `REDIS_URL` or `REDIS_HOST` is set, Redis is used for session storage instead of PostgreSQL.

| Variable | Default | Description |
|---|---|---|
| `REDIS_URL` | — | Full Redis connection URL |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | — | Redis password |
| `REDIS_DB` | `0` | Redis database index |
| `REDIS_SESSION_PREFIX` | `sess:` | Key prefix for session keys |

### Integrations

| Variable | Description |
|---|---|
| `STRIPE_PRIVATE_KEY` | Stripe API key for payments |
| `MJ_APIKEY_PUBLIC` | Mailjet public API key |
| `MJ_APIKEY_PRIVATE` | Mailjet private API key |
| `PAYMENT_WEBHOOK_SECRET` | Secret for verifying payment webhooks |

## Generating secrets

```bash
# Generate a 64-char hex string for SESSION_SECRET
openssl rand -hex 32

# Generate a UUID for JWT secrets
uuidgen
```

## Environment-specific notes

- **Development**: `SESSION_SECRET` defaults to an insecure value — a warning is printed but the app runs.
- **Production**: `SESSION_SECRET` must be set and at least 32 characters, or the app will refuse to start.
- **Production**: `secure` cookies are enforced (HTTPS only).
- **Production**: Helmet HSTS is enabled with 1-year max age.
