/**
 * Fulfillment Repository Implementation
 * PostgreSQL implementation of the fulfillment repository interface
 */

import { query, queryOne } from '../../../../libs/db';
import { withTransaction } from '../../../../libs/db';
import { Fulfillment as DbFulfillment, FulfillmentItem as DbFulfillmentItem } from '../../../../libs/db/types';
import { Fulfillment, FulfillmentStatus } from '../../domain/entities/Fulfillment';
import { FulfillmentItem } from '../../domain/entities/FulfillmentItem';
import { IFulfillmentRepository, FulfillmentFilters } from '../../domain/repositories/FulfillmentRepository';
import { PaginationOptions, PaginatedResult } from 'libs/types/pagination';
import { insertFulfillment, insertItem, updateFulfillment, updateItem } from './fulfillmentWriteQueries';
import { mapToFulfillment, mapToFulfillmentItem } from './fulfillmentRowMappers';

export class FulfillmentRepository implements IFulfillmentRepository {
  // ===== Fulfillment Operations =====

  async save(fulfillment: Fulfillment): Promise<Fulfillment> {
    const props = fulfillment.toPersistence();
    const now = new Date().toISOString();

    const existing = await queryOne<Pick<DbFulfillment, 'fulfillmentId'>>(
      'SELECT "fulfillmentId" FROM fulfillment WHERE "fulfillmentId" = $1',
      [props.fulfillmentId],
    );

    if (existing) {
      // Update
      await updateFulfillment(props, now);
    } else {
      // Insert
      await insertFulfillment(props, now);
    }

    const saved = await this.findById(props.fulfillmentId);
    return saved!;
  }

  async findById(fulfillmentId: string): Promise<Fulfillment | null> {
    const row = await queryOne<DbFulfillment>('SELECT * FROM fulfillment WHERE "fulfillmentId" = $1', [fulfillmentId]);

    if (!row) return null;
    return mapToFulfillment(row);
  }

  async findByOrderId(orderId: string): Promise<Fulfillment[]> {
    const rows = await query<DbFulfillment[]>('SELECT * FROM fulfillment WHERE "orderId" = $1 ORDER BY "createdAt" DESC', [orderId]);

    return (rows || []).map(row => mapToFulfillment(row));
  }

