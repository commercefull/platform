/**
 * Channel Entity
 *
 * Represents a distribution channel through which products are sold.
 * Channels can be web, mobile app, marketplace, POS, B2B portal, etc.
 */

export type ChannelType = 'web' | 'mobile_app' | 'marketplace' | 'social' | 'pos' | 'wholesale' | 'api' | 'b2b_portal';
export type OwnerType = 'platform' | 'merchant' | 'business';
export type FulfillmentStrategy = 'nearest' | 'priority' | 'round_robin' | 'merchant_assigned';

export interface ChannelProps {
  channelId: string;
  name: string;
  code: string;
  type: ChannelType;

  // Ownership context
  ownerType: OwnerType;
  ownerId?: string; // merchantId or businessId

  // Multi-store support
  storeIds: string[];
  defaultStoreId?: string;

  // Catalog & Pricing
  catalogId?: string;
  priceListId?: string;
  currencyCode: string;
  localeCode: string;

  // Fulfillment
  warehouseIds: string[];
  fulfillmentStrategy: FulfillmentStrategy;

  // B2B specific
  requiresApproval?: boolean;
  allowCreditPayment?: boolean;
  b2bPricingEnabled?: boolean;

  // Marketplace specific
  commissionRate?: number;
  merchantVisible?: boolean;

  isActive: boolean;
  isDefault: boolean;
  settings?: Record<string, unknown>;

  // Audit fields
  createdAt: Date;
  updatedAt: Date;
}

export class Channel {
  private props: ChannelProps;

  private constructor(props: ChannelProps) {
    this.props = props;
  }

  // Getters
  get channelId(): string {
    return this.props.channelId;
  }
  get name(): string {
    return this.props.name;
  }
  get code(): string {
    return this.props.code;
  }
  get type(): ChannelType {
    return this.props.type;
  }
  get ownerType(): OwnerType {
    return this.props.ownerType;
  }
  get ownerId(): string | undefined {
    return this.props.ownerId;
  }
  get storeIds(): string[] {
    return [...this.props.storeIds];
  }
  get defaultStoreId(): string | undefined {
    return this.props.defaultStoreId;
  }
  get catalogId(): string | undefined {
    return this.props.catalogId;
  }
  get priceListId(): string | undefined {
    return this.props.priceListId;
  }
  get currencyCode(): string {
    return this.props.currencyCode;
  }
  get localeCode(): string {
    return this.props.localeCode;
  }
  get warehouseIds(): string[] {
    return [...this.props.warehouseIds];
  }
  get fulfillmentStrategy(): FulfillmentStrategy {
    return this.props.fulfillmentStrategy;
  }
  get requiresApproval(): boolean {
    return this.props.requiresApproval ?? false;
  }
  get allowCreditPayment(): boolean {
    return this.props.allowCreditPayment ?? false;
  }
  get b2bPricingEnabled(): boolean {
    return this.props.b2bPricingEnabled ?? false;
  }
  get commissionRate(): number | undefined {
    return this.props.commissionRate;
  }
  get merchantVisible(): boolean {
    return this.props.merchantVisible ?? true;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get isDefault(): boolean {
    return this.props.isDefault;
  }
  get settings(): Record<string, unknown> | undefined {
    return this.props.settings;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Create a new Channel
   */
  static create(props: Omit<ChannelProps, 'channelId' | 'createdAt' | 'updatedAt'> & { channelId?: string }): Channel {
    const now = new Date();
    return new Channel({
      ...props,
      channelId: props.channelId || generateChannelId(),
      storeIds: props.storeIds || [],
      warehouseIds: props.warehouseIds || [],
      isActive: props.isActive ?? true,
      isDefault: props.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(props: ChannelProps): Channel {
    return new Channel(props);
  }

  /**
   * Update channel details
   */
  update(updates: Partial<Omit<ChannelProps, 'channelId' | 'createdAt'>>): void {
    Object.assign(this.props, updates, { updatedAt: new Date() });
  }

  /**
   * Activate the channel
   */
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Deactivate the channel
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Set as default channel
   */
  setAsDefault(): void {
    this.props.isDefault = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Remove default status
   */
  removeDefault(): void {
    this.props.isDefault = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Assign stores to channel
   */
  assignStores(storeIds: string[]): void {
    this.props.storeIds = [...new Set([...this.props.storeIds, ...storeIds])];
    this.props.updatedAt = new Date();
  }

  /**
   * Remove stores from channel
   */
  removeStores(storeIds: string[]): void {
    this.props.storeIds = this.props.storeIds.filter(id => !storeIds.includes(id));
    this.props.updatedAt = new Date();
  }

  /**
   * Assign warehouses to channel
   */
  assignWarehouses(warehouseIds: string[]): void {
    this.props.warehouseIds = [...new Set([...this.props.warehouseIds, ...warehouseIds])];
    this.props.updatedAt = new Date();
  }

  /**
   * Remove warehouses from channel
   */
  removeWarehouses(warehouseIds: string[]): void {
    this.props.warehouseIds = this.props.warehouseIds.filter(id => !warehouseIds.includes(id));
    this.props.updatedAt = new Date();
  }

  /**
   * Set fulfillment strategy
   */
  setFulfillmentStrategy(strategy: FulfillmentStrategy): void {
    this.props.fulfillmentStrategy = strategy;
    this.props.updatedAt = new Date();
  }

  /**
   * Update settings
   */
  updateSettings(settings: Record<string, unknown>): void {
    this.props.settings = { ...this.props.settings, ...settings };
    this.props.updatedAt = new Date();
  }

  /**
   * Check if channel is B2B enabled
   */
  isB2BChannel(): boolean {
    return this.props.type === 'b2b_portal' || this.props.b2bPricingEnabled === true;
  }

  /**
   * Check if channel is marketplace
   */
  isMarketplaceChannel(): boolean {
    return this.props.type === 'marketplace';
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): ChannelProps {
    return { ...this.props };
  }
}

// Simple ID generator - in production, use UUID v7 or similar
function generateChannelId(): string {
  return `chn_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}
