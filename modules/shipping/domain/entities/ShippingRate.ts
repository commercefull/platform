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
  baseRateCents: number;
  perUnitRate?: number;
  minWeight?: number;
  maxWeight?: number;
  minPriceCents?: number;
  maxPriceCents?: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  zones?: string[];
  countries?: string[];
  isActive: boolean;
  freeShippingThresholdCents?: number;
  dimensionalFactor?: number;
  metadata?: Record<string, unknown>;
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
      updatedAt: now,
    });
  }

  static reconstitute(props: ShippingRateProps): ShippingRate {
    return new ShippingRate(props);
  }

  get rateId(): string {
    return this.props.rateId;
  }
  get name(): string {
    return this.props.name;
  }
  get baseRateCents(): number {
    return this.props.baseRateCents;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }

  get dimensionalFactor(): number | undefined {
    return this.props.dimensionalFactor;
  }

  /**
   * Calculate the shipping rate for the given weight, subtotal, and quantity.
   *
   * @param weight   Actual weight of the shipment.
   * @param subtotal Order subtotal (for price-based and free-shipping-threshold checks).
   * @param quantity Number of items (for quantity-based rates).
   * @param volume   Optional shipment volume (L×W×H in cubic units). When provided
   *                 along with `dimensionalFactor`, billable weight is
   *                 `max(actualWeight, volume / dimensionalFactor)`.
   */
  calculateRate(weight: number, subtotalCents: number, quantity: number, volume?: number): number {
    if (this.props.freeShippingThresholdCents && subtotalCents >= this.props.freeShippingThresholdCents) {
      return 0;
    }

    // Dimensional weight: billableWeight = max(actualWeight, volume / dimFactor)
    let billableWeight = weight;
    if (volume !== undefined && this.props.dimensionalFactor && this.props.dimensionalFactor > 0) {
      const dimWeight = volume / this.props.dimensionalFactor;
      billableWeight = Math.max(weight, dimWeight);
    }

    let rateCents = this.props.baseRateCents;

    switch (this.props.calculationType) {
      case 'weight':
        rateCents += Math.round((this.props.perUnitRate || 0) * 100) * billableWeight;
        break;
      case 'price':
        rateCents += (this.props.perUnitRate || 0) * (subtotalCents / 100);
        break;
      case 'quantity':
        rateCents += Math.round((this.props.perUnitRate || 0) * 100) * quantity;
        break;
    }

    return Math.max(0, Math.round(rateCents));
  }

  isApplicable(weight: number, subtotalCents: number, countryCode?: string): boolean {
    if (!this.props.isActive) return false;
    if (this.props.minWeight && weight < this.props.minWeight) return false;
    if (this.props.maxWeight && weight > this.props.maxWeight) return false;
    if (this.props.minPriceCents && subtotalCents < this.props.minPriceCents) return false;
    if (this.props.maxPriceCents && subtotalCents > this.props.maxPriceCents) return false;
    if (countryCode && this.props.countries?.length && !this.props.countries.includes(countryCode)) return false;
    return true;
  }

  toJSON(): Record<string, unknown> {
    return { ...this.props };
  }
}
