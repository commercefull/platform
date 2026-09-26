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
      // SECURITY: private bucket (serve via presigned URLs / CloudFront OAC), encrypted,
      // TLS-only, versioned (ransomware / accidental overwrite recovery), no ACLs.
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: isProd,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      cors: [
        {
          allowedHeaders: ['Content-Type', 'Content-MD5', 'x-amz-*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
          allowedOrigins: [`https://${props.domainName}`, `https://www.${props.domainName}`],
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
