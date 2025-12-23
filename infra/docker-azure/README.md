# Docker Azure Deployment

Deploy CommerceFull platform to Microsoft Azure using Docker containers.

## Overview

This deployment strategy uses Azure cloud services with Docker for containerized deployment:

- Azure Container Apps (serverless containers)
- Azure Database for PostgreSQL 18 (managed database)
- Azure Storage Account (blob storage)
- Azure DevOps (CI/CD)
- Azure Key Vault (secrets)
- Azure Front Door (global CDN/HTTPS)

## Prerequisites

### Azure Account

- Microsoft Azure subscription
- Azure CLI installed and configured
- Resource group created
- Contributor role access

### Local Machine

- Docker and Docker Compose
- Azure CLI (`az`)
- Git

### DNS

- Domain name
- Azure DNS or external DNS provider

## Quick Start

### 1. Setup Azure Environment

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "your-subscription-id"

# Create resource group
az group create --name commercefull-rg --location eastus2

# Create service principal (for CI/CD)
az ad sp create-for-rbac --name "commercefull-sp" --role contributor \
    --scopes /subscriptions/your-subscription-id/resourceGroups/commercefull-rg \
    --sdk-auth
```

### 2. Deploy Infrastructure

```bash
cd infra/docker-azure

# Deploy using Bicep templates
az deployment group create \
  --resource-group commercefull-rg \
  --template-file main.bicep \
  --parameters environment=prod domainName=yourdomain.com

# Or use Azure CLI scripts
./deploy-infrastructure.sh
```

### 3. Deploy Application

```bash
# Build and push Docker image
az acr build --registry commercefullacr --image commercefull:latest .

# Deploy to Container Apps
az containerapp up \
  --name commercefull-app \
  --source . \
  --resource-group commercefull-rg \
  --location eastus2 \
  --environment commercefull-env \
  --ingress external \
  --target-port 3000 \
  --env-vars DATABASE_URL=secret:DATABASE_URL SESSION_SECRET=secret:SESSION_SECRET
```

## Architecture

```
Internet
    ↓
[Azure Front Door (CDN/HTTPS)]
    ↓
[Azure Container Apps]
    ↙              ↘
[Azure PostgreSQL]  [Azure Storage]
(Managed DB)       (Blob Storage)
```

## Configuration

### Environment Variables

```bash
# Application secrets (stored in Key Vault)
DATABASE_URL=secret:DATABASE_URL
SESSION_SECRET=secret:SESSION_SECRET
JWT_SECRET=secret:JWT_SECRET
AZURE_CLIENT_ID=secret:AZURE_CLIENT_ID
AZURE_CLIENT_SECRET=secret:AZURE_CLIENT_SECRET

# Application configuration
NODE_ENV=production
PORT=3000
DOMAIN=https://yourdomain.com

# Azure configuration
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_RESOURCE_GROUP=commercefull-rg
AZURE_STORAGE_ACCOUNT=commercefullstorage
AZURE_STORAGE_CONTAINER=media
```

### Bicep Template Structure

```bicep
// main.bicep
param environment string = 'dev'
param domainName string
param location string = resourceGroup().location

// Resource group scope
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'commercefull-app-${environment}'
  location: location
  properties: {
    environmentId: containerEnvironment.id
    template: {
      containers: [{
        name: 'commercefull'
        image: 'commercefullacr.azurecr.io/commercefull:latest'
        resources: {
          cpu: '0.5'
          memory: '1Gi'
        }
        env: [
          { name: 'DATABASE_URL', secretRef: 'database-url' }
          { name: 'SESSION_SECRET', secretRef: 'session-secret' }
        ]
      }]
      scale: {
        minReplicas: 1
        maxReplicas: 10
        rules: [{
          name: 'http-scaling'
          http: {
            metadata: {
              concurrentRequests: '10'
            }
          }
        }]
      }
    }
    configuration: {
      secrets: [
        { name: 'database-url', keyVaultUrl: keyVault.properties.vaultUri, identity: managedIdentity.id }
        { name: 'session-secret', keyVaultUrl: keyVault.properties.vaultUri, identity: managedIdentity.id }
      ]
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
        traffic: [{
          latestRevision: true
          weight: 100
        }]
      }
    }
  }
}
```

## File Structure

```
docker-azure/
├── README.md
├── Dockerfile                    # Application container
├── docker-compose.yml           # Local development
├── azure-pipelines.yml          # Azure DevOps CI/CD
├── main.bicep                   # Infrastructure as code
├── deploy-infrastructure.sh     # Infrastructure deployment
├── deploy-app.sh               # Application deployment
├── terraform/                   # Alternative IaC option
├── scripts/
│   ├── backup.sh                # Database backup
│   ├── restore.sh               # Database restore
│   ├── monitoring.sh            # Azure Monitor setup
│   └── scaling.sh               # Auto-scaling configuration
└── docs/
    ├── troubleshooting.md       # Common issues
    ├── security.md              # Security best practices
    └── performance.md           # Performance optimization
