# CommerceFull Platform - Deployment Infrastructure

This directory contains deployment configurations and documentation for multiple cloud and infrastructure providers.

## Deployment Strategies

| Strategy | Infrastructure | Use Case | Complexity | Cost |
|----------|----------------|----------|------------|------|
| **Ansible + VPS** | Traditional VPS (DigitalOcean, Linode, etc.) | Simple deployments, full control | Medium | Low |
| **Docker + GCP** | Google Cloud Platform | Scalable, managed services | Low | Medium |
| **Docker + Azure** | Microsoft Azure | Enterprise integration | Low | Medium |
| **ECS + RDS + AWS** | Amazon Web Services | High availability, enterprise | High | High |

## Quick Start

Choose your preferred deployment strategy:

### 1. Ansible on VPS (Recommended for simplicity)
```bash
cd infra/ansible-vps
ansible-playbook -i inventory.ini deploy.yml
```

### 2. Docker on GCP (Recommended for Google ecosystem)
```bash
cd infra/docker-gcp
gcloud builds submit --config cloudbuild.yaml .
```

### 3. Docker on Azure (Recommended for Microsoft ecosystem)
```bash
cd infra/docker-azure
az deployment group create --resource-group commercefull-rg --template-file azuredeploy.json
```

### 4. ECS + RDS on AWS (Recommended for high availability)
```bash
cd infra/ecs-aws
cdk deploy CommerceFull-App
```

## Infrastructure Implementation Status

### Ansible VPS - 
**Full Ansible automation with 7 roles:**
- `common/` - System setup, security, monitoring
- `postgresql/` - PostgreSQL 18 installation & configuration
- `nodejs/` - Node.js runtime & PM2 setup
- `app/` - Application deployment & systemd service
- `nginx/` - Web server with SSL certificates
- `ssl/` - Let's Encrypt certificate management
- `monitoring/` - System monitoring & security

**Features:**
- Automated PostgreSQL 18 deployment
- SSL certificate management with Let's Encrypt
- Systemd service management
- Log rotation & monitoring
- Security hardening (UFW, Fail2ban)
- Backup automation

### Docker GCP - 
**Terraform infrastructure with:**
- `main.tf` - Complete GCP infrastructure (Cloud Run, Cloud SQL, Cloud Storage)
- `variables.tf` - Configurable deployment variables
- `outputs.tf` - Infrastructure outputs
- `terraform.tfvars.example` - Example configuration
- `deploy.sh` - Automated deployment script

**Features:**
- Cloud Run serverless containers
- Cloud SQL PostgreSQL 18 (when available)
- Cloud Storage for media files
- Cloud Load Balancer with SSL
- Auto-scaling & monitoring
- CI/CD integration ready

### Docker Azure - 
**Terraform infrastructure with:**
- `main.tf` - Complete Azure infrastructure (Container Apps, PostgreSQL, Storage)
- `variables.tf` - Configurable deployment variables
- `outputs.tf` - Infrastructure outputs
- `terraform.tfvars.example` - Example configuration
- `deploy.sh` - Automated deployment script

**Features:**
- Azure Container Apps serverless
- Azure Database for PostgreSQL 18 (when available)
- Azure Storage Account & CDN
- Azure Front Door for global distribution
- Azure Monitor & Application Insights
- Key Vault secrets management

### ECS AWS - 
**AWS CDK v2 infrastructure with:**
- `lib/commercefull-stack.ts` - Complete AWS stack (VPC, ECS, RDS, ALB, CloudFront)
- `bin/commercefull.ts` - CDK app entry point
- `package.json` & `tsconfig.json` - CDK project configuration
- `deploy.sh` - Automated deployment script

**Features:**
- ECS Fargate containers with auto-scaling
- RDS PostgreSQL 18 (when available)
- Application Load Balancer with SSL
- CloudFront CDN for global distribution
- S3 for media file storage
- Systems Manager for secrets
- CloudWatch monitoring & alerts

## PostgreSQL 18 Support

**Current Status:**
- **AWS RDS**: Supported
- **Google Cloud SQL**: Check availability (new release)
- **Azure Database**: Check availability (new release)
- **VPS (Ubuntu)**: Available via PostgreSQL official repository

**Note:** PostgreSQL 18 was released in October 2024. If not available on your cloud provider, the infrastructure will fall back to PostgreSQL 15 or 16, which are fully compatible.

## Environment Setup

### Development
```bash
cp .env.example .env
# Edit .env with your local configuration
npm install
npm run dev
```

### Production
Each deployment strategy includes production environment configurations with proper secrets management.

## Monitoring & Maintenance

### Health Checks
- Application: `/health`
- Database: Connection monitoring
- Infrastructure: Provider-specific monitoring

### Backups
- Database: Daily automated backups
- Files: Cloud storage replication
- Configuration: Version controlled

### Scaling
- Horizontal: Load balancer configuration
- Vertical: Instance size adjustments
- Database: Read replicas

## Security

### SSL/TLS
- Automatic HTTPS certificates (Let's Encrypt)
- Certificate rotation automation

### Secrets Management
- Environment-specific secret storage
- No hardcoded secrets in code
- Rotation procedures

### Network Security
- VPC isolation
- Security groups/firewalls
- Private subnets for databases

## Troubleshooting

See individual deployment directories for specific troubleshooting guides.

## Prerequisites

### Global Requirements
- Node.js 18+ and npm
- Docker and Docker Compose
- Git
- SSH access to target environments

### Database Requirements
**PostgreSQL 18**: The platform is configured to use PostgreSQL 18. Note that PostgreSQL 18 was released in October 2024 and may not be available on all cloud providers yet:

- **AWS RDS**: Available
- **Google Cloud SQL**: May not be available yet - check [Cloud SQL versions](https://cloud.google.com/sql/docs/postgres/db-versions)
- **Azure Database**: May not be available yet - check Azure portal
- **VPS (Ubuntu)**: Available via PostgreSQL official repository

If PostgreSQL 18 is not available on your chosen provider, use PostgreSQL 15 or 16 as an alternative.

### Provider-Specific Requirements and limitations

## Contributing

When adding new deployment strategies:
1. Follow the established directory structure
2. Include comprehensive documentation
3. Provide deployment and rollback scripts
4. Test on clean environments
5. Document prerequisites and limitations
