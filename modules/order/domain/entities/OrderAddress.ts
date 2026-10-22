/**
 * Order Address Entity
 * Represents shipping or billing address for an order
 */

export type AddressType = 'shipping' | 'billing';

export interface OrderAddressProps {
  orderAddressId: string;
  orderId: string;
  addressType: AddressType;
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  /** Canonical multi-line street (country-neutral superset of address1/2). */
  addressLines?: string[];
  city: string;
  /** Locality below city level (e.g. Brazilian bairro, JP district). */
  dependentLocality?: string;
  state?: string;
  postalCode?: string;
  /** Postal sorting code used by some postal systems (e.g. FR cedex). */
  sortingCode?: string;
  country: string;
  countryCode: string;
  phone?: string;
  email?: string;
  isDefault: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class OrderAddress {
  private props: OrderAddressProps;

  private constructor(props: OrderAddressProps) {
    this.props = props;
  }

  static create(props: {
    orderAddressId: string;
    orderId: string;
    addressType: AddressType;
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    addressLines?: string[];
    city: string;
    dependentLocality?: string;
    state?: string;
    postalCode?: string;
    sortingCode?: string;
    country: string;
    countryCode: string;
    phone?: string;
    email?: string;
    isDefault?: boolean;
    metadata?: Record<string, unknown>;
  }): OrderAddress {
    const now = new Date();
    return new OrderAddress({
      orderAddressId: props.orderAddressId,
      orderId: props.orderId,
      addressType: props.addressType,
      firstName: props.firstName,
      lastName: props.lastName,
      company: props.company,
      address1: props.address1,
      address2: props.address2,
      addressLines: props.addressLines,
      city: props.city,
      dependentLocality: props.dependentLocality,
      state: props.state,
      postalCode: props.postalCode,
      sortingCode: props.sortingCode,
      country: props.country,
      countryCode: props.countryCode,
      phone: props.phone,
      email: props.email,
      isDefault: props.isDefault || false,
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: OrderAddressProps): OrderAddress {
    return new OrderAddress(props);
  }

  // Getters
  get orderAddressId(): string {
    return this.props.orderAddressId;
  }
  get orderId(): string {
    return this.props.orderId;
  }
  get addressType(): AddressType {
    return this.props.addressType;
  }
  get firstName(): string {
    return this.props.firstName;
  }
  get lastName(): string {
    return this.props.lastName;
  }
  get company(): string | undefined {
    return this.props.company;
  }
  get address1(): string {
    return this.props.address1;
  }
  get address2(): string | undefined {
    return this.props.address2;
  }
  get addressLines(): string[] | undefined {
    return this.props.addressLines ? [...this.props.addressLines] : undefined;
  }
  get city(): string {
    return this.props.city;
  }
  get dependentLocality(): string | undefined {
    return this.props.dependentLocality;
  }
  get state(): string | undefined {
    return this.props.state;
  }
  get postalCode(): string | undefined {
    return this.props.postalCode;
  }
  get sortingCode(): string | undefined {
    return this.props.sortingCode;
  }
  get country(): string {
    return this.props.country;
  }
  get countryCode(): string {
    return this.props.countryCode;
  }
  get phone(): string | undefined {
    return this.props.phone;
  }
  get email(): string | undefined {
    return this.props.email;
  }
  get isDefault(): boolean {
    return this.props.isDefault;
  }
  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Calculated properties
  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`.trim();
  }

  get fullAddress(): string {
    const parts = [
      this.props.address1,
      this.props.address2,
      this.props.dependentLocality,
      this.props.city,
      this.props.state,
      this.props.postalCode,
      this.props.country,
    ].filter(Boolean);
    return parts.join(', ');
  }

  get isShipping(): boolean {
    return this.props.addressType === 'shipping';
  }

  get isBilling(): boolean {
    return this.props.addressType === 'billing';
  }

  // Domain methods
  update(updates: Partial<Omit<OrderAddressProps, 'orderAddressId' | 'orderId' | 'createdAt' | 'updatedAt'>>): void {
    Object.assign(this.props, updates);
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      orderAddressId: this.props.orderAddressId,
      orderId: this.props.orderId,
      addressType: this.props.addressType,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      company: this.props.company,
      address1: this.props.address1,
      address2: this.props.address2,
      addressLines: this.props.addressLines,
      city: this.props.city,
      dependentLocality: this.props.dependentLocality,
      state: this.props.state,
      postalCode: this.props.postalCode,
      sortingCode: this.props.sortingCode,
      country: this.props.country,
      countryCode: this.props.countryCode,
      phone: this.props.phone,
      email: this.props.email,
      isDefault: this.props.isDefault,
      fullName: this.fullName,
      fullAddress: this.fullAddress,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
