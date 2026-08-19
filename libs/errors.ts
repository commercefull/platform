interface ErrorWithCapture {
  captureStackTrace?: (target: object, constructorOpt?: (...args: unknown[]) => unknown) => void;
}

export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    // Maintains proper stack trace (only on V8)
    const Err = Error as unknown as ErrorWithCapture;
    if (Err.captureStackTrace) {
      Err.captureStackTrace(this, this.constructor as (...args: unknown[]) => unknown);
    }
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details?: unknown) {
    super(message, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found', details?: unknown) {
    super(message, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: unknown) {
    super(message, 409, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super(message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: unknown) {
    super(message, 403, details);
  }
}
