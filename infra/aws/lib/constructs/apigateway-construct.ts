import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cloudmap from 'aws-cdk-lib/aws-servicediscovery';
import { Construct } from 'constructs';

export interface ApiGatewayConstructProps {
  readonly environment: string;
  readonly vpc: ec2.IVpc;

  /**
   * ALB listener to route traffic to (standard mode).
   * Required when using ALB integration mode.
   */
  readonly listener?: elbv2.IApplicationListener;

  /**
   * Cloud Map service to route traffic to (cost-optimized mode).
   * Required when using service discovery integration mode (no ALB).
   */
  readonly cloudMapService?: cloudmap.Service;

  readonly domainName?: string;

  /** Steady-state requests per second allowed on the default stage. Defaults to 1000. */
  readonly throttlingRateLimit?: number;
  /** Burst capacity on the default stage. Defaults to 500. */
  readonly throttlingBurstLimit?: number;
}

/**
 * HTTP API Gateway that acts as the public entry point.
 *
 * Cost-optimized mode: API Gateway → VPC Link → Cloud Map → ECS tasks
 *   No ALB, no NAT Gateways. VPC endpoints provide AWS service access.
 *
 * Standard mode: API Gateway → VPC Link → ALB → ECS tasks
 *   ALB handles load balancing, TLS termination, and health checks.
 */
export class ApiGatewayConstruct extends Construct {
  readonly api: apigatewayv2.HttpApi;
  readonly apiUrl: string;
  readonly vpcLink: apigatewayv2.VpcLink;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    const environment = props.environment;

    this.api = new apigatewayv2.HttpApi(this, 'HttpApi', {
      apiName: `commercefull-${environment}`,
      description: `Commercefull HTTP API (${environment})`,
    });

    // VPC Link — connects API Gateway to private resources
    this.vpcLink = new apigatewayv2.VpcLink(this, 'VpcLink', {
      vpc: props.vpc,
      vpcLinkName: `commercefull-${environment}-vpc-link`,
    });

    // Choose integration mode
    let integration: apigatewayv2.HttpRouteIntegration;

    if (props.cloudMapService) {
      // Cost-optimized: API Gateway → Cloud Map → ECS tasks (no ALB)
      integration = new apigatewayv2integrations.HttpServiceDiscoveryIntegration(
        'ServiceDiscoveryIntegration',
        props.cloudMapService,
        { vpcLink: this.vpcLink },
      );
    } else if (props.listener) {
      // Standard: API Gateway → ALB → ECS tasks
      integration = new apigatewayv2integrations.HttpAlbIntegration('AlbIntegration', props.listener, {
        vpcLink: this.vpcLink,
      });
    } else {
      throw new Error('Either cloudMapService or listener must be provided');
    }

    // Proxy all traffic
    this.api.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration,
    });

    // Health route
    this.api.addRoutes({
      path: '/health',
      methods: [apigatewayv2.HttpMethod.GET],
      integration,
    });

    // SECURITY: stage-level throttling so a single client cannot exhaust the
    // account-wide API Gateway quota (10k rps) or overwhelm the tasks.
    const stage = this.api.defaultStage?.node.defaultChild as apigatewayv2.CfnStage | undefined;
    stage?.addPropertyOverride('DefaultRouteSettings', {
      ThrottlingBurstLimit: props.throttlingBurstLimit ?? 500,
      ThrottlingRateLimit: props.throttlingRateLimit ?? 1000,
    });

    this.apiUrl = this.api.apiEndpoint;
  }
}
