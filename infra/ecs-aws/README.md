# ECS + RDS + AWS Deployment

Deploy CommerceFull platform to Amazon Web Services using ECS (Elastic Container Service) and RDS (Relational Database Service) for high availability and enterprise-grade deployment.

## Overview

This deployment strategy uses AWS managed services for maximum scalability and reliability:
- Amazon ECS (container orchestration)
- Amazon RDS PostgreSQL 18 (managed database)
- Amazon ECR (container registry)
- Application Load Balancer (layer 7 load balancing)
- Amazon S3 (file storage)
- AWS Systems Manager (secrets and configuration)
- AWS CloudFormation (infrastructure as code)
- Amazon Route 53 (DNS)
- AWS Certificate Manager (SSL certificates)

## Prerequisites

### AWS Account
- AWS account with billing enabled
- AWS CLI installed and configured
- IAM user with appropriate permissions
- Route 53 hosted zone (for DNS)

### Local Machine
- Docker and Docker Compose
- AWS CLI (`aws`)
- AWS CDK CLI (`cdk`)
- Node.js and npm
- Git

### DNS
- Domain name registered in Route 53
- SSL certificate via AWS Certificate Manager

## Quick Start

### 1. Setup AWS Environment
```bash
# Configure AWS CLI
aws configure

# Set AWS region
export AWS_REGION=us-east-1
export AWS_PROFILE=commercefull

# Create S3 bucket for CDK assets
aws s3 mb s3://commercefull-cdk-assets-$AWS_REGION --region $AWS_REGION

# Bootstrap CDK
cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/$AWS_REGION
```

### 2. Deploy Infrastructure
```bash
cd infra/ecs-aws

# Install dependencies
npm install

# Synthesize CloudFormation templates
cdk synth

# Deploy infrastructure
cdk deploy CommerceFull-Infra --require-approval never

# Get outputs for application deployment
cdk deploy CommerceFull-App --require-approval never --outputs-file outputs.json
```

### 3. Deploy Application
```bash
# Build and push Docker image
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com

docker build -t commercefull:latest .
docker tag commercefull:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/commercefull:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/commercefull:latest

# Update ECS service
aws ecs update-service --cluster commercefull-cluster --service commercefull-service --force-new-deployment
```

## Architecture

```
Internet
    ↓
[CloudFront (CDN/HTTPS)]
    ↓
[Application Load Balancer]
    ↓
[ECS Fargate Tasks]
    ↙         ↘
[RDS PostgreSQL]  [S3 Bucket]
(Multi-AZ)       (Static Files)
    ↓
[ElastiCache Redis]
(Session/Cache)
```

## Configuration

### Environment Variables

```bash
# Database (managed by RDS)
DATABASE_URL=postgres://user:pass@host:5432/db

# Session/Cache (managed by ElastiCache)
REDIS_URL=redis://host:6379

# AWS Services
AWS_REGION=us-east-1
AWS_S3_BUCKET=commercefull-media
AWS_CLOUDFRONT_DISTRIBUTION=distribution-id

# Application Secrets (stored in SSM Parameter Store)
JWT_SECRET=/commercefull/prod/jwt-secret
SESSION_SECRET=/commercefull/prod/session-secret
GOOGLE_CLIENT_ID=/commercefull/prod/google-client-id
GOOGLE_CLIENT_SECRET=/commercefull/prod/google-client-secret

# Application Configuration
NODE_ENV=production
PORT=3000
DOMAIN=https://yourdomain.com
API_BASE_URL=https://api.yourdomain.com
```

### CDK Stack Structure

