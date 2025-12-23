/**
 * Fulfillment Entity
 *
 * Represents the fulfillment of an order, including picking, packing,
 * shipping, and delivery tracking.
 */

export type FulfillmentStatus =
  | 'pending'
  | 'assigned'
  | 'picking'
  | 'picked'
  | 'packing'
  | 'packed'
  | 'ready_to_ship'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'cancelled'
  | 'returned';

export type SourceType = 'warehouse' | 'merchant' | 'supplier' | 'dropship' | 'store';

export interface Address {
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  countryCode: string;
  phone?: string;
  email?: string;
}

export interface FulfillmentProps {
  fulfillmentId: string;
  orderId: string;
  orderNumber?: string;

  // Source context - WHO is fulfilling
  sourceType: SourceType;
  sourceId: string;

  // For marketplace - which merchant
  merchantId?: string;

  // For B2B - which supplier
  supplierId?: string;

  // For multi-store - which store
  storeId?: string;

  // Channel context
  channelId?: string;

  // Fulfillment details
  status: FulfillmentStatus;

  // Shipping
  carrierId?: string;
  carrierName?: string;
  shippingMethodId?: string;
  shippingMethodName?: string;
  trackingNumber?: string;
  trackingUrl?: string;

  // Addresses
  shipFromAddress: Address;
  shipToAddress: Address;

  // Partner (3PL)
  fulfillmentPartnerId?: string;

  // Weight/dimensions
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;

  // Costs
  shippingCost?: number;
  insuranceCost?: number;

  // Notes
  notes?: string;
  internalNotes?: string;

