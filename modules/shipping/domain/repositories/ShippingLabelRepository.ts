/**
 * Shipping Label Repository Port
 *
 * Domain interface for shipping label data access.
 */

export interface ShippingLabel {
  shippingLabelId: string;
  shippingCarrierId: string;
  carrierName?: string;
  carrierService?: string;
  trackingNumber: string;
  labelUrl?: string;
  labelFormat: string;
  status: string;
  orderId?: string;
  fulfillmentId?: string;
  shipFromName?: string;
  shipToName?: string;
  shipToAddressLine1?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToPostalCode?: string;
  shipToCountry?: string;
  weight?: number;
  dimensions?: Record<string, unknown>;
  shippingCost?: number;
  voidReason?: string;
  voidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShippingLabelInput {
  shippingCarrierId: string;
  carrierName?: string;
  carrierService?: string;
  trackingNumber: string;
  labelUrl?: string;
  labelFormat?: string;
  orderId?: string;
  fulfillmentId?: string;
  shipFromName?: string;
  shipToName?: string;
  shipToAddressLine1?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToPostalCode?: string;
  shipToCountry?: string;
  weight?: number;
  dimensions?: Record<string, unknown>;
  shippingCost?: number;
}
