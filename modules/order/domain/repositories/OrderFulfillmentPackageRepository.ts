export interface OrderFulfillmentPackage {
  orderFulfillmentPackageId: string;
  createdAt: string;
  updatedAt: string;
  orderFulfillmentId: string;
  packageNumber: string;
  trackingNumber?: string;
  weight?: number;
  dimensions?: Record<string, unknown>;
  packageType?: string;
  shippingLabelUrl?: string;
  commercialInvoiceUrl?: string;
  customsInfo?: Record<string, unknown>;
}

export type OrderFulfillmentPackageCreateParams = Omit<OrderFulfillmentPackage, 'orderFulfillmentPackageId' | 'createdAt' | 'updatedAt'>;
export type OrderFulfillmentPackageTrackingParams = Partial<
  Pick<OrderFulfillmentPackage, 'trackingNumber' | 'shippingLabelUrl' | 'commercialInvoiceUrl'>
>;

export interface OrderFulfillmentPackageRepository {
  findByOrder(orderId: string): Promise<OrderFulfillmentPackage[]>;
  findByFulfillment(orderFulfillmentId: string): Promise<OrderFulfillmentPackage[]>;
  createPackage(params: OrderFulfillmentPackageCreateParams): Promise<OrderFulfillmentPackage>;
  updateTracking(orderFulfillmentPackageId: string, params: OrderFulfillmentPackageTrackingParams): Promise<OrderFulfillmentPackage | null>;
}
