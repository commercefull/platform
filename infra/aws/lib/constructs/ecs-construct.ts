import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as autoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as cloudmap from 'aws-cdk-lib/aws-servicediscovery';
import { Construct } from 'constructs';

export interface EcsConstructProps {
  readonly environment: string;
  readonly domainName: string;
  readonly vpc: ec2.IVpc;
  readonly albSecurityGroup?: ec2.SecurityGroup;
  readonly ecsSecurityGroup: ec2.SecurityGroup;
  readonly containerImage: string;
  readonly dbEndpointAddress: string;
  readonly dbName: string;
  readonly dbCredentials: secretsmanager.Secret;
  readonly sessionSecret: secretsmanager.Secret;
  readonly jwtSecret: secretsmanager.Secret;
  readonly desiredCount?: number;
  readonly cpu?: number;
  readonly memoryLimitMiB?: number;
  /**
   * Whether to create an Application Load Balancer.
   * Set to false for the cost-optimized mode (API Gateway + Cloud Map only).
   * Defaults to true.
   */
  readonly enableAlb?: boolean;
}

/**
 * ECS Fargate cluster, task definition, service, and optional ALB.
 *
 * In cost-optimized mode (enableAlb=false) the service registers with
 * Cloud Map service discovery so API Gateway can route to it via VPC Link
 * without an ALB. When traffic grows, set enableAlb=true to add an ALB.
 */
export class EcsConstruct extends Construct {
  readonly cluster: ecs.Cluster;
  readonly taskDefinition: ecs.FargateTaskDefinition;
  readonly service: ecs.FargateService;
  readonly taskRole: iam.Role;
  readonly logGroup: logs.LogGroup;

  // ALB-related (only when enableAlb=true)
  readonly loadBalancer?: elbv2.ApplicationLoadBalancer;
  readonly targetGroup?: elbv2.ApplicationTargetGroup;
  httpsListener?: elbv2.ApplicationListener;

  // Cloud Map service (only when enableAlb=false)
  readonly cloudMapService?: cloudmap.Service;
  readonly cloudMapNamespace?: cloudmap.INamespace;

