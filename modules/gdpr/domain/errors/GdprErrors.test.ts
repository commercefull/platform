import {
  DataRequestNotFoundError,
  DataRequestAlreadyCompletedError,
  InvalidDataRequestTypeError,
  CustomerIdRequiredError,
  DataRequestProcessingError,
  GdprValidationError,
} from './GdprErrors';

describe('GdprErrors', () => {
  it('DataRequestNotFoundError', () => {
    const err = new DataRequestNotFoundError('r1');
    expect(err.message).toContain('r1');
    expect(err.statusCode).toBe(404);
  });

  it('DataRequestAlreadyCompletedError', () => {
    const err = new DataRequestAlreadyCompletedError('r1');
    expect(err.message).toContain('already completed');
    expect(err.statusCode).toBe(400);
  });

  it('InvalidDataRequestTypeError', () => {
    const err = new InvalidDataRequestTypeError('invalid');
    expect(err.message).toContain('invalid');
    expect(err.statusCode).toBe(400);
  });

  it('CustomerIdRequiredError', () => {
    const err = new CustomerIdRequiredError();
    expect(err.message).toContain('Customer ID');
    expect(err.statusCode).toBe(400);
  });

  it('DataRequestProcessingError', () => {
    const err = new DataRequestProcessingError('Failed');
    expect(err.message).toBe('Failed');
    expect(err.statusCode).toBe(500);
  });

  it('GdprValidationError', () => {
    const err = new GdprValidationError('Invalid');
    expect(err.message).toBe('Invalid');
    expect(err.statusCode).toBe(400);
  });
});
