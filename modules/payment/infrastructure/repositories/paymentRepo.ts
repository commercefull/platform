/**
 * Payment Repository
 * Handles database operations for payment gateways, method configs, transactions, and refunds
 */

import { query, queryOne } from '../../../../libs/db';
import { PaymentGateway, PaymentMethodConfig, PaymentTransaction, PaymentRefund } from '../../../../libs/db/types';
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
  FailedToCreatePaymentRefundError,
  PaymentRefundNotFoundError,
  FailedToUpdatePaymentRefundError,
} from '../../domain/errors/PaymentErrors';

// ============================================================================
// Types
// ============================================================================

type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type PaymentGatewayCreateParams = Omit<PaymentGateway, 'paymentGatewayId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type PaymentGatewayUpdateParams = Partial<PaymentGatewayCreateParams>;

export type PaymentMethodConfigCreateParams = Omit<PaymentMethodConfig, 'paymentMethodConfigId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type PaymentMethodConfigUpdateParams = Partial<PaymentMethodConfigCreateParams>;

export type PaymentTransactionCreateParams = MakeOptional<
  Omit<PaymentTransaction, 'paymentTransactionId' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  'transactionId' | 'authorizationCode' | 'responseCode' | 'responseMessage' | 'errorCode' | 'errorMessage' | 'gatewayResponse' | 'customerId' | 'paymentMethodId' | 'paymentGatewayId' | 'externalTransactionId' | 'currency' | 'paymentMethodDetails' | 'refundedAmount' | 'metadata' | 'customerIp' | 'authorizedAt' | 'capturedAt'
>;
export type PaymentTransactionUpdateParams = Partial<PaymentTransactionCreateParams>;

export type PaymentRefundCreateParams = MakeOptional<
  Omit<PaymentRefund, 'paymentRefundId' | 'createdAt' | 'updatedAt'>,
  'transactionId' | 'reason' | 'refundId' | 'paymentTransactionId' | 'externalRefundId' | 'currency' | 'gatewayResponse' | 'errorCode' | 'errorMessage' | 'processedAt' | 'metadata'
>;
export type PaymentRefundUpdateParams = Partial<PaymentRefundCreateParams>;

// ============================================================================
// Repository
// ============================================================================

export class PaymentRepo {
  // ============================================================================
  // Payment Gateway Methods
  // ============================================================================

  async findAllGateways(organizationId: string): Promise<PaymentGateway[]> {
    const results = await query<PaymentGateway[]>(
      `SELECT * FROM "paymentGateway" 
       WHERE "organizationId" = $1 AND "deletedAt" IS NULL 
       ORDER BY "name" ASC`,
      [organizationId],
    );
    return results || [];
  }

  async findGatewayById(id: string): Promise<PaymentGateway | null> {
    return queryOne<PaymentGateway>(
      `SELECT * FROM "paymentGateway" 
       WHERE "paymentGatewayId" = $1 AND "deletedAt" IS NULL`,
      [id],
    );
  }

  async findDefaultGateway(organizationId: string): Promise<PaymentGateway | null> {
    return queryOne<PaymentGateway>(
      `SELECT * FROM "paymentGateway" 
       WHERE "organizationId" = $1 AND "isDefault" = true AND "deletedAt" IS NULL`,
      [organizationId],
    );
  }

