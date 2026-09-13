import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { Construct } from 'constructs';

export interface CloudFrontConstructProps {
  readonly domainName: string;
  readonly certificate: acm.ICertificate;
  readonly enableCaching?: boolean;

  /**
   * ALB to use as origin (standard mode).
   */
  readonly loadBalancer?: elbv2.ApplicationLoadBalancer;

  /**
   * API Gateway HTTP API to use as origin (cost-optimized mode).
   */
  readonly api?: apigatewayv2.HttpApi;
}

/**
 * CloudFront distribution.
 *
 * In cost-optimized mode: CloudFront → API Gateway → VPC Link → Cloud Map → ECS
 * In standard mode: CloudFront → ALB → ECS
 */
export class CloudFrontConstruct extends Construct {
  readonly distribution: cloudfront.Distribution;
  readonly distributionDomainName: string;

  constructor(scope: Construct, id: string, props: CloudFrontConstructProps) {
    super(scope, id);

    let origin: cloudfront.IOrigin;

    if (props.api) {
      // Cost-optimized: API Gateway as origin
      origin = new origins.HttpOrigin(props.api.apiEndpoint, {
        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
      });
    } else if (props.loadBalancer) {
      // Standard: ALB as origin
      origin = new origins.LoadBalancerV2Origin(props.loadBalancer, {
        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
      });
    } else {
      throw new Error('Either api or loadBalancer must be provided');
    }

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: props.enableCaching ?? true
          ? cloudfront.CachePolicy.CACHING_OPTIMIZED
          : cloudfront.CachePolicy.CACHING_DISABLED,
      },
      certificate: props.certificate,
      domainNames: [props.domainName, `www.${props.domainName}`],
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: cdk.Duration.minutes(30),
        },
      ],
    });

    this.distributionDomainName = this.distribution.distributionDomainName;
  }
}
