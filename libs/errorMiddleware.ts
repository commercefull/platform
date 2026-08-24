import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors';
import { logger } from './logger';
import { getCorrelationId } from './correlationId';

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
export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const isProduction = process.env.NODE_ENV === 'production';

  const appError = err instanceof AppError
    ? err
    : new AppError(
        err instanceof Error ? err.message : 'Internal Server Error',
        (err as Record<string, number>)?.status ?? 500,
      );

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

  // Log at the error's declared severity
  if (appError.severity === 'error') {
    logger.error('Unhandled error', logMeta);
  } else if (appError.severity === 'warn') {
    logger.warn('Client warning', logMeta);
  } else {
    logger.info('Client error', logMeta);
  }

  res.status(appError.statusCode);

  // API requests → RFC 7807 problem+json (alongside legacy shape for deprecation window)
  const isApiRequest = req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/customer/') || req.path.startsWith('/business/');

  if (isApiRequest) {
    // RFC 7807 problem details shape
    const problemDetails = {
      type: `https://docs.commercefull.com/errors/${appError.code}`,
      title: appError.name.replace(/Error$/, ''),
      status: appError.statusCode,
      detail: isProduction && !appError.isExpected ? 'An internal error occurred' : appError.message,
      instance: req.path,
      code: appError.code,
      correlationId: getCorrelationId(),
      // Legacy fields kept during deprecation window
      success: false,
      error: {
        message: isProduction && !appError.isExpected ? 'An internal error occurred' : appError.message,
        statusCode: appError.statusCode,
        code: appError.code,
        ...(appError.details ? { details: appError.details } : {}),
      },
    };

    res.setHeader('Content-Type', 'application/problem+json');
    res.json(problemDetails);
    return;
  }

  // Browser requests → render error page
  res.locals.message = isProduction && !appError.isExpected ? 'An error occurred' : appError.message;
  res.locals.error = isProduction ? {} : { message: appError.message, stack: appError.stack };

  res.render('storefront/views/error', {
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
