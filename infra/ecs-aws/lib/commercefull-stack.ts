import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as autoscaling from 'aws-cdk-lib/aws-applicationautoscaling';

export interface CommerceFullStackProps extends cdk.StackProps {
  domainName?: string;
  environment?: string;
}

export class CommerceFullStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CommerceFullStackProps = {}) {
    super(scope, id, props);

    const environment = props.environment || 'prod';
    const domainName = props.domainName || 'yourdomain.com';

    // ============================================================================
    // VPC and Networking
    // ============================================================================

    const vpc = new ec2.Vpc(this, 'CommerceFullVPC', {
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // ============================================================================
    // Security Groups
    // ============================================================================

    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic from anywhere');

    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic from anywhere');

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: true,
    });

    dbSecurityGroup.addIngressRule(ecsSecurityGroup, ec2.Port.tcp(5432), 'Allow PostgreSQL traffic from ECS tasks');

    // ============================================================================
    // Database - PostgreSQL 18
    // ============================================================================

    const dbCredentials = new secretsmanager.Secret(this, 'DBCredentials', {
      secretName: `commercefull/${environment}/db-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'commercefull',
        }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    const database = new rds.DatabaseInstance(this, 'CommerceFullDB', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_18,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbCredentials),
      multiAz: environment === 'prod',
      allocatedStorage: environment === 'prod' ? 100 : 20,
      maxAllocatedStorage: 1000,
      deletionProtection: environment === 'prod',
      backupRetention: cdk.Duration.days(7),
      monitoringInterval: cdk.Duration.minutes(1),
      enablePerformanceInsights: true,
      databaseName: 'commercefull',
      publiclyAccessible: false,
    });

    // ============================================================================
    // ECS Cluster and Task Definition
    // ============================================================================

    const cluster = new ecs.Cluster(this, 'CommerceFullCluster', {
      vpc,
      containerInsights: true,
    });

    const taskRole = new iam.Role(this, 'ECSTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    taskRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));

    // Grant access to secrets
    dbCredentials.grantRead(taskRole);

    const executionRole = new iam.Role(this, 'ECSExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    executionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'));

    const logGroup = new logs.LogGroup(this, 'CommerceFullLogGroup', {
      logGroupName: `/ecs/commercefull-${environment}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'CommerceFullTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
      taskRole: taskRole,
      executionRole: executionRole,
      family: `commercefull-${environment}`,
    });

    const containerImage =
      process.env.CONTAINER_IMAGE || `${cdk.Stack.of(this).account}.dkr.ecr.${cdk.Stack.of(this).region}.amazonaws.com/commercefull:latest`;

