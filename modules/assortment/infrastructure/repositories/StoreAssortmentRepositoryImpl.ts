import { query, queryOne } from '../../../../libs/db';
import type { AssortmentStore as DbAssortmentStore, AssortmentStoreEntry as DbAssortmentStoreEntry } from '../../../../libs/db/types';
import type { StoreAssortmentRepository } from '../../domain/repositories/AssortmentRepository';
import { StoreAssortment, type AssortmentMode } from '../../domain/entities/StoreAssortment';
import { StoreAssortmentEntry, type AssortmentTargetType, type AssortmentEffect } from '../../domain/entities/StoreAssortmentEntry';

function mapToStoreAssortment(row: DbAssortmentStore): StoreAssortment {
  return StoreAssortment.reconstitute({
    storeId: row.storeId,
    mode: row.mode as AssortmentMode,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function mapToEntry(row: DbAssortmentStoreEntry): StoreAssortmentEntry {
  return StoreAssortmentEntry.reconstitute({
    assortmentStoreEntryId: row.assortmentStoreEntryId,
    storeId: row.storeId,
    channelId: row.channelId ?? undefined,
    targetType: row.targetType as AssortmentTargetType,
    targetId: row.targetId,
    effect: row.effect as AssortmentEffect,
    position: row.position,
    isHidden: row.isHidden,
    createdAt: row.createdAt,
  });
}

class StoreAssortmentRepositoryImpl implements StoreAssortmentRepository {
  async findByStoreId(storeId: string): Promise<StoreAssortment | null> {
    const row = await queryOne<DbAssortmentStore>(`SELECT * FROM "assortmentStore" WHERE "storeId" = $1`, [storeId]);
    return row ? mapToStoreAssortment(row) : null;
  }

  async upsert(assortment: StoreAssortment): Promise<StoreAssortment> {
    const p = assortment.toJSON();
    const row = await queryOne<DbAssortmentStore>(
      `INSERT INTO "assortmentStore" ("storeId", "mode", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("storeId") DO UPDATE SET "mode" = EXCLUDED."mode", "updatedAt" = EXCLUDED."updatedAt"
       RETURNING *`,
      [p.storeId, p.mode, p.createdAt, p.updatedAt],
    );
    if (!row) throw new Error('Failed to upsert store assortment');
    return mapToStoreAssortment(row);
  }

  async findEntriesByStoreId(storeId: string): Promise<StoreAssortmentEntry[]> {
    const rows = await query<DbAssortmentStoreEntry[]>(
      `SELECT * FROM "assortmentStoreEntry" WHERE "storeId" = $1 ORDER BY "position" ASC, "createdAt" ASC`,
      [storeId],
    );
    return (rows ?? []).map(mapToEntry);
  }

  async createEntry(entry: StoreAssortmentEntry): Promise<StoreAssortmentEntry> {
    const p = entry.toJSON();
    // Channel-aware uniqueness is expressed with partial indexes that ON
    // CONFLICT cannot infer, so resolve the existing row explicitly.
    const existing = await queryOne<DbAssortmentStoreEntry>(
      `SELECT * FROM "assortmentStoreEntry"
       WHERE "storeId" = $1 AND "targetType" = $2 AND "targetId" = $3 AND "channelId" IS NOT DISTINCT FROM $4`,
      [p.storeId, p.targetType, p.targetId, p.channelId ?? null],
    );

    if (existing) {
      const row = await queryOne<DbAssortmentStoreEntry>(
        `UPDATE "assortmentStoreEntry"
         SET "effect" = $1, "position" = $2, "isHidden" = $3
         WHERE "assortmentStoreEntryId" = $4
         RETURNING *`,
        [p.effect, p.position, p.isHidden, existing.assortmentStoreEntryId],
      );
      if (!row) throw new Error('Failed to update assortment entry');
      return mapToEntry(row);
    }

    const row = await queryOne<DbAssortmentStoreEntry>(
      `INSERT INTO "assortmentStoreEntry" (
         "assortmentStoreEntryId", "storeId", "channelId", "targetType", "targetId", "effect", "position", "isHidden", "createdAt"
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [p.assortmentStoreEntryId, p.storeId, p.channelId ?? null, p.targetType, p.targetId, p.effect, p.position, p.isHidden, p.createdAt],
    );
    if (!row) throw new Error('Failed to create assortment entry');
    return mapToEntry(row);
  }

  async deleteEntry(assortmentStoreEntryId: string): Promise<boolean> {
    const row = await queryOne<{ assortmentStoreEntryId: string }>(
      `DELETE FROM "assortmentStoreEntry" WHERE "assortmentStoreEntryId" = $1 RETURNING "assortmentStoreEntryId"`,
      [assortmentStoreEntryId],
    );
    return !!row;
  }

  async deleteEntriesByStore(storeId: string): Promise<void> {
    await query(`DELETE FROM "assortmentStoreEntry" WHERE "storeId" = $1`, [storeId]);
  }
}

export default new StoreAssortmentRepositoryImpl();
