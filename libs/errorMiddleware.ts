import type { HttpNext, HttpRequest, HttpResponse } from './http';
import { AppError } from './errors';
import { logger } from './logger';
import { getCorrelationId } from './correlationId';

const MULTER_ERROR_CODES = new Set([
  'LIMIT_FILE_SIZE',
  'LIMIT_UNEXPECTED_FILE',
  'LIMIT_FILE_COUNT',
  'LIMIT_FIELD_KEY',
  'LIMIT_FIELD_VALUE',
  'LIMIT_FIELD_COUNT',
  'LIMIT_PART_COUNT',
]);

/**
 * Central Express error middleware.
 *
 * - Maps AppError.statusCode → HTTP status
 * - Logs at the error's declared severity (4xx → info, 5xx → error)
 * - Emits RFC 7807 application/problem+json for API requests
 * - Falls back to legacy { success, error } shape for backward compatibility
 * - Renders HTML error pages for non-API (browser) requests
 *
 * Must be registered as the last middleware via app.use(errorMiddleware).
 */
export function errorMiddleware(err: unknown, req: HttpRequest, res: HttpResponse, _next: HttpNext): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const appError = toAppError(err);

  logAppError(appError, req);
  res.status(appError.statusCode);

  if (isApiRequest(req)) {
    res.setHeader('Content-Type', 'application/problem+json');
    res.json(buildProblemDetails(appError, req, isProduction));
    return;
  }

  // Browser requests → render error page
  res.locals.message = isProduction && !appError.isExpected ? 'An error occurred' : appError.message;
  res.locals.error = isProduction ? {} : { message: appError.message, stack: appError.stack };

  res.render('storefront/themes/default/error', {
    pageName: 'Error',
    message: res.locals.message,
    error: res.locals.error,
    user: req.user,
    session: req.session,
    successMsg: res.locals.successMsg,
    errorMsg: res.locals.errorMsg,
    categories: [],
  });
}

function isMulterUploadError(err: unknown): boolean {
  const code = (err as Record<string, unknown>)?.code;
  return (
    (typeof code === 'string' && MULTER_ERROR_CODES.has(code)) || (err instanceof Error && err.message === 'Only image files are allowed')
  );
}

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  // Handle multer errors (file upload validation)
  if (isMulterUploadError(err)) {
    return new AppError(err instanceof Error ? err.message : 'File upload error', 400);
  }
  return new AppError(
    err instanceof Error ? err.message : 'Internal Server Error',
    (err as Record<string, number>)?.status ?? (err as Record<string, number>)?.statusCode ?? 500,
  );
}

// Log at the error's declared severity
function logAppError(appError: AppError, req: HttpRequest): void {
  const logMeta = {
    code: appError.code,
    message: appError.message,
    path: req.path,
    method: req.method,
    statusCode: appError.statusCode,
    isExpected: appError.isExpected,
    correlationId: getCorrelationId(),
    stack: !appError.isExpected ? appError.stack : undefined,
  };
  if (appError.severity === 'error') {
    logger.error('Unhandled error', logMeta);
  } else if (appError.severity === 'warn') {
    logger.warn('Client warning', logMeta);
  } else {
    logger.info('Client error', logMeta);
  }
}

// API requests → RFC 7807 problem+json (alongside legacy shape for deprecation window)
function isApiRequest(req: HttpRequest): boolean {
  return Boolean(
    req.xhr ||
    req.headers.accept?.includes('application/json') ||
    req.path.startsWith('/customer/') ||
    req.path.startsWith('/business/') ||
    req.path.startsWith('/acp/'),
  );
}

function buildProblemDetails(appError: AppError, req: HttpRequest, isProduction: boolean) {
  const safeMessage = isProduction && !appError.isExpected ? 'An internal error occurred' : appError.message;
  return {
    type: `https://docs.commercefull.com/errors/${appError.code}`,
    title: appError.name.replace(/Error$/, ''),
    status: appError.statusCode,
    detail: safeMessage,
    instance: req.path,
    code: appError.code,
    correlationId: getCorrelationId(),
    // Legacy fields kept during deprecation window
    success: false,
    error: {
      message: safeMessage,
      statusCode: appError.statusCode,
      code: appError.code,
      ...(appError.details ? { details: appError.details } : {}),
    },
  };
}
