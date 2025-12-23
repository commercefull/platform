/**
 * Address Value Object
 * Immutable representation of a postal address
 */

export interface AddressProps {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export class Address {
  private readonly props: AddressProps;

  private constructor(props: AddressProps) {
    this.props = { ...props };
  }

  static create(props: AddressProps): Address {
    if (!props.firstName || !props.lastName) {
      throw new Error('First name and last name are required');
    }
    if (!props.addressLine1) {
      throw new Error('Address line 1 is required');
    }
    if (!props.city) {
      throw new Error('City is required');
    }
    if (!props.postalCode) {
      throw new Error('Postal code is required');
    }
    if (!props.country) {
      throw new Error('Country is required');
    }

    return new Address(props);
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get company(): string | undefined {
    return this.props.company;
  }

  get addressLine1(): string {
    return this.props.addressLine1;
  }

  get addressLine2(): string | undefined {
    return this.props.addressLine2;
  }

  get city(): string {
    return this.props.city;
  }

  get region(): string | undefined {
    return this.props.region;
  }

  get postalCode(): string {
    return this.props.postalCode;
  }

  get country(): string {
    return this.props.country;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  equals(other: Address): boolean {
    return (
      this.props.firstName === other.props.firstName &&
      this.props.lastName === other.props.lastName &&
      this.props.addressLine1 === other.props.addressLine1 &&
      this.props.addressLine2 === other.props.addressLine2 &&
      this.props.city === other.props.city &&
      this.props.region === other.props.region &&
      this.props.postalCode === other.props.postalCode &&
      this.props.country === other.props.country
    );
  }

  toJSON(): AddressProps {
    return { ...this.props };
  }

  toString(): string {
    const parts = [
      this.fullName,
      this.props.company,
      this.props.addressLine1,
      this.props.addressLine2,
      `${this.props.city}, ${this.props.region || ''} ${this.props.postalCode}`,
      this.props.country,
    ].filter(Boolean);
    return parts.join('\n');
  }
}
