/**
 * Payout Repository
 *
 * Manages marketplace seller payouts.
 */

import { query, queryOne } from '../../../libs/db';
import { Payout } from '../../../libs/db/dataModelTypes';

function generateId(): string {
  return `payout_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface CreatePayoutParams {
  sellerId: string;
  orderId?: string;
  settlementId?: string;
  grossAmount: number;
  commissionAmount: number;
  feeAmount?: number;
  currency: string;
  scheduledDate?: Date;
}

export async function create(params: CreatePayoutParams): Promise<Payout> {
  const payoutId = generateId();
  const now = new Date();
  const netAmount = params.grossAmount - params.commissionAmount - (params.feeAmount || 0);

  const sql = `
    INSERT INTO "payout" (
      "payoutId", "sellerId", "orderId", "settlementId", "grossAmount",
      "commissionAmount", "feeAmount", "netAmount", "currency", "status",
      "scheduledDate", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;

  const result = await query<{ rows: Payout[] }>(sql, [
    payoutId,
    params.sellerId,
    params.orderId || null,
    params.settlementId || null,
    params.grossAmount,
    params.commissionAmount,
    params.feeAmount || 0,
    netAmount,
    params.currency,
    'pending',
    params.scheduledDate || null,
    now,
    now,
  ]);

  return result!.rows[0];
}

export async function findById(payoutId: string): Promise<Payout | null> {
  return queryOne<Payout>('SELECT * FROM "payout" WHERE "payoutId" = $1', [payoutId]);
}

export async function findBySeller(sellerId: string, options?: { status?: string; limit?: number; offset?: number }): Promise<Payout[]> {
  let sql = 'SELECT * FROM "payout" WHERE "sellerId" = $1';
  const params: unknown[] = [sellerId];
  let paramIndex = 2;

  if (options?.status) {
    sql += ` AND "status" = $${paramIndex++}`;
    params.push(options.status);
  }

  sql += ' ORDER BY "createdAt" DESC';

  if (options?.limit) {
    sql += ` LIMIT $${paramIndex++}`;
    params.push(options.limit);
  }
  if (options?.offset) {
    sql += ` OFFSET $${paramIndex++}`;
    params.push(options.offset);
  }

  const result = await query<{ rows: Payout[] }>(sql, params);
  return result?.rows ?? [];
}

export async function findPending(): Promise<Payout[]> {
  const result = await query<{ rows: Payout[] }>('SELECT * FROM "payout" WHERE "status" = \'pending\' ORDER BY "createdAt" ASC');
  return result?.rows ?? [];
}

export async function findScheduled(beforeDate: Date): Promise<Payout[]> {
  const result = await query<{ rows: Payout[] }>(
    'SELECT * FROM "payout" WHERE "status" = \'scheduled\' AND "scheduledDate" <= $1 ORDER BY "scheduledDate" ASC',
    [beforeDate],
  );
  return result?.rows ?? [];
}

export async function schedule(payoutId: string, scheduledDate: Date): Promise<boolean> {
  const result = await query<{ rowCount: number }>(
    'UPDATE "payout" SET "status" = \'scheduled\', "scheduledDate" = $1, "updatedAt" = $2 WHERE "payoutId" = $3 AND "status" = \'pending\'',
    [scheduledDate, new Date(), payoutId],
  );
  return (result?.rowCount ?? 0) > 0;
}

export async function process(payoutId: string): Promise<boolean> {
  const result = await query<{ rowCount: number }>(
    'UPDATE "payout" SET "status" = \'processing\', "updatedAt" = $1 WHERE "payoutId" = $2 AND "status" IN (\'pending\', \'scheduled\')',
    [new Date(), payoutId],
  );
  return (result?.rowCount ?? 0) > 0;
}

export async function complete(payoutId: string, paymentReference: string): Promise<boolean> {
  const now = new Date();
  const result = await query<{ rowCount: number }>(
    'UPDATE "payout" SET "status" = \'completed\', "processedAt" = $1, "paymentReference" = $2, "updatedAt" = $3 WHERE "payoutId" = $4 AND "status" = \'processing\'',
    [now, paymentReference, now, payoutId],
  );
  return (result?.rowCount ?? 0) > 0;
}

export async function fail(payoutId: string): Promise<boolean> {
  const result = await query<{ rowCount: number }>(
    'UPDATE "payout" SET "status" = \'failed\', "updatedAt" = $1 WHERE "payoutId" = $2 AND "status" = \'processing\'',
    [new Date(), payoutId],
  );
  return (result?.rowCount ?? 0) > 0;
}

export async function getSellerBalance(sellerId: string): Promise<{ pending: number; processing: number; paid: number }> {
  const sql = `
    SELECT 
      COALESCE(SUM(CASE WHEN "status" = 'pending' THEN "netAmount" ELSE 0 END), 0) as pending,
      COALESCE(SUM(CASE WHEN "status" = 'processing' THEN "netAmount" ELSE 0 END), 0) as processing,
      COALESCE(SUM(CASE WHEN "status" = 'completed' THEN "netAmount" ELSE 0 END), 0) as paid
    FROM "payout"
    WHERE "sellerId" = $1
  `;
  const result = await queryOne<{ pending: string; processing: string; paid: string }>(sql, [sellerId]);
  return {
    pending: parseFloat(result?.pending || '0'),
    processing: parseFloat(result?.processing || '0'),
    paid: parseFloat(result?.paid || '0'),
  };
}

export default {
  create,
  findById,
  findBySeller,
  findPending,
  findScheduled,
  schedule,
  process,
  complete,
  fail,
  getSellerBalance,
};
