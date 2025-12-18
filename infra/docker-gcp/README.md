# Docker GCP Deployment

Deploy CommerceFull platform to Google Cloud Platform using Docker containers.

## Overview

This deployment strategy uses Google Cloud Platform services with Docker for containerized deployment:
- Google Cloud Run (serverless containers)
- Cloud SQL (managed PostgreSQL 18)
- Cloud Storage (file storage)
- Cloud Build (CI/CD)
- Secret Manager (secrets)
- Load Balancer (global HTTPS)

## Prerequisites

### GCP Account
- Google Cloud Platform account
- Billing enabled
- `gcloud` CLI installed and configured
- Project created

### Local Machine
- Docker and Docker Compose
- Google Cloud SDK
- Git

### DNS
- Domain name
- Ability to configure DNS records

## Quick Start

### 1. Setup GCP Project
```bash
# Set project
export PROJECT_ID=your-commercefull-project
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Configure Infrastructure
```bash
cd infra/docker-gcp

# Copy and edit configuration
cp terraform.tfvars.example terraform.tfvars
vim terraform.tfvars

# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply deployment
terraform apply
```

### 3. Deploy Application
```bash
# Build and deploy via Cloud Build
gcloud builds submit --config cloudbuild.yaml --substitutions=_REGION=us-central1 .

# Or deploy directly to Cloud Run
gcloud run deploy commercefull-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=secret:DATABASE_URL:latest \
  --set-secrets SESSION_SECRET=SESSION_SECRET:latest
```

## Architecture

```
Internet
    ↓
[Google Cloud Load Balancer (HTTPS)]
    ↓
[Cloud Run (CommerceFull App)]
    ↙               ↘
[Cloud SQL]    [Cloud Storage]
(PostgreSQL)   (Files/Media)
```

## Configuration

### Terraform Variables (`terraform.tfvars`)

```hcl
project_id      = "your-commercefull-project"
region         = "us-central1"
domain         = "yourdomain.com"
app_name       = "commercefull"
db_tier        = "db-f1-micro"
db_version     = "POSTGRES_15"
```

### Environment Variables

```yaml
# Application secrets (stored in Secret Manager)
DATABASE_URL: postgres://user:pass@host:5432/db
SESSION_SECRET: your-session-secret
JWT_SECRET: your-jwt-secret
GOOGLE_CLIENT_ID: your-google-oauth-id
GOOGLE_CLIENT_SECRET: your-google-oauth-secret

# Application configuration
NODE_ENV: production
PORT: 8080
DOMAIN: https://yourdomain.com

# GCP configuration
GCP_PROJECT_ID: your-project-id
GCP_REGION: us-central1
GCS_BUCKET: your-storage-bucket
```

## File Structure

```
docker-gcp/
├── README.md
├── Dockerfile                    # Application container
├── docker-compose.yml           # Local development
├── nginx.conf                   # Nginx configuration
├── terraform/
│   ├── main.tf                  # Infrastructure as code
│   ├── variables.tf             # Variable definitions
│   ├── outputs.tf               # Output definitions
│   └── terraform.tfvars.example # Variable examples
├── cloudbuild.yaml              # CI/CD pipeline
├── .dockerignore               # Docker ignore rules
└── scripts/
    ├── deploy.sh                # Deployment script
    ├── backup.sh                # Backup script
    └── monitoring.sh            # Monitoring setup