  constructor(scope: Construct, id: string, props: EcsConstructProps) {
    super(scope, id);

    const environment = props.environment;
    const isProd = environment === 'prod';
    const enableAlb = props.enableAlb ?? true;

    // ── Cluster ──────────────────────────────────────────────────────────
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      containerInsights: true,
    });

    // ── IAM roles ────────────────────────────────────────────────────────
    this.taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    this.taskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
    );

    const executionRole = new iam.Role(this, 'ExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    executionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
    );

    // ── Secrets grants ────────────────────────────────────────────────────
    props.dbCredentials.grantRead(this.taskRole);
    props.sessionSecret.grantRead(this.taskRole);
    props.jwtSecret.grantRead(this.taskRole);

    // ── Log group ────────────────────────────────────────────────────────
    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/ecs/commercefull-${environment}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ── Task definition ─────────────────────────────────────────────────
    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: props.memoryLimitMiB ?? 512,
      cpu: props.cpu ?? 256,
      taskRole: this.taskRole,
      executionRole,
      family: `commercefull-${environment}`,
    });

    const container = this.taskDefinition.addContainer('Container', {
      image: ecs.ContainerImage.fromRegistry(props.containerImage),
      memoryLimitMiB: props.memoryLimitMiB ?? 512,
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'commercefull',
        logGroup: this.logGroup,
      }),
      environment: {
        NODE_ENV: environment,
        PORT: '3000',
        DOMAIN: `https://${props.domainName}`,
        ENVIRONMENT: environment,
        POSTGRES_HOST: props.dbEndpointAddress,
        POSTGRES_PORT: '5432',
        POSTGRES_DB: props.dbName,
        POSTGRES_USER: 'commercefull',
      },
      secrets: {
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(props.dbCredentials, 'password'),
        SESSION_SECRET: ecs.Secret.fromSecretsManager(props.sessionSecret, 'sessionSecret'),
        JWT_SECRET: ecs.Secret.fromSecretsManager(props.jwtSecret, 'jwtSecret'),
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // ── Service ─────────────────────────────────────────────────────────
    const desiredCount = props.desiredCount ?? (isProd ? 3 : 1);

    this.service = new ecs.FargateService(this, 'Service', {
      cluster: this.cluster,
      taskDefinition: this.taskDefinition,
      desiredCount,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      enableExecuteCommand: !isProd,
      securityGroups: [props.ecsSecurityGroup],
    });

    // Register with Cloud Map service discovery (no-ALB / cost-optimized mode)
    if (!enableAlb) {
      this.cloudMapNamespace = new cloudmap.PrivateDnsNamespace(this, 'CloudMapNamespace', {
        name: `commercefull-${environment}.local`,
        vpc: props.vpc,
      });

      // enableCloudMap creates the Cloud Map service and returns it
      this.cloudMapService = this.service.enableCloudMap({
        cloudMapNamespace: this.cloudMapNamespace,
        dnsRecordType: cloudmap.DnsRecordType.A,
        dnsTtl: cdk.Duration.seconds(10),
        name: 'commercefull',
      });
    }

    // ── ALB (optional) ──────────────────────────────────────────────────
    if (enableAlb && props.albSecurityGroup) {
      this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
        vpc: props.vpc,
        internetFacing: true,
        securityGroup: props.albSecurityGroup,
        deletionProtection: isProd,
      });

      this.targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
        vpc: props.vpc,
        protocol: elbv2.ApplicationProtocol.HTTP,
        port: 80,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 2,
        },
      });

      this.service.attachToApplicationTargetGroup(this.targetGroup);

      // HTTP → HTTPS redirect
      const httpListener = this.loadBalancer.addListener('HTTPListener', {
        port: 80,
        open: true,
      });
      httpListener.addAction('RedirectToHTTPS', {
        action: elbv2.ListenerAction.redirect({
          protocol: 'HTTPS',
          port: '443',
          permanent: true,
        }),
      });
    }

    // ── Auto Scaling ────────────────────────────────────────────────────
    const scalableTarget = new autoscaling.ScalableTarget(this, 'ScalableTarget', {
      serviceNamespace: autoscaling.ServiceNamespace.ECS,
      scalableDimension: 'ecs:service:DesiredCount',
      resourceId: `service/${this.cluster.clusterName}/${this.service.serviceName}`,
      minCapacity: 1,
      maxCapacity: isProd ? 10 : 3,
    });

    new autoscaling.TargetTrackingScalingPolicy(this, 'CpuScaling', {
      scalingTarget: scalableTarget,
      predefinedMetric: autoscaling.PredefinedMetric.ECS_SERVICE_AVERAGE_CPU_UTILIZATION,
      targetValue: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Request-based scaling only works with ALB
    if (enableAlb && this.loadBalancer && this.targetGroup) {
      new autoscaling.TargetTrackingScalingPolicy(this, 'RequestScaling', {
        scalingTarget: scalableTarget,
        predefinedMetric: autoscaling.PredefinedMetric.ALB_REQUEST_COUNT_PER_TARGET,
        resourceLabel: `app/${this.loadBalancer.loadBalancerFullName}/${this.targetGroup.targetGroupFullName}`,
        targetValue: isProd ? 1000 : 100,
        scaleInCooldown: cdk.Duration.seconds(60),
        scaleOutCooldown: cdk.Duration.seconds(60),
      });
    }
  }

  /** Add an HTTPS listener to the ALB with the given certificate. */
  addHttpsListener(certificate: import('aws-cdk-lib/aws-certificatemanager').ICertificate): elbv2.ApplicationListener {
    if (!this.loadBalancer) {
      throw new Error('Cannot add HTTPS listener: ALB is not enabled');
    }
    this.httpsListener = this.loadBalancer.addListener('HTTPSListener', {
      port: 443,
      certificates: [certificate],
      open: true,
    });
    if (this.targetGroup) {
      this.httpsListener.addTargetGroups('TargetGroups', { targetGroups: [this.targetGroup] });
    }
    return this.httpsListener;
  }
}
