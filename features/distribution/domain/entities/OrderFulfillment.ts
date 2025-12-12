/**
 * Order Fulfillment Entity (Aggregate Root)
 * Represents the fulfillment lifecycle of an order
 */
import { Address } from '../valueObjects/Address';
import { Weight } from '../valueObjects/Weight';
import { Dimensions } from '../valueObjects/Dimensions';
import { Money } from '../valueObjects/Money';

export type FulfillmentStatus = 
  | 'pending'
  | 'processing'
  | 'picking'
  | 'packing'
  | 'ready_to_ship'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned'
  | 'cancelled';

export interface TrackingEvent {
  timestamp: Date;
  status: string;
  location?: string;
  description: string;
}

export interface FulfillmentProps {
  id: string;
  orderId: string;
  orderNumber?: string;
  status: FulfillmentStatus;
  statusReason?: string;
  warehouseId?: string;
  ruleId?: string;
  shippingMethodId?: string;
  carrierId?: string;
  fulfillmentPartnerId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrierCode?: string;
  serviceCode?: string;
  shipToAddress: Address;
  packageWeight?: Weight;
  packageDimensions?: Dimensions;
  packageCount: number;
  shippingCost?: Money;
  insuranceCost?: Money;
  handlingCost?: Money;
  pickedAt?: Date;
  packedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  estimatedDeliveryAt?: Date;
  actualDeliveryAt?: Date;
  trackingEvents: TrackingEvent[];
  internalNotes?: string;
  customerNotes?: string;
  pickedBy?: string;
  packedBy?: string;
  shippedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Status transition rules
const VALID_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['picking', 'cancelled'],
  picking: ['packing', 'processing', 'cancelled'],
  packing: ['ready_to_ship', 'picking', 'cancelled'],
  ready_to_ship: ['shipped', 'packing', 'cancelled'],
  shipped: ['in_transit', 'delivered', 'failed', 'returned'],
  in_transit: ['out_for_delivery', 'delivered', 'failed', 'returned'],
  out_for_delivery: ['delivered', 'failed', 'returned'],
  delivered: ['returned'],
  failed: ['processing', 'cancelled', 'returned'],
  returned: [],
  cancelled: []
};

export class OrderFulfillment {
  private constructor(private props: FulfillmentProps) {}

  static create(props: {
    orderId: string;
    orderNumber?: string;
    shipToAddress: Address;
    warehouseId?: string;
    shippingMethodId?: string;
    carrierId?: string;
    estimatedDeliveryAt?: Date;
  }): OrderFulfillment {
    const now = new Date();
    return new OrderFulfillment({
      id: '', // Will be set by repository
      orderId: props.orderId,
      orderNumber: props.orderNumber,
      status: 'pending',
      shipToAddress: props.shipToAddress,
      warehouseId: props.warehouseId,
      shippingMethodId: props.shippingMethodId,
      carrierId: props.carrierId,
      estimatedDeliveryAt: props.estimatedDeliveryAt,
      packageCount: 1,
      trackingEvents: [],
      createdAt: now,
      updatedAt: now
    });
  }

  static reconstitute(props: FulfillmentProps): OrderFulfillment {
    return new OrderFulfillment(props);
  }

  // Getters
  get id(): string { return this.props.id; }
  get orderId(): string { return this.props.orderId; }
  get orderNumber(): string | undefined { return this.props.orderNumber; }
  get status(): FulfillmentStatus { return this.props.status; }
  get statusReason(): string | undefined { return this.props.statusReason; }
  get warehouseId(): string | undefined { return this.props.warehouseId; }
  get shippingMethodId(): string | undefined { return this.props.shippingMethodId; }
  get trackingNumber(): string | undefined { return this.props.trackingNumber; }
  get trackingUrl(): string | undefined { return this.props.trackingUrl; }
  get shipToAddress(): Address { return this.props.shipToAddress; }
  get shippingCost(): Money | undefined { return this.props.shippingCost; }
  get estimatedDeliveryAt(): Date | undefined { return this.props.estimatedDeliveryAt; }
  get trackingEvents(): TrackingEvent[] { return [...this.props.trackingEvents]; }

  // Status checks
  isPending(): boolean { return this.props.status === 'pending'; }
  isProcessing(): boolean { return ['processing', 'picking', 'packing'].includes(this.props.status); }
  isReadyToShip(): boolean { return this.props.status === 'ready_to_ship'; }
  isShipped(): boolean { return ['shipped', 'in_transit', 'out_for_delivery'].includes(this.props.status); }
  isDelivered(): boolean { return this.props.status === 'delivered'; }
  isCancelled(): boolean { return this.props.status === 'cancelled'; }
  isFailed(): boolean { return this.props.status === 'failed'; }
  isComplete(): boolean { return ['delivered', 'returned', 'cancelled'].includes(this.props.status); }

