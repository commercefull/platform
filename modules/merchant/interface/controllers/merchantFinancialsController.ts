/**
 * Merchant Financials Controller
 * Handlers for merchant-facing financial operations.
 */

import { Request, Response } from 'express';
import { logger } from '../../../../libs/logger';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import paymentBalanceRepo from '../../infrastructure/repositories/merchantBalanceRepo';
import merchantPayoutRepo from '../../infrastructure/repositories/merchantPayoutRepo';
import merchantInvoiceRepo from '../../infrastructure/repositories/merchantInvoiceRepo';
import { GetMerchantFinancialsCommand, GetMerchantFinancialsUseCase } from '../../application/useCases/GetMerchantFinancials';
import { CreateMerchantPayoutCommand, CreateMerchantPayoutUseCase } from '../../application/useCases/CreateMerchantPayout';
import { GetMerchantSettlementCommand, GetMerchantSettlementUseCase } from '../../application/useCases/GetMerchantSettlement';

function getMerchantId(req: Request): string | null {
  return (req.user as any)?.merchantId || (req.user as any)?._id || null;
}

// ============================================================================
// Financials Overview
// ============================================================================

export const getFinancials = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = getMerchantId(req);
    if (!merchantId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    const { currency, transactionLimit } = req.query;
    const useCase = new GetMerchantFinancialsUseCase();
    const result = await useCase.execute(
      new GetMerchantFinancialsCommand(
        merchantId,
        (currency as string) || 'USD',
        transactionLimit ? parseInt(transactionLimit as string, 10) : 20,
      ),
    );
    successResponse(res, result);
  } catch (error: any) {
    logger.error('getFinancials error:', error);
    errorResponse(res, error.message || 'Failed to get financials');
  }
};

// ============================================================================
// Balance
// ============================================================================

export const getBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = getMerchantId(req);
    if (!merchantId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    const { currency } = req.query;
    const balance = await paymentBalanceRepo.findByMerchant(merchantId, (currency as string) || 'USD');
    successResponse(res, { balance });
  } catch (error: any) {
    logger.error('getBalance error:', error);
    errorResponse(res, error.message || 'Failed to get balance');
  }
};

// ============================================================================
// Payouts
// ============================================================================

export const listPayouts = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = getMerchantId(req);
    if (!merchantId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const payouts = await merchantPayoutRepo.findByMerchant(merchantId, limit, offset);
    successResponse(res, { payouts });
  } catch (error: any) {
    logger.error('listPayouts error:', error);
    errorResponse(res, error.message || 'Failed to list payouts');
  }
};

export const createPayout = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = getMerchantId(req);
    if (!merchantId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    const { amount, currency, reference, scheduledAt } = req.body;
    if (!amount) {
      errorResponse(res, 'amount is required', 400);
      return;
    }
    const useCase = new CreateMerchantPayoutUseCase();
    const result = await useCase.execute(
      new CreateMerchantPayoutCommand(
        merchantId,
        Number(amount),
        currency || 'USD',
        reference,
        scheduledAt ? new Date(scheduledAt) : undefined,
      ),
    );
    successResponse(res, result, 201);
  } catch (error: any) {
    logger.error('createPayout error:', error);
    errorResponse(res, error.message || 'Failed to create payout');
  }
};

// ============================================================================
// Invoices
// ============================================================================

export const listInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = getMerchantId(req);
    if (!merchantId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const invoices = await merchantInvoiceRepo.findByMerchant(merchantId, limit, offset);
    successResponse(res, { invoices });
  } catch (error: any) {
    logger.error('listInvoices error:', error);
    errorResponse(res, error.message || 'Failed to list invoices');
  }
};

// ============================================================================
// Settlements
// ============================================================================

export const getSettlement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { payoutId } = req.params;
    const useCase = new GetMerchantSettlementUseCase();
    const result = await useCase.execute(new GetMerchantSettlementCommand(payoutId));
    successResponse(res, result);
  } catch (error: any) {
    logger.error('getSettlement error:', error);
    errorResponse(res, error.message || 'Failed to get settlement');
  }
};
