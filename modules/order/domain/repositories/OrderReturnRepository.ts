export type OrderReturnStatus = 'requested' | 'approved' | 'denied' | 'inTransit' | 'received' | 'inspected' | 'completed' | 'cancelled';
export type OrderReturnType = 'refund' | 'exchange' | 'storeCredit' | 'repair';
export type ReturnCarrier = 'ups' | 'fedex' | 'dhl' | 'usps' | 'custom';

export interface OrderReturn {
  orderReturnId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  returnNumber: string;
  customerId?: string;
  status: OrderReturnStatus;
  returnType: OrderReturnType;
  requestedAt: string;
  approvedAt?: string;
  receivedAt?: string;
  completedAt?: string;
  rmaNumber?: string;
  paymentRefundId?: string;
  returnShippingPaid: boolean;
  returnShippingAmount?: number;
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

export type OrderReturnCreateParams = Omit<
  OrderReturn,
  'orderReturnId' | 'createdAt' | 'updatedAt' | 'returnNumber' | 'requestedAt' | 'approvedAt' | 'receivedAt' | 'completedAt'
>;

export type OrderReturnUpdateParams = Partial<
  Pick<
    OrderReturn,
    | 'status'
    | 'rmaNumber'
    | 'paymentRefundId'
    | 'returnShippingPaid'
    | 'returnShippingAmount'
    | 'returnShippingLabel'
    | 'returnTrackingNumber'
    | 'returnTrackingUrl'
    | 'customerNotes'
    | 'adminNotes'
    | 'inspectionPassedItems'
    | 'inspectionFailedItems'
  >
>;

export interface OrderReturnRepository {
  findById(orderReturnId: string): Promise<OrderReturn | null>;
  findByReturnNumber(returnNumber: string): Promise<OrderReturn | null>;
  findByOrderId(orderId: string): Promise<OrderReturn[]>;
  findByCustomerId(customerId: string, limit?: number, offset?: number): Promise<OrderReturn[]>;
  findByStatus(status: OrderReturnStatus, limit?: number, offset?: number): Promise<OrderReturn[]>;
  findPending(limit?: number): Promise<OrderReturn[]>;
  findInTransit(limit?: number): Promise<OrderReturn[]>;
  findNeedingInspection(limit?: number): Promise<OrderReturn[]>;
  create(params: OrderReturnCreateParams): Promise<OrderReturn>;
  update(orderReturnId: string, params: OrderReturnUpdateParams): Promise<OrderReturn | null>;
  updateStatus(orderReturnId: string, status: OrderReturnStatus): Promise<OrderReturn | null>;
  approve(orderReturnId: string, rmaNumber?: string): Promise<OrderReturn | null>;
  deny(orderReturnId: string, adminNotes?: string): Promise<OrderReturn | null>;
  markInTransit(orderReturnId: string, trackingNumber?: string, trackingUrl?: string): Promise<OrderReturn | null>;
  markReceived(orderReturnId: string): Promise<OrderReturn | null>;
  completeInspection(orderReturnId: string, passedItems?: Record<string, unknown>, failedItems?: Record<string, unknown>): Promise<OrderReturn | null>;
  complete(orderReturnId: string): Promise<OrderReturn | null>;
  cancel(orderReturnId: string, reason?: string): Promise<OrderReturn | null>;
  addTracking(orderReturnId: string, trackingNumber: string, trackingUrl?: string, carrier?: ReturnCarrier): Promise<OrderReturn | null>;
  linkPaymentRefund(orderReturnId: string, paymentRefundId: string): Promise<OrderReturn | null>;
  delete(orderReturnId: string): Promise<boolean>;
  countByStatus(status: OrderReturnStatus): Promise<number>;
  countByCustomerId(customerId: string): Promise<number>;
  getStatistics(): Promise<{
    total: number;
    requested: number;
    approved: number;
    denied: number;
    inTransit: number;
    received: number;
    inspected: number;
    completed: number;
    cancelled: number;
  }>;
  getStatisticsByType(): Promise<Record<OrderReturnType, number>>;
  findByCustomerIdWithOrderNumber(customerId: string): Promise<unknown[]>;
  findByIdWithOrderNumber(orderReturnId: string, customerId: string): Promise<unknown | null>;
  createSimple(orderId: string, reason: string, description?: string): Promise<OrderReturn | null>;
  findOrderForCustomer(orderId: string, customerId: string): Promise<unknown | null>;
  findOrderItemsWithProduct(orderId: string): Promise<unknown[]>;
}
