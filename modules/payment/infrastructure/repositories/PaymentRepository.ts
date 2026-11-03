import { query, queryOne, withTransaction } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import {
  findSettingsByMerchant as qFindSettingsByMerchant,
  upsertSettings as qUpsertSettings,
  findAllSettings as qFindAllSettings,
  findWebhookByExternalId as qFindWebhookByExternalId,
  createWebhook as qCreateWebhook,
  markWebhookProcessed as qMarkWebhookProcessed,
  findStoredMethodsByCustomer as qFindStoredMethodsByCustomer,
  findStoredMethodById as qFindStoredMethodById,
  createStoredMethod as qCreateStoredMethod,
  setDefaultStoredMethod as qSetDefaultStoredMethod,
  softDeleteStoredMethod as qSoftDeleteStoredMethod,
} from './paymentSettingsQueries';
import {
  PaymentRepository as IPaymentRepository,
  PaymentFilters,
  PaymentSettings,
  PaymentSettingsUpsertParams,
  PaymentWebhook,
  PaymentWebhookCreateParams,
  StoredPaymentMethod,
  StoredPaymentMethodCreateParams,
} from '../../domain/repositories/PaymentRepository';
import { PaginationOptions, PaginatedResult } from 'libs/types/pagination';
import { PaymentTransaction } from '../../domain/entities/PaymentTransaction';
import { PaymentRefund } from '../../domain/entities/PaymentRefund';
import { TransactionStatus, RefundStatus } from '../../domain/valueObjects/PaymentStatus';
import type {
  PaymentTransaction as DbPaymentTransaction,
  PaymentRefund as DbPaymentRefund,
  PaymentGateway as DbPaymentGateway,
  PaymentMethodConfig as DbPaymentMethodConfig,
} from '../../../../libs/db/types';

function paginatedResult<T>(
  rows: Record<string, unknown>[] | null | undefined,
  total: number,
  limit: number,
  offset: number,
  map: (row: Record<string, unknown>) => T,
): PaginatedResult<T> {
  const length = rows?.length || 0;
  return {
    data: (rows || []).map(map),
    total,
    limit,
    offset,
    hasMore: offset + length < total,
    length,
  };
}

export class PaymentRepo implements IPaymentRepository {
  async findTransactionById(transactionId: string): Promise<PaymentTransaction | null> {
    const row = await queryOne<DbPaymentTransaction>(
      'SELECT * FROM "paymentTransaction" WHERE "paymentTransactionId" = $1 AND "deletedAt" IS NULL',
      [transactionId],
    );
    return row ? this.mapToTransaction(row) : null;
  }

  async findTransactionByExternalId(externalId: string): Promise<PaymentTransaction | null> {
    const row = await queryOne<DbPaymentTransaction>(
      'SELECT * FROM "paymentTransaction" WHERE "externalTransactionId" = $1 AND "deletedAt" IS NULL',
      [externalId],
    );
    return row ? this.mapToTransaction(row) : null;
  }

  async findTransactionsByOrderId(orderId: string): Promise<PaymentTransaction[]> {
    const rows = await query<DbPaymentTransaction[]>(
      'SELECT * FROM "paymentTransaction" WHERE "orderId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC',
      [orderId],
    );
    return (rows || []).map(row => this.mapToTransaction(row));
  }

  async findTransactionsByCustomerId(customerId: string, pagination?: PaginationOptions): Promise<PaginatedResult<PaymentTransaction>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;

