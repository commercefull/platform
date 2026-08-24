export interface OrderShipping {
  orderShippingId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  shippingMethod: string;
  carrier?: string;
  service?: string;
  amount: number;
  taxAmount?: number;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
}

export type OrderShippingCreateParams = Omit<OrderShipping, 'orderShippingId' | 'createdAt' | 'updatedAt'>;
export type OrderShippingUpdateParams = Partial<
  Pick<OrderShipping, 'shippingMethod' | 'carrier' | 'service' | 'amount' | 'taxAmount' | 'trackingNumber' | 'trackingUrl' | 'estimatedDeliveryDate'>
>;

export interface OrderShippingRepository {
  findByOrder(orderId: string): Promise<OrderShipping[]>;
  create(params: OrderShippingCreateParams): Promise<OrderShipping>;
  update(orderShippingId: string, params: OrderShippingUpdateParams): Promise<OrderShipping | null>;
}
