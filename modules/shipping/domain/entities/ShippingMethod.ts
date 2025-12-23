/**
 * ShippingMethod Entity
 * 
 * Represents a shipping method available for orders.
 */

export type ShippingMethodType = 'flat_rate' | 'weight_based' | 'price_based' | 'carrier_calculated' | 'free' | 'pickup';
export type CarrierType = 'usps' | 'ups' | 'fedex' | 'dhl' | 'custom';

export interface ShippingMethodProps {
  shippingMethodId: string;
  name: string;
  code: string;
  description?: string;
  type: ShippingMethodType;
  
  // Carrier info
  carrierId?: string;
  carrierType?: CarrierType;
  carrierServiceCode?: string;
  
  // Pricing
  basePrice: number;
  pricePerKg?: number;
  pricePerItem?: number;
  minPrice?: number;
  maxPrice?: number;
  
  // Conditions
  minOrderValue?: number;
  maxOrderValue?: number;
  minWeight?: number;
  maxWeight?: number;
  
  // Delivery
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  
  // Availability
  zoneIds: string[];
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  
  // Multi-tenant
  storeId?: string;
  merchantId?: string;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export class ShippingMethod {
  private props: ShippingMethodProps;

  private constructor(props: ShippingMethodProps) {
    this.props = props;
  }

  // Getters
  get shippingMethodId(): string { return this.props.shippingMethodId; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get description(): string | undefined { return this.props.description; }
  get type(): ShippingMethodType { return this.props.type; }
  get carrierId(): string | undefined { return this.props.carrierId; }
  get carrierType(): CarrierType | undefined { return this.props.carrierType; }
  get basePrice(): number { return this.props.basePrice; }
  get estimatedDaysMin(): number | undefined { return this.props.estimatedDaysMin; }
  get estimatedDaysMax(): number | undefined { return this.props.estimatedDaysMax; }
  get zoneIds(): string[] { return [...this.props.zoneIds]; }
  get isActive(): boolean { return this.props.isActive; }
  get isDefault(): boolean { return this.props.isDefault; }
  get sortOrder(): number { return this.props.sortOrder; }
  get storeId(): string | undefined { return this.props.storeId; }
  get merchantId(): string | undefined { return this.props.merchantId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  static create(props: Omit<ShippingMethodProps, 'shippingMethodId' | 'createdAt' | 'updatedAt'>): ShippingMethod {
    const now = new Date();
    return new ShippingMethod({
      ...props,
      shippingMethodId: generateShippingMethodId(),
      zoneIds: props.zoneIds || [],
      isActive: props.isActive ?? true,
      isDefault: props.isDefault ?? false,
      sortOrder: props.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ShippingMethodProps): ShippingMethod {
    return new ShippingMethod(props);
  }

  update(updates: Partial<Omit<ShippingMethodProps, 'shippingMethodId' | 'createdAt'>>): void {
    Object.assign(this.props, updates, { updatedAt: new Date() });
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  assignToZones(zoneIds: string[]): void {
    this.props.zoneIds = [...new Set([...this.props.zoneIds, ...zoneIds])];
    this.props.updatedAt = new Date();
  }

  removeFromZones(zoneIds: string[]): void {
    this.props.zoneIds = this.props.zoneIds.filter(id => !zoneIds.includes(id));
    this.props.updatedAt = new Date();
  }

  calculateRate(weight: number, orderValue: number): number {
    if (this.props.type === 'free') return 0;
    if (this.props.type === 'flat_rate') return this.props.basePrice;
    
    let rate = this.props.basePrice;
    
    if (this.props.type === 'weight_based' && this.props.pricePerKg) {
      rate += weight * this.props.pricePerKg;
    }
    
    if (this.props.minPrice && rate < this.props.minPrice) {
      rate = this.props.minPrice;
    }
    if (this.props.maxPrice && rate > this.props.maxPrice) {
      rate = this.props.maxPrice;
    }
    
    return rate;
  }

  isAvailableFor(weight: number, orderValue: number): boolean {
    if (!this.props.isActive) return false;
    
    if (this.props.minOrderValue && orderValue < this.props.minOrderValue) return false;
    if (this.props.maxOrderValue && orderValue > this.props.maxOrderValue) return false;
    if (this.props.minWeight && weight < this.props.minWeight) return false;
    if (this.props.maxWeight && weight > this.props.maxWeight) return false;
    
    return true;
  }

  toPersistence(): ShippingMethodProps {
    return { ...this.props };
  }
}

function generateShippingMethodId(): string {
  return `shm_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}
