import { AppError } from '../../../../libs/errors';

export class SegmentNotFoundError extends AppError {
  constructor(identifier: string) {
    super(`Segment not found: ${identifier}`, 404, { code: 'segment.not_found', details: { identifier } });
  }
}

export class SegmentAlreadyExistsError extends AppError {
  constructor(code: string) {
    super(`Segment with code already exists: ${code}`, 409, { code: 'segment.already_exists', details: { code } });
  }
}

export class CustomerProfileNotFoundError extends AppError {
  constructor(customerId: string) {
    super(`Customer profile not found: ${customerId}`, 404, { code: 'segment.profile_not_found', details: { customerId } });
  }
}

export class InvalidSegmentConditionsError extends AppError {
  constructor(reason: string) {
    super(`Invalid segment conditions: ${reason}`, 400, { code: 'segment.invalid_conditions', details: { reason } });
  }
}

export class SegmentValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'segment.validation_error' });
  }
}
