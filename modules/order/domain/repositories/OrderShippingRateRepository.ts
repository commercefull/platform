export type ShippingCarrier = 'ups' | 'usps' | 'fedex' | 'dhl' | 'custom';

export interface OrderShippingRate {
  orderShippingRateId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  carrier: ShippingCarrier;
  serviceLevel: string;
  serviceName: string;
  rate: number;
  estimatedDays?: number;
  estimatedDeliveryDate?: string;
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
