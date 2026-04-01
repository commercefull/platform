import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';

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
  gatewayResponse?: Record<string, any>;
  refundedBy?: string;
}

export type OrderPaymentRefundCreateParams = Omit<OrderPaymentRefund, 'orderPaymentRefundId' | 'createdAt' | 'updatedAt'>;

export const findByOrder = async (orderId: string): Promise<OrderPaymentRefund[]> => {
  const results = await query<OrderPaymentRefund[]>(
    `SELECT r.* FROM "orderPaymentRefund" r
     JOIN "orderPayment" p ON p."orderPaymentId" = r."orderPaymentId"
     WHERE p."orderId" = $1
     ORDER BY r."createdAt" ASC`,
    [orderId],
  );
  return results || [];
};

export const findById = async (orderPaymentRefundId: string): Promise<OrderPaymentRefund | null> => {
  return queryOne<OrderPaymentRefund>(
    `SELECT * FROM "orderPaymentRefund" WHERE "orderPaymentRefundId" = $1`,
    [orderPaymentRefundId],
  );
};

export const create = async (params: OrderPaymentRefundCreateParams): Promise<OrderPaymentRefund> => {
  const now = unixTimestamp();
  const result = await queryOne<OrderPaymentRefund>(
    `INSERT INTO "orderPaymentRefund" (
      "orderPaymentId", "amount", "reason", "notes", "transactionId",
      "status", "gatewayResponse", "refundedBy",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      params.orderPaymentId,
      params.amount,
      params.reason || null,
      params.notes || null,
      params.transactionId || null,
      params.status || 'pending',
      params.gatewayResponse ? JSON.stringify(params.gatewayResponse) : null,
      params.refundedBy || null,
      now,
      now,
    ],
  );
  if (!result) throw new Error('Failed to create orderPaymentRefund');
  return result;
};

export default { findByOrder, findById, create };
