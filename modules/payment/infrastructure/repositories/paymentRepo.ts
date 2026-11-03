/**
 * Payment Repository
 * Handles database operations for payment gateways, method configs, transactions, and refunds
 */

import { query, queryOne } from '../../../../libs/db';
import { PaymentGateway, PaymentMethodConfig, PaymentTransaction, PaymentRefund } from '../../../../libs/db/types';
import {
  findRefundById as qFindRefundById,
  findRefundsByTransactionId as qFindRefundsByTransactionId,
  createRefund as qCreateRefund,
  updateRefund as qUpdateRefund,
} from './paymentRefundQueries';
import { processPaymentMock, processRefundMock } from './paymentProcessingQueries';
import type {
  PaymentGatewayCreateParams,
  PaymentGatewayUpdateParams,
  PaymentMethodConfigCreateParams,
  PaymentMethodConfigUpdateParams,
  PaymentTransactionCreateParams,
  PaymentTransactionUpdateParams,
  PaymentRefundCreateParams,
  PaymentRefundUpdateParams,
} from './paymentRepoTypes';
export type {
  PaymentGatewayCreateParams,
  PaymentGatewayUpdateParams,
  PaymentMethodConfigCreateParams,
  PaymentMethodConfigUpdateParams,
  PaymentTransactionCreateParams,
  PaymentTransactionUpdateParams,
  PaymentRefundCreateParams,
  PaymentRefundUpdateParams,
} from './paymentRepoTypes';
import {
  FailedToCreatePaymentGatewayError,
  PaymentGatewayNotFoundError,
  FailedToUpdatePaymentGatewayError,
  FailedToCreatePaymentMethodConfigError,
  PaymentMethodConfigNotFoundError,
  FailedToUpdatePaymentMethodConfigError,
  FailedToCreatePaymentTransactionError,
  PaymentTransactionNotFoundError,
  FailedToUpdatePaymentTransactionError,
} from '../../domain/errors/PaymentErrors';
import type {
  PaymentGateway as DbPaymentGateway,
  PaymentMethodConfig as DbPaymentMethodConfig,
  PaymentTransaction as DbPaymentTransaction,
} from '../../../../libs/db/types';

/** Falsy → fallback (nullable column default). */
const dbDefault = (value: unknown, fallback: unknown = null): unknown => value || fallback;

// ============================================================================
// Types
// ============================================================================

// ============================================================================
// Repository
// ============================================================================

export class PaymentRepo {
  // ============================================================================
  // Payment Gateway Methods
  // ============================================================================

  async findAllGateways(organizationId: string): Promise<PaymentGateway[]> {
    const results = await query<DbPaymentGateway[]>(
      `SELECT * FROM "paymentGateway" 
       WHERE "organizationId" = $1 AND "deletedAt" IS NULL 
       ORDER BY "name" ASC`,
      [organizationId],
    );
    return results || [];
  }

  async findGatewayById(id: string): Promise<PaymentGateway | null> {
    return queryOne<DbPaymentGateway>(
      `SELECT * FROM "paymentGateway" 
       WHERE "paymentGatewayId" = $1 AND "deletedAt" IS NULL`,
      [id],
    );
  }

  async findDefaultGateway(organizationId: string): Promise<PaymentGateway | null> {
    return queryOne<DbPaymentGateway>(
      `SELECT * FROM "paymentGateway" 
       WHERE "organizationId" = $1 AND "isDefault" = true AND "deletedAt" IS NULL`,
      [organizationId],
    );
  }

