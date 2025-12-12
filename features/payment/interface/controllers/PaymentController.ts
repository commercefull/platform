/**
 * Payment Controller
 */

import { Request, Response } from 'express';
import PaymentRepo from '../../infrastructure/repositories/PaymentRepository';
import { InitiatePaymentCommand, InitiatePaymentUseCase } from '../../application/useCases/InitiatePayment';
import { ProcessPaymentRefundCommand, ProcessPaymentRefundUseCase } from '../../application/useCases/ProcessRefund';
import { GetTransactionCommand, GetTransactionUseCase, ListTransactionsCommand, ListTransactionsUseCase } from '../../application/useCases/GetTransactions';
import { TransactionStatus } from '../../domain/valueObjects/PaymentStatus';

function respond(req: Request, res: Response, data: any, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function respondError(req: Request, res: Response, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ success: false, error: message });
}

// ============================================================================
// Customer Endpoints
// ============================================================================

export const getMyTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?.customerId || (req as any).user?._id;
    if (!customerId) {
      respondError(req, res, 'Authentication required', 401);
      return;
    }

    const { limit, offset } = req.query;
    const result = await PaymentRepo.findTransactionsByCustomerId(
      customerId,
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );

    respond(req, res, result);
  } catch (error: any) {
    console.error('Error getting transactions:', error);
    respondError(req, res, error.message || 'Failed to get transactions', 500);
  }
};

export const getTransactionByOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const transactions = await PaymentRepo.findTransactionsByOrderId(orderId);
    respond(req, res, { transactions: transactions.map(t => t.toJSON()) });
  } catch (error: any) {
    console.error('Error getting transactions:', error);
    respondError(req, res, error.message || 'Failed to get transactions', 500);
  }
};

export const getPaymentMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currency } = req.query;
    const methods = await PaymentRepo.getEnabledPaymentMethods('default', currency as string);
    respond(req, res, { paymentMethods: methods });
  } catch (error: any) {
    console.error('Error getting payment methods:', error);
    respondError(req, res, error.message || 'Failed to get payment methods', 500);
  }
};

// ============================================================================
// Business Endpoints
// ============================================================================

export const listTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, customerId, status, gatewayId, startDate, endDate, limit, offset, orderBy, orderDirection } = req.query;

    const filters: any = {};
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
      (orderDirection as 'asc' | 'desc') || 'desc'
    );

    const useCase = new ListTransactionsUseCase(PaymentRepo);
    const result = await useCase.execute(command);

    respond(req, res, result);
  } catch (error: any) {
    console.error('Error listing transactions:', error);
    respondError(req, res, error.message || 'Failed to list transactions', 500);
  }
};

export const getTransaction = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    console.error('Error getting transaction:', error);
    respondError(req, res, error.message || 'Failed to get transaction', 500);
  }
};

export const initiatePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, amount, currency, paymentMethodConfigId, customerId } = req.body;

    if (!orderId || !amount || !currency || !paymentMethodConfigId) {
      respondError(req, res, 'Missing required fields', 400);
      return;
    }

    const command = new InitiatePaymentCommand(
      orderId, amount, currency, paymentMethodConfigId,
      customerId, req.ip
    );

    const useCase = new InitiatePaymentUseCase(PaymentRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 201);
  } catch (error: any) {
    console.error('Error initiating payment:', error);
    respondError(req, res, error.message || 'Failed to initiate payment', 500);
  }
};

export const processRefund = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
      respondError(req, res, 'Amount must be greater than zero', 400);
      return;
    }

    const command = new ProcessPaymentRefundCommand(transactionId, amount, reason);
    const useCase = new ProcessPaymentRefundUseCase(PaymentRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 201);
  } catch (error: any) {
    console.error('Error processing refund:', error);
    if (error.message.includes('not found')) {
      respondError(req, res, error.message, 404);
      return;
    }
    if (error.message.includes('cannot be refunded') || error.message.includes('exceeds')) {
      respondError(req, res, error.message, 400);
      return;
    }
    respondError(req, res, error.message || 'Failed to process refund', 500);
  }
};

export const getRefunds = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const refunds = await PaymentRepo.findRefundsByTransactionId(transactionId);
    respond(req, res, { refunds: refunds.map(r => r.toJSON()) });
  } catch (error: any) {
    console.error('Error getting refunds:', error);
    respondError(req, res, error.message || 'Failed to get refunds', 500);
  }
};