    const container = taskDefinition.addContainer('CommerceFullContainer', {
      image: ecs.ContainerImage.fromRegistry(containerImage),
      memoryLimitMiB: 512,
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'commercefull',
        logGroup: logGroup,
      }),
      environment: {
        NODE_ENV: environment,
        PORT: '3000',
        DOMAIN: `https://${domainName}`,
        ENVIRONMENT: environment,
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSsmParameter(
          ssm.StringParameter.fromStringParameterName(this, 'DatabaseUrl', `/commercefull/${environment}/database-url`),
        ),
        SESSION_SECRET: ecs.Secret.fromSsmParameter(
          ssm.StringParameter.fromStringParameterName(this, 'SessionSecret', `/commercefull/${environment}/session-secret`),
        ),
        JWT_SECRET: ecs.Secret.fromSsmParameter(
          ssm.StringParameter.fromStringParameterName(this, 'JwtSecret', `/commercefull/${environment}/jwt-secret`),
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

    // ============================================================================
    // ECS Service
    // ============================================================================

    const service = new ecs.FargateService(this, 'CommerceFullService', {
      cluster,
      taskDefinition,
      desiredCount: environment === 'prod' ? 3 : 1,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      enableExecuteCommand: environment !== 'prod',
    });

    // ============================================================================
    // Application Load Balancer
    // ============================================================================

    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'CommerceFullALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      deletionProtection: environment === 'prod',
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'CommerceFullTargetGroup', {
      vpc,
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

    service.attachToApplicationTargetGroup(targetGroup);

    const listener = loadBalancer.addListener('HTTPListener', {
      port: 80,
      open: true,
    });

    listener.addAction('RedirectToHTTPS', {
      action: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    // SSL Certificate
    const certificate = new acm.Certificate(this, 'CommerceFullCertificate', {
      domainName: domainName,
      subjectAlternativeNames: [`www.${domainName}`],
      validation: acm.CertificateValidation.fromDns(),
    });

    const httpsListener = loadBalancer.addListener('HTTPSListener', {
      port: 443,
      certificates: [certificate],
      open: true,
    });

    httpsListener.addTargetGroups('CommerceFullTargetGroups', {
      targetGroups: [targetGroup],
    });

    // ============================================================================
    // CloudFront Distribution
    // ============================================================================

    const distribution = new cloudfront.Distribution(this, 'CommerceFullDistribution', {
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      certificate: certificate,
      domainNames: [domainName, `www.${domainName}`],
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: cdk.Duration.minutes(30),
        },
      ],
    });

    // ============================================================================
    // S3 Bucket for Media Files
    // ============================================================================

    const mediaBucket = new s3.Bucket(this, 'CommerceFullMediaBucket', {
      bucketName: `commercefull-media-${environment}-${cdk.Stack.of(this).account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== 'prod',
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
          allowedOrigins: [`https://${domainName}`],
          maxAge: 3000,
        },
      ],
    });

    // Grant ECS task access to S3 bucket
    mediaBucket.grantReadWrite(taskRole);

    // ============================================================================
    // Auto Scaling
    // ============================================================================

    const scalableTarget = new autoscaling.ScalableTarget(this, 'ECSScalableTarget', {
      serviceNamespace: autoscaling.ServiceNamespace.ECS,
      scalableDimension: 'ecs:service:DesiredCount',
      resourceId: `service/${cluster.clusterName}/${service.serviceName}`,
      minCapacity: 1,
      maxCapacity: environment === 'prod' ? 10 : 3,
    });

    // CPU-based scaling policy
    new autoscaling.TargetTrackingScalingPolicy(this, 'CpuScalingPolicy', {
      scalingTarget: scalableTarget,
      predefinedMetric: autoscaling.PredefinedMetric.ECS_SERVICE_AVERAGE_CPU_UTILIZATION,
      targetValue: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Request-based scaling policy
    new autoscaling.TargetTrackingScalingPolicy(this, 'RequestScalingPolicy', {
      scalingTarget: scalableTarget,
      predefinedMetric: autoscaling.PredefinedMetric.ALB_REQUEST_COUNT_PER_TARGET,
      resourceLabel: `app/${loadBalancer.loadBalancerFullName}/${targetGroup.targetGroupFullName}`,
      targetValue: environment === 'prod' ? 1000 : 100,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // ============================================================================
    // Route 53 (if domain is managed by Route 53)
    // ============================================================================

    if (domainName !== 'yourdomain.com') {
      const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
        domainName: domainName,
      });

      new route53.ARecord(this, 'CloudFrontAlias', {
        zone: hostedZone,
        target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
      });
    }

    // ============================================================================
    // ECR Repository
    // ============================================================================

    const repository = new ecr.Repository(this, 'CommerceFullRepository', {
      repositoryName: 'commercefull',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          maxImageCount: 10,
          description: 'Keep only 10 images',
        },
      ],
    });

    // ============================================================================
    // Outputs
    // ============================================================================

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: loadBalancer.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.dbInstanceEndpointAddress,
      description: 'Database Endpoint',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: repository.repositoryUri,
      description: 'ECR Repository URI',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: mediaBucket.bucketName,
      description: 'S3 Bucket for Media Files',
    });

    new cdk.CfnOutput(this, 'ECSClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster Name',
    });

    new cdk.CfnOutput(this, 'ECSServiceName', {
      value: service.serviceName,
      description: 'ECS Service Name',
    });
  }
}
