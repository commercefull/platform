/**
 * B2B Credit Controller
 * Handlers for B2B company credit operations
 */

import { Request, Response } from 'express';
import { logger } from '../../../../libs/logger';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { GetCompanyCreditStatusUseCase } from '../../application/useCases/GetCompanyCreditStatus';
import { RecordCreditTransactionUseCase } from '../../application/useCases/RecordCreditTransaction';
import * as b2bCompanyCreditTransactionRepo from '../../infrastructure/repositories/b2bCompanyCreditTransactionRepo';

// ============================================================================
// Credit Status
// ============================================================================

export const getCreditStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req.user as any)?.companyId || req.params.companyId;
    if (!companyId) {
      errorResponse(res, 'Company ID is required', 400);
      return;
    }
    const useCase = new GetCompanyCreditStatusUseCase();
    const result = await useCase.execute({ b2bCompanyId: companyId });
    if (!result.success) {
      errorResponse(res, result.error || 'Failed to get credit status', 400);
      return;
    }
    successResponse(res, result.creditStatus);
  } catch (error: any) {
    logger.error('getCreditStatus error:', error);
    errorResponse(res, error.message || 'Failed to get credit status');
  }
};

// ============================================================================
// Transactions
// ============================================================================

export const listTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req.user as any)?.companyId || req.params.companyId;
    if (!companyId) {
      errorResponse(res, 'Company ID is required', 400);
      return;
    }
    const transactions = await b2bCompanyCreditTransactionRepo.findByCompany(companyId);
    successResponse(res, { transactions });
  } catch (error: any) {
    logger.error('listTransactions error:', error);
    errorResponse(res, error.message || 'Failed to list transactions');
  }
};

// ============================================================================
// Record Transaction
// ============================================================================

export const recordTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req.user as any)?.companyId || req.params.companyId;
    if (!companyId) {
      errorResponse(res, 'Company ID is required', 400);
      return;
    }
    const { amount, type, referenceId, notes } = req.body;
    if (amount === undefined || amount === null) {
      errorResponse(res, 'amount is required', 400);
      return;
    }
    if (!type) {
      errorResponse(res, 'type is required', 400);
      return;
    }
    const useCase = new RecordCreditTransactionUseCase();
    const result = await useCase.execute({ b2bCompanyId: companyId, amount, type, referenceId, notes });
    if (!result.success) {
      errorResponse(res, result.error || 'Failed to record transaction', 400);
      return;
    }
    successResponse(res, result.transaction, 201);
  } catch (error: any) {
    logger.error('recordTransaction error:', error);
    errorResponse(res, error.message || 'Failed to record transaction');
  }
};
