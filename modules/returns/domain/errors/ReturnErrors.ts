import { AppError } from '../../../../libs/errors';

export class ReturnNotFoundError extends AppError {
  constructor(identifier: string) {
    super(`Return request not found: ${identifier}`, 404, { code: 'returns.not_found', details: { identifier } });
  }
}

export class ReturnAlreadyExistsError extends AppError {
  constructor(orderId: string) {
    super(`Return request already exists for order: ${orderId}`, 409, { code: 'returns.already_exists', details: { orderId } });
  }
}

export class InvalidReturnTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(`Cannot transition return from ${from} to ${to}`, 409, { code: 'returns.invalid_transition', details: { from, to } });
  }
}

export class InvalidReturnRequestError extends AppError {
  constructor(reason: string) {
    super(`Invalid return request: ${reason}`, 400, { code: 'returns.invalid_request', details: { reason } });
  }
}

export class ReturnItemNotFoundError extends AppError {
  constructor(itemId: string) {
    super(`Return item not found: ${itemId}`, 404, { code: 'returns.item_not_found', details: { itemId } });
  }
}

export class InsufficientStoreCreditError extends AppError {
  constructor(customerId: string, requested: number, available: number) {
    super(`Insufficient store credit for customer ${customerId}: requested ${requested}, available ${available}`, 400, { code: 'returns.store_credit_insufficient', details: { customerId, requested, available } });
  }
}

export class StoreCreditNotFoundError extends AppError {
  constructor(customerId: string) {
    super(`No store credit found for customer: ${customerId}`, 404, { code: 'returns.store_credit_not_found', details: { customerId } });
  }
}

export class ReturnValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'returns.validation_error' });
  }
}
