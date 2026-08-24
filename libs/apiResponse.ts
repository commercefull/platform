import { Response } from 'express';
import { AppError } from './errors';

/**
 * Standard API response format for success cases
 * @param res Express response object
 * @param data Response data
 * @param statusCode HTTP status code (default: 200)
 */
export function successResponse(res: Response, data: unknown, statusCode: number = 200): Response {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Standard API response format for error cases (legacy shape)
 * @param res Express response object
 * @param message Error message
 * @param statusCode HTTP status code (default: 500)
 */
export function errorResponse(res: Response, message: string, statusCode: number = 500): Response {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
    },
  });
}

/**
 * Standard API response for validation errors
 * @param res Express response object
 * @param errors Validation errors
 */
export function validationErrorResponse(res: Response, errors: string[]): Response {
  return res.status(400).json({
    success: false,
    error: {
      message: 'Validation failed',
      statusCode: 400,
      errors,
    },
  });
}

/**
 * RFC 7807 Problem Details response.
 * Emits application/problem+json with the standard fields.
 * Keeps legacy { success, error } fields during the deprecation window.
 *
 * @param res Express response object
 * @param error AppError instance with code, severity, statusCode
 * @param instance Request path (optional, defaults to res.req.path)
 */
export function problemDetailsResponse(res: Response, error: AppError, instance?: string): Response {
  const isProduction = process.env.NODE_ENV === 'production';
  const path = instance ?? res.req?.path ?? '';

  res.setHeader('Content-Type', 'application/problem+json');

  return res.status(error.statusCode).json({
    type: `https://docs.commercefull.com/errors/${error.code}`,
    title: error.name.replace(/Error$/, ''),
    status: error.statusCode,
    detail: isProduction && !error.isExpected ? 'An internal error occurred' : error.message,
    instance: path,
    code: error.code,
    // Legacy fields kept during deprecation window
    success: false,
    error: {
      message: isProduction && !error.isExpected ? 'An internal error occurred' : error.message,
      statusCode: error.statusCode,
      code: error.code,
      ...(error.details ? { details: error.details } : {}),
    },
  });
}

export default {
  successResponse,
  errorResponse,
  validationErrorResponse,
  problemDetailsResponse,
};