  // Business Logic - Status Transitions
  private canTransitionTo(newStatus: FulfillmentStatus): boolean {
    return VALID_TRANSITIONS[this.props.status].includes(newStatus);
  }

  private transitionTo(newStatus: FulfillmentStatus, reason?: string): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this.props.status} to ${newStatus}`);
    }
    this.props.status = newStatus;
    this.props.statusReason = reason;
    this.addTrackingEvent(newStatus, reason || `Status changed to ${newStatus}`);
    this.touch();
  }

  startProcessing(): void {
    this.transitionTo('processing');
  }

  startPicking(pickedBy?: string): void {
    this.transitionTo('picking');
    this.props.pickedBy = pickedBy;
    this.props.pickedAt = new Date();
  }

  completePicking(): void {
    if (this.props.status !== 'picking') {
      throw new Error('Must be in picking status to complete picking');
    }
    this.transitionTo('packing');
  }

  startPacking(packedBy?: string): void {
    this.props.packedBy = packedBy;
  }

  completePacking(packageWeight?: Weight, packageDimensions?: Dimensions, packageCount?: number): void {
    if (this.props.status !== 'packing') {
      throw new Error('Must be in packing status to complete packing');
    }
    this.props.packageWeight = packageWeight;
    this.props.packageDimensions = packageDimensions;
    this.props.packageCount = packageCount || 1;
    this.props.packedAt = new Date();
    this.transitionTo('ready_to_ship');
  }

  ship(trackingNumber: string, trackingUrl?: string, shippedBy?: string): void {
    if (this.props.status !== 'ready_to_ship') {
      throw new Error('Must be ready to ship before shipping');
    }
    this.props.trackingNumber = trackingNumber;
    this.props.trackingUrl = trackingUrl;
    this.props.shippedBy = shippedBy;
    this.props.shippedAt = new Date();
    this.transitionTo('shipped');
  }

  updateInTransit(location?: string): void {
    if (this.props.status === 'shipped') {
      this.transitionTo('in_transit');
    }
    this.addTrackingEvent('in_transit', 'Package in transit', location);
  }

  outForDelivery(): void {
    this.transitionTo('out_for_delivery');
  }

  markDelivered(actualDeliveryAt?: Date): void {
    this.props.actualDeliveryAt = actualDeliveryAt || new Date();
    this.props.deliveredAt = this.props.actualDeliveryAt;
    this.transitionTo('delivered');
  }

  markFailed(reason: string): void {
    this.transitionTo('failed', reason);
  }

  markReturned(reason?: string): void {
    this.transitionTo('returned', reason);
  }

  cancel(reason?: string): void {
    this.transitionTo('cancelled', reason);
  }

  // Tracking
  addTrackingEvent(status: string, description: string, location?: string): void {
    this.props.trackingEvents.push({
      timestamp: new Date(),
      status,
      location,
      description
    });
    this.touch();
  }

  // Assignment
  assignWarehouse(warehouseId: string): void {
    if (!this.isPending()) {
      throw new Error('Can only assign warehouse to pending fulfillments');
    }
    this.props.warehouseId = warehouseId;
    this.touch();
  }

  assignShippingMethod(methodId: string, carrierId?: string): void {
    if (this.isShipped() || this.isComplete()) {
      throw new Error('Cannot change shipping method after shipping');
    }
    this.props.shippingMethodId = methodId;
    this.props.carrierId = carrierId;
    this.touch();
  }

  setShippingCost(cost: Money): void {
    this.props.shippingCost = cost;
    this.touch();
  }

  setEstimatedDelivery(date: Date): void {
    this.props.estimatedDeliveryAt = date;
    this.touch();
  }

  // Calculations
  getTotalCost(): Money {
    const currency = this.props.shippingCost?.currency || 'USD';
    let total = Money.zero(currency);
    
    if (this.props.shippingCost) total = total.add(this.props.shippingCost);
    if (this.props.insuranceCost) total = total.add(this.props.insuranceCost);
    if (this.props.handlingCost) total = total.add(this.props.handlingCost);
    
    return total;
  }

  isLate(): boolean {
    if (!this.props.estimatedDeliveryAt) return false;
    if (this.isDelivered() && this.props.actualDeliveryAt) {
      return this.props.actualDeliveryAt > this.props.estimatedDeliveryAt;
    }
    return !this.isDelivered() && new Date() > this.props.estimatedDeliveryAt;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      ...this.props,
      shipToAddress: this.props.shipToAddress.toJSON(),
      packageWeight: this.props.packageWeight?.toJSON(),
      packageDimensions: this.props.packageDimensions?.toJSON(),
      shippingCost: this.props.shippingCost?.toJSON(),
      insuranceCost: this.props.insuranceCost?.toJSON(),
      handlingCost: this.props.handlingCost?.toJSON()
    };
  }
}
