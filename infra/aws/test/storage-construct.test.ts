import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { StorageConstruct } from '../lib/constructs/storage-construct';

describe('StorageConstruct', () => {
  test('creates an S3 bucket with CORS for the domain', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', { env: { account: '123456789012', region: 'us-east-1' } });
    const storage = new StorageConstruct(stack, 'Storage', {
      environment: 'prod',
      domainName: 'example.com',
    });

    expect(storage.bucket).toBeDefined();

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'commercefull-media-prod-123456789012',
      CorsConfiguration: {
        CorsRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'POST', 'PUT'],
            AllowedOrigins: ['https://example.com'],
            MaxAge: 3000,
          },
        ],
      },
    });
  });

  test('retains bucket in prod (no auto-delete)', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', { env: { account: '123456789012', region: 'us-east-1' } });
    new StorageConstruct(stack, 'Storage', {
      environment: 'prod',
      domainName: 'example.com',
    });

    const template = Template.fromStack(stack);
    template.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Retain',
    });
  });

  test('auto-deletes bucket in dev', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', { env: { account: '123456789012', region: 'us-east-1' } });
    new StorageConstruct(stack, 'Storage', {
      environment: 'dev',
      domainName: 'example.com',
    });

    const template = Template.fromStack(stack);
    template.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Delete',
    });
  });

  test('uses custom bucket name when provided', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    new StorageConstruct(stack, 'Storage', {
      environment: 'prod',
      domainName: 'example.com',
      bucketName: 'my-custom-bucket',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'my-custom-bucket',
    });
  });
});
