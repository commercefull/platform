/**
 * Warehouse Entity
 * Supports both marketplace (merchant-owned) and multi-store (business-owned) scenarios
 */

export type WarehouseType = 'warehouse' | 'store' | 'fulfillment_center' | 'distribution_center';

export interface WarehouseProps {
  warehouseId: string;
  name: string;
  code: string;
  type: WarehouseType;
  organizationId?: string;
  storeId?: string; // For store-attached warehouses
  address: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  phone?: string;
  email?: string;
  managerId?: string;
  isActive: boolean;
  isDefault: boolean;
  priority: number;
  coordinates?: { latitude: number; longitude: number };
  operatingHours?: Record<string, { open: string; close: string }>;
  capacity?: number;
  currentUtilization?: number;
  supportedShippingMethods?: string[];
  autoFulfillment: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class Warehouse {
  private props: WarehouseProps;

  private constructor(props: WarehouseProps) {
    this.props = props;
  }

  static create(props: Omit<WarehouseProps, 'isActive' | 'autoFulfillment' | 'createdAt' | 'updatedAt'>): Warehouse {
    const now = new Date();

    // Validate ownership - must have an organizationId
    if (!props.organizationId) {
      throw new Error('Warehouse must be owned by an organization');
    }

    return new Warehouse({
      ...props,
      isActive: true,
      autoFulfillment: props.type === 'fulfillment_center',
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: WarehouseProps): Warehouse {
    return new Warehouse(props);
  }

  get warehouseId(): string {
    return this.props.warehouseId;
  }
  get name(): string {
    return this.props.name;
  }
  get code(): string {
    return this.props.code;
  }
  get type(): WarehouseType {
    return this.props.type;
  }
  get organizationId(): string | undefined {
    return this.props.organizationId;
  }
  get storeId(): string | undefined {
    return this.props.storeId;
  }
  get ownerId(): string {
    return this.props.organizationId!;
  }
  get isOrganizationOwned(): boolean {
    return !!this.props.organizationId;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get isDefault(): boolean {
    return this.props.isDefault;
  }
  get autoFulfillment(): boolean {
    return this.props.autoFulfillment;
  }

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  setAsDefault(): void {
    this.props.isDefault = true;
    this.touch();
  }

  updateOwnership(ownership: { organizationId?: string; storeId?: string }): void {
    if (ownership.organizationId) this.props.organizationId = ownership.organizationId;
    if (ownership.storeId) this.props.storeId = ownership.storeId;

    // Validate that we still have valid ownership
    if (!this.props.organizationId) {
      throw new Error('Warehouse must have an organization owner');
    }

    this.touch();
  }

  updateConfiguration(config: {
    supportedShippingMethods?: string[];
    autoFulfillment?: boolean;
    capacity?: number;
    priority?: number;
  }): void {
    if (config.supportedShippingMethods !== undefined) this.props.supportedShippingMethods = config.supportedShippingMethods;
    if (config.autoFulfillment !== undefined) this.props.autoFulfillment = config.autoFulfillment;
    if (config.capacity !== undefined) this.props.capacity = config.capacity;
    if (config.priority !== undefined) this.props.priority = config.priority;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      ...this.props,
      ownerId: this.ownerId,
      isOrganizationOwned: this.isOrganizationOwned,
    };
  }
}