  async createGateway(params: PaymentGatewayCreateParams): Promise<PaymentGateway> {
    const now = new Date();
    const result = await queryOne<PaymentGateway>(
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
        params.apiKey || null,
        params.apiSecret || null,
        params.publicKey || null,
        params.webhookSecret || null,
        params.apiEndpoint || null,
        params.supportedPaymentMethods || [],
        params.supportedCurrencies || [],
        params.processingFees || null,
        params.checkoutSettings || null,
        params.metadata || null,
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

    const result = await queryOne<PaymentGateway>(
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
    const results = await query<PaymentMethodConfig[]>(
      `SELECT * FROM "paymentMethodConfig" 
       WHERE "organizationId" = $1 AND "deletedAt" IS NULL 
       ORDER BY "displayOrder" ASC, "displayName" ASC`,
      [organizationId],
    );
    return results || [];
  }

  async findMethodConfigById(id: string): Promise<PaymentMethodConfig | null> {
    return queryOne<PaymentMethodConfig>(
      `SELECT * FROM "paymentMethodConfig" 
       WHERE "paymentMethodConfigId" = $1 AND "deletedAt" IS NULL`,
      [id],
    );
  }

  async findEnabledMethodConfigs(organizationId: string): Promise<PaymentMethodConfig[]> {
    const results = await query<PaymentMethodConfig[]>(
      `SELECT * FROM "paymentMethodConfig" 
       WHERE "organizationId" = $1 AND "isEnabled" = true AND "deletedAt" IS NULL 
       ORDER BY "displayOrder" ASC, "displayName" ASC`,
      [organizationId],
    );
    return results || [];
  }

  async createMethodConfig(params: PaymentMethodConfigCreateParams): Promise<PaymentMethodConfig> {
    const now = new Date();
    const result = await queryOne<PaymentMethodConfig>(
      `INSERT INTO "paymentMethodConfig" 
       ("organizationId", "paymentMethod", "isEnabled", "displayName", "description",
        "processingFee", "minimumAmount", "maximumAmount", "displayOrder", "icon",
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
        params.processingFee || null,
        params.minimumAmount || null,
        params.maximumAmount || null,
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

    const result = await queryOne<PaymentMethodConfig>(
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
    return queryOne<PaymentTransaction>(
      `SELECT * FROM "paymentTransaction" 
       WHERE "paymentTransactionId" = $1 AND "deletedAt" IS NULL`,
      [id],
    );
  }

  async findTransactionsByOrderId(orderId: string): Promise<PaymentTransaction[]> {
    const results = await query<PaymentTransaction[]>(
      `SELECT * FROM "paymentTransaction" 
       WHERE "orderId" = $1 AND "deletedAt" IS NULL 
       ORDER BY "createdAt" DESC`,
      [orderId],
    );
    return results || [];
  }

  async findTransactionsByCustomerId(customerId: string, limit: number = 10, offset: number = 0): Promise<PaymentTransaction[]> {
    const results = await query<PaymentTransaction[]>(
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
    const result = await queryOne<PaymentTransaction>(
      `INSERT INTO "paymentTransaction" 
       ("orderPaymentId", "orderId", "type", "amount", "currencyCode", "status",
        "customerId", "paymentMethodId", "paymentGatewayId", "externalTransactionId",
        "currency", "paymentMethodDetails", "gatewayResponse", "errorCode", "errorMessage",
        "refundedAmount", "metadata", "customerIp", "capturedAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING *`,
      [
        params.orderPaymentId,
        params.orderId,
        params.type,
        params.amount,
        params.currencyCode,
        params.status,
        params.customerId || null,
        params.paymentMethodId || null,
        params.paymentGatewayId || null,
        params.externalTransactionId || null,
        params.currency || null,
        params.paymentMethodDetails || null,
        params.gatewayResponse || null,
        params.errorCode || null,
        params.errorMessage || null,
        params.refundedAmount || null,
        params.metadata || null,
        params.customerIp || null,
        params.capturedAt || null,
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

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramIndex++}`);
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

    const result = await queryOne<PaymentTransaction>(
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
    return queryOne<PaymentRefund>(
      `SELECT * FROM "paymentRefund" 
       WHERE "paymentRefundId" = $1`,
      [id],
    );
  }

  async findRefundsByTransactionId(transactionId: string): Promise<PaymentRefund[]> {
    const results = await query<PaymentRefund[]>(
      `SELECT * FROM "paymentRefund" 
       WHERE "paymentTransactionId" = $1 
       ORDER BY "createdAt" DESC`,
      [transactionId],
    );
    return results || [];
  }

  async createRefund(params: PaymentRefundCreateParams): Promise<PaymentRefund> {
    const now = new Date();
    const result = await queryOne<PaymentRefund>(
      `INSERT INTO "paymentRefund" 
       ("orderPaymentId", "orderId", "transactionId", "amount", "currencyCode",
        "reason", "status", "paymentTransactionId", "externalRefundId", "currency",
        "gatewayResponse", "errorCode", "errorMessage", "metadata", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        params.orderPaymentId,
        params.orderId,
        params.transactionId || null,
        params.amount,
        params.currencyCode,
        params.reason || null,
        params.status,
        params.paymentTransactionId || null,
        params.externalRefundId || null,
        params.currency || null,
        params.gatewayResponse || null,
        params.errorCode || null,
        params.errorMessage || null,
        params.metadata || null,
        now,
        now,
      ],
    );

    if (!result) throw new FailedToCreatePaymentRefundError();

    // Update the transaction's refunded amount
    await query(
      `UPDATE "paymentTransaction" 
       SET "refundedAmount" = COALESCE("refundedAmount", 0) + $1,
           "status" = CASE
             WHEN COALESCE("refundedAmount", 0) + $1 >= "amount" THEN 'refunded'
             ELSE 'partially_refunded'
           END,
           "updatedAt" = $2
       WHERE "paymentTransactionId" = $3 AND "deletedAt" IS NULL`,
      [params.amount, now, params.paymentTransactionId],
    );

    return result;
  }

  async updateRefund(id: string, params: PaymentRefundUpdateParams): Promise<PaymentRefund> {
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
      const existing = await this.findRefundById(id);
      if (!existing) throw new PaymentRefundNotFoundError();
      return existing;
    }

    updates.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);
    values.push(id);

    const result = await queryOne<PaymentRefund>(
      `UPDATE "paymentRefund" 
       SET ${updates.join(', ')} 
       WHERE "paymentRefundId" = $${paramIndex}
       RETURNING *`,
      values,
    );

    if (!result) throw new FailedToUpdatePaymentRefundError();
    return result;
  }

  // ============================================================================
  // Payment Processing Methods (mock implementations)
  // ============================================================================

  async processPayment(paymentData: {
    orderPaymentId: string;
    orderId: string;
    customerId?: string;
    amount: number;
    currency: string;
    paymentMethodId?: string;
    paymentGatewayId?: string;
  }): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const transaction = await this.createTransaction({
        orderPaymentId: paymentData.orderPaymentId,
        orderId: paymentData.orderId,
        type: 'payment',
        amount: String(paymentData.amount),
        currencyCode: paymentData.currency,
        status: 'paid',
        customerId: paymentData.customerId || null,
        paymentMethodId: paymentData.paymentMethodId || null,
        paymentGatewayId: paymentData.paymentGatewayId || null,
        gatewayResponse: { mock: true },
      });

      return { success: true, transactionId: transaction.paymentTransactionId };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  }

  async processRefund(refundData: {
    orderPaymentId: string;
    orderId: string;
    paymentTransactionId: string;
    amount: number;
    currency: string;
    reason?: string;
  }): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const refund = await this.createRefund({
        orderPaymentId: refundData.orderPaymentId,
        orderId: refundData.orderId,
        paymentTransactionId: refundData.paymentTransactionId,
        amount: String(refundData.amount),
        currencyCode: refundData.currency,
        reason: refundData.reason || null,
        status: 'completed',
        gatewayResponse: { mock: true },
      });

      return { success: true, refundId: refund.paymentRefundId };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export default new PaymentRepo();
