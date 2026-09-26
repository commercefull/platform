import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface VpcConstructProps {
  readonly environment: string;
  /** Whether to create a new VPC. When false, existingVpcId must be provided. */
  readonly createVpc: boolean;
  /** ID of an existing VPC to import when createVpc is false. */
  readonly existingVpcId?: string;
  /** Maximum availability zones for a new VPC. */
  readonly maxAzs?: number;
  /**
   * Number of NAT Gateways to provision.
   * Set to 0 for the cost-optimized mode (no NAT, uses VPC endpoints instead).
   * Defaults to 1 (single NAT for cost efficiency).
   */
  readonly natGateways?: number;
}

/**
 * Encapsulates VPC creation or import so the rest of the stack can depend on
 * a single `IVpc` regardless of whether it was created or imported.
 *
 * In cost-optimized mode (natGateways=0) the VPC uses PRIVATE_ISOLATED subnets
 * with no public subnets — VPC endpoints replace NAT for outbound connectivity.
 */
export class VpcConstruct extends Construct {
  readonly vpc: ec2.IVpc;
  readonly albSecurityGroup: ec2.SecurityGroup;
  readonly ecsSecurityGroup: ec2.SecurityGroup;
  readonly dbSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    const maxAzs = props.maxAzs ?? 3;
    const natGateways = props.natGateways ?? 1;

    if (props.createVpc) {
      const subnetConfiguration: ec2.SubnetConfiguration[] = [
        { name: 'Public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        { name: 'Private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
        { name: 'Database', subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ];

      this.vpc = new ec2.Vpc(this, 'VPC', {
        maxAzs,
        natGateways,
        subnetConfiguration,
        // SECURITY: network forensics / anomaly detection
        flowLogs: {
          RejectedTraffic: {
            destination: ec2.FlowLogDestination.toCloudWatchLogs(),
            trafficType: ec2.FlowLogTrafficType.REJECT,
          },
        },
      });
    } else if (props.existingVpcId) {
      this.vpc = ec2.Vpc.fromVpcAttributes(this, 'ImportedVPC', {
        vpcId: props.existingVpcId,
        availabilityZones: cdk.Fn.split(',', cdk.Fn.getAtt(props.existingVpcId, 'AvailabilityZones').toString()),
      });
    } else {
      throw new Error('When createVpc is false, existingVpcId must be provided');
    }

    // Security groups
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSG', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });
    this.albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');
    this.albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS');

    this.ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSG', {
      vpc: this.vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });

    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSG', {
      vpc: this.vpc,
      description: 'Security group for RDS database',
      // The database never initiates outbound connections
      allowAllOutbound: false,
    });
    this.dbSecurityGroup.addIngressRule(this.ecsSecurityGroup, ec2.Port.tcp(5432), 'Allow PostgreSQL from ECS');
  }
}
