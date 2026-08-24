import { AppError } from '../../../../libs/errors';

export class DataRequestNotFoundError extends AppError {
  constructor(requestId: string) {
    super(`Data request not found: ${requestId}`, 404, { code: 'gdpr.request_not_found' });
  }
}

export class DataRequestAlreadyCompletedError extends AppError {
  constructor(requestId: string) {
    super(`Data request ${requestId} is already completed`, 400, { code: 'gdpr.already_completed' });
  }
}

export class InvalidDataRequestTypeError extends AppError {
  constructor(requestType: string) {
    super(`Invalid data request type: ${requestType}`, 400, { code: 'gdpr.invalid_request_type' });
  }
}

export class CustomerIdRequiredError extends AppError {
  constructor() {
    super('Customer ID is required for GDPR requests', 400, { code: 'gdpr.customer_id_required' });
  }
}

export class DataRequestProcessingError extends AppError {
  constructor(message: string) {
    super(message, 500, { code: 'gdpr.processing_error' });
  }
}

export class GdprValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'gdpr.validation_error' });
  }
}