    const countResult = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM "paymentTransaction" WHERE "customerId" = $1 AND "deletedAt" IS NULL',
      [customerId],
    );
    const total = parseInt(countResult?.count || '0');

    const rows = await query<DbPaymentTransaction[]>(
      `SELECT * FROM "paymentTransaction" WHERE "customerId" = $1 AND "deletedAt" IS NULL
       ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
      [customerId, limit, offset],
    );

    return paginatedResult(rows, total, limit, offset, row => this.mapToTransaction(row));
  }

  async findAllTransactions(filters?: PaymentFilters, pagination?: PaginationOptions): Promise<PaginatedResult<PaymentTransaction>> {
    const limit = pagination?.limit || 50;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const { whereClause, params } = this.buildWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "paymentTransaction" ${whereClause}`, params);
    const total = parseInt(countResult?.count || '0');

    const rows = await query<DbPaymentTransaction[]>(
      `SELECT * FROM "paymentTransaction" ${whereClause}
       ORDER BY "${orderBy}" ${orderDir.toUpperCase()}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    return paginatedResult(rows, total, limit, offset, row => this.mapToTransaction(row));
  }

  async saveTransaction(transaction: PaymentTransaction): Promise<PaymentTransaction> {
    const now = new Date().toISOString();

    const existing = await queryOne<{ paymentTransactionId: string }>(
      'SELECT "paymentTransactionId" FROM "paymentTransaction" WHERE "paymentTransactionId" = $1',
      [transaction.transactionId],
    );

    if (existing) {
      await query(
        `UPDATE "paymentTransaction" SET
          "externalTransactionId" = $1, status = $2, "paymentMethodDetails" = $3,
          "gatewayResponse" = $4, "errorCode" = $5, "errorMessage" = $6,
          "refundedAmountCents" = $7, "authorizedAt" = $8, "capturedAt" = $9,
          metadata = $10, "updatedAt" = $11
        WHERE "paymentTransactionId" = $12`,
        [
          transaction.externalTransactionId,
          transaction.status,
          transaction.paymentMethodDetails ? JSON.stringify(transaction.paymentMethodDetails) : null,
          transaction.gatewayResponse ? JSON.stringify(transaction.gatewayResponse) : null,
          transaction.errorCode,
          transaction.errorMessage,
          transaction.refundedAmountCents,
          transaction.authorizedAt?.toISOString(),
          transaction.capturedAt?.toISOString(),
          transaction.metadata ? JSON.stringify(transaction.metadata) : null,
          now,
          transaction.transactionId,
        ],
      );
    } else {
      const orderPaymentId = generateUUID();

      await withTransaction(async () => {
        await query(
          `INSERT INTO "orderPayment" (
            "orderPaymentId", "orderId", "type", "provider",
            "amountCents", "currencyCode", status, "refundedAmountCents",
            "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            orderPaymentId,
            transaction.orderId,
            'creditCard',
            'stripe',
            transaction.amountCents,
            transaction.currency,
            'pending',
            0,
            now,
            now,
          ],
        );

        await query(
          `INSERT INTO "paymentTransaction" (
            "paymentTransactionId", "orderPaymentId", "orderId", "type",
            "customerId", "paymentMethodId", "paymentGatewayId",
            "amountCents", "currencyCode", status, "refundedAmountCents", "customerIp", metadata,
            "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            transaction.transactionId,
            orderPaymentId,
            transaction.orderId,
            'sale',
            transaction.customerId,
            null,
            transaction.gatewayId,
            transaction.amountCents,
            transaction.currency,
            transaction.status,
            transaction.refundedAmountCents,
            transaction.customerIp,
            transaction.metadata ? JSON.stringify(transaction.metadata) : null,
            now,
            now,
          ],
        );
      });
    }

    return transaction;
  }

  async countTransactions(filters?: PaymentFilters): Promise<number> {
    const { whereClause, params } = this.buildWhereClause(filters);
    const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "paymentTransaction" ${whereClause}`, params);
    return parseInt(result?.count || '0');
  }

  async findRefundById(refundId: string): Promise<PaymentRefund | null> {
    const row = await queryOne<DbPaymentRefund>('SELECT * FROM "paymentRefund" WHERE "paymentRefundId" = $1', [refundId]);
    return row ? this.mapToRefund(row) : null;
  }

  async findRefundsByTransactionId(transactionId: string): Promise<PaymentRefund[]> {
    const rows = await query<DbPaymentRefund[]>(
      'SELECT * FROM "paymentRefund" WHERE "paymentTransactionId" = $1 ORDER BY "createdAt" DESC',
      [transactionId],
    );
    return (rows || []).map(row => this.mapToRefund(row));
  }

  async saveRefund(refund: PaymentRefund): Promise<PaymentRefund> {
    const now = new Date().toISOString();

    const existing = await queryOne<{ paymentRefundId: string }>(
      'SELECT "paymentRefundId" FROM "paymentRefund" WHERE "paymentRefundId" = $1',
      [refund.refundId],
    );

    if (existing) {
      await query(
        `UPDATE "paymentRefund" SET
          "externalRefundId" = $1, status = $2, "gatewayResponse" = $3,
          "errorCode" = $4, "errorMessage" = $5, "processedAt" = $6,
          metadata = $7, "updatedAt" = $8
        WHERE "paymentRefundId" = $9`,
        [
          refund.externalRefundId,
          refund.status,
          refund.gatewayResponse ? JSON.stringify(refund.gatewayResponse) : null,
          refund.errorCode,
          refund.errorMessage,
          refund.processedAt?.toISOString(),
          refund.metadata ? JSON.stringify(refund.metadata) : null,
          now,
          refund.refundId,
        ],
      );
    } else {
      await query(
        `INSERT INTO "paymentRefund" (
          "paymentRefundId", "paymentTransactionId", "amountCents", "currencyCode", reason, status, metadata, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          refund.refundId,
          refund.transactionId,
          refund.amountCents,
          refund.currency,
          refund.reason,
          refund.status,
          refund.metadata ? JSON.stringify(refund.metadata) : null,
          now,
          now,
        ],
      );
    }

    return refund;
  }

  async getEnabledPaymentMethods(
    organizationId: string,
    currency?: string,
  ): Promise<
    Array<{
      paymentMethodConfigId: string;
      paymentMethod: string;
      displayName: string;
      description?: string;
      icon?: string;
      processingFeeCents?: number;
    }>
  > {
    const conditions = ['"isEnabled" = true', '"deletedAt" IS NULL'];
    const params: unknown[] = [];

    if (organizationId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId)) {
      conditions.push(`"organizationId" = $${params.length + 1}`);
      params.push(organizationId);
    }

    if (currency) {
      conditions.push(`("supportedCurrencies" IS NULL OR $${params.length + 1} = ANY("supportedCurrencies"))`);
      params.push(currency);
    }

    const sql = `SELECT * FROM "paymentMethodConfig" WHERE ${conditions.join(' AND ')} ORDER BY "displayOrder" ASC`;

    const rows = await query<DbPaymentMethodConfig[]>(sql, params);
    return (rows || []).map(row => ({
      paymentMethodConfigId: row.paymentMethodConfigId,
      paymentMethod: row.paymentMethod,
      displayName: row.displayName || row.paymentMethod,
      description: row.description || undefined,
      icon: row.icon || undefined,
      processingFeeCents: row.processingFeeCents ? Number(row.processingFeeCents) : undefined,
    }));
  }

  async getDefaultGateway(organizationId: string): Promise<{
    gatewayId: string;
    provider: string;
    isTestMode: boolean;
  } | null> {
    let row: Record<string, unknown> | null = null;

    if (organizationId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId)) {
      row = await queryOne<DbPaymentGateway>(
        'SELECT * FROM "paymentGateway" WHERE "organizationId" = $1 AND "isDefault" = true AND "isActive" = true AND "deletedAt" IS NULL',
        [organizationId],
      );
    }

    if (!row) {
      const fallback = await queryOne<DbPaymentGateway>(
        'SELECT * FROM "paymentGateway" WHERE "isDefault" = true AND "isActive" = true AND "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1',
      );
      if (!fallback) {
        const anyGateway = await queryOne<DbPaymentGateway>(
          'SELECT * FROM "paymentGateway" WHERE "isActive" = true AND "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1',
        );
        if (!anyGateway) return null;
        return {
          gatewayId: anyGateway.paymentGatewayId as string,
          provider: anyGateway.provider as string,
          isTestMode: Boolean(anyGateway.isTestMode),
        };
      }
      return {
        gatewayId: fallback.paymentGatewayId as string,
        provider: fallback.provider as string,
        isTestMode: Boolean(fallback.isTestMode),
      };
    }

    return {
      gatewayId: row.paymentGatewayId as string,
      provider: row.provider as string,
      isTestMode: Boolean(row.isTestMode),
    };
  }

  private buildWhereClause(filters?: PaymentFilters): { whereClause: string; params: unknown[] } {
    const conditions: string[] = ['"deletedAt" IS NULL'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters?.orderId) {
      conditions.push(`"orderId" = $${paramIndex++}`);
      params.push(filters.orderId);
    }
    if (filters?.customerId) {
      conditions.push(`"customerId" = $${paramIndex++}`);
      params.push(filters.customerId);
    }
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(`status IN (${filters.status.map(() => `$${paramIndex++}`).join(', ')})`);
        params.push(...filters.status);
      } else {
        conditions.push(`status = $${paramIndex++}`);
        params.push(filters.status);
      }
    }
    if (filters?.gatewayId) {
      conditions.push(`"paymentGatewayId" = $${paramIndex++}`);
      params.push(filters.gatewayId);
    }
    if (filters?.startDate) {
      conditions.push(`"createdAt" >= $${paramIndex++}`);
      params.push(filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      conditions.push(`"createdAt" <= $${paramIndex++}`);
      params.push(filters.endDate.toISOString());
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private mapToTransaction(row: Record<string, unknown>): PaymentTransaction {
    return PaymentTransaction.reconstitute({
      transactionId: row.paymentTransactionId as string,
      orderId: row.orderId as string,
      customerId: row.customerId as string | undefined,
      paymentMethodConfigId: (row.paymentMethodId as string) || '',
      gatewayId: (row.paymentGatewayId as string) || '',
      externalTransactionId: row.externalTransactionId as string | undefined,
      amountCents: Number(row.amountCents),
      currency: row.currencyCode as string,
      status: row.status as TransactionStatus,
      paymentMethodDetails: row.paymentMethodDetails
        ? typeof row.paymentMethodDetails === 'string'
          ? JSON.parse(row.paymentMethodDetails)
          : row.paymentMethodDetails
        : undefined,
      gatewayResponse: row.gatewayResponse
        ? typeof row.gatewayResponse === 'string'
          ? JSON.parse(row.gatewayResponse)
          : row.gatewayResponse
        : undefined,
      errorCode: row.errorCode as string | undefined,
      errorMessage: row.errorMessage as string | undefined,
      refundedAmountCents: parseFloat(String(row.refundedAmountCents || 0)),
      customerIp: row.customerIp as string | undefined,
      authorizedAt: row.authorizedAt ? new Date(row.authorizedAt as string) : undefined,
      capturedAt: row.capturedAt ? new Date(row.capturedAt as string) : undefined,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    });
  }

  findSettingsByMerchant(organizationId: string): Promise<PaymentSettings | null> {
    return qFindSettingsByMerchant(organizationId);
  }

  upsertSettings(params: PaymentSettingsUpsertParams): Promise<PaymentSettings | null> {
    return qUpsertSettings(params);
  }

  findAllSettings(): Promise<PaymentSettings[]> {
    return qFindAllSettings();
  }

  findWebhookByExternalId(externalId: string): Promise<PaymentWebhook | null> {
    return qFindWebhookByExternalId(externalId);
  }

  createWebhook(params: PaymentWebhookCreateParams): Promise<PaymentWebhook | null> {
    return qCreateWebhook(params);
  }

  markWebhookProcessed(paymentWebhookId: string): Promise<PaymentWebhook | null> {
    return qMarkWebhookProcessed(paymentWebhookId);
  }

  findStoredMethodsByCustomer(customerId: string): Promise<StoredPaymentMethod[]> {
    return qFindStoredMethodsByCustomer(customerId);
  }

  findStoredMethodById(storedPaymentMethodId: string): Promise<StoredPaymentMethod | null> {
    return qFindStoredMethodById(storedPaymentMethodId);
  }

  createStoredMethod(params: StoredPaymentMethodCreateParams): Promise<StoredPaymentMethod | null> {
    return qCreateStoredMethod(params);
  }

  setDefaultStoredMethod(storedPaymentMethodId: string, customerId: string): Promise<StoredPaymentMethod | null> {
    return qSetDefaultStoredMethod(storedPaymentMethodId, customerId);
  }

  softDeleteStoredMethod(storedPaymentMethodId: string, customerId?: string): Promise<StoredPaymentMethod | null> {
    return qSoftDeleteStoredMethod(storedPaymentMethodId, customerId);
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    await query(`UPDATE "paymentTransaction" SET "deletedAt" = $1 WHERE "paymentTransactionId" = $2`, [
      new Date().toISOString(),
      transactionId,
    ]);
  }

  private mapToRefund(row: Record<string, unknown>): PaymentRefund {
    return PaymentRefund.reconstitute({
      refundId: row.paymentRefundId as string,
      transactionId: row.paymentTransactionId as string,
      externalRefundId: row.externalRefundId as string | undefined,
      amountCents: Number(row.amountCents),
      currency: row.currencyCode as string,
      reason: row.reason as string | undefined,
      status: row.status as RefundStatus,
      gatewayResponse: row.gatewayResponse
        ? typeof row.gatewayResponse === 'string'
          ? JSON.parse(row.gatewayResponse)
          : row.gatewayResponse
        : undefined,
      errorCode: row.errorCode as string | undefined,
      errorMessage: row.errorMessage as string | undefined,
      processedAt: row.processedAt ? new Date(row.processedAt as string) : undefined,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    });
  }
}

export default new PaymentRepo();
