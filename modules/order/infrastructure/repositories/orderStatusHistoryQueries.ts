/**
 * Order status/payment/fulfillment history table queries.
 */

import { query } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../domain/valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../../domain/valueObjects/FulfillmentStatus';
import type { OrderStatusHistory as DbOrderStatusHistory } from '../../../../libs/db/types';

export async function recordStatusChange(orderId: string, status: OrderStatus, reason?: string, previousStatus?: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `INSERT INTO "orderStatusHistory" ("orderStatusHistoryId", "orderId", "status", "previousStatus", "notes", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [generateUUID(), orderId, status, previousStatus || 'pending', reason || null, now],
  );
}

export async function recordPaymentStatusChange(orderId: string, status: PaymentStatus, transactionId?: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `INSERT INTO "orderPaymentHistory" ("orderPaymentHistoryId", "orderId", "paymentStatus", "transactionId", "createdAt")
     VALUES ($1, $2, $3, $4, $5)`,
    [generateUUID(), orderId, status, transactionId || null, now],
  );
}

export async function recordFulfillmentStatusChange(orderId: string, status: FulfillmentStatus): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `INSERT INTO "orderFulfillmentHistory" ("orderFulfillmentHistoryId", "orderId", "fulfillmentStatus", "createdAt")
     VALUES ($1, $2, $3, $4)`,
    [generateUUID(), orderId, status, now],
  );
}

export async function getStatusHistory(orderId: string): Promise<Array<{ status: OrderStatus; reason?: string; createdAt: Date }>> {
  const rows = await query<DbOrderStatusHistory[]>(
    `SELECT "status", "notes", "createdAt" FROM "orderStatusHistory"
     WHERE "orderId" = $1 ORDER BY "createdAt" DESC`,
    [orderId],
  );
  return (rows || []).map(row => ({
    status: row.status as OrderStatus,
    reason: row.notes ?? undefined,
    createdAt: new Date(row.createdAt),
  }));
}

export async function getPaymentStatusHistory(
  orderId: string,
): Promise<Array<{ orderId: string; paymentStatus: string; transactionId?: string; createdAt: Date }>> {
  const rows = await query<Array<{ orderId: string; paymentStatus: string; transactionId: string | null; createdAt: string }>>(
    `SELECT "orderId", "paymentStatus", "transactionId", "createdAt" FROM "orderPaymentHistory"
     WHERE "orderId" = $1 ORDER BY "createdAt" DESC`,
    [orderId],
  );
  return (rows || []).map(row => ({
    orderId: row.orderId,
    paymentStatus: row.paymentStatus,
    transactionId: row.transactionId ?? undefined,
    createdAt: new Date(row.createdAt),
  }));
}

export async function getFulfillmentStatusHistory(
  orderId: string,
): Promise<Array<{ orderId: string; fulfillmentStatus: string; createdAt: Date }>> {
  const rows = await query<Array<{ orderId: string; fulfillmentStatus: string; createdAt: string }>>(
    `SELECT "orderId", "fulfillmentStatus", "createdAt" FROM "orderFulfillmentHistory"
     WHERE "orderId" = $1 ORDER BY "createdAt" DESC`,
    [orderId],
  );
  return (rows || []).map(row => ({
    orderId: row.orderId,
    fulfillmentStatus: row.fulfillmentStatus,
    createdAt: new Date(row.createdAt),
  }));
}
