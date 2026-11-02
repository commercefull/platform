/**
 * Shared response helpers for warehouse business controllers.
 */

import { errorResponse, validationErrorResponse } from '../../../../libs/apiResponse';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import { WarehouseValidationError } from '../../domain/errors/WarehouseErrors';
import type { HttpResponse } from 'libs/http';

/**
 * Maps domain errors thrown by use cases to the legacy response shapes:
 * validation failures keep the `error.errors[]` array; everything else uses
 * the standard error envelope.
 */
export function useCaseErrorResponse(res: HttpResponse, error: unknown): void {
  if (error instanceof WarehouseValidationError) {
    validationErrorResponse(res, [getErrorMessage(error)]);
    return;
  }
  errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
}
