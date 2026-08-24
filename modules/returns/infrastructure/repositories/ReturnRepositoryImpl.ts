import { query, queryOne } from '../../../../libs/db';
import { logger } from '../../../../libs/logger';
import type { ReturnRequestRepository, ReturnItemRepository, StoreCreditRepository } from '../../domain/repositories/ReturnRepository';
import { ReturnRequest } from '../../domain/entities/ReturnRequest';
import type { ReturnStatus, ReturnType, ReturnItem, ReturnCarrier, ReturnItemCondition, ReturnItemReason, WarrantyStatus } from '../../domain/entities/ReturnRequest';
import { StoreCreditLedgerEntry } from '../../domain/entities/StoreCredit';
import type { StoreCreditEntryType, CustomerStoreCreditBalance } from '../../domain/entities/StoreCredit';
import { ReturnValidationError } from '../../domain/errors/ReturnErrors';

interface ReturnDbRow {
  orderReturnId: string;
  orderId: string;
  returnNumber: string;
  customerId: string | null;
  status: string;
  returnType: string;
  requestedAt: Date;
  approvedAt: Date | null;
  receivedAt: Date | null;
  completedAt: Date | null;
  rmaNumber: string | null;
  paymentRefundId: string | null;
  returnShippingPaid: boolean;
  returnShippingAmount: string | null;
  returnShippingLabel: string | null;
  returnCarrier: string;
  returnTrackingNumber: string | null;
  returnTrackingUrl: string | null;
  returnReason: string | null;
  returnInstructions: string | null;
  customerNotes: string | null;
  adminNotes: string | null;
  requiresInspection: boolean;
  inspectionPassedItems: Record<string, unknown> | null;
  inspectionFailedItems: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ReturnItemDbRow {
  orderReturnItemId: string;
  orderReturnId: string;
  orderItemId: string;
  quantity: number;
  returnReason: string;
  returnReasonDetail: string | null;
  condition: string;
  restockItem: boolean;
  refundAmount: string | null;
  exchangeProductId: string | null;
  exchangeVariantId: string | null;
  notes: string | null;
  inspectionNotes: string | null;
  warrantyClaimId: string | null;
  warrantyStatus: string | null;
  warrantyExpiresAt: Date | null;
  createdAt: Date;
}

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
    refundAmount: row.refundAmount ? parseFloat(row.refundAmount) : undefined,
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
    customerId: row.customerId ?? undefined,
    status: row.status as ReturnStatus,
    returnType: row.returnType as ReturnType,
    requestedAt: row.requestedAt,
    approvedAt: row.approvedAt ?? undefined,
    receivedAt: row.receivedAt ?? undefined,
    completedAt: row.completedAt ?? undefined,
    rmaNumber: row.rmaNumber ?? undefined,
    paymentRefundId: row.paymentRefundId ?? undefined,
    returnShippingPaid: row.returnShippingPaid,
    returnShippingAmount: row.returnShippingAmount ? parseFloat(row.returnShippingAmount) : undefined,
    returnShippingLabel: row.returnShippingLabel ?? undefined,
    returnCarrier: row.returnCarrier as ReturnCarrier,
    returnTrackingNumber: row.returnTrackingNumber ?? undefined,
    returnTrackingUrl: row.returnTrackingUrl ?? undefined,
    returnReason: row.returnReason ?? undefined,
    returnInstructions: row.returnInstructions ?? undefined,
    customerNotes: row.customerNotes ?? undefined,
    adminNotes: row.adminNotes ?? undefined,
    requiresInspection: row.requiresInspection,
    inspectionPassedItems: row.inspectionPassedItems ?? undefined,
    inspectionFailedItems: row.inspectionFailedItems ?? undefined,
    items,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export class ReturnRequestRepositoryImpl implements ReturnRequestRepository {
  async findById(id: string): Promise<ReturnRequest | null> {
    const row = await queryOne<ReturnDbRow>(
      `SELECT * FROM "orderReturn" WHERE "orderReturnId" = $1`,
      [id],
    );
    if (!row) return null;
    const items = await this.fetchItems(id);
    return rowToEntity(row, items);
  }

  async findByReturnNumber(returnNumber: string): Promise<ReturnRequest | null> {
    const row = await queryOne<ReturnDbRow>(
      `SELECT * FROM "orderReturn" WHERE "returnNumber" = $1`,
      [returnNumber],
    );
    if (!row) return null;
    const items = await this.fetchItems(row.orderReturnId);
    return rowToEntity(row, items);
  }

  async findByOrderId(orderId: string): Promise<ReturnRequest[]> {
    const rows = await query<ReturnDbRow[]>(
      `SELECT * FROM "orderReturn" WHERE "orderId" = $1 ORDER BY "requestedAt" DESC`,
      [orderId],
    );
    return Promise.all((rows || []).map(async r => rowToEntity(r, await this.fetchItems(r.orderReturnId))));
  }

  async findByCustomerId(customerId: string, limit = 50, offset = 0): Promise<ReturnRequest[]> {
    const rows = await query<ReturnDbRow[]>(
      `SELECT * FROM "orderReturn" WHERE "customerId" = $1 ORDER BY "requestedAt" DESC LIMIT $2 OFFSET $3`,
      [customerId, limit, offset],
    );
    return Promise.all((rows || []).map(async r => rowToEntity(r, await this.fetchItems(r.orderReturnId))));
  }

  async findByStatus(status: ReturnStatus, limit = 50, offset = 0): Promise<ReturnRequest[]> {
    const rows = await query<ReturnDbRow[]>(
      `SELECT * FROM "orderReturn" WHERE "status" = $1 ORDER BY "requestedAt" DESC LIMIT $2 OFFSET $3`,
      [status, limit, offset],
    );
    return Promise.all((rows || []).map(async r => rowToEntity(r, await this.fetchItems(r.orderReturnId))));
  }

  async findPending(limit = 50): Promise<ReturnRequest[]> {
    const rows = await query<ReturnDbRow[]>(
      `SELECT * FROM "orderReturn" WHERE "status" IN ('requested', 'approved', 'inTransit', 'received', 'inspected') ORDER BY "requestedAt" ASC LIMIT $1`,
      [limit],
    );
    return Promise.all((rows || []).map(async r => rowToEntity(r, await this.fetchItems(r.orderReturnId))));
  }

  async findInTransit(limit = 50): Promise<ReturnRequest[]> {
    const rows = await query<ReturnDbRow[]>(
      `SELECT * FROM "orderReturn" WHERE "status" = 'inTransit' ORDER BY "requestedAt" ASC LIMIT $1`,
      [limit],
    );
    return Promise.all((rows || []).map(async r => rowToEntity(r, await this.fetchItems(r.orderReturnId))));
  }

  async findNeedingInspection(limit = 50): Promise<ReturnRequest[]> {
    const rows = await query<ReturnDbRow[]>(
      `SELECT * FROM "orderReturn" WHERE "status" = 'received' AND "requiresInspection" = true ORDER BY "receivedAt" ASC LIMIT $1`,
      [limit],
    );
    return Promise.all((rows || []).map(async r => rowToEntity(r, await this.fetchItems(r.orderReturnId))));
  }

  async create(returnRequest: ReturnRequest): Promise<ReturnRequest> {
    const props = returnRequest.toJSON();
    const row = await queryOne<ReturnDbRow>(
      `INSERT INTO "orderReturn" (
        "orderId", "returnNumber", "customerId", "status", "returnType",
        "requestedAt", "returnShippingPaid", "returnCarrier",
        "returnReason", "customerNotes", "requiresInspection",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        props.orderId, props.returnNumber, props.customerId ?? null,
        props.status, props.returnType, props.requestedAt,
        props.returnShippingPaid, props.returnCarrier,
        props.returnReason ?? null, props.customerNotes ?? null,
        props.requiresInspection, props.createdAt, props.updatedAt,
      ],
    );
    if (!row) throw new ReturnValidationError('Failed to create return request');

    if (props.items.length > 0) {
      for (const item of props.items) {
        await query(
          `INSERT INTO "orderReturnItem" (
            "orderReturnId", "orderItemId", "quantity",
            "returnReason", "returnReasonDetail", "condition",
            "restockItem", "refundAmount", "exchangeProductId", "exchangeVariantId",
            "notes", "warrantyStatus", "createdAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            row.orderReturnId, item.orderItemId, item.quantity,
            item.returnReason, item.returnReasonDetail ?? null, item.condition,
            item.restockItem, item.refundAmount ?? null,
            item.exchangeProductId ?? null, item.exchangeVariantId ?? null,
            item.notes ?? null, item.warrantyStatus, item.createdAt,
          ],
        );
      }
    }

