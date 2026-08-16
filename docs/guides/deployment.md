# Deployment

CommerceFull supports four deployment strategies. Choose based on your cloud provider and scalability needs.

## Quick comparison

| Strategy | Infrastructure | Complexity | Cost | Best for |
|---|---|---|---|---|
| **Ansible + VPS** | DigitalOcean, Linode, etc. | Medium | Low | Simple deployments, full control |
| **Docker + GCP** | Google Cloud Platform | Low | Medium | Google ecosystem |
| **Docker + Azure** | Microsoft Azure | Low | Medium | Enterprise integration |
| **ECS + RDS + AWS** | Amazon Web Services | High | High | High availability, enterprise |

## Prerequisites

- Node.js 18+ and npm/yarn
- Docker and Docker Compose
- Git
- SSH access to target environments
- PostgreSQL 18 (or 15/16 as fallback)

## 1. Ansible + VPS

Full Ansible automation with 7 roles: common, postgresql, nodejs, app, nginx, ssl, monitoring.

```bash
cd infra/ansible-vps
# Edit inventory.ini with your server IP
ansible-playbook -i inventory.ini deploy.yml
```

**Features**: Automated PostgreSQL 18, SSL via Let's Encrypt, systemd service, log rotation, security hardening (UFW, Fail2ban), backup automation.

See `infra/ansible-vps/README.md` for details.

## 2. Docker + GCP

Terraform infrastructure: Cloud Run, Cloud SQL, Cloud Storage, Cloud Load Balancer.

```bash
cd infra/docker-gcp
# Edit terraform.tfvars
terraform init
terraform apply
./deploy.sh
```

**Features**: Serverless containers, auto-scaling, Cloud Storage for media, CI/CD ready.

See `infra/docker-gcp/README.md` for details.

## 3. Docker + Azure

Terraform infrastructure: Container Apps, Azure Database for PostgreSQL, Storage Account, Front Door.

```bash
cd infra/docker-azure
# Edit terraform.tfvars
terraform init
terraform apply
./deploy.sh
```

**Features**: Serverless, global distribution, Key Vault secrets, Application Insights.

See `infra/docker-azure/README.md` for details.

## 4. ECS + RDS + AWS

AWS CDK v2: VPC, ECS Fargate, RDS, ALB, CloudFront, S3.

```bash
cd infra/ecs-aws
./deploy.sh --environment prod
```

**Features**: Fargate auto-scaling, RDS PostgreSQL, CloudFront CDN, S3 media, Systems Manager secrets, CloudWatch.

See `infra/ecs-aws/README.md` for details.

## Docker (local production)

For local production testing with Docker Compose:

```bash
cd infra/docker
cp .env.prod.example ../../../.env.prod
# Edit .env.prod with strong secrets
./deploy.sh
```

Access at `http://localhost:3000`. Health check at `http://localhost:3000/health`.

## Production environment checklist

- [ ] `NODE_ENV=production` set
- [ ] `SESSION_SECRET` — 32+ char random string
- [ ] `CUSTOMER_JWT_SECRET` — strong secret
- [ ] `MERCHANT_JWT_SECRET` — strong secret
- [ ] `COOKIE_SECRET` — strong secret
- [ ] `COOKIE_DOMAIN` — your domain
- [ ] `ALLOWED_ORIGINS` — your frontend origins
- [ ] `STRIPE_PRIVATE_KEY` — production Stripe key
- [ ] `MJ_APIKEY_PUBLIC` / `MJ_APIKEY_PRIVATE` — Mailjet keys
- [ ] PostgreSQL backups configured
- [ ] SSL certificates configured
- [ ] Health check monitoring set up

## Health checks

- Application: `GET /health` → `{ "status": "ok" }`
- Database: Connection monitoring via pool
- Infrastructure: Provider-specific (CloudWatch, Azure Monitor, etc.)

## Scaling

- **Horizontal**: Load balancer + multiple app instances
- **Vertical**: Increase instance size
- **Database**: Read replicas for read-heavy workloads
- **Sessions**: Use Redis for shared session store across instances

## Backups

- **Database**: Daily `pg_dump` automated by infra scripts
- **Files**: Cloud storage replication (S3, GCS, Azure Blob)
- **Configuration**: Version controlled in Git
