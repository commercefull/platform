/**
 * Payment Customer Controller
 * Handlers for customer-facing stored payment method operations.
 */

import { Request, Response } from 'express';
import { logger } from '../../../../libs/logger';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import storedPaymentMethodRepo from '../../infrastructure/repositories/storedPaymentMethodRepo';
import { SaveStoredPaymentMethodCommand, SaveStoredPaymentMethodUseCase } from '../../application/useCases/SaveStoredPaymentMethod';

// ============================================================================
// Stored Payment Methods
// ============================================================================

export const listStoredMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req.user as any)?.customerId || (req.user as any)?._id;
    if (!customerId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    const methods = await storedPaymentMethodRepo.findByCustomer(customerId);
    successResponse(res, { methods });
  } catch (error: any) {
    logger.error('listStoredMethods error:', error);
    errorResponse(res, error.message || 'Failed to list stored payment methods');
  }
};

export const saveStoredMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req.user as any)?.customerId || (req.user as any)?._id;
    if (!customerId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    const { merchantId, type, provider, providerToken, isDefault, last4, brand, expiryMonth, expiryYear } = req.body;
    if (!type || !provider || !providerToken) {
      errorResponse(res, 'type, provider, and providerToken are required', 400);
      return;
    }
    const useCase = new SaveStoredPaymentMethodUseCase();
    const result = await useCase.execute(
      new SaveStoredPaymentMethodCommand(
        customerId,
        merchantId || '',
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
  } catch (error: any) {
    logger.error('saveStoredMethod error:', error);
    errorResponse(res, error.message || 'Failed to save payment method');
  }
};

export const setDefaultMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req.user as any)?.customerId || (req.user as any)?._id;
    if (!customerId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    const { methodId } = req.params;
    const method = await storedPaymentMethodRepo.setDefault(methodId, customerId);
    if (!method) {
      errorResponse(res, 'Payment method not found', 404);
      return;
    }
    successResponse(res, { method });
  } catch (error: any) {
    logger.error('setDefaultMethod error:', error);
    errorResponse(res, error.message || 'Failed to set default payment method');
  }
};

export const deleteStoredMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { methodId } = req.params;
    const method = await storedPaymentMethodRepo.softDelete(methodId);
    if (!method) {
      errorResponse(res, 'Payment method not found', 404);
      return;
    }
    successResponse(res, { deleted: true, methodId });
  } catch (error: any) {
    logger.error('deleteStoredMethod error:', error);
    errorResponse(res, error.message || 'Failed to delete payment method');
  }
};
