import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  readonly environment: string;
  readonly vpc: ec2.IVpc;
  readonly securityGroup: ec2.SecurityGroup;
  /** PostgreSQL major version. Defaults to 18. */
  readonly postgresVersion?: rds.PostgresEngineVersion;
  /** Instance class. Defaults to BURSTABLE3_MICRO. */
  readonly instanceClass?: ec2.InstanceClass;
  /** Instance size. Defaults to MICRO. */
  readonly instanceSize?: ec2.InstanceSize;
  /** Allocated storage in GB. Defaults to 100 for prod, 20 otherwise. */
  readonly allocatedStorage?: number;
  /** Whether to enable multi-AZ. Defaults to true for prod. */
  readonly multiAz?: boolean;
  /** Whether to enable deletion protection. Defaults to true for prod. */
  readonly deletionProtection?: boolean;
  /** Database name. */
  readonly databaseName?: string;
}

/**
 * RDS PostgreSQL instance with auto-generated credentials in Secrets Manager.
 * Exposes the connection endpoint and credentials secret so the ECS construct
 * can wire them into the container environment.
 */
export class DatabaseConstruct extends Construct {
  readonly instance: rds.DatabaseInstance;
  readonly credentials: secretsmanager.Secret;
  readonly endpointAddress: string;
  readonly databaseName: string;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const environment = props.environment;
    const isProd = environment === 'prod';

    this.credentials = new secretsmanager.Secret(this, 'Credentials', {
      secretName: `commercefull/${environment}/db-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'commercefull' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    const version = props.postgresVersion ?? rds.PostgresEngineVersion.VER_18;
    const instanceClass = props.instanceClass ?? ec2.InstanceClass.BURSTABLE3;
    const instanceSize = props.instanceSize ?? ec2.InstanceSize.MICRO;

    this.databaseName = props.databaseName ?? 'commercefull';

    this.instance = new rds.DatabaseInstance(this, 'Instance', {
      engine: rds.DatabaseInstanceEngine.postgres({ version }),
      instanceType: ec2.InstanceType.of(instanceClass, instanceSize),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [props.securityGroup],
      credentials: rds.Credentials.fromSecret(this.credentials),
      multiAz: props.multiAz ?? isProd,
      allocatedStorage: props.allocatedStorage ?? (isProd ? 100 : 20),
      maxAllocatedStorage: 1000,
      deletionProtection: props.deletionProtection ?? isProd,
      backupRetention: cdk.Duration.days(7),
      monitoringInterval: cdk.Duration.minutes(1),
      enablePerformanceInsights: true,
      databaseName: this.databaseName,
      publiclyAccessible: false,
    });

    this.endpointAddress = this.instance.dbInstanceEndpointAddress;
  }

  /** Grant read access to the credentials secret. */
  grantRead(grantee: iam.IGrantable): void {
    this.credentials.grantRead(grantee);
  }
}
