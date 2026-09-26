import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

import { VpcConstruct } from './constructs/vpc-construct';
import { VpcEndpointsConstruct } from './constructs/vpc-endpoints-construct';
import { DatabaseConstruct } from './constructs/database-construct';
import { StorageConstruct } from './constructs/storage-construct';
import { EcrConstruct } from './constructs/ecr-construct';
import { EcsConstruct } from './constructs/ecs-construct';
import { CloudFrontConstruct } from './constructs/cloudfront-construct';
import { ApiGatewayConstruct } from './constructs/apigateway-construct';

export interface CommercefullStackProps extends cdk.StackProps {
  readonly domainName?: string;
  readonly environment?: string;
  readonly createVpc?: boolean;
  readonly existingVpcId?: string;
  readonly containerImage?: string;
  readonly enableCloudFront?: boolean;
  readonly enableRoute53?: boolean;

  /**
   * Cost-optimized mode: API Gateway + VPC Link + Cloud Map (no ALB).
   * When true:
   *   - API Gateway is the primary entry point
   *   - No ALB is created
   *   - No NAT Gateways (VPC endpoints replace NAT)
   *   - ECS tasks use Cloud Map service discovery
   * When false:
   *   - ALB is the primary entry point
   *   - API Gateway is optional (in front of ALB)
   *   - NAT Gateways are provisioned
   * Defaults to true.
   */
  readonly costOptimized?: boolean;

  /**
   * Whether to enable API Gateway.
   * In cost-optimized mode: always enabled (primary entry point).
   * In standard mode: optional, placed in front of ALB.
   * Defaults to true in cost-optimized mode, false otherwise.
   */
  readonly enableApiGateway?: boolean;
}

/**
 * Top-level stack that composes all Commercefull infrastructure constructs.
 *
 * Two deployment modes:
 *
 * 1. Cost-optimized (default): API Gateway → VPC Link → Cloud Map → ECS
 *    No ALB, no NAT Gateways. VPC endpoints provide AWS service access.
 *    Lowest cost. Add ALB later when traffic grows.
 *
 * 2. Standard: ALB → ECS, optional API Gateway in front of ALB
 *    Full-featured with request-based auto-scaling.
 */
export class CommercefullStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CommercefullStackProps = {}) {
    super(scope, id, props);

    const environment = props.environment || 'prod';
    const domainName = props.domainName || 'yourdomain.com';
    const createVpc = props.createVpc ?? true;
    const costOptimized = props.costOptimized ?? true;
    const enableAlb = !costOptimized;
    const enableCloudFront = props.enableCloudFront ?? true;
    const enableApiGateway = props.enableApiGateway ?? costOptimized;
    const enableRoute53 = props.enableRoute53 ?? domainName !== 'yourdomain.com';
    const natGateways = costOptimized ? 0 : 1;

    // ── VPC ───────────────────────────────────────────────────────────────
    const vpc = new VpcConstruct(this, 'Vpc', {
      environment,
      createVpc,
      existingVpcId: props.existingVpcId,
      natGateways,
    });

    // ── VPC Endpoints (replaces NAT in cost-optimized mode) ────────────────
    if (costOptimized) {
      new VpcEndpointsConstruct(this, 'VpcEndpoints', {
        vpc: vpc.vpc,
      });
    }

    // ── Database ─────────────────────────────────────────────────────────
    const database = new DatabaseConstruct(this, 'Database', {
      environment,
      vpc: vpc.vpc,
      securityGroup: vpc.dbSecurityGroup,
    });

    // ── Storage (S3) ──────────────────────────────────────────────────────
    const storage = new StorageConstruct(this, 'Storage', {
      environment,
      domainName,
    });

    // ── ECR ──────────────────────────────────────────────────────────────
    const ecr = new EcrConstruct(this, 'Ecr');

