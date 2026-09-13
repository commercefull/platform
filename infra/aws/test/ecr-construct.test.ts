import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { EcrConstruct } from '../lib/constructs/ecr-construct';

describe('EcrConstruct', () => {
  test('creates an ECR repository with lifecycle rule', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', { env: { account: '123456789012', region: 'us-east-1' } });
    const ecr = new EcrConstruct(stack, 'Ecr');

    expect(ecr.repository).toBeDefined();

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ECR::Repository', 1);
    template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: 'commercefull',
    });
    // Lifecycle policy should exist with imageCountMoreThan
    template.hasResourceProperties('AWS::ECR::Repository', {
      LifecyclePolicy: {
        LifecyclePolicyText: Match.stringLikeRegexp('imageCountMoreThan'),
      },
    });
  });

  test('uses custom repository name', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    new EcrConstruct(stack, 'Ecr', { repositoryName: 'custom-repo' });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: 'custom-repo',
    });
  });

  test('respects maxImageCount option', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    new EcrConstruct(stack, 'Ecr', { maxImageCount: 5 });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ECR::Repository', {
      LifecyclePolicy: {
        LifecyclePolicyText: Match.stringLikeRegexp('"countNumber":5'),
      },
    });
  });
});
