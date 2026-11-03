/**
 * Fraud blacklist queries.
 */

import { query, queryOne } from '../../../../libs/db';
import type { BlacklistType, FraudBlacklist } from '../../domain/entities/FraudRule';
import type { FraudBlacklist as DbFraudBlacklist } from '../../../../libs/db/types';

export async function getBlacklistEntry(fraudBlacklistId: string): Promise<FraudBlacklist | null> {
  const row = await queryOne<DbFraudBlacklist>('SELECT * FROM "fraudBlacklist" WHERE "fraudBlacklistId" = $1', [fraudBlacklistId]);
  return row ? mapToBlacklist(row) : null;
}

export async function getBlacklist(
  filters?: { type?: BlacklistType; isActive?: boolean },
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: FraudBlacklist[]; total: number }> {
  let whereClause = '1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters?.type) {
    whereClause += ` AND "type" = $${paramIndex++}`;
    params.push(filters.type);
  }
  if (filters?.isActive !== undefined) {
    whereClause += ` AND "isActive" = $${paramIndex++}`;
    params.push(filters.isActive);
  }

  const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "fraudBlacklist" WHERE ${whereClause}`, params);

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<DbFraudBlacklist[]>(
    `SELECT * FROM "fraudBlacklist" WHERE ${whereClause}
     ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset],
  );

  return {
    data: (rows || []).map(mapToBlacklist),
    total: parseInt(countResult?.count || '0'),
  };
}

export async function isBlacklisted(type: BlacklistType, value: string): Promise<boolean> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "fraudBlacklist"
     WHERE "type" = $1 AND "value" = $2 AND "isActive" = true
     AND ("expiresAt" IS NULL OR "expiresAt" > NOW())`,
    [type, (value || '').toLowerCase()],
  );
  return parseInt(row?.count || '0') > 0;
}

export async function addToBlacklist(entry: {
  type: BlacklistType;
  value: string;
  reason?: string;
  source?: string;
  relatedOrderId?: string;
  relatedCustomerId?: string;
  expiresAt?: Date;
  addedBy?: string;
}): Promise<FraudBlacklist> {
  const now = new Date().toISOString();

  const result = await queryOne<DbFraudBlacklist>(
    `INSERT INTO "fraudBlacklist" (
      "type", "value", "reason", "source", "relatedOrderId", "relatedCustomerId",
      "isActive", "expiresAt", "addedBy", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $10)
    ON CONFLICT ("type", "value") DO UPDATE SET
      "isActive" = true, "reason" = COALESCE($3, "fraudBlacklist"."reason"),
      "expiresAt" = $7, "updatedAt" = $10
    RETURNING *`,
    [
      entry.type,
      (entry.value || '').toLowerCase(),
      entry.reason,
      entry.source || 'manual',
      entry.relatedOrderId,
      entry.relatedCustomerId,
      entry.expiresAt?.toISOString(),
      entry.addedBy,
      now,
      now,
    ],
  );

  return mapToBlacklist(result!);
}

export async function removeFromBlacklist(fraudBlacklistId: string): Promise<void> {
  await query('UPDATE "fraudBlacklist" SET "isActive" = false, "updatedAt" = $1 WHERE "fraudBlacklistId" = $2', [
    new Date().toISOString(),
    fraudBlacklistId,
  ]);
}

export async function expireBlacklistEntries(): Promise<number> {
  const result = await query(
    `UPDATE "fraudBlacklist" SET "isActive" = false, "updatedAt" = $1
     WHERE "isActive" = true AND "expiresAt" < NOW()`,
    [new Date().toISOString()],
  );
  return (result as { rowCount?: number })?.rowCount || 0;
}

function mapToBlacklist(row: Record<string, unknown>): FraudBlacklist {
  return {
    fraudBlacklistId: row.fraudBlacklistId as string,
    type: row.type as BlacklistType,
    value: row.value as string,
    reason: row.reason as string | undefined,
    source: row.source as string,
    relatedOrderId: row.relatedOrderId as string | undefined,
    relatedCustomerId: row.relatedCustomerId as string | undefined,
    isActive: Boolean(row.isActive),
    expiresAt: row.expiresAt ? new Date(row.expiresAt as string) : undefined,
    addedBy: row.addedBy as string | undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}
