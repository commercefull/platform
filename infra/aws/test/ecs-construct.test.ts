import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { VpcConstruct } from '../lib/constructs/vpc-construct';
import { DatabaseConstruct } from '../lib/constructs/database-construct';
import { EcsConstruct } from '../lib/constructs/ecs-construct';

describe('EcsConstruct', () => {
  function setup(environment: string, enableAlb = true) {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', { env: { account: '123456789012', region: 'us-east-1' } });
    const vpc = new VpcConstruct(stack, 'Vpc', { environment, createVpc: true, maxAzs: 2 });

    const dbCredentials = new secretsmanager.Secret(stack, 'DbCreds', {
      generateSecretString: { generateStringKey: 'password', secretStringTemplate: '{}' },
    });
    const sessionSecret = new secretsmanager.Secret(stack, 'SessionSecret', {
      generateSecretString: { generateStringKey: 'sessionSecret', secretStringTemplate: '{}' },
    });
    const jwtSecret = new secretsmanager.Secret(stack, 'JwtSecret', {
      generateSecretString: { generateStringKey: 'jwtSecret', secretStringTemplate: '{}' },
    });

    const db = new DatabaseConstruct(stack, 'Database', {
      environment,
      vpc: vpc.vpc,
      securityGroup: vpc.dbSecurityGroup,
    });

    const ecs = new EcsConstruct(stack, 'Ecs', {
      environment,
      domainName: 'example.com',
      vpc: vpc.vpc,
      albSecurityGroup: enableAlb ? vpc.albSecurityGroup : undefined,
      ecsSecurityGroup: vpc.ecsSecurityGroup,
      containerImage: '123456789012.dkr.ecr.us-east-1.amazonaws.com/commercefull:latest',
      dbEndpointAddress: db.endpointAddress,
      dbName: db.databaseName,
      dbCredentials,
      sessionSecret,
      jwtSecret,
      enableAlb,
    });

    return { stack, ecs };
  }

  // ── Common ────────────────────────────────────────────────────────────

  test('creates an ECS cluster', () => {
    const { stack } = setup('prod');
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ECS::Cluster', 1);
  });

  test('creates a Fargate task definition with correct container image', () => {
    const { stack } = setup('prod');
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Image: '123456789012.dkr.ecr.us-east-1.amazonaws.com/commercefull:latest',
        }),
      ]),
    });
  });

  test('sets NODE_ENV and PORT environment variables', () => {
    const { stack } = setup('prod');
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Environment: Match.arrayWith([
            { Name: 'NODE_ENV', Value: 'prod' },
            { Name: 'PORT', Value: '3000' },
          ]),
        }),
      ]),
    });
  });

  test('creates a Fargate service with desired count 3 in prod', () => {
    const { stack } = setup('prod');
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ECS::Service', {
      DesiredCount: 3,
      LaunchType: 'FARGATE',
    });
  });

  test('creates a Fargate service with desired count 1 in dev', () => {
    const { stack } = setup('dev');
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ECS::Service', {
      DesiredCount: 1,
    });
  });

  test('creates a log group with correct name', () => {
    const { stack } = setup('prod');
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/ecs/commercefull-prod',
    });
  });

  test('creates auto-scaling target and CPU policy', () => {
    const { stack } = setup('prod');
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 1);
    // CPU scaling always exists; request scaling only with ALB
    template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 2);
  });

  // ── ALB mode (standard) ───────────────────────────────────────────────

  test('creates an ALB when enableAlb=true', () => {
    const { stack } = setup('prod', true);
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
  });

  test('creates a target group with /health path when ALB enabled', () => {
    const { stack } = setup('prod', true);
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      HealthCheckPath: '/health',
      Port: 80,
      Protocol: 'HTTP',
    });
  });

  test('creates HTTP listener that redirects to HTTPS when ALB enabled', () => {
    const { stack } = setup('prod', true);
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      DefaultActions: Match.arrayWith([
        Match.objectLike({
          RedirectConfig: {
            Protocol: 'HTTPS',
            Port: '443',
            StatusCode: 'HTTP_301',
          },
        }),
      ]),
    });
  });

  test('does not create HTTPS listener until addHttpsListener is called', () => {
    const { stack } = setup('prod', true);
    const template = Template.fromStack(stack);
    // Only HTTP listener (port 80) should exist
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
  });

  test('does not create Cloud Map namespace when ALB enabled', () => {
    const { stack } = setup('prod', true);
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ServiceDiscovery::PrivateDnsNamespace', 0);
  });

  // ── No-ALB mode (cost-optimized) ──────────────────────────────────────

  test('does not create an ALB when enableAlb=false', () => {
    const { stack } = setup('prod', false);
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 0);
  });

  test('creates Cloud Map namespace when enableAlb=false', () => {
    const { stack } = setup('prod', false);
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ServiceDiscovery::PrivateDnsNamespace', 1);
  });

  test('registers service with Cloud Map when enableAlb=false', () => {
    const { stack } = setup('prod', false);
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ServiceDiscovery::Service', 1);
  });

  test('creates only CPU scaling policy (no request scaling) when enableAlb=false', () => {
    const { stack } = setup('prod', false);
    const template = Template.fromStack(stack);
    // Only CPU scaling, no request-based scaling (requires ALB)
    template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 1);
  });

  test('exposes cloudMapService when enableAlb=false', () => {
    const { ecs } = setup('prod', false);
    expect(ecs.cloudMapService).toBeDefined();
    expect(ecs.loadBalancer).toBeUndefined();
  });

  test('exposes loadBalancer when enableAlb=true', () => {
    const { ecs } = setup('prod', true);
    expect(ecs.loadBalancer).toBeDefined();
    expect(ecs.cloudMapService).toBeUndefined();
  });
});
