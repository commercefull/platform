# Environment Pipelines

> Staging/production promotion strategy, seed strategy per environment, and AWS dual-hosting parity.

## Environments

| Environment   | `NODE_ENV`     | Purpose                          | DB                      | Seeds                 |
| ------------- | -------------- | -------------------------------- | ----------------------- | --------------------- |
| **development** | `development`  | Local dev, hot reload            | `commercefull_dev`      | All seeds             |
| **staging**     | `staging`      | Pre-prod validation, UAT         | `commercefull_staging`  | Reference data only   |
| **production**  | `production`   | Live customer traffic            | `commercefull_prod`     | No seeds (manual)     |

## Promotion Strategy

### Flow

```
development → staging → production
```

Promotion is **artifact-based**, not source-based. The same build artifact (Docker image / esbuild bundle) is promoted across environments — only environment variables and secrets change.

### Step-by-step promotion

1. **Build artifact** (once, in CI):
   ```bash
   yarn prd:build          # produces app.mjs
   docker build -t commercefull:$VERSION .
   docker push registry/commercefull:$VERSION
   ```

2. **Deploy to staging**:
   ```bash
   # Run migrations (forward-only)
   knex migrate:latest --env staging

   # Deploy artifact
   docker pull registry/commercefull:$VERSION
   docker stop commercefull-staging && docker rm commercefull-staging
   docker run -d --name commercefull-staging \
     --env-file .env.staging \
     registry/commercefull:$VERSION

   # Run reference-data seeds (idempotent)
   knex seed:run --env staging
   ```

3. **Smoke test staging**:
   ```bash
   curl https://staging.yourdomain.com/health
   yarn db:migrate:validate
   # Run integration test suite against staging
   yarn test:int -- --baseUrl https://staging.yourdomain.com
   ```

4. **Promote to production** (same artifact):
   ```bash
   # Run migrations (forward-only)
   knex migrate:latest --env production

   # Deploy artifact (rolling update)
   docker pull registry/commercefull:$VERSION
   # For ECS: update service with new image tag
   # For Ansible: ansible-playbook deploy.yml -e version=$VERSION
   ```

5. **Post-deploy verification**:
   ```bash
   curl https://yourdomain.com/health
   # Monitor error rates for 10 minutes
   ```

### Rollback

