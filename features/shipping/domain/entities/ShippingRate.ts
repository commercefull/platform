/**
 * Shipping Rate Entity
 */

export type ShippingCalculationType = 'flat' | 'weight' | 'price' | 'quantity' | 'distance';

export interface ShippingRateProps {
  rateId: string;
  carrierId: string;
  methodId: string;
  name: string;
  description?: string;
  calculationType: ShippingCalculationType;
  baseRate: number;
  perUnitRate?: number;
  minWeight?: number;
  maxWeight?: number;
  minPrice?: number;
  maxPrice?: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  zones?: string[];
  countries?: string[];
  isActive: boolean;
  freeShippingThreshold?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class ShippingRate {
  private props: ShippingRateProps;

  private constructor(props: ShippingRateProps) {
    this.props = props;
  }

  static create(props: Omit<ShippingRateProps, 'isActive' | 'createdAt' | 'updatedAt'>): ShippingRate {
    const now = new Date();
    return new ShippingRate({
      ...props,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
  }

  static reconstitute(props: ShippingRateProps): ShippingRate {
    return new ShippingRate(props);
  }

  get rateId(): string { return this.props.rateId; }
  get name(): string { return this.props.name; }
  get baseRate(): number { return this.props.baseRate; }
  get isActive(): boolean { return this.props.isActive; }

  calculateRate(weight: number, subtotal: number, quantity: number): number {
    if (this.props.freeShippingThreshold && subtotal >= this.props.freeShippingThreshold) {
      return 0;
    }

    let rate = this.props.baseRate;

    switch (this.props.calculationType) {
      case 'weight':
        rate += (this.props.perUnitRate || 0) * weight;
        break;
      case 'price':
        rate += (this.props.perUnitRate || 0) * (subtotal / 100);
        break;
      case 'quantity':
        rate += (this.props.perUnitRate || 0) * quantity;
        break;
    }

    return Math.max(0, rate);
  }

  isApplicable(weight: number, subtotal: number, countryCode?: string): boolean {
    if (!this.props.isActive) return false;
    if (this.props.minWeight && weight < this.props.minWeight) return false;
    if (this.props.maxWeight && weight > this.props.maxWeight) return false;
    if (this.props.minPrice && subtotal < this.props.minPrice) return false;
    if (this.props.maxPrice && subtotal > this.props.maxPrice) return false;
    if (countryCode && this.props.countries?.length && !this.props.countries.includes(countryCode)) return false;
    return true;
  }

  toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
