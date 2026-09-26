/**
 * Payment Repository Implementation
 * PostgreSQL implementation using camelCase column names (matching migrations)
 */

import { query, queryOne, withTransaction } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
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
import { PaginationOptions, PaginatedResult } from 'libs/types/shared';
import { PaymentTransaction } from '../../domain/entities/PaymentTransaction';
import { PaymentRefund } from '../../domain/entities/PaymentRefund';
import { TransactionStatus, RefundStatus } from '../../domain/valueObjects/PaymentStatus';

// Maps repository-facing field names onto the actual storedPaymentMethod schema
// (e.g. "paymentMethod" -> type, "token" -> providerToken).
const STORED_METHOD_COLUMNS = `"storedPaymentMethodId", "customerId", "paymentMethod" AS type, provider, token AS "providerToken", "lastFour" AS last4, "cardType" AS brand, NULLIF("expiryMonth", '')::int AS "expiryMonth", NULLIF("expiryYear", '')::int AS "expiryYear", "isDefault", "isExpired", "createdAt", "updatedAt"`;

export class PaymentRepo implements IPaymentRepository {
  async findTransactionById(transactionId: string): Promise<PaymentTransaction | null> {
    const row = await queryOne<Record<string, unknown>>(
      'SELECT * FROM "paymentTransaction" WHERE "paymentTransactionId" = $1 AND "deletedAt" IS NULL',
      [transactionId],
    );
    return row ? this.mapToTransaction(row) : null;
  }

  async findTransactionByExternalId(externalId: string): Promise<PaymentTransaction | null> {
    const row = await queryOne<Record<string, unknown>>(
      'SELECT * FROM "paymentTransaction" WHERE "externalTransactionId" = $1 AND "deletedAt" IS NULL',
      [externalId],
    );
    return row ? this.mapToTransaction(row) : null;
  }

