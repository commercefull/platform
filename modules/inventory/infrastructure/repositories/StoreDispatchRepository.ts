import { query, queryOne } from '../../../../libs/db';
import { StoreDispatch, StoreDispatchItemProps } from '../../domain/entities/StoreDispatch';
import { StoreDispatchRepository as IStoreDispatchRepository, DispatchFilters } from '../../domain/repositories/StoreDispatchRepository';
import { PaginationOptions, PaginatedResult } from 'libs/types/pagination';
import { StoreDispatch as DbStoreDispatch, StoreDispatchItem as DbStoreDispatchItem } from '../../../../libs/db/types';
import { isUuid } from '../../../../libs/uuid';

// JSONB columns arrive pre-parsed or as JSON strings depending on driver
// config — normalise both to objects; falsy values map to undefined.
function fromJson<T>(value: unknown): T | undefined {
  if (!value) return undefined;
  return (typeof value === 'string' ? JSON.parse(value) : value) as T;
}

function isoOrNull(date: Date | undefined): string | null {
  return date ? date.toISOString() : null;
}

function toDate(value: string | Date | null | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

export class StoreDispatchRepository implements IStoreDispatchRepository {
  async findById(dispatchId: string): Promise<StoreDispatch | null> {
    const row = await queryOne<DbStoreDispatch>('SELECT * FROM "storeDispatch" WHERE "dispatchId" = $1', [dispatchId]);
    if (!row) return null;

    const items = await this.findItems(dispatchId);
    return this.mapToDispatch(row, items);
  }

  async findByNumber(dispatchNumber: string): Promise<StoreDispatch | null> {
    const row = await queryOne<DbStoreDispatch>('SELECT * FROM "storeDispatch" WHERE "dispatchNumber" = $1', [dispatchNumber]);
    if (!row) return null;

    const items = await this.findItems(row.dispatchId);
    return this.mapToDispatch(row, items);
  }

  async findAll(filters?: DispatchFilters, pagination?: PaginationOptions): Promise<PaginatedResult<StoreDispatch>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDirection = pagination?.orderDirection || 'desc';
    const { whereClause, params } = this.buildWhereClause(filters);

    const countRow = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "storeDispatch" ${whereClause}`, params);
    const total = parseInt(countRow?.count || '0', 10);

    const rows = await query<DbStoreDispatch[]>(
      `SELECT * FROM "storeDispatch" ${whereClause} ORDER BY "${orderBy}" ${orderDirection.toUpperCase()} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    const dispatches = await Promise.all(
      (rows || []).map(async (row: DbStoreDispatch) => {
        const items = await this.findItems(row.dispatchId);
        return this.mapToDispatch(row, items);
      }),
    );

    return {
      data: dispatches,
      total,
      limit,
      offset,
      hasMore: offset + dispatches.length < total,
      length: dispatches.length,
    };
  }

  async save(dispatch: StoreDispatch): Promise<StoreDispatch> {
    const existing = await queryOne<DbStoreDispatch>('SELECT "dispatchId" FROM "storeDispatch" WHERE "dispatchId" = $1', [
      dispatch.dispatchId,
    ]);

    if (existing) {
      await this.updateDispatch(dispatch);
      await query('DELETE FROM "storeDispatchItem" WHERE "dispatchId" = $1', [dispatch.dispatchId]);
    } else {
      await this.insertDispatch(dispatch);
    }

    await this.insertDispatchItems(dispatch);

    return (await this.findById(dispatch.dispatchId))!;
  }

  // Sanitize actor IDs that are stored in UUID columns; persist human
  // names in metadata when not UUIDs
  private resolveDispatchActors(dispatch: StoreDispatch) {
    const approvedById = isUuid(dispatch.approvedBy) ? dispatch.approvedBy : null;
    const dispatchedById = isUuid(dispatch.dispatchedBy) ? dispatch.dispatchedBy : null;
    const receivedById = isUuid(dispatch.receivedBy) ? dispatch.receivedBy : null;
    const requestedById = isUuid(dispatch.requestedBy) ? dispatch.requestedBy : null;

    const metadata = {
      ...(dispatch.metadata || {}),
      actorNames: {
        requestedByName: !requestedById && dispatch.requestedBy ? String(dispatch.requestedBy) : undefined,
        approvedByName: !approvedById && dispatch.approvedBy ? String(dispatch.approvedBy) : undefined,
        dispatchedByName: !dispatchedById && dispatch.dispatchedBy ? String(dispatch.dispatchedBy) : undefined,
        receivedByName: !receivedById && dispatch.receivedBy ? String(dispatch.receivedBy) : undefined,
      },
    } as Record<string, unknown>;

    return { approvedById, dispatchedById, receivedById, requestedById, metadata };
  }

  private dispatchRowValues(dispatch: StoreDispatch, actors: ReturnType<StoreDispatchRepository['resolveDispatchActors']>) {
    return {
      fromStoreId: dispatch.fromStoreId,
      toStoreId: dispatch.toStoreId,
      dispatchNumber: dispatch.dispatchNumber,
      status: dispatch.status,
      requestedBy: actors.requestedById,
      approvedBy: actors.approvedById,
      dispatchedBy: actors.dispatchedById,
      receivedBy: actors.receivedById,
      requestedAt: isoOrNull(dispatch.requestedAt),
      approvedAt: isoOrNull(dispatch.approvedAt),
      dispatchedAt: isoOrNull(dispatch.dispatchedAt),
      receivedAt: isoOrNull(dispatch.receivedAt),
      notes: dispatch.notes || null,
      metadata: JSON.stringify(actors.metadata),
    };
  }

  private async updateDispatch(dispatch: StoreDispatch): Promise<void> {
    const v = this.dispatchRowValues(dispatch, this.resolveDispatchActors(dispatch));
    await query(
      `UPDATE "storeDispatch" SET
          "fromStoreId" = $1,
          "toStoreId" = $2,
          "dispatchNumber" = $3,
          "status" = $4,
          "requestedBy" = $5,
          "approvedBy" = $6,
          "dispatchedBy" = $7,
          "receivedBy" = $8,
          "requestedAt" = $9,
          "approvedAt" = $10,
          "dispatchedAt" = $11,
          "receivedAt" = $12,
          "notes" = $13,
          "metadata" = $14,
          "updatedAt" = $15
        WHERE "dispatchId" = $16`,
      [
        v.fromStoreId,
        v.toStoreId,
        v.dispatchNumber,
        v.status,
        v.requestedBy,
        v.approvedBy,
        v.dispatchedBy,
        v.receivedBy,
        v.requestedAt,
        v.approvedAt,
        v.dispatchedAt,
        v.receivedAt,
        v.notes,
        v.metadata,
        new Date().toISOString(),
        dispatch.dispatchId,
      ],
    );
  }

  private async insertDispatch(dispatch: StoreDispatch): Promise<void> {
    const v = this.dispatchRowValues(dispatch, this.resolveDispatchActors(dispatch));
    await query(
      `INSERT INTO "storeDispatch" (
          "dispatchId", "fromStoreId", "toStoreId", "dispatchNumber", "status",
          "requestedBy", "approvedBy", "dispatchedBy", "receivedBy", "requestedAt",
          "approvedAt", "dispatchedAt", "receivedAt", "notes", "metadata", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17
        )`,
      [
        dispatch.dispatchId,
        v.fromStoreId,
        v.toStoreId,
        v.dispatchNumber,
        v.status,
        v.requestedBy,
        v.approvedBy,
        v.dispatchedBy,
        v.receivedBy,
        v.requestedAt,
        v.approvedAt,
        v.dispatchedAt,
        v.receivedAt,
        v.notes,
        v.metadata,
        dispatch.createdAt.toISOString(),
        new Date().toISOString(),
      ],
    );
  }

  private async insertDispatchItems(dispatch: StoreDispatch): Promise<void> {
    const now = new Date().toISOString();
    for (const item of dispatch.items) {
      await query(
        `INSERT INTO "storeDispatchItem" (
          "dispatchItemId", "dispatchId", "productId", "variantId", "sku", "productName",
          "requestedQuantity", "dispatchedQuantity", "receivedQuantity", "notes", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12
        )`,
        [
          item.dispatchItemId,
          dispatch.dispatchId,
          item.productId,
          item.variantId || null,
          item.sku || null,
          item.productName || null,
          item.requestedQuantity,
          item.dispatchedQuantity,
          item.receivedQuantity,
          item.notes || null,
          dispatch.createdAt.toISOString(),
          now,
        ],
      );
    }
  }

  async delete(dispatchId: string): Promise<void> {
    await query('DELETE FROM "storeDispatchItem" WHERE "dispatchId" = $1', [dispatchId]);
    await query('DELETE FROM "storeDispatch" WHERE "dispatchId" = $1', [dispatchId]);
  }

  private async findItems(dispatchId: string): Promise<StoreDispatchItemProps[]> {
    const rows = await query<DbStoreDispatchItem[]>('SELECT * FROM "storeDispatchItem" WHERE "dispatchId" = $1 ORDER BY "createdAt" ASC', [
      dispatchId,
    ]);

    return (rows || []).map((row: DbStoreDispatchItem) => ({
      dispatchItemId: row.dispatchItemId,
      dispatchId: row.dispatchId,
      productId: row.productId,
      variantId: row.variantId ?? undefined,
      sku: row.sku ?? undefined,
      productName: row.productName ?? undefined,
      requestedQuantity: row.requestedQuantity,
      dispatchedQuantity: row.dispatchedQuantity,
      receivedQuantity: row.receivedQuantity,
      notes: row.notes ?? undefined,
    }));
  }

  private buildWhereClause(filters?: DispatchFilters): { whereClause: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters?.fromStoreId) {
      conditions.push(`"fromStoreId" = $${params.length + 1}`);
      params.push(filters.fromStoreId);
    }
    if (filters?.toStoreId) {
      conditions.push(`"toStoreId" = $${params.length + 1}`);
      params.push(filters.toStoreId);
    }
    if (filters?.status) {
      conditions.push(`"status" = $${params.length + 1}`);
      params.push(filters.status);
    }
    if (filters?.dateFrom) {
      conditions.push(`"createdAt" >= $${params.length + 1}`);
      params.push(filters.dateFrom.toISOString());
    }
    if (filters?.dateTo) {
      conditions.push(`"createdAt" <= $${params.length + 1}`);
      params.push(filters.dateTo.toISOString());
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private mapToDispatch(row: DbStoreDispatch, items: StoreDispatchItemProps[]): StoreDispatch {
    const md = fromJson<Record<string, unknown>>(row.metadata);
    const actorNames = (md?.actorNames as Record<string, unknown> | undefined) || {};
    // UUID columns hold ids; non-UUID human names fall back to metadata
    const actor = (id: unknown, name: unknown) => (id as unknown as string) ?? (name as string | undefined) ?? undefined;
    return StoreDispatch.reconstitute({
      dispatchId: row.dispatchId,
      fromStoreId: row.fromStoreId,
      toStoreId: row.toStoreId,
      dispatchNumber: row.dispatchNumber,
      status: row.status as StoreDispatch['status'],
      items,
      requestedBy: actor(row.requestedBy, actorNames.requestedByName),
      approvedBy: actor(row.approvedBy, actorNames.approvedByName),
      dispatchedBy: actor(row.dispatchedBy, actorNames.dispatchedByName),
      receivedBy: actor(row.receivedBy, actorNames.receivedByName),
      requestedAt: toDate(row.requestedAt),
      approvedAt: toDate(row.approvedAt),
      dispatchedAt: toDate(row.dispatchedAt),
      receivedAt: toDate(row.receivedAt),
      notes: row.notes ?? undefined,
      metadata: md,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}

export default new StoreDispatchRepository();
