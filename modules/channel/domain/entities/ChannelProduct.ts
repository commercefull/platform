/**
 * ChannelProduct Entity
 *
 * Represents the association between a product and a channel,
 * including channel-specific settings for that product.
 */

export interface ChannelProductProps {
  channelProductId: string;
  channelId: string;
  productId: string;

  // Visibility
  isVisible: boolean;
  isFeatured: boolean;

  // Channel-specific pricing override
  priceOverride?: number;
  salePriceOverride?: number;

  // Channel-specific inventory
  inventoryOverride?: number;

  // Position/sorting
  sortOrder: number;

  // Dates
  publishedAt?: Date;
  unpublishedAt?: Date;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export class ChannelProduct {
  private props: ChannelProductProps;

  private constructor(props: ChannelProductProps) {
    this.props = props;
  }

  // Getters
  get channelProductId(): string {
    return this.props.channelProductId;
  }
  get channelId(): string {
    return this.props.channelId;
  }
  get productId(): string {
    return this.props.productId;
  }
  get isVisible(): boolean {
    return this.props.isVisible;
  }
  get isFeatured(): boolean {
    return this.props.isFeatured;
  }
  get priceOverride(): number | undefined {
    return this.props.priceOverride;
  }
  get salePriceOverride(): number | undefined {
    return this.props.salePriceOverride;
  }
  get inventoryOverride(): number | undefined {
    return this.props.inventoryOverride;
  }
  get sortOrder(): number {
    return this.props.sortOrder;
  }
  get publishedAt(): Date | undefined {
    return this.props.publishedAt;
  }
  get unpublishedAt(): Date | undefined {
    return this.props.unpublishedAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Create a new ChannelProduct association
   */
  static create(props: Omit<ChannelProductProps, 'channelProductId' | 'createdAt' | 'updatedAt'>): ChannelProduct {
    const now = new Date();
    return new ChannelProduct({
      ...props,
      channelProductId: generateChannelProductId(),
      isVisible: props.isVisible ?? true,
      isFeatured: props.isFeatured ?? false,
      sortOrder: props.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(props: ChannelProductProps): ChannelProduct {
    return new ChannelProduct(props);
  }

  /**
   * Publish product on channel
   */
  publish(): void {
    this.props.isVisible = true;
    this.props.publishedAt = new Date();
    this.props.unpublishedAt = undefined;
    this.props.updatedAt = new Date();
  }

  /**
   * Unpublish product from channel
   */
  unpublish(): void {
    this.props.isVisible = false;
    this.props.unpublishedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Set as featured
   */
  setFeatured(featured: boolean): void {
    this.props.isFeatured = featured;
    this.props.updatedAt = new Date();
  }

  /**
   * Set price override
   */
  setPriceOverride(price: number | undefined, salePrice?: number): void {
    this.props.priceOverride = price;
    this.props.salePriceOverride = salePrice;
    this.props.updatedAt = new Date();
  }

  /**
   * Set sort order
   */
  setSortOrder(order: number): void {
    this.props.sortOrder = order;
    this.props.updatedAt = new Date();
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): ChannelProductProps {
    return { ...this.props };
  }
}

function generateChannelProductId(): string {
  return `chp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}