  async createGateway(params: PaymentGatewayCreateParams): Promise<PaymentGateway> {
    const now = new Date();
    const result = await queryOne<DbPaymentGateway>(
      `INSERT INTO "paymentGateway" 
       ("organizationId", "name", "provider", "isActive", "isDefault", "isTestMode",
        "apiKey", "apiSecret", "publicKey", "webhookSecret", "apiEndpoint",
        "supportedPaymentMethods", "supportedCurrencies", "processingFees",
        "checkoutSettings", "metadata", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        params.organizationId,
        params.name,
        params.provider,
        params.isActive ?? true,
        params.isDefault ?? false,
        params.isTestMode ?? false,
        dbDefault(params.apiKey),
        dbDefault(params.apiSecret),
        dbDefault(params.publicKey),
        dbDefault(params.webhookSecret),
        dbDefault(params.apiEndpoint),
        params.supportedPaymentMethods || [],
        params.supportedCurrencies || [],
        dbDefault(params.processingFees),
        dbDefault(params.checkoutSettings),
        dbDefault(params.metadata),
        now,
        now,
      ],
    );

    if (!result) throw new FailedToCreatePaymentGatewayError();

    // If this is the default gateway, ensure it's the only default
    if (params.isDefault) {
      await query(
        `UPDATE "paymentGateway" 
         SET "isDefault" = false 
         WHERE "organizationId" = $1 AND "paymentGatewayId" != $2 AND "deletedAt" IS NULL`,
        [params.organizationId, result.paymentGatewayId],
      );
    }

    return result;
  }

  async updateGateway(id: string, params: PaymentGatewayUpdateParams): Promise<PaymentGateway> {
    const now = new Date();
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      const existing = await this.findGatewayById(id);
      if (!existing) throw new PaymentGatewayNotFoundError();
      return existing;
    }

    updates.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);
    values.push(id);

    const result = await queryOne<DbPaymentGateway>(
      `UPDATE "paymentGateway" 
       SET ${updates.join(', ')} 
       WHERE "paymentGatewayId" = $${paramIndex} AND "deletedAt" IS NULL
       RETURNING *`,
      values,
    );

    if (!result) throw new FailedToUpdatePaymentGatewayError();

    // If this is now the default gateway, ensure it's the only default
    if (params.isDefault) {
      const existing = await this.findGatewayById(id);
      if (existing) {
        await query(
          `UPDATE "paymentGateway" 
           SET "isDefault" = false 
           WHERE "organizationId" = $1 AND "paymentGatewayId" != $2 AND "deletedAt" IS NULL`,
          [existing.organizationId, id],
        );
      }
    }

    return result;
  }

  async deleteGateway(id: string): Promise<boolean> {
    const now = new Date();
    const result = await queryOne<{ paymentGatewayId: string }>(
      `UPDATE "paymentGateway" 
       SET "deletedAt" = $1 
       WHERE "paymentGatewayId" = $2 AND "deletedAt" IS NULL
       RETURNING "paymentGatewayId"`,
      [now, id],
    );
    return !!result;
  }

  // ============================================================================
  // Payment Method Config Methods
  // ============================================================================

  async findAllMethodConfigs(organizationId: string): Promise<PaymentMethodConfig[]> {
    const results = await query<DbPaymentMethodConfig[]>(
      `SELECT * FROM "paymentMethodConfig" 
       WHERE "organizationId" = $1 AND "deletedAt" IS NULL 
       ORDER BY "displayOrder" ASC, "displayName" ASC`,
      [organizationId],
    );
    return results || [];
  }

  async findMethodConfigById(id: string): Promise<PaymentMethodConfig | null> {
    return queryOne<DbPaymentMethodConfig>(
      `SELECT * FROM "paymentMethodConfig" 
       WHERE "paymentMethodConfigId" = $1 AND "deletedAt" IS NULL`,
      [id],
    );
  }

  async findEnabledMethodConfigs(organizationId: string): Promise<PaymentMethodConfig[]> {
    const results = await query<DbPaymentMethodConfig[]>(
      `SELECT * FROM "paymentMethodConfig" 
       WHERE "organizationId" = $1 AND "isEnabled" = true AND "deletedAt" IS NULL 
       ORDER BY "displayOrder" ASC, "displayName" ASC`,
      [organizationId],
    );
    return results || [];
  }

  async createMethodConfig(params: PaymentMethodConfigCreateParams): Promise<PaymentMethodConfig> {
    const now = new Date();
    const result = await queryOne<DbPaymentMethodConfig>(
      `INSERT INTO "paymentMethodConfig" 
       ("organizationId", "paymentMethod", "isEnabled", "displayName", "description",
        "processingFeeCents", "minimumAmountCents", "maximumAmountCents", "displayOrder", "icon",
        "supportedCurrencies", "countries", "gatewayId", "configuration",
        "metadata", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        params.organizationId,
        params.paymentMethod,
        params.isEnabled ?? true,
        params.displayName || null,
        params.description || null,
        params.processingFeeCents || null,
        params.minimumAmountCents || null,
        params.maximumAmountCents || null,
        params.displayOrder ?? 0,
        params.icon || null,
        params.supportedCurrencies || [],
        params.countries || null,
        params.gatewayId || null,
        params.configuration || null,
        params.metadata || null,
        now,
        now,
      ],
    );

    if (!result) throw new FailedToCreatePaymentMethodConfigError();
    return result;
  }

  async updateMethodConfig(id: string, params: PaymentMethodConfigUpdateParams): Promise<PaymentMethodConfig> {
    const now = new Date();
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      const existing = await this.findMethodConfigById(id);
      if (!existing) throw new PaymentMethodConfigNotFoundError();
      return existing;
    }

