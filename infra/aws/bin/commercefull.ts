#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CommerceFullStack } from '../lib/commercefull-stack';

const app = new cdk.App();

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Stack configuration
const environment = process.env.ENVIRONMENT || 'prod';
const domainName = process.env.DOMAIN_NAME || 'yourdomain.com';
const createVpc = (process.env.CREATE_VPC ?? 'true') !== 'false';
const existingVpcId = process.env.EXISTING_VPC_ID;
const containerImage = process.env.CONTAINER_IMAGE;

// Deployment mode:
//   cost-optimized (default): API Gateway + VPC Link + Cloud Map (no ALB, no NAT)
//   standard: ALB + NAT Gateways (add COST_OPTIMIZED=false to use)
const costOptimized = (process.env.COST_OPTIMIZED ?? 'true') !== 'false';

// Feature flags
const enableCloudFront = (process.env.ENABLE_CLOUDFRONT ?? 'true') !== 'false';
const enableApiGateway = process.env.ENABLE_API_GATEWAY
  ? process.env.ENABLE_API_GATEWAY === 'true'
  : costOptimized; // always on in cost-optimized mode
const enableRoute53 = (process.env.ENABLE_ROUTE53 ?? 'true') !== 'false';

new CommerceFullStack(app, 'CommerceFull', {
  env,
  stackName: 'CommerceFull',
  description: 'CommerceFull E-commerce Platform Infrastructure',
  tags: {
    Project: 'CommerceFull',
    Environment: environment,
    ManagedBy: 'CDK',
  },
  environment,
  domainName,
  createVpc,
  existingVpcId,
  containerImage,
  costOptimized,
  enableCloudFront,
  enableApiGateway,
  enableRoute53,
});

app.synth();
