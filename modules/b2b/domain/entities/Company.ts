export type CompanyStatus = 'pending' | 'approved' | 'suspended' | 'terminated';

import { CompanyStatusError, B2BValidationError } from '../errors/B2BErrors';

export type PaymentTerms = 'net15' | 'net30' | 'net60' | 'immediate' | 'prepaid';

export interface CompanyProps {
  companyId: string;
  organizationId: string;
  name: string;
  legalName?: string;
  taxId?: string;
  status: CompanyStatus;
  paymentTerms: PaymentTerms;
  creditLimit?: number;
  outstandingBalance: number;
  billingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  shippingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Company {
  private props: CompanyProps;

  private constructor(props: CompanyProps) {
    this.props = { ...props };
  }

  static create(input: {
    organizationId: string;
    name: string;
    legalName?: string;
    taxId?: string;
    paymentTerms?: PaymentTerms;
    creditLimit?: number;
    billingAddress?: CompanyProps['billingAddress'];
    shippingAddress?: CompanyProps['shippingAddress'];
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    parentId?: string;
  }): Company {
    const now = new Date();
    return new Company({
      companyId: crypto.randomUUID(),
      organizationId: input.organizationId,
      name: input.name,
      legalName: input.legalName,
      taxId: input.taxId,
      status: 'pending',
      paymentTerms: input.paymentTerms ?? 'net30',
      creditLimit: input.creditLimit,
      outstandingBalance: 0,
      billingAddress: input.billingAddress,
      shippingAddress: input.shippingAddress,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      website: input.website,
      parentId: input.parentId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CompanyProps): Company {
    return new Company(props);
  }

  get companyId(): string { return this.props.companyId; }
  get organizationId(): string { return this.props.organizationId; }
  get name(): string { return this.props.name; }
  get legalName(): string | undefined { return this.props.legalName; }
  get taxId(): string | undefined { return this.props.taxId; }
  get status(): CompanyStatus { return this.props.status; }
  get paymentTerms(): PaymentTerms { return this.props.paymentTerms; }
  get creditLimit(): number | undefined { return this.props.creditLimit; }
  get outstandingBalance(): number { return this.props.outstandingBalance; }
  get billingAddress(): CompanyProps['billingAddress'] { return this.props.billingAddress; }
  get shippingAddress(): CompanyProps['shippingAddress'] { return this.props.shippingAddress; }
  get contactEmail(): string | undefined { return this.props.contactEmail; }
  get contactPhone(): string | undefined { return this.props.contactPhone; }
  get website(): string | undefined { return this.props.website; }
  get parentId(): string | undefined { return this.props.parentId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  approve(): void {
    if (this.props.status !== 'pending') {
      throw new CompanyStatusError(this.props.companyId, 'approve', this.props.status);
    }
    this.props.status = 'approved';
    this.props.updatedAt = new Date();
  }

  suspend(): void {
    if (this.props.status === 'terminated') {
      throw new CompanyStatusError(this.props.companyId, 'suspend', this.props.status);
    }
    this.props.status = 'suspended';
    this.props.updatedAt = new Date();
  }

  reactivate(): void {
    if (this.props.status !== 'suspended') {
      throw new CompanyStatusError(this.props.companyId, 'reactivate', this.props.status);
    }
    this.props.status = 'approved';
    this.props.updatedAt = new Date();
  }

  terminate(): void {
    this.props.status = 'terminated';
    this.props.updatedAt = new Date();
  }

  updateProfile(input: {
    name?: string;
    legalName?: string;
    taxId?: string;
    billingAddress?: CompanyProps['billingAddress'];
    shippingAddress?: CompanyProps['shippingAddress'];
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
  }): void {
    if (input.name !== undefined) this.props.name = input.name;
    if (input.legalName !== undefined) this.props.legalName = input.legalName;
    if (input.taxId !== undefined) this.props.taxId = input.taxId;
    if (input.billingAddress !== undefined) this.props.billingAddress = input.billingAddress;
    if (input.shippingAddress !== undefined) this.props.shippingAddress = input.shippingAddress;
    if (input.contactEmail !== undefined) this.props.contactEmail = input.contactEmail;
    if (input.contactPhone !== undefined) this.props.contactPhone = input.contactPhone;
    if (input.website !== undefined) this.props.website = input.website;
    this.props.updatedAt = new Date();
  }

  setPaymentTerms(terms: PaymentTerms): void {
    this.props.paymentTerms = terms;
    this.props.updatedAt = new Date();
  }

  setCreditLimit(limit: number): void {
    if (limit < 0) throw new B2BValidationError('Credit limit cannot be negative');
    this.props.creditLimit = limit;
    this.props.updatedAt = new Date();
  }

  increaseBalance(amount: number): void {
    if (amount <= 0) throw new B2BValidationError('Amount must be positive');
    this.props.outstandingBalance += amount;
    this.props.updatedAt = new Date();
  }

  decreaseBalance(amount: number): void {
    if (amount <= 0) throw new B2BValidationError('Amount must be positive');
    this.props.outstandingBalance = Math.max(0, this.props.outstandingBalance - amount);
    this.props.updatedAt = new Date();
  }

  hasAvailableCredit(amount: number): boolean {
    if (this.props.creditLimit === undefined) return true;
    return this.props.outstandingBalance + amount <= this.props.creditLimit;
  }

  get isSubsidiary(): boolean {
    return this.props.parentId !== undefined;
  }

  toJSON(): Record<string, unknown> {
    return { ...this.props };
  }
}
