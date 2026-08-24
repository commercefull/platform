interface ErrorWithCapture {
  captureStackTrace?: (target: object, constructorOpt?: (...args: unknown[]) => unknown) => void;
}

export type ErrorSeverity = 'error' | 'warn' | 'info';

export interface AppErrorOptions {
  code?: string;
  severity?: ErrorSeverity;
  details?: unknown;
}

export class AppError extends Error {
  statusCode: number;
  code: string;
  severity: ErrorSeverity;
  isExpected: boolean;
  details?: unknown;

  constructor(
    message: string,
    statusCode = 400,
    optionsOrDetails?: AppErrorOptions | unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;

    // Support both new options object and legacy details param
    if (optionsOrDetails !== undefined && optionsOrDetails !== null && typeof optionsOrDetails === 'object' && !Array.isArray(optionsOrDetails) && ('code' in optionsOrDetails || 'severity' in optionsOrDetails || 'details' in optionsOrDetails)) {
      const opts = optionsOrDetails as AppErrorOptions;
      this.code = opts.code ?? this.deriveDefaultCode();
      this.severity = opts.severity ?? this.deriveDefaultSeverity();
      this.details = opts.details;
    } else {
      this.code = this.deriveDefaultCode();
      this.severity = this.deriveDefaultSeverity();
      this.details = optionsOrDetails;
    }

    this.isExpected = statusCode >= 400 && statusCode < 500;

    // Maintains proper stack trace (only on V8)
    const Err = Error as unknown as ErrorWithCapture;
    if (Err.captureStackTrace) {
      Err.captureStackTrace(this, this.constructor as (...args: unknown[]) => unknown);
    }
  }

  private deriveDefaultCode(): string {
    // Convert class name to snake_case code, e.g. NotFoundError -> 'not_found'
    const name = this.constructor.name.replace(/Error$/, '');
    return name
      .replace(/([A-Z])/g, '_$1')
      .replace(/^_/, '')
      .toLowerCase();
  }

  private deriveDefaultSeverity(): ErrorSeverity {
    // 4xx are expected business outcomes — not error level
    return this.statusCode >= 400 && this.statusCode < 500 ? 'info' : 'error';
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details?: unknown) {
    super(message, 400, { details });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found', details?: unknown) {
    super(message, 404, { details });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: unknown) {
    super(message, 409, { details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super(message, 401, { details });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: unknown) {
    super(message, 403, { details });
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', details?: unknown) {
    super(message, 500, { details });
  }
}

export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AppError) return error.statusCode;
  return 500;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
