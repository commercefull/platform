import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';

export type OrderPaymentType = 'creditCard' | 'debitCard' | 'paypal' | 'applePay' | 'googlePay' | 'bankTransfer' | 'crypto' | 'giftCard' | 'storeCredit';
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
  gatewayResponse?: Record<string, any>;
  refundedAmount: number;
  capturedAt?: string;
}

export type OrderPaymentCreateParams = Omit<OrderPayment, 'orderPaymentId' | 'createdAt' | 'updatedAt'>;

export const findByOrder = async (orderId: string): Promise<OrderPayment[]> => {
  const results = await query<OrderPayment[]>(
    `SELECT * FROM "orderPayment" WHERE "orderId" = $1 ORDER BY "createdAt" ASC`,
    [orderId],
  );
  return results || [];
};

export const findById = async (orderPaymentId: string): Promise<OrderPayment | null> => {
  return queryOne<OrderPayment>(
    `SELECT * FROM "orderPayment" WHERE "orderPaymentId" = $1`,
    [orderPaymentId],
  );
};

export const create = async (params: OrderPaymentCreateParams): Promise<OrderPayment> => {
  const now = unixTimestamp();
  const result = await queryOne<OrderPayment>(
    `INSERT INTO "orderPayment" (
      "orderId", "paymentMethodId", "type", "provider", "amount", "currency", "status",
      "transactionId", "authorizationCode", "errorCode", "errorMessage",
      "maskedNumber", "cardType", "gatewayResponse", "refundedAmount", "capturedAt",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *`,
    [
      params.orderId,
      params.paymentMethodId || null,
      params.type,
      params.provider,
      params.amount,
      params.currency,
      params.status || 'pending',
      params.transactionId || null,
      params.authorizationCode || null,
      params.errorCode || null,
      params.errorMessage || null,
      params.maskedNumber || null,
      params.cardType || null,
      params.gatewayResponse ? JSON.stringify(params.gatewayResponse) : null,
      params.refundedAmount ?? 0,
      params.capturedAt || null,
      now,
      now,
    ],
  );
  if (!result) throw new Error('Failed to create orderPayment');
  return result;
};

export default { findByOrder, findById, create };