  // Workflow tracking
  assignedAt?: Date;
  pickingStartedAt?: Date;
  pickedAt?: Date;
  packingStartedAt?: Date;
  packedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  failedAt?: Date;
  failureReason?: string;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export class Fulfillment {
  private props: FulfillmentProps;

  private constructor(props: FulfillmentProps) {
    this.props = props;
  }

  // Getters
  get fulfillmentId(): string {
    return this.props.fulfillmentId;
  }
  get orderId(): string {
    return this.props.orderId;
  }
  get orderNumber(): string | undefined {
    return this.props.orderNumber;
  }
  get sourceType(): SourceType {
    return this.props.sourceType;
  }
  get sourceId(): string {
    return this.props.sourceId;
  }
  get merchantId(): string | undefined {
    return this.props.merchantId;
  }
  get supplierId(): string | undefined {
    return this.props.supplierId;
  }
  get storeId(): string | undefined {
    return this.props.storeId;
  }
  get channelId(): string | undefined {
    return this.props.channelId;
  }
  get status(): FulfillmentStatus {
    return this.props.status;
  }
  get carrierId(): string | undefined {
    return this.props.carrierId;
  }
  get carrierName(): string | undefined {
    return this.props.carrierName;
  }
  get shippingMethodId(): string | undefined {
    return this.props.shippingMethodId;
  }
  get shippingMethodName(): string | undefined {
    return this.props.shippingMethodName;
  }
  get trackingNumber(): string | undefined {
    return this.props.trackingNumber;
  }
  get trackingUrl(): string | undefined {
    return this.props.trackingUrl;
  }
  get shipFromAddress(): Address {
    return this.props.shipFromAddress;
  }
  get shipToAddress(): Address {
    return this.props.shipToAddress;
  }
  get fulfillmentPartnerId(): string | undefined {
    return this.props.fulfillmentPartnerId;
  }
  get weightGrams(): number | undefined {
    return this.props.weightGrams;
  }
  get shippingCost(): number | undefined {
    return this.props.shippingCost;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
  get assignedAt(): Date | undefined {
    return this.props.assignedAt;
  }
  get pickedAt(): Date | undefined {
    return this.props.pickedAt;
  }
  get packedAt(): Date | undefined {
    return this.props.packedAt;
  }
  get shippedAt(): Date | undefined {
    return this.props.shippedAt;
  }
  get deliveredAt(): Date | undefined {
    return this.props.deliveredAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Create a new Fulfillment
   */
  static create(props: Omit<FulfillmentProps, 'fulfillmentId' | 'createdAt' | 'updatedAt' | 'status'>): Fulfillment {
    const now = new Date();
    return new Fulfillment({
      ...props,
      fulfillmentId: generateFulfillmentId(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(props: FulfillmentProps): Fulfillment {
    return new Fulfillment(props);
  }

  /**
   * Assign to source (warehouse, merchant, etc.)
   */
  assign(sourceType: SourceType, sourceId: string): void {
    this.props.sourceType = sourceType;
    this.props.sourceId = sourceId;
    this.props.status = 'assigned';
    this.props.assignedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Start picking process
   */
  startPicking(): void {
    this.validateTransition('picking');
    this.props.status = 'picking';
    this.props.pickingStartedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Complete picking
   */
  completePicking(): void {
    this.validateTransition('picked');
    this.props.status = 'picked';
    this.props.pickedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Start packing process
   */
  startPacking(): void {
    this.validateTransition('packing');
    this.props.status = 'packing';
    this.props.packingStartedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Complete packing
   */
  completePacking(weight?: number, dimensions?: { length: number; width: number; height: number }): void {
    this.validateTransition('packed');
    this.props.status = 'packed';
    this.props.packedAt = new Date();
    if (weight) this.props.weightGrams = weight;
    if (dimensions) {
      this.props.lengthCm = dimensions.length;
      this.props.widthCm = dimensions.width;
      this.props.heightCm = dimensions.height;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as ready to ship
   */
  markReadyToShip(): void {
    this.validateTransition('ready_to_ship');
    this.props.status = 'ready_to_ship';
    this.props.updatedAt = new Date();
  }

  /**
   * Ship the fulfillment
   */
  ship(trackingInfo: { trackingNumber: string; trackingUrl?: string; carrierId?: string; carrierName?: string }): void {
    this.validateTransition('shipped');
    this.props.status = 'shipped';
    this.props.trackingNumber = trackingInfo.trackingNumber;
    this.props.trackingUrl = trackingInfo.trackingUrl;
    this.props.carrierId = trackingInfo.carrierId;
    this.props.carrierName = trackingInfo.carrierName;
    this.props.shippedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Update tracking info
   */
  updateTracking(trackingNumber: string, trackingUrl?: string): void {
    this.props.trackingNumber = trackingNumber;
    this.props.trackingUrl = trackingUrl;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as in transit
   */
  markInTransit(): void {
    this.validateTransition('in_transit');
    this.props.status = 'in_transit';
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as out for delivery
   */
  markOutForDelivery(): void {
    this.validateTransition('out_for_delivery');
    this.props.status = 'out_for_delivery';
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as delivered
   */
  markDelivered(): void {
    this.validateTransition('delivered');
    this.props.status = 'delivered';
    this.props.deliveredAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as failed
   */
  markFailed(reason: string): void {
    this.props.status = 'failed';
    this.props.failedAt = new Date();
    this.props.failureReason = reason;
    this.props.updatedAt = new Date();
  }

  /**
   * Cancel fulfillment
   */
  cancel(): void {
    if (this.props.status === 'delivered') {
      throw new Error('Cannot cancel a delivered fulfillment');
    }
    this.props.status = 'cancelled';
    this.props.cancelledAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Validate status transition
   */
  private validateTransition(newStatus: FulfillmentStatus): void {
    const validTransitions: Record<FulfillmentStatus, FulfillmentStatus[]> = {
      pending: ['assigned', 'cancelled'],
      assigned: ['picking', 'cancelled'],
      picking: ['picked', 'failed', 'cancelled'],
      picked: ['packing', 'failed', 'cancelled'],
      packing: ['packed', 'failed', 'cancelled'],
      packed: ['ready_to_ship', 'failed', 'cancelled'],
      ready_to_ship: ['shipped', 'failed', 'cancelled'],
      shipped: ['in_transit', 'delivered', 'failed'],
      in_transit: ['out_for_delivery', 'delivered', 'failed'],
      out_for_delivery: ['delivered', 'failed'],
      delivered: ['returned'],
      failed: [],
      cancelled: [],
      returned: [],
    };

    const allowed = validTransitions[this.props.status];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid status transition from '${this.props.status}' to '${newStatus}'`);
    }
  }

  /**
   * Check if fulfillment can be cancelled
   */
  canCancel(): boolean {
    return !['delivered', 'cancelled', 'returned'].includes(this.props.status);
  }

  /**
   * Check if fulfillment is complete
   */
  isComplete(): boolean {
    return ['delivered', 'cancelled', 'returned'].includes(this.props.status);
  }

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): FulfillmentProps {
    return { ...this.props };
  }
}

function generateFulfillmentId(): string {
  return `ful_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}
