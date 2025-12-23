/**
 * Fulfillment Repository Implementation
 * PostgreSQL implementation of the fulfillment repository interface
 */

import { query, queryOne } from '../../../../libs/db';
import { Fulfillment, FulfillmentStatus, SourceType } from '../../domain/entities/Fulfillment';
import { FulfillmentItem } from '../../domain/entities/FulfillmentItem';
import {
  IFulfillmentRepository,
  FulfillmentFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/FulfillmentRepository';

export class FulfillmentRepository implements IFulfillmentRepository {
  // ===== Fulfillment Operations =====

  async save(fulfillment: Fulfillment): Promise<Fulfillment> {
    const props = fulfillment.toPersistence();
    const now = new Date().toISOString();

    const existing = await queryOne<Record<string, any>>('SELECT "fulfillmentId" FROM fulfillment WHERE "fulfillmentId" = $1', [
      props.fulfillmentId,
    ]);

    if (existing) {
      // Update
      await query(
        `UPDATE fulfillment SET
          "orderId" = $1,
          "orderNumber" = $2,
          "sourceType" = $3,
          "sourceId" = $4,
          "merchantId" = $5,
          "supplierId" = $6,
          "storeId" = $7,
          "channelId" = $8,
          status = $9,
          "carrierId" = $10,
          "carrierName" = $11,
          "shippingMethodId" = $12,
          "shippingMethodName" = $13,
          "trackingNumber" = $14,
          "trackingUrl" = $15,
          "shipFromAddress" = $16,
          "shipToAddress" = $17,
          "fulfillmentPartnerId" = $18,
          "weightGrams" = $19,
          "lengthCm" = $20,
          "widthCm" = $21,
          "heightCm" = $22,
          "shippingCost" = $23,
          "insuranceCost" = $24,
          notes = $25,
          "internalNotes" = $26,
          "assignedAt" = $27,
          "pickingStartedAt" = $28,
          "pickedAt" = $29,
          "packingStartedAt" = $30,
          "packedAt" = $31,
          "shippedAt" = $32,
          "deliveredAt" = $33,
          "cancelledAt" = $34,
          "failedAt" = $35,
          "failureReason" = $36,
          "updatedAt" = $37
        WHERE "fulfillmentId" = $38`,
        [
          props.orderId,
          props.orderNumber || null,
          props.sourceType,
          props.sourceId,
          props.merchantId || null,
          props.supplierId || null,
          props.storeId || null,
          props.channelId || null,
          props.status,
          props.carrierId || null,
          props.carrierName || null,
          props.shippingMethodId || null,
          props.shippingMethodName || null,
          props.trackingNumber || null,
          props.trackingUrl || null,
          JSON.stringify(props.shipFromAddress),
          JSON.stringify(props.shipToAddress),
          props.fulfillmentPartnerId || null,
          props.weightGrams || null,
          props.lengthCm || null,
          props.widthCm || null,
          props.heightCm || null,
          props.shippingCost || null,
          props.insuranceCost || null,
          props.notes || null,
          props.internalNotes || null,
          props.assignedAt?.toISOString() || null,
          props.pickingStartedAt?.toISOString() || null,
          props.pickedAt?.toISOString() || null,
          props.packingStartedAt?.toISOString() || null,
          props.packedAt?.toISOString() || null,
          props.shippedAt?.toISOString() || null,
          props.deliveredAt?.toISOString() || null,
          props.cancelledAt?.toISOString() || null,
          props.failedAt?.toISOString() || null,
          props.failureReason || null,
          now,
          props.fulfillmentId,
        ],
      );
    } else {
      // Insert
      await query(
        `INSERT INTO fulfillment (
          "fulfillmentId", "orderId", "orderNumber", "sourceType", "sourceId",
          "merchantId", "supplierId", "storeId", "channelId", status,
          "carrierId", "carrierName", "shippingMethodId", "shippingMethodName",
          "trackingNumber", "trackingUrl", "shipFromAddress", "shipToAddress",
          "fulfillmentPartnerId", "weightGrams", "lengthCm", "widthCm", "heightCm",
          "shippingCost", "insuranceCost", notes, "internalNotes",
          "assignedAt", "pickingStartedAt", "pickedAt", "packingStartedAt",
          "packedAt", "shippedAt", "deliveredAt", "cancelledAt", "failedAt",
          "failureReason", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
          $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39
        )`,
        [
          props.fulfillmentId,
          props.orderId,
          props.orderNumber || null,
          props.sourceType,
          props.sourceId,
          props.merchantId || null,
          props.supplierId || null,
          props.storeId || null,
          props.channelId || null,
          props.status,
          props.carrierId || null,
          props.carrierName || null,
          props.shippingMethodId || null,
          props.shippingMethodName || null,
          props.trackingNumber || null,
          props.trackingUrl || null,
          JSON.stringify(props.shipFromAddress),
          JSON.stringify(props.shipToAddress),
          props.fulfillmentPartnerId || null,
          props.weightGrams || null,
          props.lengthCm || null,
          props.widthCm || null,
          props.heightCm || null,
          props.shippingCost || null,
          props.insuranceCost || null,
          props.notes || null,
          props.internalNotes || null,
          props.assignedAt?.toISOString() || null,
          props.pickingStartedAt?.toISOString() || null,
          props.pickedAt?.toISOString() || null,
          props.packingStartedAt?.toISOString() || null,
          props.packedAt?.toISOString() || null,
          props.shippedAt?.toISOString() || null,
          props.deliveredAt?.toISOString() || null,
          props.cancelledAt?.toISOString() || null,
          props.failedAt?.toISOString() || null,
          props.failureReason || null,
          now,
          now,
        ],
      );
    }

    const saved = await this.findById(props.fulfillmentId);
    return saved!;
  }

  async findById(fulfillmentId: string): Promise<Fulfillment | null> {
    const row = await queryOne<Record<string, any>>('SELECT * FROM fulfillment WHERE "fulfillmentId" = $1', [fulfillmentId]);

    if (!row) return null;
    return this.mapToFulfillment(row);
  }

  async findByOrderId(orderId: string): Promise<Fulfillment[]> {
    const rows = await query<Record<string, any>[]>('SELECT * FROM fulfillment WHERE "orderId" = $1 ORDER BY "createdAt" DESC', [orderId]);

    return (rows || []).map(row => this.mapToFulfillment(row));
  }

  async findAll(filters?: FulfillmentFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Fulfillment>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const { whereClause, params } = this.buildWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM fulfillment ${whereClause}`, params);
    const total = parseInt(countResult?.count || '0', 10);

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM fulfillment ${whereClause}
       ORDER BY "createdAt" DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    const data = (rows || []).map(row => this.mapToFulfillment(row));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Fulfillment | null> {
    const row = await queryOne<Record<string, any>>('SELECT * FROM fulfillment WHERE "trackingNumber" = $1', [trackingNumber]);

    if (!row) return null;
    return this.mapToFulfillment(row);
  }

  async delete(fulfillmentId: string): Promise<boolean> {
    // Delete items first
    await query('DELETE FROM "fulfillmentItem" WHERE "fulfillmentId" = $1', [fulfillmentId]);

    const result = await query<{ rowCount?: number }>('DELETE FROM fulfillment WHERE "fulfillmentId" = $1', [fulfillmentId]);

    return (result as any)?.rowCount > 0;
  }

  // ===== Fulfillment Item Operations =====

  async saveItem(item: FulfillmentItem): Promise<FulfillmentItem> {
    const props = item.toPersistence();
    const now = new Date().toISOString();

    const existing = await queryOne<Record<string, any>>(
      'SELECT "fulfillmentItemId" FROM "fulfillmentItem" WHERE "fulfillmentItemId" = $1',
      [props.fulfillmentItemId],
    );

    if (existing) {
      await query(
        `UPDATE "fulfillmentItem" SET
          "quantityOrdered" = $1,
          "quantityFulfilled" = $2,
          "quantityPicked" = $3,
          "quantityPacked" = $4,
          "warehouseLocation" = $5,
          "binLocation" = $6,
          "serialNumbers" = $7,
          "lotNumbers" = $8,
          "isPicked" = $9,
          "isPacked" = $10,
          "pickedAt" = $11,
          "packedAt" = $12,
          "updatedAt" = $13
        WHERE "fulfillmentItemId" = $14`,
        [
          props.quantityOrdered,
          props.quantityFulfilled,
          props.quantityPicked || null,
          props.quantityPacked || null,
          props.warehouseLocation || null,
          props.binLocation || null,
          props.serialNumbers ? JSON.stringify(props.serialNumbers) : null,
          props.lotNumbers ? JSON.stringify(props.lotNumbers) : null,
          props.isPicked,
          props.isPacked,
          props.pickedAt?.toISOString() || null,
          props.packedAt?.toISOString() || null,
          now,
          props.fulfillmentItemId,
        ],
      );
    } else {
      await query(
        `INSERT INTO "fulfillmentItem" (
          "fulfillmentItemId", "fulfillmentId", "orderItemId", "productId",
          "variantId", sku, name, "quantityOrdered", "quantityFulfilled",
          "quantityPicked", "quantityPacked", "warehouseLocation", "binLocation",
          "serialNumbers", "lotNumbers", "isPicked", "isPacked",
          "pickedAt", "packedAt", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          props.fulfillmentItemId,
          props.fulfillmentId,
          props.orderItemId,
          props.productId,
          props.variantId || null,
          props.sku,
          props.name,
          props.quantityOrdered,
          props.quantityFulfilled,
          props.quantityPicked || null,
          props.quantityPacked || null,
          props.warehouseLocation || null,
          props.binLocation || null,
          props.serialNumbers ? JSON.stringify(props.serialNumbers) : null,
          props.lotNumbers ? JSON.stringify(props.lotNumbers) : null,
          props.isPicked,
          props.isPacked,
          props.pickedAt?.toISOString() || null,
          props.packedAt?.toISOString() || null,
          now,
          now,
        ],
      );
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
    const rows = await query<Record<string, any>[]>('SELECT * FROM "fulfillmentItem" WHERE "fulfillmentId" = $1 ORDER BY "createdAt" ASC', [
      fulfillmentId,
    ]);

    return (rows || []).map(row => this.mapToFulfillmentItem(row));
  }

  async findItem(fulfillmentItemId: string): Promise<FulfillmentItem | null> {
    const row = await queryOne<Record<string, any>>('SELECT * FROM "fulfillmentItem" WHERE "fulfillmentItemId" = $1', [fulfillmentItemId]);

    if (!row) return null;
    return this.mapToFulfillmentItem(row);
  }

  async deleteItem(fulfillmentItemId: string): Promise<boolean> {
    const result = await query<{ rowCount?: number }>('DELETE FROM "fulfillmentItem" WHERE "fulfillmentItemId" = $1', [fulfillmentItemId]);

    return (result as any)?.rowCount > 0;
  }

  // ===== Batch Operations =====

  async updateStatus(fulfillmentId: string, status: FulfillmentStatus): Promise<boolean> {
    const result = await query<{ rowCount?: number }>(
      'UPDATE fulfillment SET status = $1, "updatedAt" = NOW() WHERE "fulfillmentId" = $2',
      [status, fulfillmentId],
    );

    return (result as any)?.rowCount > 0;
  }

  async bulkUpdateStatus(fulfillmentIds: string[], status: FulfillmentStatus): Promise<number> {
    if (fulfillmentIds.length === 0) return 0;

    const placeholders = fulfillmentIds.map((_, i) => `$${i + 2}`).join(', ');
    const result = await query<{ rowCount?: number }>(
      `UPDATE fulfillment SET status = $1, "updatedAt" = NOW()
       WHERE "fulfillmentId" IN (${placeholders})`,
      [status, ...fulfillmentIds],
    );

    return (result as any)?.rowCount || 0;
  }

  // ===== Helper Methods =====

  private buildWhereClause(filters?: FulfillmentFilters): {
    whereClause: string;
    params: any[];
  } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.orderId) {
      conditions.push(`"orderId" = $${params.length + 1}`);
      params.push(filters.orderId);
    }

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        const placeholders = filters.status.map((_, i) => `$${params.length + i + 1}`);
        conditions.push(`status IN (${placeholders.join(', ')})`);
        params.push(...filters.status);
      } else {
        conditions.push(`status = $${params.length + 1}`);
        params.push(filters.status);
      }
    }

    if (filters?.sourceType) {
      conditions.push(`"sourceType" = $${params.length + 1}`);
      params.push(filters.sourceType);
    }

    if (filters?.sourceId) {
      conditions.push(`"sourceId" = $${params.length + 1}`);
      params.push(filters.sourceId);
    }

    if (filters?.merchantId) {
      conditions.push(`"merchantId" = $${params.length + 1}`);
      params.push(filters.merchantId);
    }

    if (filters?.supplierId) {
      conditions.push(`"supplierId" = $${params.length + 1}`);
      params.push(filters.supplierId);
    }

    if (filters?.storeId) {
      conditions.push(`"storeId" = $${params.length + 1}`);
      params.push(filters.storeId);
    }

    if (filters?.channelId) {
      conditions.push(`"channelId" = $${params.length + 1}`);
      params.push(filters.channelId);
    }

    if (filters?.fromDate) {
      conditions.push(`"createdAt" >= $${params.length + 1}`);
      params.push(filters.fromDate.toISOString());
    }

    if (filters?.toDate) {
      conditions.push(`"createdAt" <= $${params.length + 1}`);
      params.push(filters.toDate.toISOString());
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private mapToFulfillment(row: Record<string, any>): Fulfillment {
    return Fulfillment.fromPersistence({
      fulfillmentId: row.fulfillmentId,
      orderId: row.orderId,
      orderNumber: row.orderNumber || undefined,
      sourceType: row.sourceType as SourceType,
      sourceId: row.sourceId,
      merchantId: row.merchantId || undefined,
      supplierId: row.supplierId || undefined,
      storeId: row.storeId || undefined,
      channelId: row.channelId || undefined,
      status: row.status as FulfillmentStatus,
      carrierId: row.carrierId || undefined,
      carrierName: row.carrierName || undefined,
      shippingMethodId: row.shippingMethodId || undefined,
      shippingMethodName: row.shippingMethodName || undefined,
      trackingNumber: row.trackingNumber || undefined,
      trackingUrl: row.trackingUrl || undefined,
      shipFromAddress: this.parseJson(row.shipFromAddress, {
        addressLine1: '',
        city: '',
        postalCode: '',
        countryCode: '',
      }),
      shipToAddress: this.parseJson(row.shipToAddress, {
        addressLine1: '',
        city: '',
        postalCode: '',
        countryCode: '',
      }),
      fulfillmentPartnerId: row.fulfillmentPartnerId || undefined,
      weightGrams: row.weightGrams ? parseInt(row.weightGrams, 10) : undefined,
      lengthCm: row.lengthCm ? parseFloat(row.lengthCm) : undefined,
      widthCm: row.widthCm ? parseFloat(row.widthCm) : undefined,
      heightCm: row.heightCm ? parseFloat(row.heightCm) : undefined,
      shippingCost: row.shippingCost ? parseFloat(row.shippingCost) : undefined,
      insuranceCost: row.insuranceCost ? parseFloat(row.insuranceCost) : undefined,
      notes: row.notes || undefined,
      internalNotes: row.internalNotes || undefined,
      assignedAt: row.assignedAt ? new Date(row.assignedAt) : undefined,
      pickingStartedAt: row.pickingStartedAt ? new Date(row.pickingStartedAt) : undefined,
      pickedAt: row.pickedAt ? new Date(row.pickedAt) : undefined,
      packingStartedAt: row.packingStartedAt ? new Date(row.packingStartedAt) : undefined,
      packedAt: row.packedAt ? new Date(row.packedAt) : undefined,
      shippedAt: row.shippedAt ? new Date(row.shippedAt) : undefined,
      deliveredAt: row.deliveredAt ? new Date(row.deliveredAt) : undefined,
      cancelledAt: row.cancelledAt ? new Date(row.cancelledAt) : undefined,
      failedAt: row.failedAt ? new Date(row.failedAt) : undefined,
      failureReason: row.failureReason || undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  private mapToFulfillmentItem(row: Record<string, any>): FulfillmentItem {
    return FulfillmentItem.fromPersistence({
      fulfillmentItemId: row.fulfillmentItemId,
      fulfillmentId: row.fulfillmentId,
      orderItemId: row.orderItemId,
      productId: row.productId,
      variantId: row.variantId || undefined,
      sku: row.sku,
      name: row.name,
      quantityOrdered: parseInt(row.quantityOrdered, 10),
      quantityFulfilled: parseInt(row.quantityFulfilled || '0', 10),
      quantityPicked: row.quantityPicked ? parseInt(row.quantityPicked, 10) : undefined,
      quantityPacked: row.quantityPacked ? parseInt(row.quantityPacked, 10) : undefined,
      warehouseLocation: row.warehouseLocation || undefined,
      binLocation: row.binLocation || undefined,
      serialNumbers: this.parseJson(row.serialNumbers, undefined),
      lotNumbers: this.parseJson(row.lotNumbers, undefined),
      isPicked: Boolean(row.isPicked),
      isPacked: Boolean(row.isPacked),
      pickedAt: row.pickedAt ? new Date(row.pickedAt) : undefined,
      packedAt: row.packedAt ? new Date(row.packedAt) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  private parseJson<T>(value: any, defaultValue: T): T {
    if (!value) return defaultValue;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return defaultValue;
      }
    }
    return value;
  }
}

export const fulfillmentRepository = new FulfillmentRepository();
export default fulfillmentRepository;
