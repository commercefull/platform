import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { VpcConstruct } from '../lib/constructs/vpc-construct';
import { VpcEndpointsConstruct } from '../lib/constructs/vpc-endpoints-construct';

describe('VpcEndpointsConstruct', () => {
  function setup() {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', { env: { account: '123456789012', region: 'us-east-1' } });
    const vpc = new VpcConstruct(stack, 'Vpc', {
      environment: 'prod',
      createVpc: true,
      maxAzs: 2,
      natGateways: 0,
    });
    new VpcEndpointsConstruct(stack, 'Endpoints', { vpc: vpc.vpc });
    return stack;
  }

  test('creates S3 gateway endpoint', () => {
    const stack = setup();
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 5);
    // S3 is a gateway endpoint — ServiceName includes region prefix
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      VpcEndpointType: 'Gateway',
    });
  });

  test('creates ECR interface endpoints', () => {
    const stack = setup();
    const template = Template.fromStack(stack);
    // ECR API and ECR DKR
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      ServiceName: Match.stringLikeRegexp('ecr\.api'),
      VpcEndpointType: 'Interface',
    });
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      ServiceName: Match.stringLikeRegexp('ecr\.dkr'),
      VpcEndpointType: 'Interface',
    });
  });

  test('creates Secrets Manager interface endpoint', () => {
    const stack = setup();
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      ServiceName: Match.stringLikeRegexp('secretsmanager'),
      VpcEndpointType: 'Interface',
    });
  });

  test('creates CloudWatch Logs interface endpoint', () => {
    const stack = setup();
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      ServiceName: Match.stringLikeRegexp('logs'),
      VpcEndpointType: 'Interface',
    });
  });

  test('creates no endpoints when enableEndpoints=false', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', { env: { account: '123456789012', region: 'us-east-1' } });
    const vpc = new VpcConstruct(stack, 'Vpc', {
      environment: 'prod',
      createVpc: true,
      maxAzs: 2,
    });
    new VpcEndpointsConstruct(stack, 'Endpoints', { vpc: vpc.vpc, enableEndpoints: false });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 0);
  });
});