```typescript
// lib/infrastructure-stack.ts
export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'CommerceFullVPC', {
      maxAzs: 3,
      natGateways: 1,
    });

    // RDS PostgreSQL database
    const database = new rds.DatabaseInstance(this, 'CommerceFullDB', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_18 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      multiAz: true,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      deletionProtection: true,
      backupRetention: Duration.days(7),
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'CommerceFullCluster', {
      vpc,
      containerInsights: true,
    });

    // Application Load Balancer
    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'CommerceFullALB', {
      vpc,
      internetFacing: true,
    });

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'CommerceFullDistribution', {
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(loadBalancer),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      certificate: certificate,
      domainNames: [domainName],
    });

    // Outputs
    new CfnOutput(this, 'LoadBalancerDNS', { value: loadBalancer.loadBalancerDnsName });
    new CfnOutput(this, 'DatabaseEndpoint', { value: database.dbInstanceEndpointAddress });
    new CfnOutput(this, 'CloudFrontURL', { value: `https://${distribution.distributionDomainName}` });
  }
}
```

## File Structure

```
ecs-aws/
├── README.md
├── package.json               # Node.js dependencies
├── cdk.json                   # CDK configuration
├── bin/
│   └── commercefull.ts        # CDK app entry point
├── lib/
│   ├── infrastructure-stack.ts # VPC, RDS, ECS, ALB
│   ├── application-stack.ts   # ECS service, task definition
│   ├── monitoring-stack.ts    # CloudWatch, alerts
│   └── security-stack.ts      # WAF, security groups
├── src/
│   ├── Dockerfile             # Application container
│   ├── docker-compose.yml     # Local development
│   └── nginx.conf             # Nginx configuration
├── scripts/
│   ├── deploy.sh              # Deployment script
│   ├── backup.sh              # Database backup
│   ├── restore.sh             # Database restore
│   ├── migrate.sh             # Database migrations
│   └── monitoring.sh          # Monitoring setup
├── templates/
│   ├── task-definition.json   # ECS task definition
│   └── appspec.yaml           # CodeDeploy specification
├── tests/
│   └── __snapshots__/         # CDK snapshot tests
└── docs/
    ├── architecture.md        # Detailed architecture
    ├── security.md            # Security considerations
    ├── performance.md         # Performance optimization
    └── troubleshooting.md     # Common issues
```

## Detailed Setup

### 1. Infrastructure Components

#### VPC and Networking
```typescript
const vpc = new ec2.Vpc(this, 'CommerceFullVPC', {
  maxAzs: 3,  // Multi-AZ for high availability
  subnetConfiguration: [
    {
      name: 'Public',
      subnetType: ec2.SubnetType.PUBLIC,
      cidrMask: 24,
    },
    {
      name: 'Private',
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      cidrMask: 24,
    },
    {
      name: 'Database',
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      cidrMask: 24,
    },
  ],
});
```

#### RDS PostgreSQL Database
```typescript
const database = new rds.DatabaseInstance(this, 'CommerceFullDB', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_15
  }),
  instanceType: ec2.InstanceType.of(
    ec2.InstanceClass.BURSTABLE3,
    ec2.InstanceSize.MICRO
  ),
  vpc,
  vpcSubnets: {
    subnetType: ec2.SubnetType.PRIVATE_ISOLATED
  },
  multiAz: true,
  allocatedStorage: 20,
  maxAllocatedStorage: 100,
  deletionProtection: true,
  backupRetention: Duration.days(7),
  monitoringInterval: Duration.minutes(1),
  enablePerformanceInsights: true,
});
```

#### ECS Cluster and Service
```typescript
const cluster = new ecs.Cluster(this, 'CommerceFullCluster', {
  vpc,
  containerInsights: true,
  capacityProviders: ['FARGATE', 'FARGATE_SPOT'],
});

const taskDefinition = new ecs.FargateTaskDefinition(this, 'CommerceFullTask', {
  memoryLimitMiB: 512,
  cpu: 256,
  family: 'commercefull-app',
});

const container = taskDefinition.addContainer('CommerceFullContainer', {
  image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
  memoryLimitMiB: 512,
  environment: {
    NODE_ENV: 'production',
    PORT: '3000',
  },
  secrets: {
    DATABASE_URL: ecs.Secret.fromSsmParameter(databaseUrlParam),
    JWT_SECRET: ecs.Secret.fromSsmParameter(jwtSecretParam),
  },
  logging: ecs.LogDriver.awsLogs({
    streamPrefix: 'commercefull',
    logGroup: logGroup,
  }),
});

const service = new ecs.FargateService(this, 'CommerceFullService', {
  cluster,
  taskDefinition,
  desiredCount: 2,
  minHealthyPercent: 50,
  maxHealthyPercent: 200,
  healthCheckGracePeriod: Duration.seconds(60),
});
```

#### Application Load Balancer
```typescript
const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'CommerceFullALB', {
  vpc,
  internetFacing: true,
  deletionProtection: true,
});

const listener = loadBalancer.addListener('HTTPListener', {
  port: 80,
  open: true,
});

listener.addAction('RedirectToHTTPS', {
  action: elbv2.ListenerAction.redirect({
    protocol: 'HTTPS',
    port: '443',
    permanent: true,
  }),
});

