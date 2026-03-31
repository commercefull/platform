import { query, queryOne } from '../../../../libs/db';
import { StoreDispatch, StoreDispatchItemProps } from '../../domain/entities/StoreDispatch';
import {
  StoreDispatchRepository as IStoreDispatchRepository,
  DispatchFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/StoreDispatchRepository';

export class StoreDispatchRepository implements IStoreDispatchRepository {
  async findById(dispatchId: string): Promise<StoreDispatch | null> {
    const row = await queryOne<Record<string, any>>('SELECT * FROM "storeDispatch" WHERE "dispatchId" = $1', [dispatchId]);
    if (!row) return null;

    const items = await this.findItems(dispatchId);
    return this.mapToDispatch(row, items);
  }

  async findByNumber(dispatchNumber: string): Promise<StoreDispatch | null> {
    const row = await queryOne<Record<string, any>>('SELECT * FROM "storeDispatch" WHERE "dispatchNumber" = $1', [dispatchNumber]);
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

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM "storeDispatch" ${whereClause} ORDER BY "${orderBy}" ${orderDirection.toUpperCase()} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    const dispatches = await Promise.all(
      (rows || []).map(async row => {
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
    };
  }

  async save(dispatch: StoreDispatch): Promise<StoreDispatch> {
    const existing = await queryOne<Record<string, any>>('SELECT "dispatchId" FROM "storeDispatch" WHERE "dispatchId" = $1', [dispatch.dispatchId]);
    const now = new Date().toISOString();

    if (existing) {
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
          dispatch.fromStoreId,
          dispatch.toStoreId,
          dispatch.dispatchNumber,
          dispatch.status,
          dispatch.requestedBy || null,
          dispatch.approvedBy || null,
          dispatch.dispatchedBy || null,
          dispatch.receivedBy || null,
          dispatch.requestedAt?.toISOString() || null,
          dispatch.approvedAt?.toISOString() || null,
          dispatch.dispatchedAt?.toISOString() || null,
          dispatch.receivedAt?.toISOString() || null,
          dispatch.notes || null,
          dispatch.metadata ? JSON.stringify(dispatch.metadata) : null,
          now,
          dispatch.dispatchId,
        ],
      );

      await query('DELETE FROM "storeDispatchItem" WHERE "dispatchId" = $1', [dispatch.dispatchId]);
    } else {
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
          dispatch.fromStoreId,
          dispatch.toStoreId,
          dispatch.dispatchNumber,
          dispatch.status,
          dispatch.requestedBy || null,
          dispatch.approvedBy || null,
          dispatch.dispatchedBy || null,
          dispatch.receivedBy || null,
          dispatch.requestedAt?.toISOString() || null,
          dispatch.approvedAt?.toISOString() || null,
          dispatch.dispatchedAt?.toISOString() || null,
          dispatch.receivedAt?.toISOString() || null,
          dispatch.notes || null,
          dispatch.metadata ? JSON.stringify(dispatch.metadata) : null,
          dispatch.createdAt.toISOString(),
          now,
        ],
      );
    }

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

    return (await this.findById(dispatch.dispatchId))!;
  }

  async delete(dispatchId: string): Promise<void> {
    await query('DELETE FROM "storeDispatchItem" WHERE "dispatchId" = $1', [dispatchId]);
    await query('DELETE FROM "storeDispatch" WHERE "dispatchId" = $1', [dispatchId]);
  }

  private async findItems(dispatchId: string): Promise<StoreDispatchItemProps[]> {
    const rows = await query<Record<string, any>[]>('SELECT * FROM "storeDispatchItem" WHERE "dispatchId" = $1 ORDER BY "createdAt" ASC', [dispatchId]);

    return (rows || []).map(row => ({
      dispatchItemId: row.dispatchItemId,
      dispatchId: row.dispatchId,
      productId: row.productId,
      variantId: row.variantId || undefined,
      sku: row.sku || undefined,
      productName: row.productName || undefined,
      requestedQuantity: parseInt(row.requestedQuantity || '0', 10),
      dispatchedQuantity: parseInt(row.dispatchedQuantity || '0', 10),
      receivedQuantity: parseInt(row.receivedQuantity || '0', 10),
      notes: row.notes || undefined,
    }));
  }

  private buildWhereClause(filters?: DispatchFilters): { whereClause: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

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

  private mapToDispatch(row: Record<string, any>, items: StoreDispatchItemProps[]): StoreDispatch {
    return StoreDispatch.reconstitute({
      dispatchId: row.dispatchId,
      fromStoreId: row.fromStoreId,
      toStoreId: row.toStoreId,
      dispatchNumber: row.dispatchNumber,
      status: row.status,
      items,
      requestedBy: row.requestedBy || undefined,
      approvedBy: row.approvedBy || undefined,
      dispatchedBy: row.dispatchedBy || undefined,
      receivedBy: row.receivedBy || undefined,
      requestedAt: row.requestedAt ? new Date(row.requestedAt) : undefined,
      approvedAt: row.approvedAt ? new Date(row.approvedAt) : undefined,
      dispatchedAt: row.dispatchedAt ? new Date(row.dispatchedAt) : undefined,
      receivedAt: row.receivedAt ? new Date(row.receivedAt) : undefined,
      notes: row.notes || undefined,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}

export const storeDispatchRepository = new StoreDispatchRepository();
export default storeDispatchRepository;
