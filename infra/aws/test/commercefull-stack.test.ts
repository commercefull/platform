import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CommerceFullStack } from '../lib/commercefull-stack';

describe('CommerceFullStack', () => {
  function createStack(overrides: Record<string, unknown> = {}) {
    const app = new cdk.App();
    const stack = new CommerceFullStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      stackName: 'TestStack',
      environment: 'prod',
      domainName: 'example.com',
      enableRoute53: false, // Skip Route 53 lookup in tests
      ...overrides,
    });
    return { app, stack, template: Template.fromStack(stack) };
  }

  // ── Cost-optimized mode (default) ─────────────────────────────────────

  test('creates all core resources in cost-optimized mode', () => {
    const { template } = createStack();
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::RDS::DBInstance', 1);
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.resourceCountIs('AWS::ECS::Cluster', 1);
    template.resourceCountIs('AWS::ECS::TaskDefinition', 1);
    template.resourceCountIs('AWS::ECS::Service', 1);
    template.resourceCountIs('AWS::ECR::Repository', 1);
  });

  test('creates no ALB in cost-optimized mode', () => {
    const { template } = createStack();
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 0);
  });

  test('creates no NAT Gateways in cost-optimized mode', () => {
    const { template } = createStack();
    template.resourceCountIs('AWS::EC2::NatGateway', 0);
  });

  test('creates VPC endpoints in cost-optimized mode', () => {
    const { template } = createStack();
    // S3 gateway + ECR API + ECR DKR + Secrets Manager + CloudWatch Logs = 5
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 5);
  });

  test('creates API Gateway in cost-optimized mode', () => {
    const { template } = createStack();
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
    template.resourceCountIs('AWS::ApiGatewayV2::VpcLink', 1);
  });

  test('creates Cloud Map service discovery in cost-optimized mode', () => {
    const { template } = createStack();
    template.resourceCountIs('AWS::ServiceDiscovery::PrivateDnsNamespace', 1);
    template.resourceCountIs('AWS::ServiceDiscovery::Service', 1);
  });

  test('creates CloudFront in cost-optimized mode', () => {
    const { template } = createStack();
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
  });

  test('creates SSL certificate', () => {
    const { template } = createStack();
    template.resourceCountIs('AWS::CertificateManager::Certificate', 1);
  });

  test('creates Secrets Manager secrets for DB, session, and JWT', () => {
    const { template } = createStack();
    template.resourceCountIs('AWS::SecretsManager::Secret', 3);
  });

  test('outputs DeploymentMode as cost-optimized', () => {
    const { template } = createStack();
    const outputs = template.toJSON().Outputs ?? {};
    expect(outputs.DeploymentMode).toBeDefined();
    expect(outputs.DeploymentMode.Value).toBe('cost-optimized');
  });

  test('outputs ApiGatewayURL in cost-optimized mode', () => {
    const { template } = createStack();
    const outputs = template.toJSON().Outputs ?? {};
    expect(outputs).toHaveProperty('ApiGatewayURL');
  });

  test('does not output LoadBalancerDNS in cost-optimized mode', () => {
    const { template } = createStack();
    const outputs = template.toJSON().Outputs ?? {};
    expect(outputs).not.toHaveProperty('LoadBalancerDNS');
  });

  // ── Standard mode (ALB) ───────────────────────────────────────────────

  test('creates ALB in standard mode', () => {
    const { template } = createStack({ costOptimized: false });
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
  });

  test('creates NAT Gateway in standard mode', () => {
    const { template } = createStack({ costOptimized: false });
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
  });

  test('does not create VPC endpoints in standard mode', () => {
    const { template } = createStack({ costOptimized: false });
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 0);
  });

  test('does not create Cloud Map in standard mode', () => {
    const { template } = createStack({ costOptimized: false });
    template.resourceCountIs('AWS::ServiceDiscovery::PrivateDnsNamespace', 0);
  });

  test('does not create API Gateway by default in standard mode', () => {
    const { template } = createStack({ costOptimized: false });
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 0);
  });

  test('outputs LoadBalancerDNS in standard mode', () => {
    const { template } = createStack({ costOptimized: false });
    const outputs = template.toJSON().Outputs ?? {};
    expect(outputs).toHaveProperty('LoadBalancerDNS');
  });

  test('outputs DeploymentMode as standard', () => {
    const { template } = createStack({ costOptimized: false });
    const outputs = template.toJSON().Outputs ?? {};
    expect(outputs.DeploymentMode.Value).toBe('standard');
  });

  test('creates API Gateway in front of ALB when enabled in standard mode', () => {
    const { template } = createStack({ costOptimized: false, enableApiGateway: true });
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
  });

  // ── Feature flags ────────────────────────────────────────────────────

  test('skips CloudFront when disabled', () => {
    const { template } = createStack({ enableCloudFront: false });
    template.resourceCountIs('AWS::CloudFront::Distribution', 0);
  });

  test('creates CfnOutputs for key resources', () => {
    const { template } = createStack();
    const outputs = template.toJSON().Outputs ?? {};
    expect(outputs).toHaveProperty('CloudFrontURL');
    expect(outputs).toHaveProperty('DatabaseEndpoint');
    expect(outputs).toHaveProperty('ECRRepositoryURI');
    expect(outputs).toHaveProperty('S3BucketName');
    expect(outputs).toHaveProperty('ECSClusterName');
    expect(outputs).toHaveProperty('ECSServiceName');
  });

  // ── Environment defaults ─────────────────────────────────────────────

  test('uses dev defaults (1 task, no multi-AZ) in dev environment', () => {
    const { template } = createStack({ environment: 'dev' });
    template.hasResourceProperties('AWS::ECS::Service', {
      DesiredCount: 1,
    });
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      MultiAZ: false,
      DeletionProtection: false,
    });
  });

  test('uses prod defaults (3 tasks, multi-AZ) in prod environment', () => {
    const { template } = createStack({ environment: 'prod' });
    template.hasResourceProperties('AWS::ECS::Service', {
      DesiredCount: 3,
    });
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      MultiAZ: true,
      DeletionProtection: true,
    });
  });
});
