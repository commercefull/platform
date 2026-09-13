import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { VpcConstruct } from '../lib/constructs/vpc-construct';

describe('VpcConstruct', () => {
  test('creates a new VPC with 3 subnet types', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const vpcConstruct = new VpcConstruct(stack, 'Vpc', {
      environment: 'prod',
      createVpc: true,
      maxAzs: 3,
    });

    expect(vpcConstruct.vpc).toBeDefined();
    expect(vpcConstruct.albSecurityGroup).toBeDefined();
    expect(vpcConstruct.ecsSecurityGroup).toBeDefined();
    expect(vpcConstruct.dbSecurityGroup).toBeDefined();

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
    // CDK uses 2 AZs in test environments (no real AZs available)
    template.resourceCountIs('AWS::EC2::Subnet', 6);
    template.resourceCountIs('AWS::EC2::SecurityGroup', 3);
  });

  test('creates ALB security group with HTTP and HTTPS ingress', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    new VpcConstruct(stack, 'Vpc', {
      environment: 'prod',
      createVpc: true,
      maxAzs: 2,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for Application Load Balancer',
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({ FromPort: 80, ToPort: 80, IpProtocol: 'tcp', CidrIp: '0.0.0.0/0' }),
        Match.objectLike({ FromPort: 443, ToPort: 443, IpProtocol: 'tcp', CidrIp: '0.0.0.0/0' }),
      ]),
    });
  });

  test('creates DB security group allowing PostgreSQL from ECS', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    new VpcConstruct(stack, 'Vpc', {
      environment: 'prod',
      createVpc: true,
      maxAzs: 2,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      FromPort: 5432,
      ToPort: 5432,
      IpProtocol: 'tcp',
      Description: 'Allow PostgreSQL from ECS',
    });
  });

  test('throws when createVpc=false and no existingVpcId', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    expect(() => new VpcConstruct(stack, 'Vpc', {
      environment: 'prod',
      createVpc: false,
    })).toThrow('existingVpcId must be provided');
  });

  test('respects maxAzs option', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    new VpcConstruct(stack, 'Vpc', {
      environment: 'dev',
      createVpc: true,
      maxAzs: 2,
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::Subnet', 6);
  });

  test('creates no NAT Gateways when natGateways=0', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    new VpcConstruct(stack, 'Vpc', {
      environment: 'prod',
      createVpc: true,
      maxAzs: 2,
      natGateways: 0,
    });

    const template = Template.fromStack(stack);
    // No NAT Gateways should be created
    template.resourceCountIs('AWS::EC2::NatGateway', 0);
  });

  test('creates NAT Gateways when natGateways=1', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    new VpcConstruct(stack, 'Vpc', {
      environment: 'prod',
      createVpc: true,
      maxAzs: 2,
      natGateways: 1,
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
  });
});