    updates.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);
    values.push(id);

    const result = await queryOne<DbPaymentMethodConfig>(
      `UPDATE "paymentMethodConfig" 
       SET ${updates.join(', ')} 
       WHERE "paymentMethodConfigId" = $${paramIndex} AND "deletedAt" IS NULL
       RETURNING *`,
      values,
    );

    if (!result) throw new FailedToUpdatePaymentMethodConfigError();
    return result;
  }

  async deleteMethodConfig(id: string): Promise<boolean> {
    const now = new Date();
    const result = await queryOne<{ paymentMethodConfigId: string }>(
      `UPDATE "paymentMethodConfig" 
       SET "deletedAt" = $1 
       WHERE "paymentMethodConfigId" = $2 AND "deletedAt" IS NULL
       RETURNING "paymentMethodConfigId"`,
      [now, id],
    );
    return !!result;
  }

  // ============================================================================
  // Transaction Methods
  // ============================================================================

  async findTransactionById(id: string): Promise<PaymentTransaction | null> {
    return queryOne<DbPaymentTransaction>(
      `SELECT * FROM "paymentTransaction" 
       WHERE "paymentTransactionId" = $1 AND "deletedAt" IS NULL`,
      [id],
    );
  }

  async findTransactionsByOrderId(orderId: string): Promise<PaymentTransaction[]> {
    const results = await query<DbPaymentTransaction[]>(
      `SELECT * FROM "paymentTransaction" 
       WHERE "orderId" = $1 AND "deletedAt" IS NULL 
       ORDER BY "createdAt" DESC`,
      [orderId],
    );
    return results || [];
  }

  async findTransactionsByCustomerId(customerId: string, limit: number = 10, offset: number = 0): Promise<PaymentTransaction[]> {
    const results = await query<DbPaymentTransaction[]>(
      `SELECT * FROM "paymentTransaction" 
       WHERE "customerId" = $1 AND "deletedAt" IS NULL 
       ORDER BY "createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [customerId, limit, offset],
    );
    return results || [];
  }

  async createTransaction(params: PaymentTransactionCreateParams): Promise<PaymentTransaction> {
    const now = new Date();
    const result = await queryOne<DbPaymentTransaction>(
      `INSERT INTO "paymentTransaction" 
       ("orderPaymentId", "orderId", "type", "amountCents", "currencyCode", "status",
        "customerId", "paymentMethodId", "paymentGatewayId", "externalTransactionId",
        "paymentMethodDetails", "gatewayResponse", "errorCode", "errorMessage",
        "refundedAmountCents", "metadata", "customerIp", "capturedAt",
        "settlementCurrencyCode", "settlementAmountCents",
        "accountingCurrencyCode", "accountingAmountCents", "fxRate",
        "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
       RETURNING *`,
      [
        params.orderPaymentId,
        params.orderId,
        params.type,
        params.amountCents,
        params.currencyCode,
        params.status,
        dbDefault(params.customerId),
        dbDefault(params.paymentMethodId),
        dbDefault(params.paymentGatewayId),
        dbDefault(params.externalTransactionId),
        dbDefault(params.paymentMethodDetails),
        dbDefault(params.gatewayResponse),
        dbDefault(params.errorCode),
        dbDefault(params.errorMessage),
        dbDefault(params.refundedAmountCents),
        dbDefault(params.metadata),
        dbDefault(params.customerIp),
        dbDefault(params.capturedAt),
        dbDefault(params.settlementCurrencyCode),
        dbDefault(params.settlementAmountCents),
        dbDefault(params.accountingCurrencyCode),
        dbDefault(params.accountingAmountCents),
        dbDefault(params.fxRate),
        now,
        now,
      ],
    );

    if (!result) throw new FailedToCreatePaymentTransactionError();
    return result;
  }

  async updateTransaction(id: string, params: PaymentTransactionUpdateParams): Promise<PaymentTransaction> {
    const now = new Date();
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;
    const columnMap: Record<string, string> = { currency: 'currencyCode' };

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${columnMap[key] ?? key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      const existing = await this.findTransactionById(id);
      if (!existing) throw new PaymentTransactionNotFoundError();
      return existing;
    }

    updates.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);
    values.push(id);

    const result = await queryOne<DbPaymentTransaction>(
      `UPDATE "paymentTransaction" 
       SET ${updates.join(', ')} 
       WHERE "paymentTransactionId" = $${paramIndex} AND "deletedAt" IS NULL
       RETURNING *`,
      values,
    );

    if (!result) throw new FailedToUpdatePaymentTransactionError();
    return result;
  }

  // ============================================================================
  // Refund Methods
  // ============================================================================

  async findRefundById(id: string): Promise<PaymentRefund | null> {
    return qFindRefundById(id);
  }

  async findRefundsByTransactionId(transactionId: string): Promise<PaymentRefund[]> {
    return qFindRefundsByTransactionId(transactionId);
  }

  async createRefund(params: PaymentRefundCreateParams): Promise<PaymentRefund> {
    return qCreateRefund(params);
  }

  async updateRefund(id: string, params: PaymentRefundUpdateParams): Promise<PaymentRefund> {
    return qUpdateRefund(id, params);
  }

  // ============================================================================
  // Payment Processing Methods (mock implementations)
  // ============================================================================

  processPayment(paymentData: Parameters<typeof processPaymentMock>[1]) {
    return processPaymentMock(this, paymentData);
  }

  processRefund(refundData: Parameters<typeof processRefundMock>[1]) {
    return processRefundMock(this, refundData);
  }
}

export default new PaymentRepo();