    const items = await this.fetchItems(row.orderReturnId);
    return rowToEntity(row, items);
  }

  async update(returnRequest: ReturnRequest): Promise<ReturnRequest | null> {
    const props = returnRequest.toJSON();
    const row = await queryOne<ReturnDbRow>(
      `UPDATE "orderReturn" SET
        "status" = $1, "approvedAt" = $2, "receivedAt" = $3, "completedAt" = $4,
        "rmaNumber" = $5, "paymentRefundId" = $6,
        "returnShippingPaid" = $7, "returnShippingAmount" = $8, "returnShippingLabel" = $9,
        "returnTrackingNumber" = $10, "returnTrackingUrl" = $11,
        "returnCarrier" = $12, "adminNotes" = $13,
        "inspectionPassedItems" = $14, "inspectionFailedItems" = $15,
        "updatedAt" = NOW()
       WHERE "orderReturnId" = $16 RETURNING *`,
      [
        props.status, props.approvedAt ?? null, props.receivedAt ?? null,
        props.completedAt ?? null, props.rmaNumber ?? null, props.paymentRefundId ?? null,
        props.returnShippingPaid, props.returnShippingAmount ?? null,
        props.returnShippingLabel ?? null, props.returnTrackingNumber ?? null,
        props.returnTrackingUrl ?? null, props.returnCarrier,
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
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "orderReturn" WHERE "status" = $1`,
      [status],
    );
    return result ? parseInt(result.count, 10) : 0;
  }

  async countByCustomerId(customerId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "orderReturn" WHERE "customerId" = $1`,
      [customerId],
    );
    return result ? parseInt(result.count, 10) : 0;
  }

  async getStatistics(): Promise<Record<ReturnStatus, number>> {
    const rows = await query<Array<{ status: string; count: string }>>(
      `SELECT "status", COUNT(*) as count FROM "orderReturn" GROUP BY "status"`,
    );
    const stats = {
      requested: 0, approved: 0, denied: 0, inTransit: 0,
      received: 0, inspected: 0, completed: 0, cancelled: 0,
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
    const rows = await query<ReturnItemDbRow[]>(
      `SELECT * FROM "orderReturnItem" WHERE "orderReturnId" = $1 ORDER BY "createdAt" ASC`,
      [returnId],
    );
    return (rows || []).map(itemRowToEntity);
  }
}

export class ReturnItemRepositoryImpl implements ReturnItemRepository {
  async findByReturnId(returnId: string): Promise<ReturnItem[]> {
    const rows = await query<ReturnItemDbRow[]>(
      `SELECT * FROM "orderReturnItem" WHERE "orderReturnId" = $1 ORDER BY "createdAt" ASC`,
      [returnId],
    );
    return (rows || []).map(itemRowToEntity);
  }

  async findById(itemId: string): Promise<ReturnItem | null> {
    const row = await queryOne<ReturnItemDbRow>(
      `SELECT * FROM "orderReturnItem" WHERE "orderReturnItemId" = $1`,
      [itemId],
    );
    return row ? itemRowToEntity(row) : null;
  }

  async createMany(returnId: string, items: ReturnItem[]): Promise<ReturnItem[]> {
    const created: ReturnItem[] = [];
    for (const item of items) {
      const row = await queryOne<ReturnItemDbRow>(
        `INSERT INTO "orderReturnItem" (
          "orderReturnId", "orderItemId", "quantity",
          "returnReason", "returnReasonDetail", "condition",
          "restockItem", "refundAmount", "exchangeProductId", "exchangeVariantId",
          "notes", "warrantyStatus", "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
        [
          returnId, item.orderItemId, item.quantity,
          item.returnReason, item.returnReasonDetail ?? null, item.condition,
          item.restockItem, item.refundAmount ?? null,
          item.exchangeProductId ?? null, item.exchangeVariantId ?? null,
          item.notes ?? null, item.warrantyStatus, item.createdAt,
        ],
      );
      if (row) created.push(itemRowToEntity(row));
    }
    return created;
  }

  async updateInspection(itemId: string, inspectionNotes: string, condition: string, restockItem: boolean): Promise<ReturnItem | null> {
    const row = await queryOne<ReturnItemDbRow>(
      `UPDATE "orderReturnItem" SET
        "inspectionNotes" = $1, "condition" = $2, "restockItem" = $3
       WHERE "orderReturnItemId" = $4 RETURNING *`,
      [inspectionNotes, condition, restockItem, itemId],
    );
    return row ? itemRowToEntity(row) : null;
  }
}

export class StoreCreditRepositoryImpl implements StoreCreditRepository {
  async getBalance(customerId: string): Promise<CustomerStoreCreditBalance> {
    const row = await queryOne<{ balance: string; totalCredits: string; totalDebits: string; pendingExpiry: string; lastEntryAt: Date | null }>(
      `SELECT
        COALESCE(SUM(CASE WHEN "entryType" = 'credit' THEN "amount" ELSE 0 END) -
                 SUM(CASE WHEN "entryType" IN ('debit', 'expiry') THEN "amount" ELSE 0 END), 0) as balance,
        COALESCE(SUM(CASE WHEN "entryType" = 'credit' THEN "amount" ELSE 0 END), 0) as totalCredits,
        COALESCE(SUM(CASE WHEN "entryType" IN ('debit', 'expiry') THEN "amount" ELSE 0 END), 0) as totalDebits,
        COALESCE(SUM(CASE WHEN "entryType" = 'credit' AND "expiresAt" IS NOT NULL AND "expiresAt" > NOW() THEN "amount" ELSE 0 END), 0) as pendingExpiry,
        MAX("createdAt") as lastEntryAt
       FROM "storeCreditLedger" WHERE "customerId" = $1`,
      [customerId],
    );

    return {
      customerId,
      balance: row ? parseFloat(row.balance) : 0,
      currency: 'USD',
      totalCredits: row ? parseFloat(row.totalCredits) : 0,
      totalDebits: row ? parseFloat(row.totalDebits) : 0,
      pendingExpiry: row ? parseFloat(row.pendingExpiry) : 0,
      lastEntryAt: row?.lastEntryAt ?? null,
    };
  }

  async addEntry(entry: StoreCreditLedgerEntry): Promise<StoreCreditLedgerEntry> {
    const props = entry.toJSON();
    const row = await queryOne<{
      storeCreditLedgerId: string;
      customerId: string;
      entryType: string;
      referenceType: string | null;
      referenceId: string | null;
      amount: string;
      balanceAfter: string;
      currency: string;
      reason: string | null;
      notes: string | null;
      createdBy: string | null;
      expiresAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }>(
      `INSERT INTO "storeCreditLedger" (
        "customerId", "entryType", "referenceType", "referenceId",
        "amount", "balanceAfter", "currency", "reason", "notes",
        "createdBy", "expiresAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        props.customerId, props.entryType, props.referenceType ?? null, props.referenceId ?? null,
        props.amount, props.balanceAfter, props.currency,
        props.reason ?? null, props.notes ?? null, props.createdBy ?? null,
        props.expiresAt ?? null, props.createdAt, props.updatedAt,
      ],
    );
    if (!row) throw new ReturnValidationError('Failed to create store credit entry');

    return StoreCreditLedgerEntry.reconstitute({
      ...row,
      entryType: row.entryType as StoreCreditEntryType,
      amount: parseFloat(row.amount),
      balanceAfter: parseFloat(row.balanceAfter),
      referenceType: row.referenceType ?? undefined,
      referenceId: row.referenceId ?? undefined,
      reason: row.reason ?? undefined,
      notes: row.notes ?? undefined,
      createdBy: row.createdBy ?? undefined,
      expiresAt: row.expiresAt ?? undefined,
    });
  }

  async getLedger(customerId: string, limit = 50): Promise<StoreCreditLedgerEntry[]> {
    const rows = await query<Record<string, unknown>[]>(
      `SELECT * FROM "storeCreditLedger" WHERE "customerId" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
      [customerId, limit],
    );
    return (rows || []).map((row: Record<string, unknown>) => StoreCreditLedgerEntry.reconstitute({
      storeCreditLedgerId: row.storeCreditLedgerId as string,
      customerId: row.customerId as string,
      entryType: row.entryType as StoreCreditEntryType,
      referenceType: row.referenceType as string | undefined,
      referenceId: row.referenceId as string | undefined,
      amount: parseFloat(row.amount as string),
      balanceAfter: parseFloat(row.balanceAfter as string),
      currency: row.currency as string,
      reason: row.reason as string | undefined,
      notes: row.notes as string | undefined,
      createdBy: row.createdBy as string | undefined,
      expiresAt: row.expiresAt as Date | undefined,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
    }));
  }

  async findByReference(referenceType: string, referenceId: string): Promise<StoreCreditLedgerEntry | null> {
    const row = await queryOne<Record<string, unknown>>(
      `SELECT * FROM "storeCreditLedger" WHERE "referenceType" = $1 AND "referenceId" = $2`,
      [referenceType, referenceId],
    );
    if (!row) return null;
    return StoreCreditLedgerEntry.reconstitute({
      storeCreditLedgerId: row.storeCreditLedgerId as string,
      customerId: row.customerId as string,
      entryType: row.entryType as StoreCreditEntryType,
      referenceType: row.referenceType as string | undefined,
      referenceId: row.referenceId as string | undefined,
      amount: parseFloat(row.amount as string),
      balanceAfter: parseFloat(row.balanceAfter as string),
      currency: row.currency as string,
      reason: row.reason as string | undefined,
      notes: row.notes as string | undefined,
      createdBy: row.createdBy as string | undefined,
      expiresAt: row.expiresAt as Date | undefined,
      createdAt: row.createdAt as Date,
      updatedAt: row.updatedAt as Date,
    });
  }

  async processExpiry(): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `WITH expired AS (
        SELECT "storeCreditLedgerId", "customerId", "amount"
        FROM "storeCreditLedger"
        WHERE "entryType" = 'credit'
          AND "expiresAt" IS NOT NULL
          AND "expiresAt" < NOW()
          AND "storeCreditLedgerId" NOT IN (
            SELECT "referenceId" FROM "storeCreditLedger" WHERE "entryType" = 'expiry' AND "referenceType" = 'storeCredit'
          )
      )
      INSERT INTO "storeCreditLedger" ("customerId", "entryType", "referenceType", "referenceId", "amount", "balanceAfter", "currency", "reason", "createdAt", "updatedAt")
      SELECT e."customerId", 'expiry', 'storeCredit', e."storeCreditLedgerId", e."amount", 0, 'USD', 'Credit expired', NOW(), NOW()
      FROM expired e
      RETURNING 1`,
    );
    const count = result ? parseInt(result.count, 10) : 0;
    if (count > 0) logger.info('Store credit expiry processed', { count });
    return count;
  }
}
