/**
 * IdempotencyRepositoryImpl
 *
 * Persists ACP Idempotency-Key records. `createIfAbsent` relies on the
 * (integrationId, key) unique constraint — an insert conflict means the key
 * is already in flight or completed, so it returns null.
 */

import { query, queryOne } from '../../../../libs/db';
import type { AgenticCheckoutIdempotencyRecord as DbAgenticCheckoutIdempotencyRecord } from '../../../../libs/db/types';
import type { IdempotencyRepository } from '../../domain/repositories/IdempotencyRepository';
import { IdempotencyRecord, type IdempotencyState } from '../../domain/entities/IdempotencyRecord';

function mapToEntity(row: DbAgenticCheckoutIdempotencyRecord): IdempotencyRecord {
  return IdempotencyRecord.reconstitute({
    idempotencyRecordId: row.agenticCheckoutIdempotencyRecordId,
    integrationId: row.integrationId,
    key: row.key,
    requestHash: row.requestHash,
    method: row.method,
    path: row.path,
    state: row.state as IdempotencyState,
    responseStatus: row.responseStatus,
    responseBody: (row.responseBody as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  });
}

class IdempotencyRepositoryImpl implements IdempotencyRepository {
  async createIfAbsent(record: IdempotencyRecord): Promise<IdempotencyRecord | null> {
    const row = await queryOne<DbAgenticCheckoutIdempotencyRecord>(
      `INSERT INTO "agenticCheckoutIdempotencyRecord" (
         "agenticCheckoutIdempotencyRecordId", "integrationId", "key", "requestHash",
         "method", "path", "state", "responseStatus", "responseBody", "createdAt", "expiresAt"
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT ("integrationId", "key") DO NOTHING
       RETURNING *`,
      [
        record.idempotencyRecordId,
        record.integrationId,
        record.key,
        record.requestHash,
        record.method,
        record.path,
        record.state,
        record.responseStatus,
        record.responseBody ? JSON.stringify(record.responseBody) : null,
        record.createdAt,
        record.expiresAt,
      ],
    );
    return row ? mapToEntity(row) : null;
  }

  async findByKey(integrationId: string, key: string): Promise<IdempotencyRecord | null> {
    const row = await queryOne<DbAgenticCheckoutIdempotencyRecord>(
      `SELECT * FROM "agenticCheckoutIdempotencyRecord" WHERE "integrationId" = $1 AND "key" = $2`,
      [integrationId, key],
    );
    return row ? mapToEntity(row) : null;
  }

  async update(record: IdempotencyRecord): Promise<IdempotencyRecord> {
    const row = await queryOne<DbAgenticCheckoutIdempotencyRecord>(
      `UPDATE "agenticCheckoutIdempotencyRecord"
       SET "state" = $2, "responseStatus" = $3, "responseBody" = $4
       WHERE "agenticCheckoutIdempotencyRecordId" = $1
       RETURNING *`,
      [record.idempotencyRecordId, record.state, record.responseStatus, record.responseBody ? JSON.stringify(record.responseBody) : null],
    );
    return mapToEntity(row!);
  }

  async deleteExpired(now: Date): Promise<number> {
    const rows = await query<{ agenticCheckoutIdempotencyRecordId: string }[]>(
      `DELETE FROM "agenticCheckoutIdempotencyRecord" WHERE "expiresAt" < $1 RETURNING "agenticCheckoutIdempotencyRecordId"`,
      [now],
    );
    return rows?.length ?? 0;
  }
}

export const idempotencyRepository = new IdempotencyRepositoryImpl();
