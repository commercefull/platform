/**
 * Supplier Entity
 */

export type SupplierStatus = 'pending' | 'approved' | 'active' | 'suspended' | 'inactive';

export interface SupplierProps {
  supplierId: string;
  name: string;
  code: string;
  email: string;
  phone?: string;
  website?: string;
  status: SupplierStatus;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  contactPerson?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
  minOrderAmount?: number;
  rating?: number;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Supplier {
  private props: SupplierProps;

  private constructor(props: SupplierProps) {
    this.props = props;
  }

  static create(props: Omit<SupplierProps, 'status' | 'createdAt' | 'updatedAt'>): Supplier {
    const now = new Date();
    return new Supplier({
      ...props,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: SupplierProps): Supplier {
    return new Supplier(props);
  }

  get supplierId(): string {
    return this.props.supplierId;
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
  get status(): SupplierStatus {
    return this.props.status;
  }
  get isActive(): boolean {
    return this.props.status === 'active';
  }

  approve(): void {
    this.props.status = 'approved';
    this.touch();
  }

  activate(): void {
    this.props.status = 'active';
    this.touch();
  }

  suspend(): void {
    this.props.status = 'suspended';
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
