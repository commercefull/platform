import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { CloudFrontConstruct } from '../lib/constructs/cloudfront-construct';

describe('CloudFrontConstruct', () => {
  function setupAlbOrigin(enableCaching = true) {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', { env: { account: '123456789012', region: 'us-east-1' } });

    const vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2 });
    const alb = new elbv2.ApplicationLoadBalancer(stack, 'ALB', { vpc, internetFacing: true });
    const cert = new acm.Certificate(stack, 'Cert', {
      domainName: 'example.com',
      validation: acm.CertificateValidation.fromDns(),
    });

    const cf = new CloudFrontConstruct(stack, 'CloudFront', {
      domainName: 'example.com',
      certificate: cert,
      loadBalancer: alb,
      enableCaching,
    });

    return { stack, cf };
  }

  function setupApiOrigin() {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', { env: { account: '123456789012', region: 'us-east-1' } });

    const api = new apigatewayv2.HttpApi(stack, 'Api', {
      apiName: 'commercefull-prod',
    });

    const cert = new acm.Certificate(stack, 'Cert', {
      domainName: 'example.com',
      validation: acm.CertificateValidation.fromDns(),
    });

    const cf = new CloudFrontConstruct(stack, 'CloudFront', {
      domainName: 'example.com',
      certificate: cert,
      api,
    });

    return { stack, cf };
  }

  // ── ALB origin ───────────────────────────────────────────────────────

  test('creates a CloudFront distribution with ALB origin', () => {
    const { stack } = setupAlbOrigin();
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
  });

  test('configures domain names for the distribution', () => {
    const { stack } = setupAlbOrigin();
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: ['example.com', 'www.example.com'],
      },
    });
  });

  test('enables HTTPS redirect for viewers', () => {
    const { stack } = setupAlbOrigin();
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: 'redirect-to-https',
        },
      },
    });
  });

  test('uses HTTPS-only origin protocol for ALB', () => {
    const { stack } = setupAlbOrigin();
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Origins: Match.arrayWith([
          Match.objectLike({
            CustomOriginConfig: Match.objectLike({
              OriginProtocolPolicy: 'https-only',
            }),
          }),
        ]),
      },
    });
  });

  test('configures 404 error response', () => {
    const { stack } = setupAlbOrigin();
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        CustomErrorResponses: [
          {
            ErrorCode: 404,
            ResponseCode: 404,
            ResponsePagePath: '/404.html',
          },
        ],
      }),
    });
  });

  // ── API Gateway origin ───────────────────────────────────────────────

  test('creates a CloudFront distribution with API Gateway origin', () => {
    const { stack } = setupApiOrigin();
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
  });

  test('uses HTTPS-only origin protocol for API Gateway', () => {
    const { stack } = setupApiOrigin();
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Origins: Match.arrayWith([
          Match.objectLike({
            CustomOriginConfig: Match.objectLike({
              OriginProtocolPolicy: 'https-only',
            }),
          }),
        ]),
      },
    });
  });

  // ── Validation ────────────────────────────────────────────────────────

  test('throws when neither api nor loadBalancer is provided', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const cert = new acm.Certificate(stack, 'Cert', {
      domainName: 'example.com',
      validation: acm.CertificateValidation.fromDns(),
    });

    expect(() => new CloudFrontConstruct(stack, 'CloudFront', {
      domainName: 'example.com',
      certificate: cert,
    })).toThrow('Either api or loadBalancer must be provided');
  });

  test('exposes distribution domain name', () => {
    const { cf } = setupAlbOrigin();
    expect(cf.distributionDomainName).toBeDefined();
  });
});
