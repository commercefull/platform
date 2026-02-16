/**
 * Organization Aggregate Root
 *
 * Represents a business organization in the hierarchy.
 * Organizations can own stores, have merchants, and manage teams.
 */

export type OrganizationStatus = 'active' | 'inactive' | 'suspended';

export interface OrganizationProps {
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  status: OrganizationStatus;
  parentOrganizationId?: string;
  logoUrl?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export class Organization {
  private props: OrganizationProps;

  constructor(props: OrganizationProps) {
    this.props = props;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get status(): OrganizationStatus {
    return this.props.status;
  }

  get parentOrganizationId(): string | undefined {
    return this.props.parentOrganizationId;
  }

  get isActive(): boolean {
    return this.props.status === 'active';
  }

  activate(): void {
    this.props.status = 'active';
  }

  suspend(): void {
    this.props.status = 'suspended';
  }

  deactivate(): void {
    this.props.status = 'inactive';
  }

  toJSON(): OrganizationProps {
    return { ...this.props };
  }
}
