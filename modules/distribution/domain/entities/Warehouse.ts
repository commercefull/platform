/**
 * Warehouse Entity (Aggregate Root)
 * Represents a distribution center/warehouse for inventory storage and order fulfillment
 */
import { Address } from '../valueObjects/Address';

export interface WarehouseProps {
  id: string;
  name: string;
  code: string;
  description?: string;
  address: Address;
  email?: string;
  phone?: string;
  contactName?: string;
  timezone: string;
  cutoffTime: string; // HH:MM format
  processingTime: number; // hours
  isActive: boolean;
  isDefault: boolean;
  isFulfillmentCenter: boolean;
  isReturnCenter: boolean;
  isVirtual: boolean;
  capabilities: string[];
  shippingMethods: string[];
  operatingHours?: Record<string, { open: string; close: string }>;
  merchantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Warehouse {
  private constructor(private props: WarehouseProps) {}

  static create(props: Omit<WarehouseProps, 'isActive' | 'isDefault' | 'createdAt' | 'updatedAt'> & {
    isActive?: boolean;
    isDefault?: boolean;
  }): Warehouse {
    const now = new Date();
    return new Warehouse({
      ...props,
      isActive: props.isActive ?? true,
      isDefault: props.isDefault ?? false,
      createdAt: now,
      updatedAt: now
    });
  }

  static reconstitute(props: WarehouseProps): Warehouse {
    return new Warehouse(props);
  }

  // Getters
  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get address(): Address { return this.props.address; }
  get timezone(): string { return this.props.timezone; }
  get cutoffTime(): string { return this.props.cutoffTime; }
  get processingTime(): number { return this.props.processingTime; }
  get isActive(): boolean { return this.props.isActive; }
  get isDefault(): boolean { return this.props.isDefault; }
  get isFulfillmentCenter(): boolean { return this.props.isFulfillmentCenter; }
  get isReturnCenter(): boolean { return this.props.isReturnCenter; }
  get capabilities(): string[] { return [...this.props.capabilities]; }
  get shippingMethods(): string[] { return [...this.props.shippingMethods]; }

  // Business Logic
  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isDefault = false; // Cannot be default if inactive
    this.props.isActive = false;
    this.touch();
  }

  setAsDefault(): void {
    if (!this.props.isActive) {
      throw new Error('Cannot set inactive warehouse as default');
    }
    this.props.isDefault = true;
    this.touch();
  }

  removeDefault(): void {
    this.props.isDefault = false;
    this.touch();
  }

  /**
   * Check if the warehouse can fulfill orders at the current time
   */
  canFulfillNow(): boolean {
    if (!this.props.isActive || !this.props.isFulfillmentCenter) return false;

    const now = new Date();
    const warehouseTime = new Date(now.toLocaleString('en-US', { timeZone: this.props.timezone }));
    const currentTime = `${warehouseTime.getHours().toString().padStart(2, '0')}:${warehouseTime.getMinutes().toString().padStart(2, '0')}`;
    
    // Check if before cutoff time
    return currentTime < this.props.cutoffTime;
  }

  /**
   * Check if warehouse supports a specific shipping method
   */
  supportsShippingMethod(methodId: string): boolean {
    return this.props.shippingMethods.length === 0 || this.props.shippingMethods.includes(methodId);
  }

  /**
   * Check if warehouse has a specific capability
   */
  hasCapability(capability: string): boolean {
    return this.props.capabilities.includes(capability);
  }

  /**
   * Add a shipping method to supported methods
   */
  addShippingMethod(methodId: string): void {
    if (!this.props.shippingMethods.includes(methodId)) {
      this.props.shippingMethods.push(methodId);
      this.touch();
    }
  }

  /**
   * Remove a shipping method from supported methods
   */
  removeShippingMethod(methodId: string): void {
    const index = this.props.shippingMethods.indexOf(methodId);
    if (index > -1) {
      this.props.shippingMethods.splice(index, 1);
      this.touch();
    }
  }

  /**
   * Calculate distance to a destination address
   */
  distanceTo(destination: Address): number | null {
    return this.props.address.distanceTo(destination);
  }

  /**
   * Get estimated ship date based on processing time
   */
  getEstimatedShipDate(orderDate: Date = new Date()): Date {
    const shipDate = new Date(orderDate);
    
    // If after cutoff, add a day
    if (!this.canFulfillNow()) {
      shipDate.setDate(shipDate.getDate() + 1);
    }
    
    // Add processing time
    shipDate.setHours(shipDate.getHours() + this.props.processingTime);
    
    return shipDate;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      ...this.props,
      address: this.props.address.toJSON()
    };
  }
}
