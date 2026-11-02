export type OrderPaymentRefundStatus = 'pending' | 'completed' | 'failed';

export interface OrderPaymentRefund {
  orderPaymentRefundId: string;
  createdAt: Date;
  updatedAt: Date;
  orderPaymentId: string;
  /** Refund amount in integer cents. */
  amountCents: number;
  reason?: string;
  notes?: string;
  transactionId?: string;
  status: OrderPaymentRefundStatus;
  gatewayResponse?: Record<string, unknown>;
  refundedBy?: string;
}

export type OrderPaymentRefundCreateParams = Omit<OrderPaymentRefund, 'orderPaymentRefundId' | 'createdAt' | 'updatedAt'>;


