/**
 * Fulfillment Repository Implementation
 * PostgreSQL implementation of the fulfillment repository interface
 */

import { query, queryOne } from '../../../../libs/db';
import { withTransaction } from '../../../../libs/db';
import { Fulfillment as DbFulfillment, FulfillmentItem as DbFulfillmentItem } from '../../../../libs/db/types';
import { Fulfillment, FulfillmentProps, FulfillmentStatus, SourceType } from '../../domain/entities/Fulfillment';
import { FulfillmentItem } from '../../domain/entities/FulfillmentItem';
import { IFulfillmentRepository, FulfillmentFilters } from '../../domain/repositories/FulfillmentRepository';
import { PaginationOptions, PaginatedResult } from 'libs/types/pagination';

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
      await this.updateFulfillment(props, now);
    } else {
      // Insert
      await this.insertFulfillment(props, now);
    }

    const saved = await this.findById(props.fulfillmentId);
    return saved!;
  }

  private isoOrNull(value?: Date): string | null {
    return value?.toISOString() ?? null;
  }

  private fulfillmentCoreValues(props: FulfillmentProps): Record<string, unknown> {
    return {
      orderId: props.orderId,
      orderNumber: props.orderNumber || null,
      sourceType: props.sourceType,
      sourceId: props.sourceId,
      organizationId: props.organizationId || null,
      supplierId: props.supplierId || null,
      storeId: props.storeId || null,
      channelId: props.channelId || null,
      status: props.status,
    };
  }

  private fulfillmentCarrierValues(props: FulfillmentProps): Record<string, unknown> {
    return {
      carrierId: props.carrierId || null,
      carrierName: props.carrierName || null,
      shippingMethodId: props.shippingMethodId || null,
      shippingMethodName: props.shippingMethodName || null,
      trackingNumber: props.trackingNumber || null,
      trackingUrl: props.trackingUrl || null,
    };
  }

  private fulfillmentShippingValues(props: FulfillmentProps): Record<string, unknown> {
    return {
      shipFromAddress: JSON.stringify(props.shipFromAddress),
      shipToAddress: JSON.stringify(props.shipToAddress),
      fulfillmentPartnerId: props.fulfillmentPartnerId || null,
      weightGrams: props.weightGrams || null,
      lengthCm: props.lengthCm || null,
      widthCm: props.widthCm || null,
      heightCm: props.heightCm || null,
      shippingCostCents: props.shippingCostCents || null,
      insuranceCostCents: props.insuranceCostCents || null,
    };
  }

  private fulfillmentLifecycleValues(props: FulfillmentProps): Record<string, unknown> {
    return {
      notes: props.notes || null,
      internalNotes: props.internalNotes || null,
      assignedAt: this.isoOrNull(props.assignedAt),
      pickingStartedAt: this.isoOrNull(props.pickingStartedAt),
      pickedAt: this.isoOrNull(props.pickedAt),
      packingStartedAt: this.isoOrNull(props.packingStartedAt),
      packedAt: this.isoOrNull(props.packedAt),
      shippedAt: this.isoOrNull(props.shippedAt),
      deliveredAt: this.isoOrNull(props.deliveredAt),
      cancelledAt: this.isoOrNull(props.cancelledAt),
      failedAt: this.isoOrNull(props.failedAt),
      failureReason: props.failureReason || null,
    };
  }

  private fulfillmentRowValues(props: FulfillmentProps, now: string): Record<string, unknown> {
    return {
      fulfillmentId: props.fulfillmentId,
      createdAt: now,
      updatedAt: now,
      ...this.fulfillmentCoreValues(props),
      ...this.fulfillmentCarrierValues(props),
      ...this.fulfillmentShippingValues(props),
      ...this.fulfillmentLifecycleValues(props),
    };
  }

  private async updateFulfillment(props: FulfillmentProps, now: string): Promise<void> {
    const v = this.fulfillmentRowValues(props, now);
    await query(
      `UPDATE fulfillment SET
          "orderId" = $1,
          "orderNumber" = $2,
          "sourceType" = $3,
          "sourceId" = $4,
          "organizationId" = $5,
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
          "shippingCostCents" = $23,
          "insuranceCostCents" = $24,
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
        v.orderId,
        v.orderNumber,
        v.sourceType,
        v.sourceId,
        v.organizationId,
        v.supplierId,
        v.storeId,
        v.channelId,
        v.status,
        v.carrierId,
        v.carrierName,
        v.shippingMethodId,
        v.shippingMethodName,
        v.trackingNumber,
        v.trackingUrl,
        v.shipFromAddress,
        v.shipToAddress,
        v.fulfillmentPartnerId,
        v.weightGrams,
        v.lengthCm,
        v.widthCm,
        v.heightCm,
        v.shippingCostCents,
        v.insuranceCostCents,
        v.notes,
        v.internalNotes,
        v.assignedAt,
        v.pickingStartedAt,
        v.pickedAt,
        v.packingStartedAt,
        v.packedAt,
        v.shippedAt,
        v.deliveredAt,
        v.cancelledAt,
        v.failedAt,
        v.failureReason,
        v.updatedAt,
        v.fulfillmentId,
      ],
    );
  }

  private async insertFulfillment(props: FulfillmentProps, now: string): Promise<void> {
    const v = this.fulfillmentRowValues(props, now);
    await query(
      `INSERT INTO fulfillment (
          "fulfillmentId", "orderId", "orderNumber", "sourceType", "sourceId",
          "organizationId", "supplierId", "storeId", "channelId", status,
          "carrierId", "carrierName", "shippingMethodId", "shippingMethodName",
          "trackingNumber", "trackingUrl", "shipFromAddress", "shipToAddress",
          "fulfillmentPartnerId", "weightGrams", "lengthCm", "widthCm", "heightCm",
          "shippingCostCents", "insuranceCostCents", notes, "internalNotes",
          "assignedAt", "pickingStartedAt", "pickedAt", "packingStartedAt",
          "packedAt", "shippedAt", "deliveredAt", "cancelledAt", "failedAt",
          "failureReason", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
          $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39
        )`,
      [
        v.fulfillmentId,
        v.orderId,
        v.orderNumber,
        v.sourceType,
        v.sourceId,
        v.organizationId,
        v.supplierId,
        v.storeId,
        v.channelId,
        v.status,
        v.carrierId,
        v.carrierName,
        v.shippingMethodId,
        v.shippingMethodName,
        v.trackingNumber,
        v.trackingUrl,
        v.shipFromAddress,
        v.shipToAddress,
        v.fulfillmentPartnerId,
        v.weightGrams,
        v.lengthCm,
        v.widthCm,
        v.heightCm,
        v.shippingCostCents,
        v.insuranceCostCents,
        v.notes,
        v.internalNotes,
        v.assignedAt,
        v.pickingStartedAt,
        v.pickedAt,
        v.packingStartedAt,
        v.packedAt,
        v.shippedAt,
        v.deliveredAt,
        v.cancelledAt,
        v.failedAt,
        v.failureReason,
        v.createdAt,
        v.updatedAt,
      ],
    );
  }

  async findById(fulfillmentId: string): Promise<Fulfillment | null> {
    const row = await queryOne<DbFulfillment>('SELECT * FROM fulfillment WHERE "fulfillmentId" = $1', [fulfillmentId]);

    if (!row) return null;
    return this.mapToFulfillment(row);
  }

  async findByOrderId(orderId: string): Promise<Fulfillment[]> {
    const rows = await query<DbFulfillment[]>('SELECT * FROM fulfillment WHERE "orderId" = $1 ORDER BY "createdAt" DESC', [orderId]);

    return (rows || []).map(row => this.mapToFulfillment(row));
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

    const data = (rows || []).map(row => this.mapToFulfillment(row));

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
    return this.mapToFulfillment(row);
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
      await this.updateItem(props);
    } else {
      await this.insertItem(props);
    }

    const saved = await this.findItem(props.fulfillmentItemId);
    return saved!;
  }

  private itemRowValues(props: ReturnType<FulfillmentItem['toPersistence']>) {
    return {
      quantityOrdered: props.quantityOrdered,
      quantityFulfilled: props.quantityFulfilled,
      quantityPicked: props.quantityPicked || null,
      quantityPacked: props.quantityPacked || null,
      warehouseLocation: props.warehouseLocation || null,
      binLocation: props.binLocation || null,
      serialNumbers: props.serialNumbers ? JSON.stringify(props.serialNumbers) : null,
      lotNumbers: props.lotNumbers ? JSON.stringify(props.lotNumbers) : null,
      isPicked: props.isPicked,
      isPacked: props.isPacked,
      pickedAt: props.pickedAt?.toISOString() || null,
      packedAt: props.packedAt?.toISOString() || null,
    };
  }

  private async updateItem(props: ReturnType<FulfillmentItem['toPersistence']>): Promise<void> {
    const now = new Date().toISOString();
    const v = this.itemRowValues(props);
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
        v.quantityOrdered,
        v.quantityFulfilled,
        v.quantityPicked,
        v.quantityPacked,
        v.warehouseLocation,
        v.binLocation,
        v.serialNumbers,
        v.lotNumbers,
        v.isPicked,
        v.isPacked,
        v.pickedAt,
        v.packedAt,
        now,
        props.fulfillmentItemId,
      ],
    );
  }

  private async insertItem(props: ReturnType<FulfillmentItem['toPersistence']>): Promise<void> {
    const now = new Date().toISOString();
    const v = this.itemRowValues(props);
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
        v.quantityOrdered,
        v.quantityFulfilled,
        v.quantityPicked,
        v.quantityPacked,
        v.warehouseLocation,
        v.binLocation,
        v.serialNumbers,
        v.lotNumbers,
        v.isPicked,
        v.isPacked,
        v.pickedAt,
        v.packedAt,
        now,
        now,
      ],
    );
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

    return (rows || []).map(row => this.mapToFulfillmentItem(row));
  }

  async findItem(fulfillmentItemId: string): Promise<FulfillmentItem | null> {
    const row = await queryOne<DbFulfillmentItem>('SELECT * FROM "fulfillmentItem" WHERE "fulfillmentItemId" = $1', [fulfillmentItemId]);

    if (!row) return null;
    return this.mapToFulfillmentItem(row);
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

  private mapToFulfillment(row: DbFulfillment): Fulfillment {
    return Fulfillment.fromPersistence({
      ...this.fulfillmentIdentityFromRow(row),
      ...this.fulfillmentCarrierFromRow(row),
      ...this.fulfillmentParcelFromRow(row),
      ...this.fulfillmentDatesFromRow(row),
      createdAt: new Date(row.createdAt ?? new Date()),
      updatedAt: new Date(row.updatedAt ?? new Date()),
    });
  }

  private fulfillmentIdentityFromRow(row: DbFulfillment) {
    return {
      fulfillmentId: row.fulfillmentId,
      orderId: row.orderId,
      orderNumber: row.orderNumber ?? undefined,
      sourceType: row.sourceType as SourceType,
      sourceId: row.sourceId,
      organizationId: row.organizationId ?? undefined,
      supplierId: row.supplierId ?? undefined,
      storeId: row.storeId ?? undefined,
      channelId: row.channelId ?? undefined,
      status: row.status as FulfillmentStatus,
      fulfillmentPartnerId: row.fulfillmentPartnerId ?? undefined,
    };
  }

  private fulfillmentCarrierFromRow(row: DbFulfillment) {
    const emptyAddress = { addressLine1: '', city: '', postalCode: '', countryCode: '' };
    return {
      carrierId: row.carrierId ?? undefined,
      carrierName: row.carrierName ?? undefined,
      shippingMethodId: row.shippingMethodId ?? undefined,
      shippingMethodName: row.shippingMethodName ?? undefined,
      trackingNumber: row.trackingNumber ?? undefined,
      trackingUrl: row.trackingUrl ?? undefined,
      shipFromAddress: this.parseJson(row.shipFromAddress, emptyAddress),
      shipToAddress: this.parseJson(row.shipToAddress, emptyAddress),
    };
  }

  private fulfillmentParcelFromRow(row: DbFulfillment) {
    return {
      weightGrams: row.weightGrams ?? undefined,
      lengthCm: row.lengthCm ?? undefined,
      widthCm: row.widthCm ?? undefined,
      heightCm: row.heightCm ?? undefined,
      shippingCostCents: row.shippingCostCents != null ? Number(row.shippingCostCents) : undefined,
      insuranceCostCents: row.insuranceCostCents != null ? Number(row.insuranceCostCents) : undefined,
      notes: row.notes ?? undefined,
      internalNotes: row.internalNotes ?? undefined,
      failureReason: row.failureReason ?? undefined,
    };
  }

  private fulfillmentDatesFromRow(row: DbFulfillment) {
    return {
      assignedAt: row.assignedAt ? new Date(row.assignedAt) : undefined,
      pickingStartedAt: row.pickingStartedAt ? new Date(row.pickingStartedAt) : undefined,
      pickedAt: row.pickedAt ? new Date(row.pickedAt) : undefined,
      packingStartedAt: row.packingStartedAt ? new Date(row.packingStartedAt) : undefined,
      packedAt: row.packedAt ? new Date(row.packedAt) : undefined,
      shippedAt: row.shippedAt ? new Date(row.shippedAt) : undefined,
      deliveredAt: row.deliveredAt ? new Date(row.deliveredAt) : undefined,
      cancelledAt: row.cancelledAt ? new Date(row.cancelledAt) : undefined,
      failedAt: row.failedAt ? new Date(row.failedAt) : undefined,
    };
  }

  private mapToFulfillmentItem(row: DbFulfillmentItem): FulfillmentItem {
    return FulfillmentItem.fromPersistence({
      fulfillmentItemId: row.fulfillmentItemId,
      fulfillmentId: row.fulfillmentId,
      orderItemId: row.orderItemId,
      productId: row.productId,
      variantId: row.variantId ?? undefined,
      sku: row.sku,
      name: row.name,
      quantityOrdered: row.quantityOrdered,
      quantityFulfilled: row.quantityFulfilled ?? 0,
      quantityPicked: row.quantityPicked ?? undefined,
      quantityPacked: row.quantityPacked ?? undefined,
      warehouseLocation: row.warehouseLocation ?? undefined,
      binLocation: row.binLocation ?? undefined,
      serialNumbers: this.parseJson(row.serialNumbers, undefined),
      lotNumbers: this.parseJson(row.lotNumbers, undefined),
      isPicked: Boolean(row.isPicked),
      isPacked: Boolean(row.isPacked),
      pickedAt: row.pickedAt ? new Date(row.pickedAt) : undefined,
      packedAt: row.packedAt ? new Date(row.packedAt) : undefined,
      createdAt: new Date(row.createdAt ?? new Date()),
      updatedAt: new Date(row.updatedAt ?? new Date()),
    });
  }

  private parseJson<T>(value: unknown, defaultValue: T): T {
    if (!value) return defaultValue;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return defaultValue;
      }
    }
    return value as T;
  }
}

export default new FulfillmentRepository();
