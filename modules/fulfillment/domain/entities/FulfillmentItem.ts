/**
 * FulfillmentItem Entity
 *
 * Represents an item within a fulfillment.
 */

export interface FulfillmentItemProps {
  fulfillmentItemId: string;
  fulfillmentId: string;
  orderItemId: string;
  productId: string;
  variantId?: string;
  sku: string;
  name: string;

  // Quantities
  quantityOrdered: number;
  quantityFulfilled: number;
  quantityPicked?: number;
  quantityPacked?: number;

  // Location info
  warehouseLocation?: string;
  binLocation?: string;

  // Serialization
  serialNumbers?: string[];
  lotNumbers?: string[];

  // Status
  isPicked: boolean;
  isPacked: boolean;

  // Audit
  pickedAt?: Date;
  packedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class FulfillmentItem {
  private props: FulfillmentItemProps;

  private constructor(props: FulfillmentItemProps) {
    this.props = props;
  }

  // Getters
  get fulfillmentItemId(): string {
    return this.props.fulfillmentItemId;
  }
  get fulfillmentId(): string {
    return this.props.fulfillmentId;
  }
  get orderItemId(): string {
    return this.props.orderItemId;
  }
  get productId(): string {
    return this.props.productId;
  }
  get variantId(): string | undefined {
    return this.props.variantId;
  }
  get sku(): string {
    return this.props.sku;
  }
  get name(): string {
    return this.props.name;
  }
  get quantityOrdered(): number {
    return this.props.quantityOrdered;
  }
  get quantityFulfilled(): number {
    return this.props.quantityFulfilled;
  }
  get quantityPicked(): number {
    return this.props.quantityPicked ?? 0;
  }
  get quantityPacked(): number {
    return this.props.quantityPacked ?? 0;
  }
  get warehouseLocation(): string | undefined {
    return this.props.warehouseLocation;
  }
  get binLocation(): string | undefined {
    return this.props.binLocation;
  }
  get isPicked(): boolean {
    return this.props.isPicked;
  }
  get isPacked(): boolean {
    return this.props.isPacked;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Create a new FulfillmentItem
   */
  static create(
    props: Omit<FulfillmentItemProps, 'fulfillmentItemId' | 'createdAt' | 'updatedAt' | 'isPicked' | 'isPacked'>,
  ): FulfillmentItem {
    const now = new Date();
    return new FulfillmentItem({
      ...props,
      fulfillmentItemId: generateFulfillmentItemId(),
      isPicked: false,
      isPacked: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(props: FulfillmentItemProps): FulfillmentItem {
    return new FulfillmentItem(props);
  }

  /**
   * Mark item as picked
   */
  pick(quantity: number, serialNumbers?: string[], lotNumbers?: string[]): void {
    if (quantity > this.props.quantityOrdered) {
      throw new Error('Cannot pick more than ordered quantity');
    }
    this.props.quantityPicked = quantity;
    this.props.isPicked = true;
    this.props.pickedAt = new Date();
    if (serialNumbers) this.props.serialNumbers = serialNumbers;
    if (lotNumbers) this.props.lotNumbers = lotNumbers;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark item as packed
   */
  pack(quantity: number): void {
    if (quantity > (this.props.quantityPicked ?? this.props.quantityOrdered)) {
      throw new Error('Cannot pack more than picked quantity');
    }
    this.props.quantityPacked = quantity;
    this.props.isPacked = true;
    this.props.packedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Update fulfilled quantity
   */
  updateFulfilledQuantity(quantity: number): void {
    this.props.quantityFulfilled = quantity;
    this.props.updatedAt = new Date();
  }

  /**
   * Set location info
   */
  setLocation(warehouseLocation: string, binLocation?: string): void {
    this.props.warehouseLocation = warehouseLocation;
    this.props.binLocation = binLocation;
    this.props.updatedAt = new Date();
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): FulfillmentItemProps {
    return { ...this.props };
  }
}

function generateFulfillmentItemId(): string {
  return `fli_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}
