import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  getErrorMessage,
  getErrorStatusCode,
} from './errors';

describe('libs/errors', () => {
  describe('AppError', () => {
    it('derives a snake_case code from the class name', () => {
      expect(new NotFoundError().code).toBe('not_found');
      expect(new BadRequestError().code).toBe('bad_request');
      expect(new InternalServerError().code).toBe('internal_server');
    });

    it('derives code for custom subclasses', () => {
      class StoreValidationError extends AppError {}
      expect(new StoreValidationError('x').code).toBe('store_validation');
    });

    it('marks 4xx as expected and 5xx as unexpected', () => {
      expect(new NotFoundError().isExpected).toBe(true);
      expect(new InternalServerError().isExpected).toBe(false);
    });

    it('defaults severity to info for 4xx and error for 5xx', () => {
      expect(new BadRequestError().severity).toBe('info');
      expect(new InternalServerError().severity).toBe('error');
    });

    it('accepts an options object overriding code, severity and details', () => {
      const err = new AppError('boom', 422, { code: 'custom_code', severity: 'warn', details: { field: 'x' } });
      expect(err.code).toBe('custom_code');
      expect(err.severity).toBe('warn');
      expect(err.details).toEqual({ field: 'x' });
    });

    it('treats a non-options object as legacy details', () => {
      const err = new AppError('boom', 400, ['a', 'b']);
      expect(err.details).toEqual(['a', 'b']);
      expect(err.code).toBe('app');
    });

    it('treats a plain object without option keys as legacy details', () => {
      const err = new AppError('boom', 400, { field: 'name' });
      expect(err.details).toEqual({ field: 'name' });
      expect(err.code).toBe('app');
    });

    it('captures a stack trace', () => {
      expect(new AppError('boom').stack).toContain('boom');
    });
  });

  describe('subclasses', () => {
    it.each([
      [BadRequestError, 400],
      [UnauthorizedError, 401],
      [ForbiddenError, 403],
      [NotFoundError, 404],
      [ConflictError, 409],
      [InternalServerError, 500],
    ])('%s has status %i', (Cls, status) => {
      const err = new Cls();
      expect(err.statusCode).toBe(status);
      expect(err).toBeInstanceOf(AppError);
    });

    it('passes details through', () => {
      expect(new NotFoundError('gone', { id: 1 }).details).toEqual({ id: 1 });
    });
  });

  describe('getErrorStatusCode', () => {
    it('returns statusCode for AppError', () => {
      expect(getErrorStatusCode(new ForbiddenError())).toBe(403);
    });
    it('returns 500 for non-AppError', () => {
      expect(getErrorStatusCode(new Error('x'))).toBe(500);
      expect(getErrorStatusCode('x')).toBe(500);
      expect(getErrorStatusCode(undefined)).toBe(500);
    });
  });

  describe('getErrorMessage', () => {
    it('returns message for Error instances', () => {
      expect(getErrorMessage(new Error('the message'))).toBe('the message');
    });
    it('returns a fallback for non-errors', () => {
      expect(getErrorMessage('nope')).toBe('An unexpected error occurred');
      expect(getErrorMessage(42)).toBe('An unexpected error occurred');
    });
  });
});
