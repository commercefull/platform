/**
 * Warehouse Entity
 */

export type WarehouseType = 'warehouse' | 'store' | 'fulfillment_center' | 'distribution_center';

export interface WarehouseProps {
  warehouseId: string;
  name: string;
  code: string;
  type: WarehouseType;
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
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Warehouse {
  private props: WarehouseProps;

  private constructor(props: WarehouseProps) {
    this.props = props;
  }

  static create(props: Omit<WarehouseProps, 'isActive' | 'createdAt' | 'updatedAt'>): Warehouse {
    const now = new Date();
    return new Warehouse({
      ...props,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
  }

  static reconstitute(props: WarehouseProps): Warehouse {
    return new Warehouse(props);
  }

  get warehouseId(): string { return this.props.warehouseId; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get type(): WarehouseType { return this.props.type; }
  get isActive(): boolean { return this.props.isActive; }
  get isDefault(): boolean { return this.props.isDefault; }

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

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
