import { Response } from 'express';

/**
 * Standard API response format for success cases
 * @param res Express response object
 * @param data Response data
 * @param statusCode HTTP status code (default: 200)
 */
export function successResponse(res: Response, data: any, statusCode: number = 200): Response {
  return res.status(statusCode).json({
    success: true,
    data
  });
}

/**
 * Standard API response format for error cases
 * @param res Express response object
 * @param message Error message
 * @param statusCode HTTP status code (default: 500)
 */
export function errorResponse(res: Response, message: string, statusCode: number = 500): Response {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode
    }
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
      errors
    }
  });
}

export default {
  successResponse,
  errorResponse,
  validationErrorResponse
};