- **Application rollback**: redeploy previous Docker image tag.
- **Database rollback**: **forward-only** — write a new migration to fix the issue. See [migrations.md](./migrations.md#forward-only-in-production) for emergency rollback guidance.
- **Never roll back the database past a data migration.**

## Seed Strategy

### Three seed categories

| Category          | Description                          | Runs in dev | Runs in staging | Runs in prod |
| ----------------- | ------------------------------------ |:-----------:|:---------------:|:------------:|
| **Reference data** | Currencies, countries, locales, tax categories, notification templates, default roles | ✅ | ✅ | ❌ (pre-seeded manually) |
| **Sample data**   | Test users, sample products, sample orders | ✅ | ❌ | ❌ |
| **Test data**     | Integration test fixtures            | ✅ | ❌ | ❌ |

### How it works

Seeds check `NODE_ENV` and skip themselves if the environment doesn't match. This is handled by the environment-aware seed runner (`knexfile.js` seed filter):

```javascript
// In a seed file
exports.seed = async function (knex) {
  // Only run in development
  if (process.env.NODE_ENV === 'production') return;
  if (process.env.NODE_ENV === 'staging' && !REFERENCE_DATA_SEEDS.has(__filename)) return;

  // ... seed logic
};
```

### Reference data seeds (safe for staging)

These seeds populate lookup tables that the application depends on:

- `seedCurrency` — currency codes (USD, EUR, GBP, etc.)
- `seedCountry` — ISO country codes
- `seedLocale` — supported locales
- `seedTaxCategory` — standard tax categories
- `seedDefaultRoles` — RBAC system roles
- `seedNotificationCategory` — notification event types
- `seedContentTypes` — CMS content type definitions
- `seedProductType` — product type definitions

### Production seeding

Production should **never** run `knex seed:run`. Reference data is inserted via:
1. A one-time manual SQL script after the first deployment.
2. A migration that inserts reference data (for new tables only).
3. The admin UI (for roles, notification templates, etc.).

## AWS Dual-Hosting Parity

The `infra/ecs-aws/` directory contains AWS CDK infrastructure that achieves feature parity with the other deployment strategies.

### Architecture

```
                    CloudFront CDN
                         |
                    Application Load Balancer
                    /                    \
              ECS Fargate           ECS Fargate
              (AZ 1a)               (AZ 1b)
                    \                    /
                    RDS PostgreSQL (Multi-AZ)
                    |
                    S3 (media files)
                    |
                    Systems Manager (secrets)
```

### Parity matrix

| Feature                | Ansible VPS | Docker GCP | Docker Azure | ECS AWS |
| ---------------------- |:-----------:|:----------:|:------------:|:-------:|
| SSL/TLS termination    | ✅ Nginx    | ✅ Cloud LB | ✅ Front Door | ✅ ALB  |
| Auto-scaling           | ❌          | ✅ Cloud Run | ✅ Container Apps | ✅ Fargate |
| Managed PostgreSQL     | ❌          | ✅ Cloud SQL | ✅ Azure DB | ✅ RDS  |
| Media file storage     | Local FS    | ✅ Cloud Storage | ✅ Blob Storage | ✅ S3 |
| Secrets management     | .env file   | Secret Manager | Key Vault | SSM Parameter Store |
| Multi-AZ               | ❌          | ✅          | ✅           | ✅      |
| CDN                    | ❌          | ✅ Cloud CDN | ✅ Azure CDN | ✅ CloudFront |
| Health checks          | ✅          | ✅          | ✅           | ✅ ALB  |
| Log aggregation        | File + journald | Cloud Logging | App Insights | CloudWatch |

### AWS-specific configuration

- **RDS**: PostgreSQL 18, Multi-AZ, automated backups, point-in-time recovery
- **ECS**: Fargate (no EC2 management), auto-scaling on CPU/memory
- **Secrets**: All secrets stored in SSM Parameter Store with KMS encryption
- **CDN**: CloudFront for static assets and media files
- **VPC**: Private subnets for RDS, public subnets for ALB

### Deploying to AWS

```bash
cd infra/ecs-aws
npm install
cdk bootstrap    # one-time
cdk deploy CommerceFull-App
```

See `infra/ecs-aws/README.md` for detailed instructions.

## CI/CD Pipeline (recommended)

```yaml
# .github/workflows/deploy.yml (or equivalent)
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn install --frozen-lockfile
      - run: yarn lint:errors
      - run: yarn test:unit
      - run: yarn db:migrate:validate
      - run: yarn prd:build
      - run: docker build -t commercefull:${{ github.sha }} .
      - run: docker push registry/commercefull:${{ github.sha }}

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: knex migrate:latest --env staging
      - run: knex seed:run --env staging
      - run: # deploy artifact to staging
      - run: curl https://staging.yourdomain.com/health

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - run: knex migrate:latest --env production
      - run: # deploy same artifact to production
      - run: curl https://yourdomain.com/health
```

## Promotion Checklist

Before promoting to production:

- [ ] All unit tests pass (`yarn test:unit`)
- [ ] All integration tests pass (`yarn test:int`)
- [ ] Migration validation passes (`yarn db:migrate:validate`)
- [ ] Migration smoke test passes (`yarn db:migrate:smoke`)
- [ ] `tsc --noEmit` exits 0
- [ ] No secrets in code (grep for `SECRET`, `PASSWORD`, `KEY` in diff)
- [ ] Staging smoke tests pass (health check, key API endpoints)
- [ ] No pending migrations in production (`knex migrate:status --env production`)
- [ ] Secrets validated (`validateAllSecrets()` passes in production mode)
- [ ] Rollback plan documented (previous image tag available)
- [ ] Monitoring alerts configured for the new deployment
