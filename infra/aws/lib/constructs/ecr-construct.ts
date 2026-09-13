import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export interface EcrConstructProps {
  /** Repository name. Defaults to 'commercefull'. */
  readonly repositoryName?: string;
  /** Max images to retain. Defaults to 10. */
  readonly maxImageCount?: number;
}

/**
 * ECR repository for the CommerceFull container image with lifecycle rules.
 */
export class EcrConstruct extends Construct {
  readonly repository: ecr.Repository;
  readonly repositoryUri: string;

  constructor(scope: Construct, id: string, props: EcrConstructProps = {}) {
    super(scope, id);

    this.repository = new ecr.Repository(this, 'Repository', {
      repositoryName: props.repositoryName ?? 'commercefull',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          maxImageCount: props.maxImageCount ?? 10,
          description: 'Keep only recent images',
        },
      ],
    });

    this.repositoryUri = this.repository.repositoryUri;
  }
}
