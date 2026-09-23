/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Payment Business Controller
 * Handlers for merchant-facing payment operations.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';

const paymentBillingRepo = paymentBillingDataRepository.billing;
const PaymentRepo = paymentDataRepository.payments;
import { GetPaymentBalanceCommand } from '../../application/useCases/GetPaymentBalance';
import { getPaymentBalanceUseCase } from '../../application/useCases/wired';
import { paymentBillingDataRepository, paymentDataRepository } from '../../application/wired';

// ============================================================================
// Disputes
// ============================================================================

export const listDisputes = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { paymentId } = req.query;
  const disputes = paymentId ? await paymentBillingRepo.findDisputesByPayment(paymentId as string) : [];
  successResponse(res, { disputes });
};

export const getDispute = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { disputeId } = req.params;
  const dispute = await paymentBillingRepo.findDisputeById(String(disputeId));
  if (!dispute) {
    errorResponse(res, 'Dispute not found', 404);
    return;
  }
  successResponse(res, { dispute });
};

export const updateDisputeStatus = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { disputeId } = req.params;
  const { status, resolvedAt } = req.body as { status?: string; resolvedAt?: string };
  if (!status) {
    errorResponse(res, 'status is required', 400);
    return;
  }
  const dispute = await paymentBillingRepo.updateDisputeStatus(String(disputeId), status, resolvedAt ? new Date(resolvedAt) : undefined);
  if (!dispute) {
    errorResponse(res, 'Dispute not found', 404);
    return;
  }
  successResponse(res, { dispute });
};

// ============================================================================
// Fees
// ============================================================================

export const listFees = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { transactionId } = req.query;
  if (!transactionId) {
    errorResponse(res, 'transactionId query parameter is required', 400);
    return;
  }
  const fees = await paymentBillingRepo.findFeesByTransaction(transactionId as string);
  successResponse(res, { fees });
};

// ============================================================================
// Settings
// ============================================================================

export const getSettings = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const organizationId = req.user?.organizationId || req.user?.id || req.user?._id;
  if (!organizationId) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }
  const settings = await PaymentRepo.findSettingsByMerchant(organizationId);
  successResponse(res, { settings });
};

export const updateSettings = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const organizationId = req.user?.organizationId || req.user?.id || req.user?._id;
  if (!organizationId) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }
  const allowedFields = [
    'capturePaymentsAutomatically',
    'authorizationValidityPeriod',
    'cardVaultingEnabled',
    'allowGuestCheckout',
    'requireBillingAddress',
    'requireCvv',
    'requirePostalCodeVerification',
    'threeDSecureSettings',
    'fraudDetectionSettings',
    'receiptSettings',
    'paymentFormCustomization',
    'autoRefundOnCancel',
    'paymentAttemptLimit',
  ] as const;
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if ((req.body as Record<string, unknown>)[field] !== undefined) {
      updates[field] = (req.body as Record<string, unknown>)[field];
    }
  }
  if (Object.keys(updates).length === 0) {
    errorResponse(res, 'at least one settings field is required', 400);
    return;
  }
  const settings = await PaymentRepo.upsertSettings({
    organizationId,
    ...updates,
  });
  successResponse(res, { settings });
};

// ============================================================================
// Balance
// ============================================================================

export const getBalance = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const organizationId = req.user?.organizationId || req.user?.id || req.user?._id;
  if (!organizationId) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }
  const { currency } = req.query;
  const useCase = getPaymentBalanceUseCase;
  const result = await useCase.execute(new GetPaymentBalanceCommand(organizationId, currency as string | undefined));
  successResponse(res, result);
};

// ============================================================================
// Reports
// ============================================================================

export const listReports = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const organizationId = req.user?.organizationId || req.user?.id || req.user?._id;
  if (!organizationId) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }
  const reports = await paymentBillingRepo.findReportsByMerchant(organizationId);
  successResponse(res, { reports });
};

const getReport = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const organizationId = req.user?.organizationId || req.user?.id || req.user?._id;
  if (!organizationId) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }
  const { from, to } = req.query;
  if (!from || !to) {
    errorResponse(res, 'from and to query parameters are required', 400);
    return;
  }
  const reports = await paymentBillingRepo.findReportsByDateRange(organizationId, new Date(from as string), new Date(to as string));
  successResponse(res, { reports });
};
