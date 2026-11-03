export type OrderReturnStatus = 'requested' | 'approved' | 'denied' | 'inTransit' | 'received' | 'inspected' | 'completed' | 'cancelled';
export type OrderReturnType = 'refund' | 'exchange' | 'storeCredit' | 'repair';
export type ReturnCarrier = 'ups' | 'fedex' | 'dhl' | 'usps' | 'custom';

export interface OrderReturn {
  orderReturnId: string;
  createdAt: Date;
  updatedAt: Date;
  orderId: string;
  returnNumber: string;
  customerId?: string;
  status: OrderReturnStatus;
  returnType: OrderReturnType;
  requestedAt: Date;
  approvedAt?: Date;
  receivedAt?: Date;
  completedAt?: Date;
  rmaNumber?: string;
  paymentRefundId?: string;
  returnShippingPaid: boolean;
  returnShippingAmountCents?: number;
  returnShippingLabel?: string;
  returnCarrier: ReturnCarrier;
  returnTrackingNumber?: string;
  returnTrackingUrl?: string;
  returnReason?: string;
  returnInstructions?: string;
  customerNotes?: string;
  adminNotes?: string;
  requiresInspection: boolean;
  inspectionPassedItems?: Record<string, unknown>;
  inspectionFailedItems?: Record<string, unknown>;
}

/**
 * Storefront return reads. orderReturn lifecycle writes (approve/deny/transit/
 * receive/inspect/complete/cancel) are owned by the returns module —
 * see modules/returns/domain/repositories/ReturnRepository.
 */
export interface OrderReturnRepository {
  findByCustomerIdWithOrderNumber(customerId: string): Promise<unknown[]>;
  findByIdWithOrderNumber(orderReturnId: string, customerId: string): Promise<unknown | null>;
  findOrderForCustomer(orderId: string, customerId: string): Promise<unknown | null>;
  findOrderItemsWithProduct(orderId: string): Promise<unknown[]>;
}

/**
 * Storefront "simple return" write, implemented by the ACL adapter that
 * delegates to the returns module's canonical orderReturn writer.
 */
export interface StorefrontReturnWriter {
  createSimple(orderId: string, customerId: string, reason: string, description?: string): Promise<unknown>;
}
