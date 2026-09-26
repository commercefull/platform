import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

/** Header CloudFront injects so the app can reject requests that bypass the edge. */
export const ORIGIN_VERIFY_HEADER = 'x-origin-verify';

/** Static asset prefixes that are safe to cache (no cookies, no per-user content). */
const STATIC_PATH_PATTERNS = ['/javascripts/*', '/stylesheets/*', '/images/*', '/fonts/*'];

export interface CloudFrontConstructProps {
  readonly domainName: string;
  readonly certificate: acm.ICertificate;
  /** Cache static asset paths at the edge. Dynamic pages/APIs are never cached. Defaults to true. */
  readonly enableCaching?: boolean;

  /**
   * ALB to use as origin (standard mode).
   */
  readonly loadBalancer?: elbv2.ApplicationLoadBalancer;

  /**
   * API Gateway HTTP API to use as origin (cost-optimized mode).
   */
  readonly api?: apigatewayv2.HttpApi;

  /**
   * Shared secret sent to the origin in the `x-origin-verify` header. The app
   * (ORIGIN_VERIFY_SECRET) rejects requests without it, closing the
   * "hit the API Gateway / ALB URL directly and skip the WAF" bypass.
   */
  readonly originVerifySecret?: secretsmanager.ISecret;

  /** Attach an AWS WAF web ACL (managed OWASP rules + rate limiting). Defaults to true. */
  readonly enableWaf?: boolean;
}

/**
 * CloudFront distribution.
 *
 * In cost-optimized mode: CloudFront → API Gateway → VPC Link → Cloud Map → ECS
 * In standard mode: CloudFront → ALB → ECS
 *
 * Security posture:
 *  - Dynamic responses are NEVER cached and all viewer headers/cookies/query
 *    strings are forwarded (caching them leaks one user's session pages to others).
 *  - Only static asset paths are cached.
 *  - TLS 1.2+ for viewers, HTTPS-only to origin.
 *  - Optional WAF with AWS managed rules and per-IP rate limits.
 */
export class CloudFrontConstruct extends Construct {
  readonly distribution: cloudfront.Distribution;
  readonly distributionDomainName: string;
  readonly webAcl?: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: CloudFrontConstructProps) {
    super(scope, id);

    const customHeaders = props.originVerifySecret
      ? { [ORIGIN_VERIFY_HEADER]: props.originVerifySecret.secretValue.unsafeUnwrap() }
      : undefined;

    let origin: cloudfront.IOrigin;
    let originRequestPolicy: cloudfront.IOriginRequestPolicy;

    if (props.api) {
      // Cost-optimized: API Gateway as origin. API Gateway requires its own Host header.
      origin = new origins.HttpOrigin(cdk.Fn.select(2, cdk.Fn.split('/', props.api.apiEndpoint)), {
        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
        customHeaders,
      });
      originRequestPolicy = cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER;
    } else if (props.loadBalancer) {
      // Standard: ALB as origin
      origin = new origins.LoadBalancerV2Origin(props.loadBalancer, {
        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
        customHeaders,
      });
      originRequestPolicy = cloudfront.OriginRequestPolicy.ALL_VIEWER;
    } else {
      throw new Error('Either api or loadBalancer must be provided');
    }

    if (props.enableWaf ?? true) {
      this.webAcl = this.createWebAcl();
    }

    const staticBehavior: cloudfront.BehaviorOptions = {
      origin,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
      compress: true,
    };

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        compress: true,
      },
      additionalBehaviors:
        props.enableCaching ?? true ? Object.fromEntries(STATIC_PATH_PATTERNS.map(pattern => [pattern, staticBehavior])) : undefined,
      certificate: props.certificate,
      domainNames: [props.domainName, `www.${props.domainName}`],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      webAclId: this.webAcl?.attrArn,
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

  private createWebAcl(): wafv2.CfnWebACL | undefined {
    const region = cdk.Stack.of(this).region;
    if (!cdk.Token.isUnresolved(region) && region !== 'us-east-1') {
      cdk.Annotations.of(this).addWarningV2(
        'commercefull:wafRegion',
        'CloudFront WAF web ACLs must be created in us-east-1; WAF was skipped for this stack.',
      );
      return undefined;
    }

    const visibility = (metricName: string): wafv2.CfnWebACL.VisibilityConfigProperty => ({
      cloudWatchMetricsEnabled: true,
      sampledRequestsEnabled: true,
      metricName,
    });

    const managedRule = (
      name: string,
      priority: number,
      ruleActionOverrides?: wafv2.CfnWebACL.RuleActionOverrideProperty[],
    ): wafv2.CfnWebACL.RuleProperty => ({
      name,
      priority,
      overrideAction: { none: {} },
      statement: { managedRuleGroupStatement: { vendorName: 'AWS', name, ruleActionOverrides } },
      visibilityConfig: visibility(name),
    });

    const authPathMatch = (path: string): wafv2.CfnWebACL.StatementProperty => ({
      byteMatchStatement: {
        fieldToMatch: { uriPath: {} },
        positionalConstraint: 'CONTAINS',
        searchString: path,
        textTransformations: [{ priority: 0, type: 'LOWERCASE' }],
      },
    });

    return new wafv2.CfnWebACL(this, 'WebAcl', {
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      visibilityConfig: visibility('commercefull-waf'),
      rules: [
        managedRule('AWSManagedRulesAmazonIpReputationList', 0),
        // Body size rule counted, not blocked: media uploads and page-builder saves exceed 8 KB
        managedRule('AWSManagedRulesCommonRuleSet', 1, [{ name: 'SizeRestrictions_BODY', actionToUse: { count: {} } }]),
        managedRule('AWSManagedRulesKnownBadInputsRuleSet', 2),
        managedRule('AWSManagedRulesSQLiRuleSet', 3),
        {
          name: 'RateLimitAuthEndpoints',
          priority: 10,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 100,
              aggregateKeyType: 'IP',
              scopeDownStatement: {
                orStatement: { statements: ['/login', '/signin', '/signup', '/auth/', '/identity/'].map(authPathMatch) },
              },
            },
          },
          visibilityConfig: visibility('RateLimitAuthEndpoints'),
        },
        {
          name: 'RateLimitGlobal',
          priority: 11,
          action: { block: {} },
          statement: { rateBasedStatement: { limit: 3000, aggregateKeyType: 'IP' } },
          visibilityConfig: visibility('RateLimitGlobal'),
        },
      ],
    });
  }
}