const httpsListener = loadBalancer.addListener('HTTPSListener', {
  port: 443,
  certificates: [certificate],
  open: true,
});

httpsListener.addTargets('CommerceFullTargets', {
  port: 80,
  targets: [service.loadBalancerTarget({
    containerName: 'CommerceFullContainer',
    containerPort: 3000,
  })],
  healthCheck: {
    path: '/health',
    interval: Duration.seconds(30),
    timeout: Duration.seconds(5),
    healthyThresholdCount: 2,
    unhealthyThresholdCount: 2,
  },
});
```

### 2. Application Container

#### Dockerfile
```dockerfile
FROM node:18-alpine

# Install AWS CLI and system dependencies
RUN apk add --no-cache postgresql-client aws-cli curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Build application (if needed)
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# AWS-specific setup
RUN mkdir -p /app/logs /tmp && chown -R nextjs:nodejs /app /tmp
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

#### GitHub Actions Example
```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build and push Docker image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: commercefull
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$GITHUB_SHA .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$GITHUB_SHA
        echo "IMAGE_URI=$ECR_REGISTRY/$ECR_REPOSITORY:$GITHUB_SHA" >> $GITHUB_ENV

    - name: Update ECS service
      run: |
        aws ecs update-service \
          --cluster commercefull-cluster \
          --service commercefull-service \
          --force-new-deployment \
          --task-definition $(aws ecs describe-task-definition --task-definition commercefull-app --query 'taskDefinition.taskDefinitionArn' --output text)

    - name: Wait for deployment
      run: |
        aws ecs wait services-stable \
          --cluster commercefull-cluster \
          --services commercefull-service
```

## Deployment

### Automated Deployment
```bash
# Push to main branch
git add .
git commit -m "Deploy to production"
git push origin main

# GitHub Actions handles deployment automatically
```

### Manual Deployment
```bash
# Build and push Docker image
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

docker build -t commercefull:latest .
docker tag commercefull:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/commercefull:latest
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/commercefull:latest

# Update ECS service
aws ecs update-service \
  --cluster commercefull-cluster \
  --service commercefull-service \
  --force-new-deployment

# Monitor deployment
aws ecs describe-services \
  --cluster commercefull-cluster \
  --services commercefull-service \
  --query 'services[0].deployments'
```

## Monitoring & Maintenance

### CloudWatch Monitoring
```bash
# View ECS service metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=commercefull-cluster Name=ServiceName,Value=commercefull-service \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# Set up CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name "CommerceFull-HighCPU" \
  --alarm-description "CPU usage above 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ClusterName,Value=commercefull-cluster Name=ServiceName,Value=commercefull-service \
  --evaluation-periods 2
```

### RDS Management
```bash
# Create database backup
aws rds create-db-snapshot \
  --db-instance-identifier commercefull-db \
  --db-snapshot-identifier commercefull-backup-$(date +%Y%m%d)

# Restore from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier commercefull-db-restored \
  --db-snapshot-identifier commercefull-backup-20240101 \
  --db-instance-class db.t3.micro

# Monitor database performance
aws rds describe-db-instances \
  --db-instance-identifier commercefull-db \
  --query 'DBInstances[0].{DBInstanceStatus:DBInstanceStatus,DBInstanceClass:DBInstanceClass,AllocatedStorage:AllocatedStorage}'
```

### Scaling
```bash
# Scale ECS service
aws ecs update-service \
  --cluster commercefull-cluster \
  --service commercefull-service \
  --desired-count 5

# Enable auto-scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/commercefull-cluster/commercefull-service \
  --min-capacity 2 \
  --max-capacity 10

aws application-autoscaling put-scaling-policy \
  --policy-name commercefull-cpu-scaling \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/commercefull-cluster/commercefull-service \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{"TargetValue":70,"PredefinedMetricSpecification":{"PredefinedMetricType":"ECSServiceAverageCPUUtilization"}}'
```

## Security

### AWS Systems Manager Parameter Store
```bash
# Store secrets
aws ssm put-parameter \
  --name "/commercefull/prod/database-url" \
  --type "SecureString" \
  --value "postgresql://user:pass@host:5432/db"

# Retrieve secrets in application
aws ssm get-parameter \
  --name "/commercefull/prod/database-url" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text
```

### Network Security
- Security groups restrict access to necessary ports only
- RDS in private subnets, accessible only from ECS tasks
- AWS WAF provides application-level protection
- AWS Shield for DDoS protection
- VPC endpoints for AWS service access

