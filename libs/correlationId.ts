import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import type { HttpNext, HttpRequest, HttpResponse } from './http';

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
 * Express middleware that sets a correlation ID for each request.
 *
 * - Reads `X-Correlation-Id` header if present (for distributed tracing)
 * - Otherwise generates a new UUID
 * - Stores it in AsyncLocalStorage for the request lifecycle
 * - Attaches it to response headers and res.locals
 */
export function correlationIdMiddleware(req: HttpRequest, res: HttpResponse, next: HttpNext): void {
  const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();

  res.setHeader('X-Correlation-Id', correlationId);
  res.locals.correlationId = correlationId;

  correlationStorage.run({ correlationId }, () => next());
}
