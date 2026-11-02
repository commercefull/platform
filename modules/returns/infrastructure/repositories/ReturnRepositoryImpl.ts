import { query, queryOne } from '../../../../libs/db';
import type { ReturnRequestRepository, ReturnItemRepository } from '../../domain/repositories/ReturnRepository';
import { ReturnRequest } from '../../domain/entities/ReturnRequest';
import type {
  ReturnStatus,
  ReturnType,
  ReturnItem,
  ReturnCarrier,
  ReturnItemCondition,
  ReturnItemReason,
  WarrantyStatus,
} from '../../domain/entities/ReturnRequest';
import { ReturnValidationError } from '../../domain/errors/ReturnErrors';
import type { OrderReturn as DbOrderReturn, OrderReturnItem as DbOrderReturnItem } from '../../../../libs/db/types';

type ReturnDbRow = DbOrderReturn;

// Null → undefined coercion kept out of row mapping to keep complexity low.
function opt<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

type ReturnItemDbRow = DbOrderReturnItem;

function itemRowToEntity(row: ReturnItemDbRow): ReturnItem {
  return {
    orderReturnItemId: row.orderReturnItemId,
    orderReturnId: row.orderReturnId,
    orderItemId: row.orderItemId,
    quantity: row.quantity,
    returnReason: row.returnReason as ReturnItemReason,
    returnReasonDetail: row.returnReasonDetail ?? undefined,
    condition: row.condition as ReturnItemCondition,
    restockItem: row.restockItem,
    refundAmountCents: row.refundAmountCents ?? undefined,
    exchangeProductId: row.exchangeProductId ?? undefined,
    exchangeVariantId: row.exchangeVariantId ?? undefined,
    notes: row.notes ?? undefined,
    inspectionNotes: row.inspectionNotes ?? undefined,
    warrantyClaimId: row.warrantyClaimId ?? undefined,
    warrantyStatus: (row.warrantyStatus ?? 'none') as WarrantyStatus,
    warrantyExpiresAt: row.warrantyExpiresAt ?? undefined,
    createdAt: row.createdAt,
  };
}

