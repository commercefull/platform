export type OrderPaymentType =
  | 'creditCard'
  | 'debitCard'
  | 'paypal'
  | 'applePay'
  | 'googlePay'
  | 'bankTransfer'
  | 'crypto'
  | 'giftCard'
  | 'storeCredit';

export type OrderPaymentStatus = 'pending' | 'authorized' | 'captured' | 'refunded' | 'partiallyRefunded' | 'voided' | 'failed';

export interface OrderPayment {
  orderPaymentId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  paymentMethodId?: string;
  type: OrderPaymentType;
  provider: string;
  amount: number;
  currency: string;
  status: OrderPaymentStatus;
  transactionId?: string;
  authorizationCode?: string;
  errorCode?: string;
  errorMessage?: string;
  maskedNumber?: string;
  cardType?: string;
  gatewayResponse?: Record<string, unknown>;
  refundedAmount: number;
  capturedAt?: string;
}

export type OrderPaymentCreateParams = Omit<OrderPayment, 'orderPaymentId' | 'createdAt' | 'updatedAt'>;

export interface OrderPaymentRepository {
  findByOrder(orderId: string): Promise<OrderPayment[]>;
  findById(orderPaymentId: string): Promise<OrderPayment | null>;
  create(params: OrderPaymentCreateParams): Promise<OrderPayment>;
}
