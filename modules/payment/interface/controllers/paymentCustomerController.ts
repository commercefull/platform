/**
 * Payment Customer Controller
 * Handlers for customer-facing stored payment method operations.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';

import { SaveStoredPaymentMethodCommand } from '../../application/useCases/SaveStoredPaymentMethod';
import { managePaymentRecordsUseCase, saveStoredPaymentMethodUseCase } from '../../application/useCases/wired';

// ============================================================================
// Stored Payment Methods
// ============================================================================

export const listStoredMethods = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const customerId = req.user?.customerId || req.user?.id || req.user?._id;
  if (!customerId) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }
  const methods = await managePaymentRecordsUseCase.findStoredMethodsByCustomer(customerId);
  successResponse(res, { methods });
};

export const saveStoredMethod = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const customerId = req.user?.customerId || req.user?.id || req.user?._id;
  if (!customerId) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }
  const { organizationId, type, provider, providerToken, isDefault, last4, brand, expiryMonth, expiryYear } = req.body as {
    organizationId?: string;
    type?: string;
    provider?: string;
    providerToken?: string;
    isDefault?: boolean;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
  if (!type || !provider || !providerToken) {
    errorResponse(res, 'type, provider, and providerToken are required', 400);
    return;
  }
  const useCase = saveStoredPaymentMethodUseCase;
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

export const setDefaultMethod = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const customerId = req.user?.customerId || req.user?.id || req.user?._id;
  if (!customerId) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }
  const { methodId } = req.params;
  const method = await managePaymentRecordsUseCase.setDefaultStoredMethod(String(methodId), customerId);
  if (!method) {
    errorResponse(res, 'Payment method not found', 404);
    return;
  }
  successResponse(res, { method });
};

export const deleteStoredMethod = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { methodId } = req.params;
  const customerId = req.user?.customerId || req.user?.id || req.user?._id;
  if (!customerId) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }
  const method = await managePaymentRecordsUseCase.softDeleteStoredMethod(String(methodId), String(customerId));
  if (!method) {
    errorResponse(res, 'Payment method not found', 404);
    return;
  }
  successResponse(res, { deleted: true, methodId });
};