### IAM Roles and Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": "arn:aws:ssm:us-east-1:123456789012:parameter/commercefull/prod/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::commercefull-media/*"
    }
  ]
}
```

## Cost Optimization

### AWS Pricing Calculator
- ECS Fargate: $0.04048 per vCPU-hour + $0.004445 per GB-hour
- RDS PostgreSQL: $0.018/hour for db.t3.micro
- Application Load Balancer: $0.0225/hour + $0.008/hour per LCU
- CloudFront: $0.085/GB for first 10TB
- S3: $0.023/GB/month

### Cost Management
```bash
# Set up billing alerts
aws budgets create-budget \
  --budget-name commercefull-monthly-budget \
  --budget-limit '{"Amount":"500","Unit":"USD"}' \
  --time-unit MONTHLY \
  --budget-type COST

# View current costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics "BlendedCost" \
  --group-by '[{"Type":"DIMENSION","Key":"SERVICE"}]'
```

## Troubleshooting

### Common Issues

#### ECS Deployment Failures
```bash
# Check service events
aws ecs describe-services \
  --cluster commercefull-cluster \
  --services commercefull-service \
  --query 'services[0].events[0:5]'

# Check task status
aws ecs list-tasks --cluster commercefull-cluster --service-name commercefull-service
aws ecs describe-tasks --cluster commercefull-cluster --tasks $(aws ecs list-tasks --cluster commercefull-cluster --service-name commercefull-service --query 'taskArns[0]' --output text)

# View container logs
aws logs get-log-events \
  --log-group-name /ecs/commercefull-app \
  --log-stream-name ecs/commercefull/$(aws ecs list-tasks --cluster commercefull-cluster --service-name commercefull-service --query 'taskArns[0]' --output text | cut -d'/' -f3)
```

#### Database Connection Issues
```bash
# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier commercefull-db \
  --query 'DBInstances[0].DBInstanceStatus'

# Test connectivity from ECS task
aws ecs execute-command \
  --cluster commercefull-cluster \
  --task $(aws ecs list-tasks --cluster commercefull-cluster --service-name commercefull-service --query 'taskArns[0]' --output text) \
  --container commercefull-app \
  --interactive \
  --command "/bin/sh"
```

#### Load Balancer Issues
```bash
# Check ALB health
aws elbv2 describe-target-health \
  --target-group-arn $(aws elbv2 describe-target-groups --names commercefull-targets --query 'TargetGroups[0].TargetGroupArn' --output text)

# View ALB access logs
aws s3 cp s3://commercefull-alb-logs/2024/01/01/ access.log - | head -20
```

## Migration

### From Other Platforms to AWS
```bash
# Export database from source
pg_dump source_db > backup.sql

# Upload to S3
aws s3 cp backup.sql s3://commercefull-migrations/

# Import to RDS
aws rds restore-db-instance-from-s3 \
  --db-instance-identifier commercefull-db-temp \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --source-engine postgres \
  --source-engine-version "18" \
  --s3-bucket-name commercefull-migrations \
  --s3-ingestion-role-arn arn:aws:iam::account:role/RDSLoadRole \
  --s3-prefix backup.sql

# Switch RDS instances
aws rds failover-db-cluster --db-cluster-identifier commercefull-cluster
```

### Blue-Green Deployments
```bash
# Create new task definition with updated image
aws ecs register-task-definition --cli-input-json file://task-definition-v2.json

# Create new service with blue-green deployment
aws ecs create-service \
  --cluster commercefull-cluster \
  --service-name commercefull-service-green \
  --task-definition commercefull-app-v2 \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=commercefull-app,containerPort=3000 \
  --desired-count 2

# Switch traffic using ALB
aws elbv2 modify-listener \
  --listener-arn $LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=$GREEN_TARGET_GROUP_ARN

# Clean up old service
aws ecs update-service \
  --cluster commercefull-cluster \
  --service commercefull-service-blue \
  --desired-count 0
```

## Performance

### Optimization Strategies
- Use AWS Global Accelerator for global performance
- Implement CloudFront caching for static assets
- Use RDS read replicas for read-heavy workloads
- Implement ElastiCache Redis for session storage
- Use AWS WAF for application-level optimization

### Monitoring Dashboard
```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name commercefull-performance \
  --dashboard-body file://dashboard.json
```

This AWS deployment provides enterprise-grade scalability, security, and reliability suitable for high-traffic e-commerce applications.