    // ── Application secrets ──────────────────────────────────────────────
    const sessionSecret = new secretsmanager.Secret(this, 'SessionSecret', {
      secretName: `commercefull/${environment}/session-secret`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'sessionSecret',
        excludeCharacters: '"@/\\',
        passwordLength: 64,
      },
    });

    // One independent secret per auth realm. A shared JWT secret would let a
    // customer token validate against the organization/admin APIs.
    const generatedSecret = (id: string, name: string) =>
      new secretsmanager.Secret(this, id, {
        secretName: `commercefull/${environment}/${name}`,
        generateSecretString: { passwordLength: 64, excludePunctuation: true },
      });

    const appSecrets: Record<string, secretsmanager.ISecret> = {
      CUSTOMER_JWT_SECRET: generatedSecret('CustomerJwtSecret', 'customer-jwt-secret'),
      ORGANIZATION_JWT_SECRET: generatedSecret('OrganizationJwtSecret', 'organization-jwt-secret'),
      ADMIN_JWT_SECRET: generatedSecret('AdminJwtSecret', 'admin-jwt-secret'),
      B2B_JWT_SECRET: generatedSecret('B2bJwtSecret', 'b2b-jwt-secret'),
      COOKIE_SECRET: generatedSecret('CookieSecret', 'cookie-secret'),
    };

    // Shared secret between CloudFront and the app — blocks direct-to-origin traffic
    const originVerifySecret = enableCloudFront && (enableApiGateway || enableAlb) ? generatedSecret('OriginVerifySecret', 'origin-verify-secret') : undefined;
    if (originVerifySecret) {
      appSecrets.ORIGIN_VERIFY_SECRET = originVerifySecret;
    }

    // ── ECS ──────────────────────────────────────────────────────────────
    const containerImage =
      props.containerImage ||
      `${this.account}.dkr.ecr.${this.region}.amazonaws.com/commercefull:latest`;

    const ecs = new EcsConstruct(this, 'Ecs', {
      environment,
      domainName,
      vpc: vpc.vpc,
      albSecurityGroup: enableAlb ? vpc.albSecurityGroup : undefined,
      ecsSecurityGroup: vpc.ecsSecurityGroup,
      containerImage,
      dbEndpointAddress: database.endpointAddress,
      dbName: database.databaseName,
      dbCredentials: database.credentials,
      sessionSecret,
      appSecrets,
      // CloudFront → (API Gateway | ALB) → task
      trustProxyHops: enableCloudFront ? 2 : 1,
      enableAlb,
    });

    // Grant ECS task role access to S3
    storage.grantReadWrite(ecs.taskRole);

    // ── SSL Certificate ──────────────────────────────────────────────────
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName,
      subjectAlternativeNames: [`www.${domainName}`],
      validation: acm.CertificateValidation.fromDns(),
    });

    // Add HTTPS listener to ALB (standard mode only)
    if (enableAlb) {
      ecs.addHttpsListener(certificate);
    }

    // ── API Gateway ──────────────────────────────────────────────────────
    let apiGateway: ApiGatewayConstruct | undefined;
    if (enableApiGateway) {
      if (costOptimized && ecs.cloudMapService) {
        // Cost-optimized: API Gateway → VPC Link → Cloud Map → ECS
        apiGateway = new ApiGatewayConstruct(this, 'ApiGateway', {
          environment,
          vpc: vpc.vpc,
          cloudMapService: ecs.cloudMapService,
          domainName,
        });
      } else if (ecs.httpsListener) {
        // Standard: API Gateway → VPC Link → ALB → ECS
        apiGateway = new ApiGatewayConstruct(this, 'ApiGateway', {
          environment,
          vpc: vpc.vpc,
          listener: ecs.httpsListener,
          domainName,
        });
      }
    }

    // ── CloudFront ───────────────────────────────────────────────────────
    let cloudFront: CloudFrontConstruct | undefined;
    if (enableCloudFront) {
      if (apiGateway) {
        // CloudFront → API Gateway
        cloudFront = new CloudFrontConstruct(this, 'CloudFront', {
          domainName,
          certificate,
          api: apiGateway.api,
          originVerifySecret,
        });
      } else if (ecs.loadBalancer) {
        // CloudFront → ALB
        cloudFront = new CloudFrontConstruct(this, 'CloudFront', {
          domainName,
          certificate,
          loadBalancer: ecs.loadBalancer,
          originVerifySecret,
        });
      }
    }

    // ── Route 53 ─────────────────────────────────────────────────────────
    if (enableRoute53 && cloudFront) {
      const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
        domainName,
      });

      new route53.ARecord(this, 'CloudFrontAlias', {
        zone: hostedZone,
        target: route53.RecordTarget.fromAlias(
          new route53targets.CloudFrontTarget(cloudFront.distribution),
        ),
      });
    }

    // ── Outputs ──────────────────────────────────────────────────────────
    if (ecs.loadBalancer) {
      new cdk.CfnOutput(this, 'LoadBalancerDNS', {
        value: ecs.loadBalancer.loadBalancerDnsName,
        description: 'Load Balancer DNS Name',
      });
    }

    if (cloudFront) {
      new cdk.CfnOutput(this, 'CloudFrontURL', {
        value: `https://${cloudFront.distributionDomainName}`,
        description: 'CloudFront Distribution URL',
      });
    }

    if (apiGateway) {
      new cdk.CfnOutput(this, 'ApiGatewayURL', {
        value: apiGateway.apiUrl,
        description: 'API Gateway URL',
      });
    }

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.endpointAddress,
      description: 'Database Endpoint',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: ecr.repositoryUri,
      description: 'ECR Repository URI',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: storage.bucket.bucketName,
      description: 'S3 Bucket for Media Files',
    });

    new cdk.CfnOutput(this, 'ECSClusterName', {
      value: ecs.cluster.clusterName,
      description: 'ECS Cluster Name',
    });

    new cdk.CfnOutput(this, 'ECSServiceName', {
      value: ecs.service.serviceName,
      description: 'ECS Service Name',
    });

    new cdk.CfnOutput(this, 'DeploymentMode', {
      value: costOptimized ? 'cost-optimized' : 'standard',
      description: 'Deployment mode (cost-optimized = APIGW+CloudMap, standard = ALB)',
    });
  }
}
