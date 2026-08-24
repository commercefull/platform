import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { AppError } from './errors';
import { logger } from './logger';

/**
 * Central error boundary for controller catch blocks.
 *
 * - `AppError` instances use their built-in `statusCode` and `message`.
 * - PostgreSQL "invalid input syntax for type uuid" is mapped to 404.
 * - Everything else is a 500 and logged at error level.
 *
 * @example
 * ```ts
 * export const myHandler = async (req, res) => {
 *   try {
 *     // ... use case execution
 *   } catch (error) {
 *     handleControllerError(req, res, error, 'Failed to do thing');
 *   }
 * };
 * ```
 */
export function handleControllerError(
  req: TypedRequest,
  res: Response,
  error: unknown,
  fallbackMessage: string,
): void {
  if (error instanceof AppError) {
    if (error.severity === 'error') {
      logger.error(fallbackMessage, error);
    }
    res.status(error.statusCode).json({ success: false, error: error.message, code: error.code });
    return;
  }

  const message = (error as Error)?.message ?? '';

  // PostgreSQL invalid UUID format — treat as not found
  if (message.includes('invalid input syntax for type uuid')) {
    res.status(404).json({ success: false, error: 'Resource not found' });
    return;
  }

  logger.error(fallbackMessage, error);
  res.status(500).json({ success: false, error: message || fallbackMessage });
}