```

## Detailed Setup

### 1. Infrastructure Provisioning

#### Cloud SQL Database
```hcl
resource "google_sql_database_instance" "postgres" {
  name             = "commercefull-db"
  database_version = "POSTGRES_18"  # Note: PostgreSQL 18 may not be available yet
  region           = var.region

  settings {
    tier = "db-f1-micro"
    disk_size = 10
    disk_type = "PD_SSD"

    backup_configuration {
      enabled = true
      start_time = "02:00"
    }
  }
}
```

**Note:** PostgreSQL 18 may not be available on Cloud SQL yet. Check [Cloud SQL version availability](https://cloud.google.com/sql/docs/postgres/db-versions) for the latest supported versions.

#### Cloud Storage Bucket
```hcl
resource "google_storage_bucket" "media" {
  name     = "${var.project_id}-media"
  location = var.region

  uniform_bucket_level_access = true

  cors {
    origin          = ["https://${var.domain}"]
    method          = ["GET", "POST", "PUT"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}
```

#### Cloud Run Service
```hcl
resource "google_cloud_run_service" "app" {
  name     = var.app_name
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/${var.app_name}:latest"

        env {
          name  = "DATABASE_URL"
          value = "secret:DATABASE_URL:latest"
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}
```

### 2. Application Container

#### Dockerfile
```dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache postgresql-client

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### 3. CI/CD Pipeline

#### Cloud Build Configuration (`cloudbuild.yaml`)
```yaml
steps:
  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/commercefull:$COMMIT_SHA', '.']

  # Push image to GCR
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/commercefull:$COMMIT_SHA']

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'commercefull-app'
      - '--image=gcr.io/$PROJECT_ID/commercefull:$COMMIT_SHA'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'

  # Run database migrations
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'jobs'
      - 'execute'
      - 'db-migrate'
      - '--region=us-central1'
```

## Deployment

### Automated Deployment
```bash
# Push to main branch triggers deployment
git push origin main

# Or manual deployment
gcloud builds submit --config cloudbuild.yaml .
```

### Manual Deployment
```bash
# Build and tag image
docker build -t gcr.io/$PROJECT_ID/commercefull:v1.0.0 .

# Push to GCR
docker push gcr.io/$PROJECT_ID/commercefull:v1.0.0

# Deploy to Cloud Run
gcloud run deploy commercefull-app \
  --image gcr.io/$PROJECT_ID/commercefull:v1.0.0 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 80 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10
```

## Monitoring & Maintenance

### GCP Monitoring
```bash
# View service logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=commercefull-app" --limit 50

# Monitor performance
gcloud monitoring dashboards create --config-from-file=dashboard.json

# Set up alerts
gcloud alpha monitoring policies create --policy-from-file=alert-policy.json
```

### Database Management
```bash
# Connect to Cloud SQL
gcloud sql connect commercefull-db --user=postgres

# Backup database
gcloud sql backups create commercefull-db --description="Manual backup"

# Restore from backup
gcloud sql backups restore BACKUP_ID --restore-instance=commercefull-db
```

### Scaling
```bash
# Scale Cloud Run service
gcloud run services update commercefull-app \
  --concurrency 100 \
  --cpu 2 \
  --memory 1Gi \
  --max-instances 20 \
  --min-instances 1

# Scale database
gcloud sql instances patch commercefull-db --tier=db-g1-small
```

## Security

### Secret Management
```bash
# Create secrets
echo -n "your-secret-value" | gcloud secrets create SECRET_NAME --data-file=-

# Update secrets
echo -n "new-secret-value" | gcloud secrets versions add SECRET_NAME --data-file=-

# Grant access
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member=serviceAccount:SERVICE_ACCOUNT \
  --role=roles/secretmanager.secretAccessor
```

### Network Security
- Cloud Run provides automatic SSL
- VPC Service Controls for data protection
- Cloud Armor for DDoS protection
- Private Google Access for VPC networks

## Cost Optimization

### Pricing Calculator
- Cloud Run: $0.000024 per CPU-second + $0.0000023 per GiB-second
- Cloud SQL: $0.015/hour for db-f1-micro
- Cloud Storage: $0.026/GB/month
- Load Balancer: $0.025/hour + data transfer costs

### Cost Monitoring
```bash
# View current costs
gcloud billing accounts list
gcloud billing budgets create BUDGET_NAME --billing-account=BILLING_ACCOUNT_ID --amount=100

# Set up cost alerts
gcloud alpha monitoring alert-policies create --policy-from-file=cost-alert.json
```

## Troubleshooting

### Common Issues

#### Cold Starts
- Increase min instances: `--min-instances=1`
- Optimize container size
- Use global load balancer

#### Database Connection Issues
```bash
# Check Cloud SQL connectivity
gcloud sql instances describe commercefull-db

# Test connection from Cloud Run
gcloud run services exec commercefull-app -- psql $DATABASE_URL -c "SELECT 1"
```

#### Memory Issues
```bash
# Increase memory allocation
gcloud run services update commercefull-app --memory 1Gi

# Check memory usage
gcloud logging read "resource.type=cloud_run_revision" --filter="textPayload:memory"
```

#### SSL Certificate Issues
```bash
# Check SSL status
gcloud compute ssl-certificates list

# Renew certificates
gcloud compute ssl-certificates create CERT_NAME \
  --certificate=CERT_FILE \
  --private-key=KEY_FILE
```

## Migration

### From Other Platforms
```bash
# Export data from source
pg_dump source_db > backup.sql

# Import to Cloud SQL
gcloud sql import sql commercefull-db backup.sql --database=commercefull_prod

# Update DNS to point to GCP load balancer
# Deploy application
gcloud run deploy commercefull-app --source .
```

### Rollback
```bash
# Rollback to previous revision
gcloud run services update-traffic commercefull-app \
  --to-revisions=LATEST=0,PREVIOUS=100

# Full rollback
gcloud run revisions delete REVISION_NAME --quiet
```

## Performance

### Optimization Tips
- Use Cloud CDN for static assets
- Implement database connection pooling
- Cache frequently accessed data
- Use Cloud Storage for large files
- Monitor and optimize queries

### Benchmarking
```bash
# Load testing
npm install -g artillery
artillery quick --count 50 --num 10 https://yourdomain.com/

# Performance monitoring
gcloud monitoring dashboards create --config-from-file=performance-dashboard.json
```

This GCP deployment provides excellent scalability, managed services, and integration with Google's ecosystem.
