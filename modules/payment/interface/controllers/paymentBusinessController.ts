/**
 * Payment Business Controller
 * Handlers for merchant-facing payment operations.
 */

import { Request, Response } from 'express';
import { logger } from '../../../../libs/logger';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import paymentDisputeRepo from '../../infrastructure/repositories/paymentDisputeRepo';
import paymentFeeRepo from '../../infrastructure/repositories/paymentFeeRepo';
import paymentSettingsRepo from '../../infrastructure/repositories/paymentSettingsRepo';
import paymentReportRepo from '../../infrastructure/repositories/paymentReportRepo';
import { GetPaymentBalanceCommand, GetPaymentBalanceUseCase } from '../../application/useCases/GetPaymentBalance';

// ============================================================================
// Disputes
// ============================================================================

export const listDisputes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.query;
    const disputes = paymentId
      ? await paymentDisputeRepo.findByPayment(paymentId as string)
      : [];
    successResponse(res, { disputes });
  } catch (error: any) {
    logger.error('listDisputes error:', error);
    errorResponse(res, error.message || 'Failed to list disputes');
  }
};

export const getDispute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { disputeId } = req.params;
    const dispute = await paymentDisputeRepo.findById(disputeId);
    if (!dispute) {
      errorResponse(res, 'Dispute not found', 404);
      return;
    }
    successResponse(res, { dispute });
  } catch (error: any) {
    logger.error('getDispute error:', error);
    errorResponse(res, error.message || 'Failed to get dispute');
  }
};

export const updateDisputeStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { disputeId } = req.params;
    const { status, resolvedAt } = req.body;
    if (!status) {
      errorResponse(res, 'status is required', 400);
      return;
    }
    const dispute = await paymentDisputeRepo.updateStatus(
      disputeId,
      status,
      resolvedAt ? new Date(resolvedAt) : undefined,
    );
    if (!dispute) {
      errorResponse(res, 'Dispute not found', 404);
      return;
    }
    successResponse(res, { dispute });
  } catch (error: any) {
    logger.error('updateDisputeStatus error:', error);
    errorResponse(res, error.message || 'Failed to update dispute status');
  }
};

// ============================================================================
// Fees
// ============================================================================

export const listFees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.query;
    if (!transactionId) {
      errorResponse(res, 'transactionId query parameter is required', 400);
      return;
    }
    const fees = await paymentFeeRepo.findByTransaction(transactionId as string);
    successResponse(res, { fees });
  } catch (error: any) {
    logger.error('listFees error:', error);
    errorResponse(res, error.message || 'Failed to list fees');
  }
};

// ============================================================================
// Settings
// ============================================================================

export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = (req.user as any)?.merchantId || (req.user as any)?._id;
    if (!merchantId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    const settings = await paymentSettingsRepo.findByMerchant(merchantId);
    successResponse(res, { settings });
  } catch (error: any) {
    logger.error('getSettings error:', error);
    errorResponse(res, error.message || 'Failed to get settings');
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = (req.user as any)?.merchantId || (req.user as any)?._id;
    if (!merchantId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    const { provider, isEnabled, config } = req.body;
    if (!provider) {
      errorResponse(res, 'provider is required', 400);
      return;
    }
    const settings = await paymentSettingsRepo.upsert({
      merchantId,
      provider,
      isEnabled: isEnabled ?? true,
      config: config || {},
    });
    successResponse(res, { settings });
  } catch (error: any) {
    logger.error('updateSettings error:', error);
    errorResponse(res, error.message || 'Failed to update settings');
  }
};

// ============================================================================
// Balance
// ============================================================================

export const getBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = (req.user as any)?.merchantId || (req.user as any)?._id;
    if (!merchantId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    const { currency } = req.query;
    const useCase = new GetPaymentBalanceUseCase();
    const result = await useCase.execute(
      new GetPaymentBalanceCommand(merchantId, currency as string | undefined),
    );
    successResponse(res, result);
  } catch (error: any) {
    logger.error('getBalance error:', error);
    errorResponse(res, error.message || 'Failed to get balance');
  }
};

// ============================================================================
// Reports
// ============================================================================

export const listReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = (req.user as any)?.merchantId || (req.user as any)?._id;
    if (!merchantId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    const reports = await paymentReportRepo.findByMerchant(merchantId);
    successResponse(res, { reports });
  } catch (error: any) {
    logger.error('listReports error:', error);
    errorResponse(res, error.message || 'Failed to list reports');
  }
};

export const getReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = (req.user as any)?.merchantId || (req.user as any)?._id;
    if (!merchantId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    const { from, to } = req.query;
    if (!from || !to) {
      errorResponse(res, 'from and to query parameters are required', 400);
      return;
    }
    const reports = await paymentReportRepo.findByDateRange(
      merchantId,
      new Date(from as string),
      new Date(to as string),
    );
    successResponse(res, { reports });
  } catch (error: any) {
    logger.error('getReport error:', error);
    errorResponse(res, error.message || 'Failed to get report');
  }
};
