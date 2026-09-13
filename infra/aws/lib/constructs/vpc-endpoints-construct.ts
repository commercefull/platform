import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface VpcEndpointsConstructProps {
  readonly vpc: ec2.IVpc;
  /**
   * When true (default) creates interface endpoints for ECR, Secrets Manager,
   and CloudWatch Logs. Required when natGateways=0 so Fargate can pull images
   and access AWS services without NAT.
   */
  readonly enableEndpoints?: boolean;
}

/**
 * VPC Gateway and Interface endpoints that replace the need for NAT Gateways.
 *
 * Without NAT, Fargate tasks still need to:
 *  - Pull images from ECR (ecr.api + ecr.dkr interface endpoints + S3 gateway)
 *  - Read secrets from Secrets Manager (interface endpoint)
 *  - Ship logs to CloudWatch (logs interface endpoint)
 *
 * These endpoints cost ~$0.01/hr each but are far cheaper than NAT Gateways
 * ($0.045/hr + $0.045/GB data processed).
 */
export class VpcEndpointsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: VpcEndpointsConstructProps) {
    super(scope, id);

    if (props.enableEndpoints === false) return;

    const vpc = props.vpc;

    // S3 Gateway endpoint (free, always create for ECR layer storage)
    vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // ECR API — for image metadata
    vpc.addInterfaceEndpoint('EcrApiEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
    });

    // ECR DKR — for image pulls
    vpc.addInterfaceEndpoint('EcrDkrEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
    });

    // Secrets Manager — for DB credentials, session/JWT secrets
    vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    // CloudWatch Logs — for ECS log shipping
    vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
    });
  }
}
