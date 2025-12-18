/**
 * Shipping Method Entity
 * Represents a shipping service option (e.g., Standard, Express, Overnight)
 */
import { Money } from '../valueObjects/Money';
import { Weight } from '../valueObjects/Weight';

export type DeliverySpeed = 'economy' | 'standard' | 'express' | 'overnight' | 'same_day';
export type ServiceScope = 'domestic' | 'international' | 'both';

export interface DeliveryEstimate {
  minDays: number;
  maxDays: number;
}

export interface ShippingMethodProps {
  id: string;
  carrierId?: string;
  name: string;
  code: string;
  description?: string;
  serviceCode?: string;
  deliverySpeed: DeliverySpeed;
  serviceScope: ServiceScope;
  estimatedDelivery: DeliveryEstimate;
  handlingDays: number;
  priority: number;
  isActive: boolean;
  isDefault: boolean;
  displayOnFrontend: boolean;
  allowFreeShipping: boolean;
  minWeight?: Weight;
  maxWeight?: Weight;
  minOrderValue?: Money;
  maxOrderValue?: Money;
  shippingClass?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ShippingMethod {
  private constructor(private props: ShippingMethodProps) {}

  static create(props: Omit<ShippingMethodProps, 'isActive' | 'isDefault' | 'displayOnFrontend' | 'allowFreeShipping' | 'createdAt' | 'updatedAt'> & {
    isActive?: boolean;
    isDefault?: boolean;
    displayOnFrontend?: boolean;
    allowFreeShipping?: boolean;
  }): ShippingMethod {
    const now = new Date();
    return new ShippingMethod({
      ...props,
      isActive: props.isActive ?? true,
      isDefault: props.isDefault ?? false,
      displayOnFrontend: props.displayOnFrontend ?? true,
      allowFreeShipping: props.allowFreeShipping ?? false,
      createdAt: now,
      updatedAt: now
    });
  }

  static reconstitute(props: ShippingMethodProps): ShippingMethod {
    return new ShippingMethod(props);
  }

  // Getters
  get id(): string { return this.props.id; }
  get carrierId(): string | undefined { return this.props.carrierId; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get deliverySpeed(): DeliverySpeed { return this.props.deliverySpeed; }
  get serviceScope(): ServiceScope { return this.props.serviceScope; }
  get estimatedDelivery(): DeliveryEstimate { return { ...this.props.estimatedDelivery }; }
  get handlingDays(): number { return this.props.handlingDays; }
  get priority(): number { return this.props.priority; }
  get isActive(): boolean { return this.props.isActive; }
  get isDefault(): boolean { return this.props.isDefault; }
  get displayOnFrontend(): boolean { return this.props.displayOnFrontend; }
  get allowFreeShipping(): boolean { return this.props.allowFreeShipping; }

  // Business Logic
  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isDefault = false;
    this.props.isActive = false;
    this.touch();
  }

  /**
   * Check if this method is available for a given weight
   */
  isAvailableForWeight(weight: Weight): boolean {
    if (this.props.minWeight && weight.isLessThan(this.props.minWeight)) {
      return false;
    }
    if (this.props.maxWeight && weight.isGreaterThan(this.props.maxWeight)) {
      return false;
    }
    return true;
  }

  /**
   * Check if this method is available for a given order value
   */
  isAvailableForOrderValue(orderValue: Money): boolean {
    if (this.props.minOrderValue && orderValue.isLessThan(this.props.minOrderValue)) {
      return false;
    }
    if (this.props.maxOrderValue && orderValue.isGreaterThan(this.props.maxOrderValue)) {
      return false;
    }
    return true;
  }

  /**
   * Check if this method supports domestic shipping
   */
  supportsDomestic(): boolean {
    return this.props.serviceScope === 'domestic' || this.props.serviceScope === 'both';
  }

  /**
   * Check if this method supports international shipping
   */
  supportsInternational(): boolean {
    return this.props.serviceScope === 'international' || this.props.serviceScope === 'both';
  }

  /**
   * Get estimated delivery date range from ship date
   */
  getEstimatedDeliveryRange(shipDate: Date): { earliest: Date; latest: Date } {
    const earliest = new Date(shipDate);
    earliest.setDate(earliest.getDate() + this.props.estimatedDelivery.minDays);
    
    const latest = new Date(shipDate);
    latest.setDate(latest.getDate() + this.props.estimatedDelivery.maxDays);
    
    return { earliest, latest };
  }

  /**
   * Get total handling + delivery days
   */
  getTotalDeliveryDays(): { min: number; max: number } {
    return {
      min: this.props.handlingDays + this.props.estimatedDelivery.minDays,
      max: this.props.handlingDays + this.props.estimatedDelivery.maxDays
    };
  }

  /**
   * Check if this is a faster option than another method
   */
  isFasterThan(other: ShippingMethod): boolean {
    return this.props.estimatedDelivery.maxDays < other.props.estimatedDelivery.maxDays;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      ...this.props,
      minWeight: this.props.minWeight?.toJSON(),
      maxWeight: this.props.maxWeight?.toJSON(),
      minOrderValue: this.props.minOrderValue?.toJSON(),
      maxOrderValue: this.props.maxOrderValue?.toJSON()
    };
  }
}