  async findAll(filters?: FulfillmentFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Fulfillment>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;

    const { whereClause, params } = this.buildWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM fulfillment ${whereClause}`, params);
    const total = parseInt(countResult?.count || '0', 10);

    const rows = await query<DbFulfillment[]>(
      `SELECT * FROM fulfillment ${whereClause}
       ORDER BY "createdAt" DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    const data = (rows || []).map(row => mapToFulfillment(row));

    return {
      data,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
      length: data.length,
    };
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Fulfillment | null> {
    const row = await queryOne<DbFulfillment>('SELECT * FROM fulfillment WHERE "trackingNumber" = $1', [trackingNumber]);

    if (!row) return null;
    return mapToFulfillment(row);
  }

  async delete(fulfillmentId: string): Promise<boolean> {
    return withTransaction(async tx => {
      // Delete items first
      await tx.query('DELETE FROM "fulfillmentItem" WHERE "fulfillmentId" = $1', [fulfillmentId]);

      await tx.query('DELETE FROM fulfillment WHERE "fulfillmentId" = $1', [fulfillmentId]);

      return true;
    });
  }

  // ===== Fulfillment Item Operations =====

  async saveItem(item: FulfillmentItem): Promise<FulfillmentItem> {
    const props = item.toPersistence();

    const existing = await queryOne<Pick<DbFulfillmentItem, 'fulfillmentItemId'>>(
      'SELECT "fulfillmentItemId" FROM "fulfillmentItem" WHERE "fulfillmentItemId" = $1',
      [props.fulfillmentItemId],
    );

    if (existing) {
      await updateItem(props);
    } else {
      await insertItem(props);
    }

    const saved = await this.findItem(props.fulfillmentItemId);
    return saved!;
  }

  async saveItems(items: FulfillmentItem[]): Promise<FulfillmentItem[]> {
    const savedItems: FulfillmentItem[] = [];
    for (const item of items) {
      const saved = await this.saveItem(item);
      savedItems.push(saved);
    }
    return savedItems;
  }

  async findItemsByFulfillmentId(fulfillmentId: string): Promise<FulfillmentItem[]> {
    const rows = await query<DbFulfillmentItem[]>('SELECT * FROM "fulfillmentItem" WHERE "fulfillmentId" = $1 ORDER BY "createdAt" ASC', [
      fulfillmentId,
    ]);

    return (rows || []).map(row => mapToFulfillmentItem(row));
  }

  async findItem(fulfillmentItemId: string): Promise<FulfillmentItem | null> {
    const row = await queryOne<DbFulfillmentItem>('SELECT * FROM "fulfillmentItem" WHERE "fulfillmentItemId" = $1', [fulfillmentItemId]);

    if (!row) return null;
    return mapToFulfillmentItem(row);
  }

  async deleteItem(fulfillmentItemId: string): Promise<boolean> {
    await query('DELETE FROM "fulfillmentItem" WHERE "fulfillmentItemId" = $1', [fulfillmentItemId]);

    return true;
  }

  // ===== Batch Operations =====

  async updateStatus(fulfillmentId: string, status: FulfillmentStatus): Promise<boolean> {
    await query('UPDATE fulfillment SET status = $1, "updatedAt" = NOW() WHERE "fulfillmentId" = $2', [status, fulfillmentId]);

    return true;
  }

  async bulkUpdateStatus(fulfillmentIds: string[], status: FulfillmentStatus): Promise<number> {
    if (fulfillmentIds.length === 0) return 0;

    const placeholders = fulfillmentIds.map((_, i) => `$${i + 2}`).join(', ');
    await query(
      `UPDATE fulfillment SET status = $1, "updatedAt" = NOW()
       WHERE "fulfillmentId" IN (${placeholders})`,
      [status, ...fulfillmentIds],
    );

    return fulfillmentIds.length;
  }

  // ===== Helper Methods =====

  private buildWhereClause(filters?: FulfillmentFilters): {
    whereClause: string;
    params: unknown[];
  } {
    const b = { conditions: [] as string[], params: [] as unknown[] };

    this.addEqualityCondition(b, '"orderId"', filters?.orderId);
    this.addStatusCondition(b, filters?.status);
    this.addEqualityCondition(b, '"sourceType"', filters?.sourceType);
    this.addEqualityCondition(b, '"sourceId"', filters?.sourceId);
    this.addEqualityCondition(b, '"organizationId"', filters?.organizationId);
    this.addEqualityCondition(b, '"supplierId"', filters?.supplierId);
    this.addEqualityCondition(b, '"storeId"', filters?.storeId);
    this.addEqualityCondition(b, '"channelId"', filters?.channelId);
    this.addDateConditions(b, filters);

    return {
      whereClause: b.conditions.length > 0 ? `WHERE ${b.conditions.join(' AND ')}` : '',
      params: b.params,
    };
  }

  private addEqualityCondition(b: { conditions: string[]; params: unknown[] }, column: string, value: string | undefined): void {
    if (!value) return;
    b.conditions.push(`${column} = $${b.params.length + 1}`);
    b.params.push(value);
  }

  private addStatusCondition(b: { conditions: string[]; params: unknown[] }, status: FulfillmentFilters['status']): void {
    if (!status) return;
    if (Array.isArray(status)) {
      const placeholders = status.map((_, i) => `$${b.params.length + i + 1}`);
      b.conditions.push(`status IN (${placeholders.join(', ')})`);
      b.params.push(...status);
    } else {
      b.conditions.push(`status = $${b.params.length + 1}`);
      b.params.push(status);
    }
  }

  private addDateConditions(b: { conditions: string[]; params: unknown[] }, filters?: FulfillmentFilters): void {
    if (filters?.fromDate) {
      b.conditions.push(`"createdAt" >= $${b.params.length + 1}`);
      b.params.push(filters.fromDate.toISOString());
    }
    if (filters?.toDate) {
      b.conditions.push(`"createdAt" <= $${b.params.length + 1}`);
      b.params.push(filters.toDate.toISOString());
    }
  }
}

export default new FulfillmentRepository();