function rowToEntity(row: ReturnDbRow, items: ReturnItem[] = []): ReturnRequest {
  return ReturnRequest.reconstitute({
    orderReturnId: row.orderReturnId,
    orderId: row.orderId,
    returnNumber: row.returnNumber,
    customerId: opt(row.customerId),
    status: row.status as ReturnStatus,
    returnType: row.returnType as ReturnType,
    requestedAt: row.requestedAt,
    approvedAt: opt(row.approvedAt),
    receivedAt: opt(row.receivedAt),
    completedAt: opt(row.completedAt),
    rmaNumber: opt(row.rmaNumber),
    paymentRefundId: opt(row.paymentRefundId),
    returnShippingPaid: row.returnShippingPaid,
    returnShippingAmountCents: opt(row.returnShippingAmountCents),
    returnShippingLabel: opt(row.returnShippingLabel),
    returnCarrier: row.returnCarrier as ReturnCarrier,
    returnTrackingNumber: opt(row.returnTrackingNumber),
    returnTrackingUrl: opt(row.returnTrackingUrl),
    returnReason: opt(row.returnReason),
    returnInstructions: opt(row.returnInstructions),
    customerNotes: opt(row.customerNotes),
    adminNotes: opt(row.adminNotes),
    requiresInspection: row.requiresInspection,
    inspectionPassedItems: opt(row.inspectionPassedItems as Record<string, unknown> | null),
    inspectionFailedItems: opt(row.inspectionFailedItems as Record<string, unknown> | null),
    items,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export class ReturnRequestRepositoryImpl implements ReturnRequestRepository {
  async findById(id: string): Promise<ReturnRequest | null> {
    const row = await queryOne<DbOrderReturn>(`SELECT * FROM "orderReturn" WHERE "orderReturnId" = $1`, [id]);
    if (!row) return null;
    const items = await this.fetchItems(id);
    return rowToEntity(row, items);
  }

  async findByReturnNumber(returnNumber: string): Promise<ReturnRequest | null> {
    const row = await queryOne<DbOrderReturn>(`SELECT * FROM "orderReturn" WHERE "returnNumber" = $1`, [returnNumber]);
    if (!row) return null;
    const items = await this.fetchItems(row.orderReturnId);
    return rowToEntity(row, items);
  }

  async findByOrderId(orderId: string): Promise<ReturnRequest[]> {
    const rows = await query<DbOrderReturn[]>(`SELECT * FROM "orderReturn" WHERE "orderId" = $1 ORDER BY "requestedAt" DESC`, [orderId]);
    return Promise.all((rows || []).map(async r => rowToEntity(r, await this.fetchItems(r.orderReturnId))));
  }

  async findByCustomerId(customerId: string, limit = 50, offset = 0): Promise<ReturnRequest[]> {
    const rows = await query<DbOrderReturn[]>(
      `SELECT * FROM "orderReturn" WHERE "customerId" = $1 ORDER BY "requestedAt" DESC LIMIT $2 OFFSET $3`,
      [customerId, limit, offset],
    );
    return Promise.all((rows || []).map(async r => rowToEntity(r, await this.fetchItems(r.orderReturnId))));
  }

  async findByStatus(status: ReturnStatus, limit = 50, offset = 0): Promise<ReturnRequest[]> {
    const rows = await query<DbOrderReturn[]>(
      `SELECT * FROM "orderReturn" WHERE "status" = $1 ORDER BY "requestedAt" DESC LIMIT $2 OFFSET $3`,
      [status, limit, offset],
    );
    return Promise.all((rows || []).map(async r => rowToEntity(r, await this.fetchItems(r.orderReturnId))));
  }

  async findPending(limit = 50): Promise<ReturnRequest[]> {
    const rows = await query<DbOrderReturn[]>(
      `SELECT * FROM "orderReturn" WHERE "status" IN ('requested', 'approved', 'inTransit', 'received', 'inspected') ORDER BY "requestedAt" ASC LIMIT $1`,
      [limit],
    );
    return Promise.all((rows || []).map(async r => rowToEntity(r, await this.fetchItems(r.orderReturnId))));
  }

  async findInTransit(limit = 50): Promise<ReturnRequest[]> {
    const rows = await query<DbOrderReturn[]>(
      `SELECT * FROM "orderReturn" WHERE "status" = 'inTransit' ORDER BY "requestedAt" ASC LIMIT $1`,
      [limit],
    );
    return Promise.all((rows || []).map(async r => rowToEntity(r, await this.fetchItems(r.orderReturnId))));
  }

  async findNeedingInspection(limit = 50): Promise<ReturnRequest[]> {
    const rows = await query<DbOrderReturn[]>(
      `SELECT * FROM "orderReturn" WHERE "status" = 'received' AND "requiresInspection" = true ORDER BY "receivedAt" ASC LIMIT $1`,
      [limit],
    );
    return Promise.all((rows || []).map(async r => rowToEntity(r, await this.fetchItems(r.orderReturnId))));
  }

  async create(returnRequest: ReturnRequest): Promise<ReturnRequest> {
    const props = returnRequest.toJSON();
    const row = await queryOne<DbOrderReturn>(
      `INSERT INTO "orderReturn" (
        "orderId", "returnNumber", "customerId", "status", "returnType",
        "requestedAt", "returnShippingPaid", "returnCarrier",
        "returnReason", "customerNotes", "requiresInspection",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        props.orderId,
        props.returnNumber,
        props.customerId ?? null,
        props.status,
        props.returnType,
        props.requestedAt,
        props.returnShippingPaid,
        props.returnCarrier,
        props.returnReason ?? null,
        props.customerNotes ?? null,
        props.requiresInspection,
        props.createdAt,
        props.updatedAt,
      ],
    );
    if (!row) throw new ReturnValidationError('Failed to create return request');

    if (props.items.length > 0) {
      for (const item of props.items) {
        await query(
          `INSERT INTO "orderReturnItem" (
            "orderReturnId", "orderItemId", "quantity",
            "returnReason", "returnReasonDetail", "condition",
            "restockItem", "refundAmountCents", "exchangeProductId", "exchangeVariantId",
            "notes", "warrantyStatus", "createdAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            row.orderReturnId,
            item.orderItemId,
            item.quantity,
            item.returnReason,
            item.returnReasonDetail ?? null,
            item.condition,
            item.restockItem,
            item.refundAmountCents ?? null,
            item.exchangeProductId ?? null,
            item.exchangeVariantId ?? null,
            item.notes ?? null,
            item.warrantyStatus,
            item.createdAt,
          ],
        );
      }
    }

    const items = await this.fetchItems(row.orderReturnId);
    return rowToEntity(row, items);
  }

  async update(returnRequest: ReturnRequest): Promise<ReturnRequest | null> {
    const props = returnRequest.toJSON();
    const row = await queryOne<DbOrderReturn>(
      `UPDATE "orderReturn" SET
        "status" = $1, "approvedAt" = $2, "receivedAt" = $3, "completedAt" = $4,
        "rmaNumber" = $5, "paymentRefundId" = $6,
        "returnShippingPaid" = $7, "returnShippingAmountCents" = $8, "returnShippingLabel" = $9,
        "returnTrackingNumber" = $10, "returnTrackingUrl" = $11,
        "returnCarrier" = $12, "adminNotes" = $13,
        "inspectionPassedItems" = $14, "inspectionFailedItems" = $15,
        "updatedAt" = NOW()
       WHERE "orderReturnId" = $16 RETURNING *`,
      [
        props.status,
        props.approvedAt ?? null,
        props.receivedAt ?? null,
        props.completedAt ?? null,
        props.rmaNumber ?? null,
        props.paymentRefundId ?? null,
        props.returnShippingPaid,
        props.returnShippingAmountCents ?? null,
        props.returnShippingLabel ?? null,
        props.returnTrackingNumber ?? null,
        props.returnTrackingUrl ?? null,
        props.returnCarrier,
        props.adminNotes ?? null,
        props.inspectionPassedItems ? JSON.stringify(props.inspectionPassedItems) : null,
        props.inspectionFailedItems ? JSON.stringify(props.inspectionFailedItems) : null,
        props.orderReturnId,
      ],
    );
    if (!row) return null;
    const items = await this.fetchItems(row.orderReturnId);
    return rowToEntity(row, items);
  }

  async delete(id: string): Promise<boolean> {
    const row = await queryOne<{ orderReturnId: string }>(
      `DELETE FROM "orderReturn" WHERE "orderReturnId" = $1 RETURNING "orderReturnId"`,
      [id],
    );
    return !!row;
  }

  async countByStatus(status: ReturnStatus): Promise<number> {
    const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "orderReturn" WHERE "status" = $1`, [status]);
    return result ? parseInt(result.count, 10) : 0;
  }

  async countByCustomerId(customerId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "orderReturn" WHERE "customerId" = $1`, [customerId]);
    return result ? parseInt(result.count, 10) : 0;
  }

  async getStatistics(): Promise<Record<ReturnStatus, number>> {
    const rows = await query<Array<{ status: string; count: string }>>(
      `SELECT "status", COUNT(*) as count FROM "orderReturn" GROUP BY "status"`,
    );
    const stats = {
      requested: 0,
      approved: 0,
      denied: 0,
      inTransit: 0,
      received: 0,
      inspected: 0,
      completed: 0,
      cancelled: 0,
    } as Record<ReturnStatus, number>;
    for (const row of rows || []) {
      stats[row.status as ReturnStatus] = parseInt(row.count, 10);
    }
    return stats;
  }

  async getStatisticsByType(): Promise<Record<ReturnType, number>> {
    const rows = await query<Array<{ returnType: string; count: string }>>(
      `SELECT "returnType", COUNT(*) as count FROM "orderReturn" GROUP BY "returnType"`,
    );
    const stats = { refund: 0, exchange: 0, storeCredit: 0, repair: 0 } as Record<ReturnType, number>;
    for (const row of rows || []) {
      stats[row.returnType as ReturnType] = parseInt(row.count, 10);
    }
    return stats;
  }

  private async fetchItems(returnId: string): Promise<ReturnItem[]> {
    const rows = await query<DbOrderReturnItem[]>(`SELECT * FROM "orderReturnItem" WHERE "orderReturnId" = $1 ORDER BY "createdAt" ASC`, [
      returnId,
    ]);
    return (rows || []).map(itemRowToEntity);
  }
}

