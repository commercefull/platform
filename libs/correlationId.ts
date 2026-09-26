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
const CORRELATION_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

export function correlationIdMiddleware(req: HttpRequest, res: HttpResponse, next: HttpNext): void {
  // Only accept well-formed inbound IDs — prevents log injection and oversized headers
  const inbound = req.headers['x-correlation-id'];
  const correlationId = typeof inbound === 'string' && CORRELATION_ID_PATTERN.test(inbound) ? inbound : randomUUID();

  res.setHeader('X-Correlation-Id', correlationId);
  res.locals.correlationId = correlationId;

  correlationStorage.run({ correlationId }, () => next());
}
