import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface StorageConstructProps {
  readonly environment: string;
  /** Domain used for CORS configuration. */
  readonly domainName: string;
  /** Optional explicit bucket name. Defaults to commercefull-media-<env>-<account>. */
  readonly bucketName?: string;
  /** Whether to auto-delete objects on stack deletion. Defaults to false in prod. */
  readonly autoDeleteObjects?: boolean;
}

/**
 * S3 bucket for media uploads with CORS configured for the storefront domain.
 */
export class StorageConstruct extends Construct {
  readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    const isProd = props.environment === 'prod';
    const account = cdk.Stack.of(this).account;
    const bucketName = props.bucketName ?? `commercefull-media-${props.environment}-${account}`;
    const autoDelete = props.autoDeleteObjects ?? !isProd;

    this.bucket = new s3.Bucket(this, 'MediaBucket', {
      bucketName,
      removalPolicy: autoDelete ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: autoDelete,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
          allowedOrigins: [`https://${props.domainName}`],
          maxAge: 3000,
        },
      ],
    });
  }

  /** Grant read/write access to a principal (e.g. ECS task role). */
  grantReadWrite(grantee: import('aws-cdk-lib/aws-iam').IGrantable): void {
    this.bucket.grantReadWrite(grantee);
  }
}
