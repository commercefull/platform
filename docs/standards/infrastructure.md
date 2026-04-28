# Infrastructure & Deployment

## `infra/` Directory

| Directory        | Strategy                          | Use Case                      |
| ---------------- | --------------------------------- | ----------------------------- |
| `ansible-vps/`   | Ansible on traditional VPS        | Simple, full control          |
| `docker/`        | Docker Compose (local/staging)    | Development, CI               |
| `docker-gcp/`    | Terraform + Cloud Run             | Google Cloud deployment       |
| `docker-azure/`  | Terraform + Container Apps        | Azure deployment              |
| `ecs-aws/`       | AWS CDK + ECS Fargate + RDS       | High availability, enterprise |

## Docker Development

```bash
# Start all services
docker-compose up -d

# Production build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Health Check

```
GET /health → { "status": "ok", "timestamp": "2026-02-16T..." }
```

## Environment Variables

```bash
# Application
PORT=3000
NODE_ENV=development
BASE_URL=http://127.0.0.1:3000
SERVERLESS=0

# Database
POSTGRES_PORT=5432
POSTGRES_HOST=127.0.0.1
POSTGRES_USER=ecomm-user
POSTGRES_PASSWORD=ecomm-password
POSTGRES_DB=ecomm-db

# Authentication
SESSION_SECRET=<64-char-hex>
CUSTOMER_JWT_SECRET=<secure-secret>
MERCHANT_JWT_SECRET=<secure-secret>
ADMIN_JWT_SECRET=<secure-secret>
B2B_JWT_SECRET=<secure-secret>
COOKIE_SECRET=<secure-secret>
COOKIE_DOMAIN=

# External Services
STRIPE_PRIVATE_KEY=<stripe-key>
MJ_APIKEY_PUBLIC=<mailjet-public>
MJ_APIKEY_PRIVATE=<mailjet-private>
APP_EMAIL=hello@example.com

# Redis (optional)
# REDIS_URL=redis://localhost:6379

# CORS
ALLOWED_ORIGINS=https://yourdomain.com
```
