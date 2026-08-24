export type OrderPaymentRefundStatus = 'pending' | 'completed' | 'failed';

export interface OrderPaymentRefund {
  orderPaymentRefundId: string;
  createdAt: string;
  updatedAt: string;
  orderPaymentId: string;
  amount: number;
  reason?: string;
  notes?: string;
  transactionId?: string;
  status: OrderPaymentRefundStatus;
  gatewayResponse?: Record<string, unknown>;
  refundedBy?: string;
}

export type OrderPaymentRefundCreateParams = Omit<OrderPaymentRefund, 'orderPaymentRefundId' | 'createdAt' | 'updatedAt'>;

export interface OrderPaymentRefundRepository {
  findByOrder(orderId: string): Promise<OrderPaymentRefund[]>;
  findById(orderPaymentRefundId: string): Promise<OrderPaymentRefund | null>;
  create(params: OrderPaymentRefundCreateParams): Promise<OrderPaymentRefund>;
}
