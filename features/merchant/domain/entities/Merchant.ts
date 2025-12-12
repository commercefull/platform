/**
 * Merchant Entity
 */

export type MerchantStatus = 'pending' | 'approved' | 'active' | 'suspended' | 'inactive';

export interface MerchantProps {
  merchantId: string;
  name: string;
  code: string;
  email: string;
  phone?: string;
  website?: string;
  status: MerchantStatus;
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
  commissionRate?: number;
  paymentTerms?: string;
  logoUrl?: string;
  rating?: number;
  verifiedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Merchant {
  private props: MerchantProps;

  private constructor(props: MerchantProps) {
    this.props = props;
  }

  static create(props: Omit<MerchantProps, 'status' | 'createdAt' | 'updatedAt'>): Merchant {
    const now = new Date();
    return new Merchant({
      ...props,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    });
  }

  static reconstitute(props: MerchantProps): Merchant {
    return new Merchant(props);
  }

  get merchantId(): string { return this.props.merchantId; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get email(): string { return this.props.email; }
  get status(): MerchantStatus { return this.props.status; }
  get isActive(): boolean { return this.props.status === 'active'; }
  get commissionRate(): number | undefined { return this.props.commissionRate; }

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

  verify(): void {
    this.props.verifiedAt = new Date();
    this.touch();
  }

  setCommissionRate(rate: number): void {
    if (rate < 0 || rate > 100) throw new Error('Invalid commission rate');
    this.props.commissionRate = rate;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
