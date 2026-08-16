/**
 * Payment Controller
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import PaymentRepo from '../../infrastructure/repositories/PaymentRepository';
import { InitiatePaymentCommand, InitiatePaymentUseCase } from '../../application/useCases/InitiatePayment';
import { ProcessPaymentRefundCommand, ProcessPaymentRefundUseCase } from '../../application/useCases/ProcessRefund';
import {
  GetTransactionCommand,
  GetTransactionUseCase,
  ListTransactionsCommand,
  ListTransactionsUseCase,
} from '../../application/useCases/GetTransactions';
import { TransactionStatus } from '../../domain/valueObjects/PaymentStatus';
import { query, queryOne } from '../../../../libs/db';

function respond(req: TypedRequest, res: Response, data: unknown, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function respondError(req: TypedRequest, res: Response, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ success: false, error: message });
}

// ============================================================================
// Customer Endpoints
// ============================================================================

export const getMyTransactions = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const customerId = req.user?.customerId || req.user?.id || req.user?._id || req.user?.id;
    if (!customerId) {
      respondError(req, res, 'Authentication required', 401);
      return;
    }

    const { limit, offset } = req.query;
    const result = await PaymentRepo.findTransactionsByCustomerId(customerId, {
      limit: parseInt(limit as string) || 20,
      offset: parseInt(offset as string) || 0,
    });

    respond(req, res, result);
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to get transactions', 500);
  }
};

export const getTransactionByOrder = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const transactions = await PaymentRepo.findTransactionsByOrderId(orderId);
    respond(req, res, { transactions: transactions.map(t => t.toJSON()) });
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to get transactions', 500);
  }
};

export const getPaymentMethods = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { currency } = req.query;
    const methods = await PaymentRepo.getEnabledPaymentMethods('default', currency as string);
    respond(req, res, { paymentMethods: methods });
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to get payment methods', 500);
  }
};

// ============================================================================
// Business Endpoints
// ============================================================================

export const listTransactions = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { orderId, customerId, status, gatewayId, startDate, endDate, limit, offset, orderBy, orderDirection } = req.query;

    const filters: {
      orderId?: string;
      customerId?: string;
      status?: TransactionStatus;
      gatewayId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {};
    if (orderId) filters.orderId = orderId as string;
    if (customerId) filters.customerId = customerId as string;
    if (status) filters.status = status as TransactionStatus;
    if (gatewayId) filters.gatewayId = gatewayId as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const command = new ListTransactionsCommand(
      Object.keys(filters).length > 0 ? filters : undefined,
      parseInt(limit as string) || 50,
      parseInt(offset as string) || 0,
      (orderBy as string) || 'createdAt',
      (orderDirection as 'asc' | 'desc') || 'desc',
    );

    const useCase = new ListTransactionsUseCase(PaymentRepo);
    const result = await useCase.execute(command);

    respond(req, res, result);
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to list transactions', 500);
  }
};

export const getTransaction = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const command = new GetTransactionCommand(transactionId);
    const useCase = new GetTransactionUseCase(PaymentRepo);
    const transaction = await useCase.execute(command);

    if (!transaction) {
      respondError(req, res, 'Transaction not found', 404);
      return;
    }

    respond(req, res, transaction);
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to get transaction', 500);
  }
};

export const initiatePayment = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as { orderId?: string; amount?: number; currency?: string; paymentMethodConfigId?: string; customerId?: string };
    const { orderId, amount, currency, paymentMethodConfigId, customerId } = body;

    if (!orderId || !amount || !currency || !paymentMethodConfigId) {
      respondError(req, res, 'Missing required fields', 400);
      return;
    }

    const command = new InitiatePaymentCommand(orderId, amount, currency, paymentMethodConfigId, customerId, req.ip);

    const useCase = new InitiatePaymentUseCase(PaymentRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 201);
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to initiate payment', 500);
  }
};

export const processRefund = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const body = req.body as { amount?: number; reason?: string };
    const { amount, reason } = body;

    if (!amount || amount <= 0) {
      respondError(req, res, 'Amount must be greater than zero', 400);
      return;
    }

    const command = new ProcessPaymentRefundCommand(transactionId, amount, reason);
    const useCase = new ProcessPaymentRefundUseCase(PaymentRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 201);
  } catch (error: unknown) {
    logger.error('Error:', error);

    if ((error as Error).message.includes('not found') || (error as Error).message?.includes('invalid input syntax for type uuid')) {
      respondError(req, res, 'Transaction not found', 404);
      return;
    }
    if ((error as Error).message.includes('cannot be refunded') || (error as Error).message.includes('exceeds')) {
      respondError(req, res, (error as Error).message, 400);
      return;
    }
    respondError(req, res, (error as Error).message || 'Failed to process refund', 500);
  }
};

export const getRefunds = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;

    const transaction = await PaymentRepo.findTransactionById(transactionId);
    if (!transaction) {
      respondError(req, res, 'Transaction not found', 404);
      return;
    }

    const refunds = await PaymentRepo.findRefundsByTransactionId(transactionId);
    respond(req, res, { refunds: refunds.map(r => r.toJSON()) });
  } catch (error: unknown) {
    logger.error('Error:', error);

    if ((error as Error).message?.includes('not found') || (error as Error).message?.includes('invalid input syntax for type uuid')) {
      respondError(req, res, 'Transaction not found', 404);
      return;
    }
    respondError(req, res, (error as Error).message || 'Failed to get refunds', 500);
  }
};

// ============================================================================
// Gateway Management Endpoints
// ============================================================================

export const listGateways = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user?.merchantId || req.user?._id || req.user?.id;
    if (!merchantId) {
      respondError(req, res, 'Authentication required', 401);
      return;
    }

    const rows = await query<Record<string, unknown>[]>(
      'SELECT * FROM "paymentGateway" WHERE "merchantId" = $1 AND "deletedAt" IS NULL ORDER BY "name" ASC',
      [merchantId],
    );
    respond(req, res, rows || []);
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to list gateways', 500);
  }
};

export const getGateway = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { gatewayId } = req.params;
    const gateway = await queryOne<Record<string, unknown>>(
      'SELECT * FROM "paymentGateway" WHERE "paymentGatewayId" = $1 AND "deletedAt" IS NULL',
      [gatewayId],
    );

    if (!gateway) {
      respondError(req, res, 'Gateway not found', 404);
      return;
    }
    respond(req, res, gateway);
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to get gateway', 500);
  }
};

export const createGateway = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user?.merchantId || req.user?._id || req.user?.id;
    if (!merchantId) {
      respondError(req, res, 'Authentication required', 401);
      return;
    }

    const body = req.body as {
      name?: string;
      provider?: string;
      isActive?: boolean;
      isDefault?: boolean;
      isTestMode?: boolean;
      apiKey?: string;
      apiSecret?: string;
      publicKey?: string;
      webhookSecret?: string;
      apiEndpoint?: string;
      supportedPaymentMethods?: string;
    };

    const {
      name,
      provider,
      isActive,
      isDefault,
      isTestMode,
      apiKey,
      apiSecret,
      publicKey,
      webhookSecret,
      apiEndpoint,
      supportedPaymentMethods,
    } = body;

    if (!name || !provider) {
      respondError(req, res, 'Name and provider are required', 400);
      return;
    }

    const now = new Date().toISOString();

    const result = await queryOne<Record<string, unknown>>(
      `INSERT INTO "paymentGateway" (
        "merchantId", name, provider, "isActive", "isDefault", "isTestMode",
        "apiKey", "apiSecret", "publicKey", "webhookSecret", "apiEndpoint", "supportedPaymentMethods",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        merchantId,
        name,
        provider,
        isActive ?? true,
        isDefault ?? false,
        isTestMode ?? false,
        apiKey,
        apiSecret,
        publicKey,
        webhookSecret,
        apiEndpoint,
        supportedPaymentMethods || 'creditCard',
        now,
        now,
      ],
    );

    respond(req, res, result, 201);
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to create gateway', 500);
  }
};

export const updateGateway = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { gatewayId } = req.params;
    const updates = req.body as Record<string, unknown>;

    const now = new Date().toISOString();

    // Build dynamic update
    const allowedFields = [
      'name',
      'provider',
      'isActive',
      'isDefault',
      'isTestMode',
      'apiKey',
      'apiSecret',
      'publicKey',
      'webhookSecret',
      'apiEndpoint',
      'supportedPaymentMethods',
    ];
    const setStatements: string[] = ['"updatedAt" = $1'];
    const values: unknown[] = [now];
    let paramIndex = 2;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setStatements.push(`"${field}" = $${paramIndex++}`);
        values.push(updates[field]);
      }
    }

    values.push(gatewayId);

    const result = await queryOne<Record<string, unknown>>(
      `UPDATE "paymentGateway" SET ${setStatements.join(', ')} WHERE "paymentGatewayId" = $${paramIndex} AND "deletedAt" IS NULL RETURNING *`,
      values,
    );

    if (!result) {
      respondError(req, res, 'Gateway not found', 404);
      return;
    }
    respond(req, res, result);
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to update gateway', 500);
  }
};

export const deleteGateway = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { gatewayId } = req.params;
    const now = new Date().toISOString();

    await query('UPDATE "paymentGateway" SET "deletedAt" = $1 WHERE "paymentGatewayId" = $2', [now, gatewayId]);

    respond(req, res, { success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to delete gateway', 500);
  }
};

// ============================================================================
// Method Config Management Endpoints
// ============================================================================

export const listMethodConfigs = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user?.merchantId || req.user?._id || req.user?.id;
    if (!merchantId) {
      respondError(req, res, 'Authentication required', 401);
      return;
    }

    const rows = await query<Record<string, unknown>[]>(
      'SELECT * FROM "paymentMethodConfig" WHERE "merchantId" = $1 AND "deletedAt" IS NULL ORDER BY "displayOrder" ASC',
      [merchantId],
    );
    respond(req, res, rows || []);
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to list method configs', 500);
  }
};

export const getMethodConfig = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { methodConfigId } = req.params;
    const config = await queryOne<Record<string, unknown>>(
      'SELECT * FROM "paymentMethodConfig" WHERE "paymentMethodConfigId" = $1 AND "deletedAt" IS NULL',
      [methodConfigId],
    );

    if (!config) {
      respondError(req, res, 'Method config not found', 404);
      return;
    }
    respond(req, res, config);
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to get method config', 500);
  }
};

export const createMethodConfig = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user?.merchantId || req.user?._id || req.user?.id;
    if (!merchantId) {
      respondError(req, res, 'Authentication required', 401);
      return;
    }

    const body = req.body as {
      paymentMethod?: string;
      isEnabled?: boolean;
      displayName?: string;
      description?: string;
      processingFee?: string;
      minimumAmount?: string;
      maximumAmount?: string;
      displayOrder?: number;
      icon?: string;
      supportedCurrencies?: string[];
      countries?: string[];
      gatewayId?: string;
      configuration?: Record<string, unknown>;
    };

    const {
      paymentMethod,
      isEnabled,
      displayName,
      description,
      processingFee,
      minimumAmount,
      maximumAmount,
      displayOrder,
      icon,
      supportedCurrencies,
      countries,
      gatewayId,
      configuration,
    } = body;

    if (!paymentMethod) {
      respondError(req, res, 'Payment method is required', 400);
      return;
    }

    const now = new Date().toISOString();

    const result = await queryOne<Record<string, unknown>>(
      `INSERT INTO "paymentMethodConfig" (
        "merchantId", "paymentMethod", "isEnabled", "displayName", description, "processingFee",
        "minimumAmount", "maximumAmount", "displayOrder", icon, "supportedCurrencies", countries,
        "gatewayId", configuration, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        merchantId,
        paymentMethod,
        isEnabled ?? true,
        displayName,
        description,
        processingFee,
        minimumAmount,
        maximumAmount,
        displayOrder ?? 0,
        icon,
        supportedCurrencies || ['USD'],
        countries,
        gatewayId,
        configuration ? JSON.stringify(configuration) : null,
        now,
        now,
      ],
    );

    respond(req, res, result, 201);
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to create method config', 500);
  }
};

export const updateMethodConfig = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { methodConfigId } = req.params;
    const updates = req.body as Record<string, unknown>;

    const now = new Date().toISOString();

    // Build dynamic update
    const allowedFields = [
      'paymentMethod',
      'isEnabled',
      'displayName',
      'description',
      'processingFee',
      'minimumAmount',
      'maximumAmount',
      'displayOrder',
      'icon',
      'supportedCurrencies',
      'countries',
      'gatewayId',
      'configuration',
    ];
    const setStatements: string[] = ['"updatedAt" = $1'];
    const values: unknown[] = [now];
    let paramIndex = 2;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setStatements.push(`"${field}" = $${paramIndex++}`);
        values.push(field === 'configuration' ? JSON.stringify(updates[field]) : updates[field]);
      }
    }

    values.push(methodConfigId);

    const result = await queryOne<Record<string, unknown>>(
      `UPDATE "paymentMethodConfig" SET ${setStatements.join(', ')} WHERE "paymentMethodConfigId" = $${paramIndex} AND "deletedAt" IS NULL RETURNING *`,
      values,
    );

    if (!result) {
      respondError(req, res, 'Method config not found', 404);
      return;
    }
    respond(req, res, result);
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to update method config', 500);
  }
};

export const deleteMethodConfig = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { methodConfigId } = req.params;
    const now = new Date().toISOString();

    await query('UPDATE "paymentMethodConfig" SET "deletedAt" = $1 WHERE "paymentMethodConfigId" = $2', [now, methodConfigId]);

    respond(req, res, { success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to delete method config', 500);
  }
};

export const deleteTransaction = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const now = new Date().toISOString();

    await query('UPDATE "paymentTransaction" SET "deletedAt" = $1 WHERE "paymentTransactionId" = $2', [now, transactionId]);

    respond(req, res, { success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);

    respondError(req, res, (error as Error).message || 'Failed to delete transaction', 500);
  }
};
