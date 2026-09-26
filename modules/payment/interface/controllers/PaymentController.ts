/**
 * Payment Controller
 */

import type { HttpRequest, HttpResponse } from 'libs/http';

import { InitiatePaymentCommand } from '../../application/useCases/InitiatePayment';
import { ProcessPaymentRefundCommand } from '../../application/useCases/ProcessRefund';
import {
  GetTransactionCommand,
  ListTransactionsCommand,
} from '../../application/useCases';
import {
  getTransactionUseCase,
  initiatePaymentUseCase,
  listTransactionsUseCase,
  managePaymentGatewaysUseCase,
  managePaymentRecordsUseCase,
  processPaymentRefundUseCase,
} from '../../application/useCases/wired';
import type {
  PaymentGatewayCreateParams,
  PaymentGatewayUpdateParams,
  PaymentMethodConfigCreateParams,
  PaymentMethodConfigUpdateParams,
} from '../../domain/repositories/PaymentGatewayRepository';
import { TransactionStatus } from '../../domain/valueObjects/PaymentStatus';
import { isUuid } from '../../../../libs/uuid';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';

function respond(req: HttpRequest, res: HttpResponse, data: unknown, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function respondError(req: HttpRequest, res: HttpResponse, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ success: false, error: message });
}

// ============================================================================
// Customer Endpoints
// ============================================================================

export const getMyTransactions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const customerId = req.user?.customerId || req.user?.id || req.user?._id || req.user?.id;
  if (!customerId) {
    respondError(req, res, 'Authentication required', 401);
    return;
  }

  const { limit, offset } = req.query;
  const result = await managePaymentRecordsUseCase.findTransactionsByCustomerId(customerId, {
    limit: parseInt(limit as string) || 20,
    offset: parseInt(offset as string) || 0,
  });

  respond(req, res, result);
};

export const getTransactionByOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const transactions = await managePaymentRecordsUseCase.findTransactionsByOrderId(orderId);
  respond(req, res, { transactions: transactions.map(t => t.toJSON()) });
};

export const getPaymentMethods = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { currency } = req.query;
  const methods = await managePaymentRecordsUseCase.getEnabledPaymentMethods('default', currency as string);
  respond(req, res, { paymentMethods: methods });
};

// ============================================================================
// Business Endpoints
// ============================================================================

export const listTransactions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

  const result = await listTransactionsUseCase.execute(command);

  respond(req, res, result);
};

export const getTransaction = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { transactionId } = req.params;
  if (!isUuid(transactionId)) {
    respondError(req, res, 'Transaction not found', 404);
    return;
  }
  const command = new GetTransactionCommand(transactionId);
  const transaction = await getTransactionUseCase.execute(command);

  if (!transaction) {
    respondError(req, res, 'Transaction not found', 404);
    return;
  }

  respond(req, res, transaction);
};

export const initiatePayment = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as { orderId?: string; amountCents?: number; currency?: string; paymentMethodConfigId?: string; customerId?: string };
  const { orderId, amountCents, currency, paymentMethodConfigId, customerId } = body;

  if (!orderId || !amountCents || !currency || !paymentMethodConfigId) {
    respondError(req, res, 'Missing required fields', 400);
    return;
  }

  const command = new InitiatePaymentCommand(orderId, amountCents, currency, paymentMethodConfigId, customerId, req.ip);

  const result = await initiatePaymentUseCase.execute(command);

  respond(req, res, result, 201);
};

export const processRefund = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { transactionId } = req.params;
  const body = req.body as { amountCents?: number; reason?: string };
  const { amountCents, reason } = body;

  if (!amountCents || amountCents <= 0) {
    respondError(req, res, 'Amount must be greater than zero', 400);
    return;
  }

  const command = new ProcessPaymentRefundCommand(transactionId, amountCents, reason);
  const result = await processPaymentRefundUseCase.execute(command);

  respond(req, res, result, 201);
};

export const getRefunds = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { transactionId } = req.params;

  const transaction = await managePaymentRecordsUseCase.findTransactionById(transactionId);
  if (!transaction) {
    respondError(req, res, 'Transaction not found', 404);
    return;
  }

  const refunds = await managePaymentRecordsUseCase.findRefundsByTransactionId(transactionId);
  respond(req, res, { refunds: refunds.map(r => r.toJSON()) });
};

// ============================================================================
// Gateway Management Endpoints
// ============================================================================

export const listGateways = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const organizationId = req.user?.organizationId || req.user?._id || req.user?.id;
  if (!organizationId) {
    respondError(req, res, 'Authentication required', 401);
    return;
  }

  const rows = await managePaymentGatewaysUseCase.findAll(organizationId);
  respond(req, res, rows || []);
};

