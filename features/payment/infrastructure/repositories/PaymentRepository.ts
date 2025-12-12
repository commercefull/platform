/**
 * Payment Repository Implementation
 * PostgreSQL implementation using camelCase column names (matching migrations)
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { 
  PaymentRepository as IPaymentRepository, 
  PaymentFilters, 
  PaginationOptions,
  PaginatedResult 
} from '../../domain/repositories/PaymentRepository';
import { PaymentTransaction, PaymentTransactionProps } from '../../domain/entities/PaymentTransaction';
import { PaymentRefund, PaymentRefundProps } from '../../domain/entities/PaymentRefund';
import { TransactionStatus, RefundStatus } from '../../domain/valueObjects/PaymentStatus';

export class PaymentRepo implements IPaymentRepository {

  async findTransactionById(transactionId: string): Promise<PaymentTransaction | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM "paymentTransaction" WHERE "paymentTransactionId" = $1 AND "deletedAt" IS NULL',
      [transactionId]
    );
    return row ? this.mapToTransaction(row) : null;
  }

  async findTransactionByExternalId(externalId: string): Promise<PaymentTransaction | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM "paymentTransaction" WHERE "externalTransactionId" = $1 AND "deletedAt" IS NULL',
      [externalId]
    );
    return row ? this.mapToTransaction(row) : null;
  }

  async findTransactionsByOrderId(orderId: string): Promise<PaymentTransaction[]> {
    const rows = await query<Record<string, any>[]>(
      'SELECT * FROM "paymentTransaction" WHERE "orderId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC',
      [orderId]
    );
    return (rows || []).map(row => this.mapToTransaction(row));
  }

  async findTransactionsByCustomerId(customerId: string, pagination?: PaginationOptions): Promise<PaginatedResult<PaymentTransaction>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;

    const countResult = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM "paymentTransaction" WHERE "customerId" = $1 AND "deletedAt" IS NULL',
      [customerId]
    );
    const total = parseInt(countResult?.count || '0');

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM "paymentTransaction" WHERE "customerId" = $1 AND "deletedAt" IS NULL
       ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
      [customerId, limit, offset]
    );

    return {
      data: (rows || []).map(row => this.mapToTransaction(row)),
      total, limit, offset,
      hasMore: offset + (rows?.length || 0) < total
    };
  }

  async findAllTransactions(filters?: PaymentFilters, pagination?: PaginationOptions): Promise<PaginatedResult<PaymentTransaction>> {
    const limit = pagination?.limit || 50;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const { whereClause, params } = this.buildWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "paymentTransaction" ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0');

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM "paymentTransaction" ${whereClause}
       ORDER BY "${orderBy}" ${orderDir.toUpperCase()}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return {
      data: (rows || []).map(row => this.mapToTransaction(row)),
      total, limit, offset,
      hasMore: offset + (rows?.length || 0) < total
    };
  }

  async saveTransaction(transaction: PaymentTransaction): Promise<PaymentTransaction> {
    const now = new Date().toISOString();
    
    const existing = await queryOne<Record<string, any>>(
      'SELECT "paymentTransactionId" FROM "paymentTransaction" WHERE "paymentTransactionId" = $1',
      [transaction.transactionId]
    );

    if (existing) {
      await query(
        `UPDATE "paymentTransaction" SET
          "externalTransactionId" = $1, status = $2, "paymentMethodDetails" = $3,
          "gatewayResponse" = $4, "errorCode" = $5, "errorMessage" = $6,
          "refundedAmount" = $7, "authorizedAt" = $8, "capturedAt" = $9,
          metadata = $10, "updatedAt" = $11
        WHERE "paymentTransactionId" = $12`,
        [
          transaction.externalTransactionId,
          transaction.status,
          transaction.paymentMethodDetails ? JSON.stringify(transaction.paymentMethodDetails) : null,
          transaction.gatewayResponse ? JSON.stringify(transaction.gatewayResponse) : null,
          transaction.errorCode,
          transaction.errorMessage,
          transaction.refundedAmount,
          transaction.authorizedAt?.toISOString(),
          transaction.capturedAt?.toISOString(),
          transaction.metadata ? JSON.stringify(transaction.metadata) : null,
          now,
          transaction.transactionId
        ]
      );
    } else {
      await query(
        `INSERT INTO "paymentTransaction" (
          "paymentTransactionId", "orderId", "customerId", "paymentMethodId", "paymentGatewayId",
          amount, currency, status, "refundedAmount", "customerIp", metadata,
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          transaction.transactionId,
          transaction.orderId,
          transaction.customerId,
          transaction.paymentMethodConfigId,
          transaction.gatewayId,
          transaction.amount,
          transaction.currency,
          transaction.status,
          transaction.refundedAmount,
          transaction.customerIp,
          transaction.metadata ? JSON.stringify(transaction.metadata) : null,
          now,
          now
        ]
      );
    }

    return transaction;
  }

  async countTransactions(filters?: PaymentFilters): Promise<number> {
    const { whereClause, params } = this.buildWhereClause(filters);
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "paymentTransaction" ${whereClause}`,
      params
    );
    return parseInt(result?.count || '0');
  }

  // Refunds
  async findRefundById(refundId: string): Promise<PaymentRefund | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM "paymentRefund" WHERE "paymentRefundId" = $1',
      [refundId]
    );
    return row ? this.mapToRefund(row) : null;
  }

  async findRefundsByTransactionId(transactionId: string): Promise<PaymentRefund[]> {
    const rows = await query<Record<string, any>[]>(
      'SELECT * FROM "paymentRefund" WHERE "paymentTransactionId" = $1 ORDER BY "createdAt" DESC',
      [transactionId]
    );
    return (rows || []).map(row => this.mapToRefund(row));
  }

  async saveRefund(refund: PaymentRefund): Promise<PaymentRefund> {
    const now = new Date().toISOString();
    
    const existing = await queryOne<Record<string, any>>(
      'SELECT "paymentRefundId" FROM "paymentRefund" WHERE "paymentRefundId" = $1',
      [refund.refundId]
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
          refund.refundId
        ]
      );
    } else {
      await query(
        `INSERT INTO "paymentRefund" (
          "paymentRefundId", "paymentTransactionId", amount, currency, reason, status, metadata, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          refund.refundId,
          refund.transactionId,
          refund.amount,
          refund.currency,
          refund.reason,
          refund.status,
          refund.metadata ? JSON.stringify(refund.metadata) : null,
          now,
          now
        ]
      );
    }

    return refund;
  }

  // Payment Methods
  async getEnabledPaymentMethods(merchantId: string, currency?: string): Promise<Array<{
    paymentMethodConfigId: string;
    paymentMethod: string;
    displayName: string;
    description?: string;
    icon?: string;
    processingFee?: number;
  }>> {
    let sql = 'SELECT * FROM "paymentMethod" WHERE "merchantId" = $1 AND "isEnabled" = true AND "deletedAt" IS NULL';
    const params: any[] = [merchantId];

    if (currency) {
      sql += ' AND ("supportedCurrencies" IS NULL OR $2 = ANY("supportedCurrencies"))';
      params.push(currency);
    }

    sql += ' ORDER BY "displayOrder" ASC';

    const rows = await query<Record<string, any>[]>(sql, params);
    return (rows || []).map(row => ({
      paymentMethodConfigId: row.paymentMethodId,
      paymentMethod: row.type,
      displayName: row.displayName || row.type,
      description: row.description,
      icon: row.icon,
      processingFee: row.processingFee ? parseFloat(row.processingFee) : undefined
    }));
  }

  // Gateways
  async getDefaultGateway(merchantId: string): Promise<{
    gatewayId: string;
    provider: string;
    isTestMode: boolean;
  } | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM "paymentGateway" WHERE "merchantId" = $1 AND "isDefault" = true AND "isActive" = true AND "deletedAt" IS NULL',
      [merchantId]
    );
    
    if (!row) {
      const fallback = await queryOne<Record<string, any>>(
        'SELECT * FROM "paymentGateway" WHERE "isActive" = true AND "deletedAt" IS NULL ORDER BY "createdAt" ASC LIMIT 1'
      );
      if (!fallback) return null;
      return {
        gatewayId: fallback.paymentGatewayId,
        provider: fallback.provider,
        isTestMode: Boolean(fallback.isTestMode)
      };
    }

    return {
      gatewayId: row.paymentGatewayId,
      provider: row.provider,
      isTestMode: Boolean(row.isTestMode)
    };
  }

  // Helpers
  private buildWhereClause(filters?: PaymentFilters): { whereClause: string; params: any[] } {
    const conditions: string[] = ['"deletedAt" IS NULL'];
    const params: any[] = [];
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
      params
    };
  }

  private mapToTransaction(row: Record<string, any>): PaymentTransaction {
    return PaymentTransaction.reconstitute({
      transactionId: row.paymentTransactionId,
      orderId: row.orderId,
      customerId: row.customerId,
      paymentMethodConfigId: row.paymentMethodId,
      gatewayId: row.paymentGatewayId,
      externalTransactionId: row.externalTransactionId,
      amount: parseFloat(row.amount),
      currency: row.currency,
      status: row.status as TransactionStatus,
      paymentMethodDetails: row.paymentMethodDetails ? 
        (typeof row.paymentMethodDetails === 'string' ? JSON.parse(row.paymentMethodDetails) : row.paymentMethodDetails) : undefined,
      gatewayResponse: row.gatewayResponse ?
        (typeof row.gatewayResponse === 'string' ? JSON.parse(row.gatewayResponse) : row.gatewayResponse) : undefined,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      refundedAmount: parseFloat(row.refundedAmount || 0),
      customerIp: row.customerIp,
      authorizedAt: row.authorizedAt ? new Date(row.authorizedAt) : undefined,
      capturedAt: row.capturedAt ? new Date(row.capturedAt) : undefined,
      metadata: row.metadata ?
        (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    });
  }

  private mapToRefund(row: Record<string, any>): PaymentRefund {
    return PaymentRefund.reconstitute({
      refundId: row.paymentRefundId,
      transactionId: row.paymentTransactionId,
      externalRefundId: row.externalRefundId,
      amount: parseFloat(row.amount),
      currency: row.currency,
      reason: row.reason,
      status: row.status as RefundStatus,
      gatewayResponse: row.gatewayResponse ?
        (typeof row.gatewayResponse === 'string' ? JSON.parse(row.gatewayResponse) : row.gatewayResponse) : undefined,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      processedAt: row.processedAt ? new Date(row.processedAt) : undefined,
      metadata: row.metadata ?
        (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    });
  }
}

export default new PaymentRepo();
