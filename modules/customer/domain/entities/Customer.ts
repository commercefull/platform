/**
 * Customer Aggregate Root
 * The main entity that manages customer lifecycle and business logic
 */

export type CustomerStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

export interface CustomerAddress {
  addressId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string;
  addressType: 'billing' | 'shipping';
  isDefault: boolean;
  phone?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
}

export interface CustomerProps {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  status: CustomerStatus;
  isVerified: boolean;
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  addresses: CustomerAddress[];
  defaultShippingAddressId?: string;
  defaultBillingAddressId?: string;
  groupIds: string[];
  preferredCurrency?: string;
  preferredLanguage?: string;
  taxExempt: boolean;
  taxExemptionNumber?: string;
  notes?: string;
  tags: string[];
  metadata?: Record<string, any>;
  lastLoginAt?: Date;
  loginCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Customer {
  private props: CustomerProps;

  private constructor(props: CustomerProps) {
    this.props = props;
  }

  static create(props: {
    customerId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: Date;
    preferredCurrency?: string;
    preferredLanguage?: string;
    metadata?: Record<string, any>;
  }): Customer {
    const now = new Date();
    return new Customer({
      customerId: props.customerId,
      email: props.email.toLowerCase().trim(),
      firstName: props.firstName.trim(),
      lastName: props.lastName.trim(),
      phone: props.phone?.trim(),
      dateOfBirth: props.dateOfBirth,
      status: 'active',
      isVerified: false,
      addresses: [],
      groupIds: [],
      preferredCurrency: props.preferredCurrency || 'USD',
      preferredLanguage: props.preferredLanguage || 'en',
      taxExempt: false,
      tags: [],
      metadata: props.metadata,
      loginCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CustomerProps): Customer {
    return new Customer(props);
  }

  // Getters
  get customerId(): string {
    return this.props.customerId;
  }
  get email(): string {
    return this.props.email;
  }
  get firstName(): string {
    return this.props.firstName;
  }
  get lastName(): string {
    return this.props.lastName;
  }
  get phone(): string | undefined {
    return this.props.phone;
  }
  get dateOfBirth(): Date | undefined {
    return this.props.dateOfBirth;
  }
  get status(): CustomerStatus {
    return this.props.status;
  }
  get isVerified(): boolean {
    return this.props.isVerified;
  }
  get emailVerifiedAt(): Date | undefined {
    return this.props.emailVerifiedAt;
  }
  get addresses(): CustomerAddress[] {
    return [...this.props.addresses];
  }
  get defaultShippingAddressId(): string | undefined {
    return this.props.defaultShippingAddressId;
  }
  get defaultBillingAddressId(): string | undefined {
    return this.props.defaultBillingAddressId;
  }
  get groupIds(): string[] {
    return [...this.props.groupIds];
  }
  get preferredCurrency(): string | undefined {
    return this.props.preferredCurrency;
  }
  get preferredLanguage(): string | undefined {
    return this.props.preferredLanguage;
  }
  get taxExempt(): boolean {
    return this.props.taxExempt;
  }
  get taxExemptionNumber(): string | undefined {
    return this.props.taxExemptionNumber;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
  get tags(): string[] {
    return [...this.props.tags];
  }
  get metadata(): Record<string, any> | undefined {
    return this.props.metadata;
  }
  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }
  get loginCount(): number {
    return this.props.loginCount;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed properties
  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`.trim();
  }

  get isActive(): boolean {
    return this.props.status === 'active';
  }

  get defaultShippingAddress(): CustomerAddress | undefined {
    return this.props.addresses.find(
      a => a.addressId === this.props.defaultShippingAddressId || (a.addressType === 'shipping' && a.isDefault),
    );
  }

  get defaultBillingAddress(): CustomerAddress | undefined {
    return this.props.addresses.find(
      a => a.addressId === this.props.defaultBillingAddressId || (a.addressType === 'billing' && a.isDefault),
    );
  }

  // Domain methods
  updateProfile(updates: { firstName?: string; lastName?: string; phone?: string; dateOfBirth?: Date }): void {
    if (updates.firstName) this.props.firstName = updates.firstName.trim();
    if (updates.lastName) this.props.lastName = updates.lastName.trim();
    if (updates.phone !== undefined) this.props.phone = updates.phone?.trim();
    if (updates.dateOfBirth !== undefined) this.props.dateOfBirth = updates.dateOfBirth;
    this.touch();
  }

  changeEmail(newEmail: string): void {
    this.props.email = newEmail.toLowerCase().trim();
    this.props.isVerified = false;
    this.props.emailVerifiedAt = undefined;
    this.touch();
  }

  verifyEmail(): void {
    this.props.isVerified = true;
    this.props.emailVerifiedAt = new Date();
    this.touch();
  }

  verifyPhone(): void {
    this.props.phoneVerifiedAt = new Date();
    this.touch();
  }

  activate(): void {
    this.props.status = 'active';
    this.touch();
  }

  deactivate(): void {
    this.props.status = 'inactive';
    this.touch();
  }

  suspend(): void {
    this.props.status = 'suspended';
    this.touch();
  }

  recordLogin(): void {
    this.props.lastLoginAt = new Date();
    this.props.loginCount += 1;
    this.touch();
  }

  addAddress(address: CustomerAddress): void {
    const existing = this.props.addresses.find(a => a.addressId === address.addressId);
    if (existing) {
      Object.assign(existing, address);
    } else {
      this.props.addresses.push(address);
    }

    if (address.isDefault) {
      this.setDefaultAddress(address.addressId, address.addressType);
    }

    this.touch();
  }

  removeAddress(addressId: string): void {
    const index = this.props.addresses.findIndex(a => a.addressId === addressId);
    if (index > -1) {
      const removed = this.props.addresses.splice(index, 1)[0];
      if (this.props.defaultShippingAddressId === addressId) {
        this.props.defaultShippingAddressId = undefined;
      }
      if (this.props.defaultBillingAddressId === addressId) {
        this.props.defaultBillingAddressId = undefined;
      }
    }
    this.touch();
  }

  setDefaultAddress(addressId: string, type: 'billing' | 'shipping'): void {
    const address = this.props.addresses.find(a => a.addressId === addressId);
    if (!address) {
      throw new Error('Address not found');
    }

    // Update isDefault flag on addresses
    this.props.addresses.forEach(a => {
      if (a.addressType === type) {
        a.isDefault = a.addressId === addressId;
      }
    });

    if (type === 'shipping') {
      this.props.defaultShippingAddressId = addressId;
    } else {
      this.props.defaultBillingAddressId = addressId;
    }
    this.touch();
  }

  joinGroup(groupId: string): void {
    if (!this.props.groupIds.includes(groupId)) {
      this.props.groupIds.push(groupId);
      this.touch();
    }
  }

  leaveGroup(groupId: string): void {
    const index = this.props.groupIds.indexOf(groupId);
    if (index > -1) {
      this.props.groupIds.splice(index, 1);
      this.touch();
    }
  }

  setTaxExempt(exempt: boolean, exemptionNumber?: string): void {
    this.props.taxExempt = exempt;
    this.props.taxExemptionNumber = exempt ? exemptionNumber : undefined;
    this.touch();
  }

  setPreferences(preferences: { currency?: string; language?: string }): void {
    if (preferences.currency) this.props.preferredCurrency = preferences.currency;
    if (preferences.language) this.props.preferredLanguage = preferences.language;
    this.touch();
  }

  addTag(tag: string): void {
    if (!this.props.tags.includes(tag)) {
      this.props.tags.push(tag);
      this.touch();
    }
  }

  removeTag(tag: string): void {
    const index = this.props.tags.indexOf(tag);
    if (index > -1) {
      this.props.tags.splice(index, 1);
      this.touch();
    }
  }

  updateNotes(notes: string): void {
    this.props.notes = notes;
    this.touch();
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      customerId: this.props.customerId,
      email: this.props.email,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      fullName: this.fullName,
      phone: this.props.phone,
      dateOfBirth: this.props.dateOfBirth?.toISOString(),
      status: this.props.status,
      isActive: this.isActive,
      isVerified: this.props.isVerified,
      emailVerifiedAt: this.props.emailVerifiedAt?.toISOString(),
      addresses: this.props.addresses,
      defaultShippingAddressId: this.props.defaultShippingAddressId,
      defaultBillingAddressId: this.props.defaultBillingAddressId,
      groupIds: this.props.groupIds,
      preferredCurrency: this.props.preferredCurrency,
      preferredLanguage: this.props.preferredLanguage,
      taxExempt: this.props.taxExempt,
      taxExemptionNumber: this.props.taxExemptionNumber,
      tags: this.props.tags,
      metadata: this.props.metadata,
      lastLoginAt: this.props.lastLoginAt?.toISOString(),
      loginCount: this.props.loginCount,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
