/**
 * Idempotency Middleware
 *
 * ACP requires `Idempotency-Key` on all POSTs. Semantics:
 * - key seen, same payload   → replay stored response with `Idempotent-Replayed: true`
 * - key seen, other payload  → 422
 * - key seen, still in flight → 409
 * - new key                  → run handler, capture response, store it
 */

import { createHash } from 'crypto';
import type { HttpRequest, HttpResponse, HttpNext } from '../../../../libs/http';
import type { IdempotencyRepository } from '../../domain/repositories/IdempotencyRepository';
import { IdempotencyRecord } from '../../domain/entities/IdempotencyRecord';
import {
  IdempotencyKeyRequiredError,
  IdempotencyConflictError,
  IdempotencyInFlightError,
  ChannelAuthenticationError,
} from '../../domain/errors/AgenticCheckoutErrors';
import { setHeader, jsonResponse } from '../../../../libs/apiResponse';
import { logger } from '../../../../libs/logger';

function requestHash(req: HttpRequest): string {
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body ?? {});
  return createHash('sha256').update(`${req.method} ${req.path} ${rawBody}`).digest('hex');
}

export function createIdempotencyMiddleware(idempotencyRepository: IdempotencyRepository) {
  return async function idempotency(req: HttpRequest, res: HttpResponse, next: HttpNext): Promise<void> {
    try {
      const key = req.headers['idempotency-key'];
      if (!key || typeof key !== 'string') {
        throw new IdempotencyKeyRequiredError();
      }

      const integrationId = req.channelContext?.integrationId;
      if (!integrationId) {
        throw new ChannelAuthenticationError();
      }

      const hash = requestHash(req);
      const existing = await idempotencyRepository.findByKey(integrationId, key);

      if (existing && !existing.isExpired) {
        if (!existing.matchesRequest(hash)) {
          throw new IdempotencyConflictError();
        }
        if (existing.state === 'in_flight') {
          throw new IdempotencyInFlightError();
        }
        // Replay stored response
        setHeader(res, 'Idempotent-Replayed', 'true');
        setHeader(res, 'Idempotency-Key', key);
        jsonResponse(res, existing.responseStatus ?? 200, existing.responseBody ?? {});
        return;
      }

      // Claim the key — insert in-flight; a concurrent request with the same
      // key hits the unique constraint path and gets the 409/422 branches.
      const record = IdempotencyRecord.createInFlight({
        integrationId,
        key,
        requestHash: hash,
        method: req.method,
        path: req.path,
      });
      const created = await idempotencyRepository.createIfAbsent(record);
      if (!created) {
        // Lost the race — treat as in-flight replay attempt
        throw new IdempotencyInFlightError();
      }

      // Capture the handler's response and persist it on the record
      const originalJson = res.json.bind(res);
      res.json = ((body: unknown) => {
        record.complete(res.statusCode, body as Record<string, unknown>);
        idempotencyRepository.update(record).catch(err => {
          logger.error('Failed to persist idempotency record', { error: String(err) });
        });
        return originalJson(body);
      }) as typeof res.json;

      setHeader(res, 'Idempotency-Key', key);
      next();
    } catch (err) {
      next(err);
    }
  };
}
