/**
 * ShippingZone Entity
 *
 * Represents a geographic zone for shipping rate calculation.
 */

export interface ZoneLocation {
  countryCode: string;
  stateCode?: string;
  postalCodePattern?: string; // e.g., "90*" for all 90xxx zip codes
}

export interface ShippingZoneProps {
  shippingZoneId: string;
  name: string;
  description?: string;
  locations: ZoneLocation[];
  isDefault: boolean;
  isActive: boolean;

  // Multi-tenant
  storeId?: string;
  merchantId?: string;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export class ShippingZone {
  private props: ShippingZoneProps;

  private constructor(props: ShippingZoneProps) {
    this.props = props;
  }

  get shippingZoneId(): string {
    return this.props.shippingZoneId;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get locations(): ZoneLocation[] {
    return [...this.props.locations];
  }
  get isDefault(): boolean {
    return this.props.isDefault;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get storeId(): string | undefined {
    return this.props.storeId;
  }
  get merchantId(): string | undefined {
    return this.props.merchantId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static create(props: Omit<ShippingZoneProps, 'shippingZoneId' | 'createdAt' | 'updatedAt'>): ShippingZone {
    const now = new Date();
    return new ShippingZone({
      ...props,
      shippingZoneId: generateShippingZoneId(),
      locations: props.locations || [],
      isActive: props.isActive ?? true,
      isDefault: props.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ShippingZoneProps): ShippingZone {
    return new ShippingZone(props);
  }

  update(updates: Partial<Omit<ShippingZoneProps, 'shippingZoneId' | 'createdAt'>>): void {
    Object.assign(this.props, updates, { updatedAt: new Date() });
  }

  addLocation(location: ZoneLocation): void {
    this.props.locations.push(location);
    this.props.updatedAt = new Date();
  }

  removeLocation(countryCode: string, stateCode?: string): void {
    this.props.locations = this.props.locations.filter(loc => !(loc.countryCode === countryCode && loc.stateCode === stateCode));
    this.props.updatedAt = new Date();
  }

  matchesAddress(countryCode: string, stateCode?: string, postalCode?: string): boolean {
    return this.props.locations.some(loc => {
      if (loc.countryCode !== countryCode) return false;
      if (loc.stateCode && loc.stateCode !== stateCode) return false;
      if (loc.postalCodePattern && postalCode) {
        const pattern = new RegExp('^' + loc.postalCodePattern.replace(/\*/g, '.*') + '$');
        if (!pattern.test(postalCode)) return false;
      }
      return true;
    });
  }

  toPersistence(): ShippingZoneProps {
    return { ...this.props };
  }
}

function generateShippingZoneId(): string {
  return `shz_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}