```

## Detailed Setup

### 1. Infrastructure Components

#### Azure Container Apps Environment

```bicep
resource containerEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'commercefull-env-${environment}'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
}
```

#### Azure Database for PostgreSQL

```bicep
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: 'commercefull-db-${environment}'
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: "18",  # PostgreSQL 18 (check availability)
    administratorLogin: 'commercefulladmin'
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    network: {
      publicNetworkAccess: 'Disabled'
    }
  }
}
```

#### Azure Storage Account

```bicep
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'commercefullstorage${uniqueString(resourceGroup().id)}'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    isHnsEnabled: false
  }
}
```

### 2. Application Container

#### Dockerfile

```dockerfile
FROM node:18-alpine

# Install Azure CLI and system dependencies
RUN apk add --no-cache postgresql-client azure-cli curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Azure-specific setup
RUN mkdir -p /app/logs && chown -R nextjs:nodejs /app
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### 3. CI/CD Pipeline

#### Azure DevOps Pipeline (`azure-pipelines.yml`)

```yaml
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  azureSubscription: 'commercefull-connection'
  resourceGroup: 'commercefull-rg'
  containerRegistry: 'commercefullacr.azurecr.io'
  containerApp: 'commercefull-app'
  environment: 'prod'

stages:
  - stage: Build
    jobs:
      - job: BuildAndPush
        steps:
          - task: Docker@2
            inputs:
              containerRegistry: 'commercefull-acr'
              repository: 'commercefull'
              command: 'buildAndPush'
              Dockerfile: '**/Dockerfile'
              tags: |
                $(Build.BuildNumber)
                latest

  - stage: Deploy
    jobs:
      - deployment: DeployToStaging
        condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/develop'))
        environment: 'staging'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureContainerApps@1
                  inputs:
                    azureSubscription: $(azureSubscription)
                    containerAppName: $(containerApp)-staging
                    resourceGroup: $(resourceGroup)
                    imageName: $(containerRegistry)/commercefull:$(Build.BuildNumber)

      - deployment: DeployToProduction
        condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureContainerApps@1
                  inputs:
                    azureSubscription: $(azureSubscription)
                    containerAppName: $(containerApp)
                    resourceGroup: $(resourceGroup)
                    imageName: $(containerRegistry)/commercefull:$(Build.BuildNumber)
```

## Deployment

### Automated Deployment

```bash
# Commit and push changes
git add .
git commit -m "Deploy to production"
git push origin main

# Azure DevOps handles the rest automatically
```

### Manual Deployment

```bash
# Login to Azure
az login

# Build and push Docker image
az acr build \
  --registry commercefullacr \
  --image commercefull:$(date +%Y%m%d-%H%M%S) \
  --file Dockerfile .

# Deploy to Container Apps
az containerapp update \
  --name commercefull-app \
  --resource-group commercefull-rg \
  --image commercefullacr.azurecr.io/commercefull:latest \
  --set-env-vars NODE_ENV=production
```

## Monitoring & Maintenance

### Azure Monitor

```bash
# View application logs
az monitor app-insights query \
  --app commercefull-app-insights \
  --analytics-query "requests | where timestamp > ago(1h)"

# Set up alerts
az monitor metrics alert create \
  --name "High CPU Usage" \
  --resource /subscriptions/.../commercefull-app \
  --condition "avg Percentage CPU > 80" \
  --action email admin@yourdomain.com
```

### Database Management

