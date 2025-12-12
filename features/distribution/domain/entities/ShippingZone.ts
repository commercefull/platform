/**
 * Shipping Zone Entity
 * Represents a geographic region for shipping rate calculation
 */
export type LocationType = 'country' | 'state' | 'zipcode' | 'region' | 'continent';

export interface ShippingZoneProps {
  id: string;
  name: string;
  description?: string;
  locationType: LocationType;
  locations: string[]; // Country codes, state codes, zip patterns, etc.
  excludedLocations: string[];
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ShippingZone {
  private constructor(private props: ShippingZoneProps) {}

  static create(props: Omit<ShippingZoneProps, 'isActive' | 'createdAt' | 'updatedAt'> & {
    isActive?: boolean;
  }): ShippingZone {
    const now = new Date();
    return new ShippingZone({
      ...props,
      excludedLocations: props.excludedLocations || [],
      isActive: props.isActive ?? true,
      createdAt: now,
      updatedAt: now
    });
  }

  static reconstitute(props: ShippingZoneProps): ShippingZone {
    return new ShippingZone(props);
  }

  // Getters
  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get locationType(): LocationType { return this.props.locationType; }
  get locations(): string[] { return [...this.props.locations]; }
  get excludedLocations(): string[] { return [...this.props.excludedLocations]; }
  get priority(): number { return this.props.priority; }
  get isActive(): boolean { return this.props.isActive; }

  // Business Logic
  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  /**
   * Check if an address matches this zone
   */
  matchesAddress(country: string, state?: string, postalCode?: string): boolean {
    if (!this.props.isActive) return false;

    // Check exclusions first
    if (this.isExcluded(country, state, postalCode)) {
      return false;
    }

    // Check inclusions based on location type
    switch (this.props.locationType) {
      case 'country':
        return this.matchesCountry(country);
      case 'state':
        return this.matchesState(country, state);
      case 'zipcode':
        return this.matchesPostalCode(postalCode);
      case 'region':
        return this.matchesRegion(country);
      case 'continent':
        return this.matchesContinent(country);
      default:
        return false;
    }
  }

  private matchesCountry(country: string): boolean {
    return this.props.locations.some(loc => 
      loc.toUpperCase() === country.toUpperCase() || loc === '*'
    );
  }

  private matchesState(country: string, state?: string): boolean {
    if (!state) return false;
    return this.props.locations.some(loc => {
      // Format: "US:CA" or "US:*" or just "CA"
      if (loc.includes(':')) {
        const [locCountry, locState] = loc.split(':');
        return locCountry.toUpperCase() === country.toUpperCase() && 
               (locState === '*' || locState.toUpperCase() === state.toUpperCase());
      }
      return loc.toUpperCase() === state.toUpperCase();
    });
  }

  private matchesPostalCode(postalCode?: string): boolean {
    if (!postalCode) return false;
    return this.props.locations.some(pattern => {
      // Support wildcards: "902*" matches "90210"
      if (pattern.endsWith('*')) {
        return postalCode.startsWith(pattern.slice(0, -1));
      }
      // Support ranges: "90000-99999"
      if (pattern.includes('-')) {
        const [min, max] = pattern.split('-');
        return postalCode >= min && postalCode <= max;
      }
      return pattern === postalCode;
    });
  }

  private matchesRegion(country: string): boolean {
    // Predefined regions
    const regions: Record<string, string[]> = {
      'NORTH_AMERICA': ['US', 'CA', 'MX'],
      'EUROPE': ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'PL', 'SE', 'NO', 'DK', 'FI'],
      'ASIA_PACIFIC': ['JP', 'KR', 'CN', 'AU', 'NZ', 'SG', 'HK', 'TW'],
      'LATIN_AMERICA': ['BR', 'AR', 'CL', 'CO', 'PE', 'MX'],
      'MIDDLE_EAST': ['AE', 'SA', 'IL', 'QA', 'KW', 'BH']
    };

    return this.props.locations.some(region => {
      const countries = regions[region.toUpperCase()];
      return countries?.includes(country.toUpperCase());
    });
  }

  private matchesContinent(country: string): boolean {
    // Map countries to continents (simplified)
    const continents: Record<string, string[]> = {
      'NORTH_AMERICA': ['US', 'CA', 'MX'],
      'SOUTH_AMERICA': ['BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY'],
      'EUROPE': ['GB', 'DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'PL', 'SE', 'NO', 'DK', 'FI', 'IE', 'GR', 'CZ', 'RO', 'HU'],
      'ASIA': ['CN', 'JP', 'KR', 'IN', 'TH', 'VN', 'MY', 'SG', 'ID', 'PH', 'TW', 'HK'],
      'OCEANIA': ['AU', 'NZ', 'FJ', 'PG'],
      'AFRICA': ['ZA', 'EG', 'NG', 'KE', 'MA', 'GH', 'TZ']
    };

    return this.props.locations.some(continent => {
      const countries = continents[continent.toUpperCase()];
      return countries?.includes(country.toUpperCase());
    });
  }

  private isExcluded(country: string, state?: string, postalCode?: string): boolean {
    return this.props.excludedLocations.some(exclusion => {
      if (exclusion.includes(':')) {
        const [excCountry, excState] = exclusion.split(':');
        return excCountry.toUpperCase() === country.toUpperCase() && 
               state?.toUpperCase() === excState.toUpperCase();
      }
      return exclusion.toUpperCase() === country.toUpperCase() ||
             exclusion.toUpperCase() === state?.toUpperCase() ||
             exclusion === postalCode;
    });
  }

  /**
   * Add a location to the zone
   */
  addLocation(location: string): void {
    if (!this.props.locations.includes(location)) {
      this.props.locations.push(location);
      this.touch();
    }
  }

  /**
   * Remove a location from the zone
   */
  removeLocation(location: string): void {
    const index = this.props.locations.indexOf(location);
    if (index > -1) {
      this.props.locations.splice(index, 1);
      this.touch();
    }
  }

  /**
   * Add an exclusion
   */
  addExclusion(location: string): void {
    if (!this.props.excludedLocations.includes(location)) {
      this.props.excludedLocations.push(location);
      this.touch();
    }
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
