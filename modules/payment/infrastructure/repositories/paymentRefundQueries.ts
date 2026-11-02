/**
 * paymentRefund table queries.
 */

import { query, queryOne } from '../../../../libs/db';
import type { PaymentRefund as DbPaymentRefund } from '../../../../libs/db/types';
import {
  FailedToCreatePaymentRefundError,
  PaymentRefundNotFoundError,
  FailedToUpdatePaymentRefundError,
} from '../../domain/errors/PaymentErrors';
import type { PaymentRefundCreateParams, PaymentRefundUpdateParams } from './paymentRepoTypes';

/** Falsy → fallback (nullable column default). */
const dbDefault = (value: unknown, fallback: unknown = null): unknown => value || fallback;

export async function findRefundById(id: string): Promise<DbPaymentRefund | null> {
  return queryOne<DbPaymentRefund>(
    `SELECT * FROM "paymentRefund"
     WHERE "paymentRefundId" = $1`,
    [id],
  );
}

export async function findRefundsByTransactionId(transactionId: string): Promise<DbPaymentRefund[]> {
  const results = await query<DbPaymentRefund[]>(
    `SELECT * FROM "paymentRefund"
     WHERE "paymentTransactionId" = $1
     ORDER BY "createdAt" DESC`,
    [transactionId],
  );
  return results || [];
}

export async function createRefund(params: PaymentRefundCreateParams): Promise<DbPaymentRefund> {
  const now = new Date();
  const result = await queryOne<DbPaymentRefund>(
    `INSERT INTO "paymentRefund"
     ("orderPaymentId", "orderId", "transactionId", "amountCents", "currencyCode",
      "reason", "status", "paymentTransactionId", "externalRefundId",
      "gatewayResponse", "errorCode", "errorMessage", "metadata", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`,
    [
      params.orderPaymentId,
      params.orderId,
      dbDefault(params.transactionId),
      params.amountCents,
      params.currencyCode,
      dbDefault(params.reason),
      params.status,
      dbDefault(params.paymentTransactionId),
      dbDefault(params.externalRefundId),
      dbDefault(params.gatewayResponse),
      dbDefault(params.errorCode),
      dbDefault(params.errorMessage),
      dbDefault(params.metadata),
      now,
      now,
    ],
  );

  if (!result) throw new FailedToCreatePaymentRefundError();

  // Update the transaction's refunded amountCents
  await query(
    `UPDATE "paymentTransaction"
     SET "refundedAmountCents" = COALESCE("refundedAmountCents", 0) + $1,
         "status" = CASE
           WHEN COALESCE("refundedAmountCents", 0) + $1 >= "amountCents" THEN 'refunded'
           ELSE 'partially_refunded'
         END,
         "updatedAt" = $2
     WHERE "paymentTransactionId" = $3 AND "deletedAt" IS NULL`,
    [params.amountCents, now, params.paymentTransactionId],
  );

  return result;
}

export async function updateRefund(id: string, params: PaymentRefundUpdateParams): Promise<DbPaymentRefund> {
  const now = new Date();
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;
  const columnMap: Record<string, string> = { currency: 'currencyCode' };

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`"${columnMap[key] ?? key}" = $${paramIndex++}`);
      values.push(value);
    }
  });

  if (updates.length === 0) {
    const existing = await findRefundById(id);
    if (!existing) throw new PaymentRefundNotFoundError();
    return existing;
  }

  updates.push(`"updatedAt" = $${paramIndex++}`);
  values.push(now);
  values.push(id);

  const result = await queryOne<DbPaymentRefund>(
    `UPDATE "paymentRefund"
     SET ${updates.join(', ')}
     WHERE "paymentRefundId" = $${paramIndex}
     RETURNING *`,
    values,
  );

  if (!result) throw new FailedToUpdatePaymentRefundError();
  return result;
}
