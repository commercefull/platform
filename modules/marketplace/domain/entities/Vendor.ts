import { randomUUID } from 'crypto';
import { VendorStatusError, MarketplaceValidationError } from '../errors/MarketplaceErrors';

export type VendorStatus = 'pending' | 'approved' | 'suspended' | 'terminated';
export type VendorTier = 'standard' | 'premium' | 'enterprise';

export interface VendorAddress {
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface VendorBankInfo {
  bankName?: string;
  accountLast4?: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  payoutMethod: 'bank_transfer' | 'paypal' | 'stripe';
}

export interface VendorStats {
  totalOrders: number;
  totalRevenue: number;
  totalPayouts: number;
  outstandingBalance: number;
  averageRating: number;
  productCount: number;
}

export interface VendorProps {
  vendorId: string;
  organizationId: string;
  name: string;
  legalName?: string;
  taxId?: string;
  email: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  status: VendorStatus;
  tier: VendorTier;
  commissionRate: number;
  address?: VendorAddress;
  bankInfo?: VendorBankInfo;
  stats: VendorStats;
  approvedAt?: Date;
  suspendedAt?: Date;
  terminatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Vendor {
  private readonly _vendorId: string;
  private _organizationId: string;
  private _name: string;
  private _legalName?: string;
  private _taxId?: string;
  private _email: string;
  private _phone?: string;
  private _website?: string;
  private _logoUrl?: string;
  private _description?: string;
  private _status: VendorStatus;
  private _tier: VendorTier;
  private _commissionRate: number;
  private _address?: VendorAddress;
  private _bankInfo?: VendorBankInfo;
  private _stats: VendorStats;
  private _approvedAt?: Date;
  private _suspendedAt?: Date;
  private _terminatedAt?: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: VendorProps) {
    this._vendorId = props.vendorId;
    this._organizationId = props.organizationId;
    this._name = props.name;
    this._legalName = props.legalName;
    this._taxId = props.taxId;
    this._email = props.email;
    this._phone = props.phone;
    this._website = props.website;
    this._logoUrl = props.logoUrl;
    this._description = props.description;
    this._status = props.status;
    this._tier = props.tier;
    this._commissionRate = props.commissionRate;
    this._address = props.address;
    this._bankInfo = props.bankInfo;
    this._stats = props.stats;
    this._approvedAt = props.approvedAt;
    this._suspendedAt = props.suspendedAt;
    this._terminatedAt = props.terminatedAt;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(input: {
    organizationId: string;
    name: string;
    email: string;
    legalName?: string;
    taxId?: string;
    phone?: string;
    website?: string;
    logoUrl?: string;
    description?: string;
    commissionRate?: number;
    tier?: VendorTier;
    address?: VendorAddress;
    bankInfo?: VendorBankInfo;
  }): Vendor {
    const now = new Date();
    return new Vendor({
      vendorId: randomUUID(),
      organizationId: input.organizationId,
      name: input.name,
      legalName: input.legalName,
      taxId: input.taxId,
      email: input.email,
      phone: input.phone,
      website: input.website,
      logoUrl: input.logoUrl,
      description: input.description,
      status: 'pending',
      tier: input.tier ?? 'standard',
      commissionRate: input.commissionRate ?? 10,
      address: input.address,
      bankInfo: input.bankInfo,
      stats: {
        totalOrders: 0,
        totalRevenue: 0,
        totalPayouts: 0,
        outstandingBalance: 0,
        averageRating: 0,
        productCount: 0,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: VendorProps): Vendor {
    return new Vendor(props);
  }

  get vendorId(): string { return this._vendorId; }
  get organizationId(): string { return this._organizationId; }
  get name(): string { return this._name; }
  get legalName(): string | undefined { return this._legalName; }
  get taxId(): string | undefined { return this._taxId; }
  get email(): string { return this._email; }
  get phone(): string | undefined { return this._phone; }
  get website(): string | undefined { return this._website; }
  get logoUrl(): string | undefined { return this._logoUrl; }
  get description(): string | undefined { return this._description; }
  get status(): VendorStatus { return this._status; }
  get tier(): VendorTier { return this._tier; }
  get commissionRate(): number { return this._commissionRate; }
  get address(): VendorAddress | undefined { return this._address; }
  get bankInfo(): VendorBankInfo | undefined { return this._bankInfo; }
  get stats(): VendorStats { return this._stats; }
  get approvedAt(): Date | undefined { return this._approvedAt; }
  get suspendedAt(): Date | undefined { return this._suspendedAt; }
  get terminatedAt(): Date | undefined { return this._terminatedAt; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  get isApproved(): boolean { return this._status === 'approved'; }
  get isPending(): boolean { return this._status === 'pending'; }
  get canSell(): boolean { return this._status === 'approved'; }

  approve(): void {
    if (this._status !== 'pending' && this._status !== 'suspended') {
      throw new VendorStatusError(this._vendorId, 'approve', this._status);
    }
    this._status = 'approved';
    this._approvedAt = new Date();
    this._suspendedAt = undefined;
    this._updatedAt = new Date();
  }

  suspend(): void {
    if (this._status === 'terminated') {
      throw new VendorStatusError(this._vendorId, 'suspend', this._status);
    }
    this._status = 'suspended';
    this._suspendedAt = new Date();
    this._updatedAt = new Date();
  }

  terminate(): void {
    if (this._status === 'terminated') {
      throw new MarketplaceValidationError('Vendor is already terminated');
    }
    this._status = 'terminated';
    this._terminatedAt = new Date();
    this._updatedAt = new Date();
  }

  setTier(tier: VendorTier): void {
    this._tier = tier;
    this._updatedAt = new Date();
  }

  setCommissionRate(rate: number): void {
    if (rate < 0 || rate > 100) {
      throw new MarketplaceValidationError('Commission rate must be between 0 and 100');
    }
    this._commissionRate = rate;
    this._updatedAt = new Date();
  }

  updateProfile(updates: {
    name?: string;
    legalName?: string;
    taxId?: string;
    email?: string;
    phone?: string;
    website?: string;
    logoUrl?: string;
    description?: string;
  }): void {
    if (updates.name !== undefined) this._name = updates.name;
    if (updates.legalName !== undefined) this._legalName = updates.legalName;
    if (updates.taxId !== undefined) this._taxId = updates.taxId;
    if (updates.email !== undefined) this._email = updates.email;
    if (updates.phone !== undefined) this._phone = updates.phone;
    if (updates.website !== undefined) this._website = updates.website;
    if (updates.logoUrl !== undefined) this._logoUrl = updates.logoUrl;
    if (updates.description !== undefined) this._description = updates.description;
    this._updatedAt = new Date();
  }

  setAddress(address: VendorAddress): void {
    this._address = address;
    this._updatedAt = new Date();
  }

  setBankInfo(bankInfo: VendorBankInfo): void {
    this._bankInfo = bankInfo;
    this._updatedAt = new Date();
  }

  recordOrder(revenue: number): void {
    this._stats.totalOrders += 1;
    this._stats.totalRevenue += revenue;
    this._stats.outstandingBalance += revenue;
    this._updatedAt = new Date();
  }

  recordPayout(amount: number): void {
    this._stats.totalPayouts += amount;
    this._stats.outstandingBalance = Math.max(0, this._stats.outstandingBalance - amount);
    this._updatedAt = new Date();
  }

  updateRating(rating: number): void {
    if (rating < 0 || rating > 5) {
      throw new MarketplaceValidationError('Rating must be between 0 and 5');
    }
    this._stats.averageRating = rating;
    this._updatedAt = new Date();
  }

  setProductCount(count: number): void {
    this._stats.productCount = count;
    this._updatedAt = new Date();
  }

  calculateCommission(amount: number): number {
    return (amount * this._commissionRate) / 100;
  }

  get netEarnings(): number {
    return this._stats.totalRevenue - this._stats.totalPayouts;
  }

  toJSON(): VendorProps {
    return {
      vendorId: this._vendorId,
      organizationId: this._organizationId,
      name: this._name,
      legalName: this._legalName,
      taxId: this._taxId,
      email: this._email,
      phone: this._phone,
      website: this._website,
      logoUrl: this._logoUrl,
      description: this._description,
      status: this._status,
      tier: this._tier,
      commissionRate: this._commissionRate,
      address: this._address,
      bankInfo: this._bankInfo,
      stats: this._stats,
      approvedAt: this._approvedAt,
      suspendedAt: this._suspendedAt,
      terminatedAt: this._terminatedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