```bash
# Connect to PostgreSQL
az postgres flexible-server connect \
  --name commercefull-db \
  --admin-user commercefulladmin \
  --admin-password $DB_PASSWORD

# Backup database
az postgres flexible-server backup create \
  --name commercefull-db-backup \
  --server-name commercefull-db

# Restore from backup
az postgres flexible-server restore \
  --name commercefull-db \
  --source-server commercefull-db \
  --restore-point-in-time "2024-01-01T00:00:00Z"
```

### Scaling

```bash
# Scale Container App
az containerapp update \
  --name commercefull-app \
  --resource-group commercefull-rg \
  --scale-rule-name http-scaling \
  --scale-rule-http-concurrency 20 \
  --min-replicas 1 \
  --max-replicas 20

# Scale database
az postgres flexible-server update \
  --name commercefull-db \
  --resource-group commercefull-rg \
  --sku-name Standard_D2s_v3
```

## Security

### Azure Key Vault

```bash
# Create Key Vault
az keyvault create \
  --name commercefull-kv \
  --resource-group commercefull-rg \
  --location eastus2

# Store secrets
az keyvault secret set \
  --vault-name commercefull-kv \
  --name database-url \
  --value "postgresql://user:pass@host:5432/db"

# Grant access to Container App
az keyvault set-policy \
  --name commercefull-kv \
  --object-id $(az containerapp identity show --name commercefull-app --resource-group commercefull-rg --query principalId -o tsv) \
  --secret-permissions get list
```

### Network Security

- Azure Front Door provides WAF and DDoS protection
- Private endpoints for database connectivity
- Network security groups restrict access
- Azure Defender for threat protection

## Cost Optimization

### Azure Pricing Calculator

- Container Apps: $0.000024 per vCPU-second + $0.0000023 per GB-second
- PostgreSQL Flexible Server: $0.014/hour for B1ms
- Storage Account: $0.0184/GB/month
- Front Door: $0.025/hour + data transfer

### Cost Management

```bash
# Set budget alerts
az consumption budget create \
  --budget-name commercefull-budget \
  --amount 100 \
  --time-grain Monthly \
  --start-date 2024-01-01 \
  --end-date 2024-12-31

# View current costs
az costmanagement query \
  --type ActualCost \
  --dataset-filter "ResourceGroup eq 'commercefull-rg'" \
  --timeframe MonthToDate
```

## Troubleshooting

### Common Issues

#### Container App Deployment Failures

```bash
# Check deployment status
az containerapp show --name commercefull-app --resource-group commercefull-rg

# View logs
az containerapp logs show --name commercefull-app --resource-group commercefull-rg

# Check environment variables
az containerapp secret list --name commercefull-app --resource-group commercefull-rg
```

#### Database Connection Issues

```bash
# Test database connectivity
az postgres flexible-server connect \
  --name commercefull-db \
  --admin-user commercefulladmin

# Check firewall rules
az postgres flexible-server firewall-rule list \
  --name commercefull-db \
  --resource-group commercefull-rg
```

#### Performance Issues

```bash
# Monitor Container App metrics
az monitor metrics list \
  --resource /subscriptions/.../commercefull-app \
  --metric "RequestsPerSecond"

# Scale based on metrics
az containerapp update \
  --name commercefull-app \
  --resource-group commercefull-rg \
  --max-replicas 20
```

## Migration

### From Development to Azure

```bash
# Export local database
pg_dump local_db > backup.sql

# Import to Azure PostgreSQL
az postgres flexible-server import create \
  --name commercefull-db-import \
  --server-name commercefull-db \
  --resource-group commercefull-rg \
  --admin-user commercefulladmin \
  --database-name commercefull_prod \
  --local-path backup.sql

# Update DNS
az network dns record-set a add-record \
  --resource-group your-dns-rg \
  --zone-name yourdomain.com \
  --record-set-name @ \
  --ipv4-address $(az containerapp show --name commercefull-app --resource-group commercefull-rg --query properties.configuration.ingress.fqdn -o tsv)
```

### Rollback

```bash
# Rollback to previous revision
az containerapp update \
  --name commercefull-app \
  --resource-group commercefull-rg \
  --image commercefullacr.azurecr.io/commercefull:previous-tag

# Or use traffic splitting
az containerapp ingress traffic set \
  --name commercefull-app \
  --resource-group commercefull-rg \
  --revision-weight latest=0 previous=100
```

This Azure deployment provides enterprise-grade scalability, security, and integration with Microsoft's ecosystem.
