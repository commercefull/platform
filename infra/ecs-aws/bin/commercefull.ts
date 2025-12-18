#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CommerceFullStack } from '../lib/commercefull-stack';

const app = new cdk.App();

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
};

// Stack configuration
const stackProps = {
  env,
  description: 'CommerceFull E-commerce Platform Infrastructure',
  tags: {
    Project: 'CommerceFull',
    Environment: process.env.ENVIRONMENT || 'prod',
    ManagedBy: 'CDK'
  }
};

// Deploy stacks
new CommerceFullStack(app, 'CommerceFull-Infra', {
  ...stackProps,
  stackName: 'CommerceFull-Infra'
});

new CommerceFullStack(app, 'CommerceFull-App', {
  ...stackProps,
  stackName: 'CommerceFull-App'
});

app.synth();