export class ReturnItemRepositoryImpl implements ReturnItemRepository {
  async findByReturnId(returnId: string): Promise<ReturnItem[]> {
    const rows = await query<DbOrderReturnItem[]>(`SELECT * FROM "orderReturnItem" WHERE "orderReturnId" = $1 ORDER BY "createdAt" ASC`, [
      returnId,
    ]);
    return (rows || []).map(itemRowToEntity);
  }

  async findById(itemId: string): Promise<ReturnItem | null> {
    const row = await queryOne<DbOrderReturnItem>(`SELECT * FROM "orderReturnItem" WHERE "orderReturnItemId" = $1`, [itemId]);
    return row ? itemRowToEntity(row) : null;
  }

  async createMany(returnId: string, items: ReturnItem[]): Promise<ReturnItem[]> {
    const created: ReturnItem[] = [];
    for (const item of items) {
      const row = await queryOne<DbOrderReturnItem>(
        `INSERT INTO "orderReturnItem" (
          "orderReturnId", "orderItemId", "quantity",
          "returnReason", "returnReasonDetail", "condition",
          "restockItem", "refundAmountCents", "exchangeProductId", "exchangeVariantId",
          "notes", "warrantyStatus", "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
        [
          returnId,
          item.orderItemId,
          item.quantity,
          item.returnReason,
          item.returnReasonDetail ?? null,
          item.condition,
          item.restockItem,
          item.refundAmountCents ?? null,
          item.exchangeProductId ?? null,
          item.exchangeVariantId ?? null,
          item.notes ?? null,
          item.warrantyStatus,
          item.createdAt,
        ],
      );
      if (row) created.push(itemRowToEntity(row));
    }
    return created;
  }

  async updateInspection(itemId: string, inspectionNotes: string, condition: string, restockItem: boolean): Promise<ReturnItem | null> {
    const row = await queryOne<DbOrderReturnItem>(
      `UPDATE "orderReturnItem" SET
        "inspectionNotes" = $1, "condition" = $2, "restockItem" = $3
       WHERE "orderReturnItemId" = $4 RETURNING *`,
      [inspectionNotes, condition, restockItem, itemId],
    );
    return row ? itemRowToEntity(row) : null;
  }
}

export { StoreCreditRepositoryImpl } from './storeCreditRepositoryImpl';
