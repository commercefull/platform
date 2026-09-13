import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cloudmap from 'aws-cdk-lib/aws-servicediscovery';
import { Template } from 'aws-cdk-lib/assertions';
import { ApiGatewayConstruct } from '../lib/constructs/apigateway-construct';

describe('ApiGatewayConstruct', () => {
  // ── Cloud Map mode (cost-optimized) ──────────────────────────────────

  function setupCloudMap() {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', { env: { account: '123456789012', region: 'us-east-1' } });

    const vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2 });
    const namespace = new cloudmap.PrivateDnsNamespace(stack, 'Namespace', {
      name: 'commercefull.local',
      vpc,
    });
    const service = new cloudmap.Service(stack, 'Service', {
      namespace,
      name: 'commercefull',
      dnsRecordType: cloudmap.DnsRecordType.A,
    });

    const api = new ApiGatewayConstruct(stack, 'Api', {
      environment: 'prod',
      vpc,
      cloudMapService: service,
      domainName: 'example.com',
    });

    return { stack, api };
  }

  test('creates an HTTP API with Cloud Map integration', () => {
    const { stack } = setupCloudMap();
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
  });

  test('creates a VPC link for Cloud Map mode', () => {
    const { stack } = setupCloudMap();
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ApiGatewayV2::VpcLink', 1);
  });

  test('creates routes for proxy and health in Cloud Map mode', () => {
    const { stack } = setupCloudMap();
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ApiGatewayV2::Route', 2);
  });

  test('exposes API URL in Cloud Map mode', () => {
    const { api } = setupCloudMap();
    expect(api.apiUrl).toBeDefined();
  });

  // ── ALB mode (standard) ──────────────────────────────────────────────

  function setupAlb() {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', { env: { account: '123456789012', region: 'us-east-1' } });

    const vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2 });
    const alb = new elbv2.ApplicationLoadBalancer(stack, 'ALB', {
      vpc,
      internetFacing: true,
    });
    const listener = alb.addListener('Listener', {
      port: 80,
      open: true,
      defaultAction: elbv2.ListenerAction.fixedResponse(200),
    });

    const api = new ApiGatewayConstruct(stack, 'Api', {
      environment: 'prod',
      vpc,
      listener,
      domainName: 'example.com',
    });

    return { stack, api };
  }

  test('creates an HTTP API with ALB integration', () => {
    const { stack } = setupAlb();
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
  });

  test('creates a VPC link for ALB mode', () => {
    const { stack } = setupAlb();
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ApiGatewayV2::VpcLink', 1);
  });

  test('creates routes for proxy and health in ALB mode', () => {
    const { stack } = setupAlb();
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ApiGatewayV2::Route', 2);
  });

  // ── Validation ────────────────────────────────────────────────────────

  test('throws when neither cloudMapService nor listener is provided', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', { env: { account: '123456789012', region: 'us-east-1' } });
    const vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2 });

    expect(() => new ApiGatewayConstruct(stack, 'Api', {
      environment: 'prod',
      vpc,
    })).toThrow('Either cloudMapService or listener must be provided');
  });
});
