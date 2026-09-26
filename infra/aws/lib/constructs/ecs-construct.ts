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
  /**
   * Plain-string secrets injected as env vars, keyed by variable name
   * (CUSTOMER_JWT_SECRET, ORGANIZATION_JWT_SECRET, ADMIN_JWT_SECRET,
   * B2B_JWT_SECRET, COOKIE_SECRET, ORIGIN_VERIFY_SECRET, ...).
   * Each realm MUST have its own secret — a shared JWT secret lets a customer
   * token authenticate against the admin/organization APIs.
   */
  readonly appSecrets?: Record<string, secretsmanager.ISecret>;
  /** Number of reverse-proxy hops in front of the container (CloudFront + ALB/API Gateway = 2). */
  readonly trustProxyHops?: number;
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
    // Task role = what the application code can do. Least privilege: no ECR/logs
    // permissions and no direct secret access (secrets are injected at start-up
    // by the execution role), so an RCE cannot read every secret via the SDK.
    this.taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    const executionRole = new iam.Role(this, 'ExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    executionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
    );

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
        // Must be exactly 'production' — the app keys every production safeguard
        // (secure cookies, CSP, error redaction, CORS allow-list, test-DB lockout) on it.
        NODE_ENV: 'production',
        PORT: '3000',
        DOMAIN: `https://${props.domainName}`,
        ENVIRONMENT: environment,
        ALLOWED_ORIGINS: `https://${props.domainName},https://www.${props.domainName}`,
        COOKIE_DOMAIN: props.domainName,
        TRUST_PROXY: String(props.trustProxyHops ?? 2),
        POSTGRES_HOST: props.dbEndpointAddress,
        POSTGRES_PORT: '5432',
        POSTGRES_DB: props.dbName,
        POSTGRES_USER: 'commercefull',
        // RDS enforces TLS (rds.force_ssl=1). Mount the RDS CA bundle into
        // POSTGRES_SSL_CA and drop REJECT_UNAUTHORIZED=false to also verify the server.
        POSTGRES_SSL: 'true',
        POSTGRES_SSL_REJECT_UNAUTHORIZED: 'false',
      },
      secrets: {
        POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(props.dbCredentials, 'password'),
        SESSION_SECRET: ecs.Secret.fromSecretsManager(props.sessionSecret, 'sessionSecret'),
        ...Object.fromEntries(
          Object.entries(props.appSecrets ?? {}).map(([name, secret]) => [name, ecs.Secret.fromSecretsManager(secret)]),
        ),
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
        // Reject requests with malformed headers (HTTP request smuggling / desync)
        dropInvalidHeaderFields: true,
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
      sslPolicy: elbv2.SslPolicy.RECOMMENDED_TLS,
      open: true,
    });
    if (this.targetGroup) {
      this.httpsListener.addTargetGroups('TargetGroups', { targetGroups: [this.targetGroup] });
    }
    return this.httpsListener;
  }
}
