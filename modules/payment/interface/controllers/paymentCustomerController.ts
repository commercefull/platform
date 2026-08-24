/**
 * Payment Customer Controller
 * Handlers for customer-facing stored payment method operations.
 */

import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import paymentDataRepository from '../../infrastructure/repositories/PaymentDataRepository';

const PaymentRepo = paymentDataRepository.payments;
import { SaveStoredPaymentMethodCommand, SaveStoredPaymentMethodUseCase } from '../../application/useCases/SaveStoredPaymentMethod';

// ============================================================================
// Stored Payment Methods
// ============================================================================

export const listStoredMethods = async (req: Request, res: Response): Promise<void> => {
  const customerId = req.user?.customerId || req.user?.id || req.user?._id;
  if (!customerId) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }
  const methods = await PaymentRepo.findStoredMethodsByCustomer(customerId);
  successResponse(res, { methods });
};

export const saveStoredMethod = async (req: Request, res: Response): Promise<void> => {
  const customerId = req.user?.customerId || req.user?.id || req.user?._id;
  if (!customerId) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }
  const { organizationId, type, provider, providerToken, isDefault, last4, brand, expiryMonth, expiryYear } = req.body;
  if (!type || !provider || !providerToken) {
    errorResponse(res, 'type, provider, and providerToken are required', 400);
    return;
  }
  const useCase = new SaveStoredPaymentMethodUseCase();
  const result = await useCase.execute(
    new SaveStoredPaymentMethodCommand(
      customerId,
      organizationId || '',
      type,
      provider,
      providerToken,
      isDefault ?? false,
      last4,
      brand,
      expiryMonth,
      expiryYear,
    ),
  );
  successResponse(res, result, 201);
};

export const setDefaultMethod = async (req: Request, res: Response): Promise<void> => {
  const customerId = req.user?.customerId || req.user?.id || req.user?._id;
  if (!customerId) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }
  const { methodId } = req.params;
  const method = await PaymentRepo.setDefaultStoredMethod(String(methodId), customerId);
  if (!method) {
    errorResponse(res, 'Payment method not found', 404);
    return;
  }
  successResponse(res, { method });
};

export const deleteStoredMethod = async (req: Request, res: Response): Promise<void> => {
  const { methodId } = req.params;
  const method = await PaymentRepo.softDeleteStoredMethod(String(methodId));
  if (!method) {
    errorResponse(res, 'Payment method not found', 404);
    return;
  }
  successResponse(res, { deleted: true, methodId });
};
