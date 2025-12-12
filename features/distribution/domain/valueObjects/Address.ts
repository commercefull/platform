/**
 * Address Value Object
 * Immutable representation of a physical address
 */
export interface AddressProps {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export class Address {
  private constructor(private readonly props: AddressProps) {
    Object.freeze(this.props);
  }

  static create(props: AddressProps): Address {
    if (!props.line1 || !props.city || !props.postalCode || !props.country) {
      throw new Error('Address requires line1, city, postalCode, and country');
    }
    return new Address(props);
  }

  get line1(): string { return this.props.line1; }
  get line2(): string | undefined { return this.props.line2; }
  get city(): string { return this.props.city; }
  get state(): string | undefined { return this.props.state; }
  get postalCode(): string { return this.props.postalCode; }
  get country(): string { return this.props.country; }
  get latitude(): number | undefined { return this.props.latitude; }
  get longitude(): number | undefined { return this.props.longitude; }

  get fullAddress(): string {
    const parts = [this.line1];
    if (this.line2) parts.push(this.line2);
    parts.push(this.city);
    if (this.state) parts.push(this.state);
    parts.push(this.postalCode);
    parts.push(this.country);
    return parts.join(', ');
  }

  hasCoordinates(): boolean {
    return this.latitude !== undefined && this.longitude !== undefined;
  }

  /**
   * Calculate distance to another address using Haversine formula
   */
  distanceTo(other: Address): number | null {
    if (!this.hasCoordinates() || !other.hasCoordinates()) return null;

    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(other.latitude! - this.latitude!);
    const dLon = this.toRad(other.longitude! - this.longitude!);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(this.latitude!)) * Math.cos(this.toRad(other.latitude!)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  equals(other: Address): boolean {
    return (
      this.line1 === other.line1 &&
      this.line2 === other.line2 &&
      this.city === other.city &&
      this.state === other.state &&
      this.postalCode === other.postalCode &&
      this.country === other.country
    );
  }

  toJSON(): AddressProps {
    return { ...this.props };
  }
}
