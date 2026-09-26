import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { VpcConstruct } from '../lib/constructs/vpc-construct';
import { DatabaseConstruct } from '../lib/constructs/database-construct';

describe('DatabaseConstruct', () => {
  function setup(environment: string) {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', { env: { account: '123456789012', region: 'us-east-1' } });
    const vpc = new VpcConstruct(stack, 'Vpc', { environment, createVpc: true });
    const db = new DatabaseConstruct(stack, 'Database', {
      environment,
      vpc: vpc.vpc,
      securityGroup: vpc.dbSecurityGroup,
    });
    return { stack, db };
  }

  test('creates an RDS PostgreSQL instance', () => {
    const { stack } = setup('prod');
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::RDS::DBInstance', 1);
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      Engine: 'postgres',
      DBInstanceClass: 'db.t3.micro',
      AllocatedStorage: '100',
      MultiAZ: true,
      PubliclyAccessible: false,
      DeletionProtection: true,
    });
  });

  test('encrypts storage and exports PostgreSQL logs', () => {
    const { stack } = setup('prod');
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      StorageEncrypted: true,
      EnableCloudwatchLogsExports: ['postgresql'],
    });
  });

  test('enforces TLS connections via parameter group', () => {
    const { stack } = setup('prod');
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::RDS::DBParameterGroup', {
      Parameters: Match.objectLike({ 'rds.force_ssl': '1' }),
    });
  });

  test('creates a Secrets Manager secret for credentials', () => {
    const { stack } = setup('prod');
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'commercefull/prod/db-credentials',
    });
  });

  test('enables multi-AZ and deletion protection in prod', () => {
    const { stack } = setup('prod');
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      MultiAZ: true,
      DeletionProtection: true,
    });
  });

  test('disables multi-AZ and deletion protection in dev', () => {
    const { stack } = setup('dev');
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      MultiAZ: false,
      DeletionProtection: false,
      AllocatedStorage: '20',
    });
  });

  test('exposes endpoint address and database name', () => {
    const { db } = setup('prod');
    expect(db.endpointAddress).toBeDefined();
    expect(db.databaseName).toBe('commercefull');
  });

  test('uses PostgreSQL 18 by default', () => {
    const { stack } = setup('prod');
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      EngineVersion: Match.stringLikeRegexp('18.*'),
    });
  });
});