  async findTransactionsByOrderId(orderId: string): Promise<PaymentTransaction[]> {
    const rows = await query<Record<string, unknown>[]>(
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

    const rows = await query<Record<string, unknown>[]>(
      `SELECT * FROM "paymentTransaction" WHERE "customerId" = $1 AND "deletedAt" IS NULL
       ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
      [customerId, limit, offset],
    );

    return {
      data: (rows || []).map(row => this.mapToTransaction(row)),
      total,
      limit,
      offset,
      hasMore: offset + (rows?.length || 0) < total,
      length: rows?.length || 0,
    };
  }

  async findAllTransactions(filters?: PaymentFilters, pagination?: PaginationOptions): Promise<PaginatedResult<PaymentTransaction>> {
    const limit = pagination?.limit || 50;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const { whereClause, params } = this.buildWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "paymentTransaction" ${whereClause}`, params);
    const total = parseInt(countResult?.count || '0');

    const rows = await query<Record<string, unknown>[]>(
      `SELECT * FROM "paymentTransaction" ${whereClause}
       ORDER BY "${orderBy}" ${orderDir.toUpperCase()}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    return {
      data: (rows || []).map(row => this.mapToTransaction(row)),
      total,
      limit,
      offset,
      hasMore: offset + (rows?.length || 0) < total,
      length: rows?.length || 0,
    };
  }

  async saveTransaction(transaction: PaymentTransaction): Promise<PaymentTransaction> {
    const now = new Date().toISOString();

    const existing = await queryOne<Record<string, unknown>>(
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

      // Create orderPayment + paymentTransaction atomically
      await withTransaction(async () => {
        // Create orderPayment record first (FK constraint)
        await query(
          `INSERT INTO "orderPayment" (
            "orderPaymentId", "orderId", "type", "provider",
            "amountCents", "currencyCode", status, "refundedAmountCents",
            "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [orderPaymentId, transaction.orderId, 'creditCard', 'stripe', transaction.amountCents, transaction.currency, 'pending', 0, now, now],
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

  // Refunds
  async findRefundById(refundId: string): Promise<PaymentRefund | null> {
    const row = await queryOne<Record<string, unknown>>('SELECT * FROM "paymentRefund" WHERE "paymentRefundId" = $1', [refundId]);
    return row ? this.mapToRefund(row) : null;
  }

  async findRefundsByTransactionId(transactionId: string): Promise<PaymentRefund[]> {
    const rows = await query<Record<string, unknown>[]>(
      'SELECT * FROM "paymentRefund" WHERE "paymentTransactionId" = $1 ORDER BY "createdAt" DESC',
      [transactionId],
    );
    return (rows || []).map(row => this.mapToRefund(row));
  }

  async saveRefund(refund: PaymentRefund): Promise<PaymentRefund> {
    const now = new Date().toISOString();

    const existing = await queryOne<Record<string, unknown>>('SELECT "paymentRefundId" FROM "paymentRefund" WHERE "paymentRefundId" = $1', [
      refund.refundId,
    ]);

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

  // Payment Methods
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

    const rows = await query<Record<string, unknown>[]>(sql, params);
    return (rows || []).map(row => ({
      paymentMethodConfigId: row.paymentMethodConfigId as string,
      paymentMethod: row.paymentMethod as string,
      displayName: (row.displayName as string) || (row.type as string),
      description: row.description as string | undefined,
      icon: row.icon as string | undefined,
      processingFeeCents: row.processingFeeCents ? Number(row.processingFeeCents) : undefined,
    }));
  }

  // Gateways
  async getDefaultGateway(organizationId: string): Promise<{
    gatewayId: string;
    provider: string;
    isTestMode: boolean;
  } | null> {
    let row: Record<string, unknown> | null = null;

    if (organizationId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId)) {
      row = await queryOne<Record<string, unknown>>(
        'SELECT * FROM "paymentGateway" WHERE "organizationId" = $1 AND "isDefault" = true AND "isActive" = true AND "deletedAt" IS NULL',
        [organizationId],
      );
    }

    if (!row) {
      const fallback = await queryOne<Record<string, unknown>>(
        'SELECT * FROM "paymentGateway" WHERE "isDefault" = true AND "isActive" = true AND "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1',
      );
      if (!fallback) {
        const anyGateway = await queryOne<Record<string, unknown>>(
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

  // Helpers
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

  // ==========================================================================
  // Settings
  // ==========================================================================

  async findSettingsByMerchant(organizationId: string): Promise<PaymentSettings | null> {
    return queryOne<PaymentSettings>(`SELECT * FROM "paymentSettings" WHERE "organizationId" = $1`, [organizationId]);
  }

  async upsertSettings(params: PaymentSettingsUpsertParams): Promise<PaymentSettings | null> {
    const now = new Date();
    const jsonbFields = new Set(['threeDSecureSettings', 'fraudDetectionSettings', 'receiptSettings', 'paymentFormCustomization']);
    const fields = (Object.keys(params) as (keyof PaymentSettingsUpsertParams)[]).filter(
      key => key !== 'organizationId' && params[key] !== undefined,
    );

    const columns = ['"organizationId"', ...fields.map(f => `"${f}"`), '"createdAt"', '"updatedAt"'];
    const values: unknown[] = [
      params.organizationId,
      ...fields.map(f => (jsonbFields.has(f) ? JSON.stringify(params[f]) : params[f])),
      now,
      now,
    ];
    const updateSet = fields.length > 0 ? `${fields.map(f => `"${f}" = EXCLUDED."${f}"`).join(', ')}, ` : '';

    return queryOne<PaymentSettings>(
      `INSERT INTO "paymentSettings" (${columns.join(', ')})
       VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')})
       ON CONFLICT ("organizationId") DO UPDATE SET ${updateSet}"updatedAt" = $${values.length}
       RETURNING *`,
      values,
    );
  }

  async findAllSettings(): Promise<PaymentSettings[]> {
    return (await query<PaymentSettings[]>(`SELECT * FROM "paymentSettings" ORDER BY "createdAt" DESC`)) || [];
  }

  // ==========================================================================
  // Webhooks
  // ==========================================================================

  async findWebhookByExternalId(externalId: string): Promise<PaymentWebhook | null> {
    return queryOne<PaymentWebhook>(`SELECT * FROM "paymentWebhook" WHERE "externalId" = $1`, [externalId]);
  }

  async createWebhook(params: PaymentWebhookCreateParams): Promise<PaymentWebhook | null> {
    const now = new Date();
    return queryOne<PaymentWebhook>(
      `INSERT INTO "paymentWebhook" ("externalId", provider, "eventType", payload, "processedAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [params.externalId, params.provider, params.eventType, JSON.stringify(params.payload), params.processedAt || null, now, now],
    );
  }

  async markWebhookProcessed(paymentWebhookId: string): Promise<PaymentWebhook | null> {
    const now = new Date();
    return queryOne<PaymentWebhook>(
      `UPDATE "paymentWebhook" SET "processedAt" = $1, "updatedAt" = $1 WHERE "paymentWebhookId" = $2 RETURNING *`,
      [now, paymentWebhookId],
    );
  }

  // ==========================================================================
  // Stored Payment Methods
  // ==========================================================================

  async findStoredMethodsByCustomer(customerId: string): Promise<StoredPaymentMethod[]> {
    return (
      (await query<StoredPaymentMethod[]>(
        `SELECT ${STORED_METHOD_COLUMNS} FROM "storedPaymentMethod" WHERE "customerId" = $1 ORDER BY "isDefault" DESC, "createdAt" DESC`,
        [customerId],
      )) || []
    );
  }

  async findStoredMethodById(storedPaymentMethodId: string): Promise<StoredPaymentMethod | null> {
    return queryOne<StoredPaymentMethod>(
      `SELECT ${STORED_METHOD_COLUMNS} FROM "storedPaymentMethod" WHERE "storedPaymentMethodId" = $1`,
      [storedPaymentMethodId],
    );
  }

  async createStoredMethod(params: StoredPaymentMethodCreateParams): Promise<StoredPaymentMethod | null> {
    const now = new Date();
    return queryOne<StoredPaymentMethod>(
      `INSERT INTO "storedPaymentMethod" ("customerId", "paymentMethod", provider, token, "lastFour", "cardType", "expiryMonth", "expiryYear", "isDefault", "isExpired", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, $10, $11) RETURNING ${STORED_METHOD_COLUMNS}`,
      [
        params.customerId,
        params.type,
        params.provider,
        params.providerToken,
        params.last4 || null,
        params.brand || null,
        params.expiryMonth != null ? String(params.expiryMonth).padStart(2, '0') : null,
        params.expiryYear != null ? String(params.expiryYear) : null,
        params.isDefault,
        now,
        now,
      ],
    );
  }

  async setDefaultStoredMethod(storedPaymentMethodId: string, customerId: string): Promise<StoredPaymentMethod | null> {
    const now = new Date();
    await query(`UPDATE "storedPaymentMethod" SET "isDefault" = false, "updatedAt" = $1 WHERE "customerId" = $2`, [now, customerId]);
    return queryOne<StoredPaymentMethod>(
      `UPDATE "storedPaymentMethod" SET "isDefault" = true, "updatedAt" = $1 WHERE "storedPaymentMethodId" = $2 AND "customerId" = $3 RETURNING ${STORED_METHOD_COLUMNS}`,
      [now, storedPaymentMethodId, customerId],
    );
  }

  async softDeleteStoredMethod(storedPaymentMethodId: string, customerId?: string): Promise<StoredPaymentMethod | null> {
    // The table has no deletedAt column — a "soft" delete is a hard delete.
    const sql = customerId
      ? `DELETE FROM "storedPaymentMethod" WHERE "storedPaymentMethodId" = $1 AND "customerId" = $2 RETURNING ${STORED_METHOD_COLUMNS}`
      : `DELETE FROM "storedPaymentMethod" WHERE "storedPaymentMethodId" = $1 RETURNING ${STORED_METHOD_COLUMNS}`;
    return queryOne<StoredPaymentMethod>(sql, customerId ? [storedPaymentMethodId, customerId] : [storedPaymentMethodId]);
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