export const getGateway = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { gatewayId } = req.params;
  if (!isUuid(gatewayId)) {
    respondError(req, res, 'Gateway not found', 404);
    return;
  }
  const gateway = await managePaymentGatewaysUseCase.findById(gatewayId);

  if (!gateway) {
    respondError(req, res, 'Gateway not found', 404);
    return;
  }
  respond(req, res, gateway);
};

export const createGateway = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const organizationId = req.user?.organizationId || req.user?._id || req.user?.id;
  if (!organizationId) {
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

  try {
    const result = await managePaymentGatewaysUseCase.create({
      organizationId,
      name,
      provider,
      isActive: isActive ?? true,
      isDefault: isDefault ?? false,
      isTestMode: isTestMode ?? false,
      apiKey,
      apiSecret,
      publicKey,
      webhookSecret,
      apiEndpoint,
      supportedPaymentMethods: supportedPaymentMethods || 'creditCard',
      supportedCurrencies: null,
      processingFees: null,
      checkoutSettings: null,
      metadata: null,
    } as PaymentGatewayCreateParams);

    respond(req, res, result, 201);
  } catch (error) {
    respondError(req, res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const updateGateway = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { gatewayId } = req.params;
  const updates = req.body as Record<string, unknown>;

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
  const params: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      params[field] = updates[field];
    }
  }

  try {
    const result = await managePaymentGatewaysUseCase.update(gatewayId, params as PaymentGatewayUpdateParams);
    respond(req, res, result);
  } catch (error) {
    respondError(req, res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const deleteGateway = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { gatewayId } = req.params;
  await managePaymentGatewaysUseCase.delete(gatewayId);

  respond(req, res, { success: true });
};

// ============================================================================
// Method Config Management Endpoints
// ============================================================================

export const listMethodConfigs = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const organizationId = req.user?.organizationId || req.user?._id || req.user?.id;
  if (!organizationId) {
    respondError(req, res, 'Authentication required', 401);
    return;
  }

  const rows = await managePaymentGatewaysUseCase.findAllMethodConfigs(organizationId);
  respond(req, res, rows || []);
};

export const getMethodConfig = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { methodConfigId } = req.params;
  if (!isUuid(methodConfigId)) {
    respondError(req, res, 'Method config not found', 404);
    return;
  }
  const config = await managePaymentGatewaysUseCase.findMethodConfigById(methodConfigId);

  if (!config) {
    respondError(req, res, 'Method config not found', 404);
    return;
  }
  respond(req, res, config);
};

export const createMethodConfig = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const organizationId = req.user?.organizationId || req.user?._id || req.user?.id;
  if (!organizationId) {
    respondError(req, res, 'Authentication required', 401);
    return;
  }

  const body = req.body as {
    paymentMethod?: string;
    isEnabled?: boolean;
    displayName?: string;
    description?: string;
    processingFeeCents?: string;
    minimumAmountCents?: string;
    maximumAmountCents?: string;
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
    processingFeeCents,
    minimumAmountCents,
    maximumAmountCents,
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

  try {
    const result = await managePaymentGatewaysUseCase.createMethodConfig({
      organizationId,
      paymentMethod,
      isEnabled: isEnabled ?? true,
      displayName,
      description,
      processingFeeCents: processingFeeCents !== undefined ? Number(processingFeeCents) : undefined,
      minimumAmountCents: minimumAmountCents !== undefined ? Number(minimumAmountCents) : undefined,
      maximumAmountCents: maximumAmountCents !== undefined ? Number(maximumAmountCents) : undefined,
      displayOrder: displayOrder ?? 0,
      icon,
      supportedCurrencies: supportedCurrencies || ['USD'],
      countries,
      gatewayId,
      configuration,
      metadata: null,
    } as PaymentMethodConfigCreateParams);

    respond(req, res, result, 201);
  } catch (error) {
    respondError(req, res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const updateMethodConfig = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { methodConfigId } = req.params;
  const updates = req.body as Record<string, unknown>;

  // Build dynamic update
  const allowedFields = [
    'paymentMethod',
    'isEnabled',
    'displayName',
    'description',
    'processingFeeCents',
    'minimumAmountCents',
    'maximumAmountCents',
    'displayOrder',
    'icon',
    'supportedCurrencies',
    'countries',
    'gatewayId',
    'configuration',
  ];
  const params: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      params[field] = updates[field];
    }
  }

  try {
    const result = await managePaymentGatewaysUseCase.updateMethodConfig(methodConfigId, params as PaymentMethodConfigUpdateParams);
    respond(req, res, result);
  } catch (error) {
    respondError(req, res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const deleteMethodConfig = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { methodConfigId } = req.params;
  await managePaymentGatewaysUseCase.deleteMethodConfig(methodConfigId);

  respond(req, res, { success: true });
};

export const deleteTransaction = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { transactionId } = req.params;
  await managePaymentRecordsUseCase.deleteTransaction(transactionId);

  respond(req, res, { success: true });
};
