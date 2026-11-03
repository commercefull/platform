import { query, queryOne, withTransaction } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import type { PaymentTransactionRepository, PaymentFilters } from '../../domain/repositories/PaymentTransactionRepository';
import { PaginationOptions, PaginatedResult } from 'libs/types/pagination';
import { PaymentTransaction } from '../../domain/entities/PaymentTransaction';
import { TransactionStatus } from '../../domain/valueObjects/PaymentStatus';
import type { PaymentTransaction as DbPaymentTransaction } from '../../../../libs/db/types';

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

class PaymentTransactionRepo implements PaymentTransactionRepository {
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

  async deleteTransaction(transactionId: string): Promise<void> {
    await query(`UPDATE "paymentTransaction" SET "deletedAt" = $1 WHERE "paymentTransactionId" = $2`, [
      new Date().toISOString(),
      transactionId,
    ]);
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
}

export default new PaymentTransactionRepo();
