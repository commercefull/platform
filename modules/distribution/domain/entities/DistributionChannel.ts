/**
 * Distribution Channel Entity
 */

export type ChannelType = 'web' | 'mobile_app' | 'marketplace' | 'social' | 'pos' | 'wholesale' | 'api';

export interface DistributionChannelProps {
  distributionChannelId: string;
  name: string;
  code: string;
  type: ChannelType;
  description?: string;
  currencyCode: string;
  localeCode: string;
  timezone: string;
  priceListId?: string;
  catalogId?: string;
  warehouseIds: string[];
  paymentMethodIds: string[];
  shippingMethodIds: string[];
  isActive: boolean;
  isDefault: boolean;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class DistributionChannel {
  private props: DistributionChannelProps;

  private constructor(props: DistributionChannelProps) {
    this.props = props;
  }

  static create(props: Omit<DistributionChannelProps, 'isActive' | 'isDefault' | 'createdAt' | 'updatedAt'>): DistributionChannel {
    const now = new Date();
    return new DistributionChannel({
      ...props,
      isActive: true,
      isDefault: false,
      createdAt: now,
      updatedAt: now
    });
  }

  static reconstitute(props: DistributionChannelProps): DistributionChannel {
    return new DistributionChannel(props);
  }

  get distributionChannelId(): string { return this.props.distributionChannelId; }
  get name(): string { return this.props.name; }
  get code(): string { return this.props.code; }
  get type(): ChannelType { return this.props.type; }
  get currencyCode(): string { return this.props.currencyCode; }
  get localeCode(): string { return this.props.localeCode; }
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

  addWarehouse(warehouseId: string): void {
    if (!this.props.warehouseIds.includes(warehouseId)) {
      this.props.warehouseIds.push(warehouseId);
      this.touch();
    }
  }

  removeWarehouse(warehouseId: string): void {
    this.props.warehouseIds = this.props.warehouseIds.filter(id => id !== warehouseId);
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
