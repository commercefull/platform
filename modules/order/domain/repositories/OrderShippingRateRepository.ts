export type ShippingCarrier = 'ups' | 'usps' | 'fedex' | 'dhl' | 'custom';

export interface OrderShippingRate {
  orderShippingRateId: string;
  createdAt: Date;
  updatedAt: Date;
  orderId: string;
  carrier: ShippingCarrier;
  serviceLevel: string;
  serviceName: string;
  /** Shipping rate amount in integer cents. */
  rateCents: number;
  estimatedDays?: number;
  estimatedDeliveryDate?: Date;
  currencyCode: string;
  isSelected: boolean;
  carrierAccountId?: string;
  shipmentId?: string;
  rateData?: Record<string, unknown>;
}

export type OrderShippingRateCreateParams = Omit<OrderShippingRate, 'orderShippingRateId' | 'createdAt' | 'updatedAt'>;

export interface OrderShippingRateRepository {
  findByOrder(orderId: string): Promise<OrderShippingRate[]>;
  create(params: OrderShippingRateCreateParams): Promise<OrderShippingRate>;
}
