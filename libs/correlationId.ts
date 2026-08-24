import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

interface CorrelationContext {
  correlationId: string;
}

const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

/**
 * Get the current correlation ID from the AsyncLocalStorage context.
 * Returns undefined if called outside a request context.
 */
export function getCorrelationId(): string | undefined {
  return correlationStorage.getStore()?.correlationId;
}

/**
 * Run a function within a correlation ID context.
 * Used for propagating correlation IDs into event handlers and background jobs.
 */
export function runWithCorrelationId<T>(correlationId: string, fn: () => T): T {
  return correlationStorage.run({ correlationId }, fn);
}

/**
 * Express middleware that sets a correlation ID for each request.
 *
 * - Reads `X-Correlation-Id` header if present (for distributed tracing)
 * - Otherwise generates a new UUID
 * - Stores it in AsyncLocalStorage for the request lifecycle
 * - Attaches it to response headers and res.locals
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();

  res.setHeader('X-Correlation-Id', correlationId);
  res.locals.correlationId = correlationId;

  correlationStorage.run({ correlationId }, () => next());
}
