/**
 * Organization Entity
 */

export type OrganizationStatus = 'pending' | 'active' | 'suspended' | 'inactive';

export interface OrganizationProps {
  organizationId: string;
  name: string;
  code: string;
  email: string;
  phone?: string;
  website?: string;
  status: OrganizationStatus;
  businessType?: string;
  taxId?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    routingNumber?: string;
  };
  logoUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class Organization {
  private props: OrganizationProps;

  private constructor(props: OrganizationProps) {
    this.props = props;
  }

  static create(props: Omit<OrganizationProps, 'status' | 'createdAt' | 'updatedAt'>): Organization {
    const now = new Date();
    return new Organization({
      ...props,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: OrganizationProps): Organization {
    return new Organization(props);
  }

  get organizationId(): string {
    return this.props.organizationId;
  }
  get name(): string {
    return this.props.name;
  }
  get code(): string {
    return this.props.code;
  }
  get email(): string {
    return this.props.email;
  }
  get status(): OrganizationStatus {
    return this.props.status;
  }
  get isActive(): boolean {
    return this.props.status === 'active';
  }

  activate(): void {
    this.props.status = 'active';
    this.touch();
  }

  suspend(): void {
    this.props.status = 'suspended';
    this.touch();
  }

  deactivate(): void {
    this.props.status = 'inactive';
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return { ...this.props };
  }
}
