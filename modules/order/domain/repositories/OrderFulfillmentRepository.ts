export type FulfillmentType = 'shipping' | 'pickup' | 'digital' | 'service';
export type FulfillmentStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'failed' | 'cancelled';

export interface OrderFulfillment {
  orderFulfillmentId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  fulfillmentNumber: string;
  type: FulfillmentType;
  status: FulfillmentStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  carrierCode?: string;
  carrierName?: string;
  shippingMethod?: string;
  shippingAddressId?: string;
  weight?: number;
  weightUnit?: string;
  dimensions?: Record<string, unknown>;
  packageCount?: number;
  shippedAt?: string;
  deliveredAt?: string;
  estimatedDeliveryDate?: string;
  notes?: string;
  fulfilledBy?: string;
}

export type OrderFulfillmentCreateParams = Omit<OrderFulfillment, 'orderFulfillmentId' | 'createdAt' | 'updatedAt' | 'fulfillmentNumber'>;
export type OrderFulfillmentUpdateParams = Partial<
  Pick<OrderFulfillment, 'status' | 'trackingNumber' | 'trackingUrl' | 'carrierCode' | 'carrierName' | 'shippingMethod' | 'shippedAt' | 'deliveredAt' | 'estimatedDeliveryDate' | 'notes'>
>;

export interface OrderFulfillmentRepository {
  findById(orderFulfillmentId: string): Promise<OrderFulfillment | null>;
  findByFulfillmentNumber(fulfillmentNumber: string): Promise<OrderFulfillment | null>;
  findByOrderId(orderId: string): Promise<OrderFulfillment[]>;
  findByStatus(status: FulfillmentStatus, limit?: number, offset?: number): Promise<OrderFulfillment[]>;
  findByTrackingNumber(trackingNumber: string): Promise<OrderFulfillment[]>;
  findByCarrier(carrierCode: string, limit?: number, offset?: number): Promise<OrderFulfillment[]>;
  create(params: OrderFulfillmentCreateParams): Promise<OrderFulfillment>;
  update(orderFulfillmentId: string, params: OrderFulfillmentUpdateParams): Promise<OrderFulfillment | null>;
  updateStatus(orderFulfillmentId: string, status: FulfillmentStatus): Promise<OrderFulfillment | null>;
  addTracking(orderFulfillmentId: string, trackingNumber: string, carrierCode?: string, carrierName?: string, trackingUrl?: string): Promise<OrderFulfillment | null>;
  markAsShipped(orderFulfillmentId: string, shippedAt?: string): Promise<OrderFulfillment | null>;
  markAsDelivered(orderFulfillmentId: string, deliveredAt?: string): Promise<OrderFulfillment | null>;
  cancel(orderFulfillmentId: string, notes?: string): Promise<OrderFulfillment | null>;
  delete(orderFulfillmentId: string): Promise<boolean>;
  countByOrderId(orderId: string): Promise<number>;
  getStatusStatistics(): Promise<Record<FulfillmentStatus, number>>;
  findOverdue(): Promise<OrderFulfillment[]>;
  findShippedToday(): Promise<OrderFulfillment[]>;
}
