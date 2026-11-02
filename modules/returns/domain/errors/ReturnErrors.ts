import { AppError } from '../../../../libs/errors';

export class ReturnNotFoundError extends AppError {
  constructor(identifier: string) {
    super(`Return request not found: ${identifier}`, 404, { code: 'returns.not_found', details: { identifier } });
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

export class InsufficientStoreCreditError extends AppError {
  constructor(customerId: string, requested: number, available: number) {
    super(`Insufficient store credit for customer ${customerId}: requested ${requested}, available ${available}`, 400, {
      code: 'returns.store_credit_insufficient',
      details: { customerId, requested, available },
    });
  }
}

export class ReturnValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'returns.validation_error' });
  }
}
