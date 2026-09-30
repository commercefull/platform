/**
 * Postgres Outbox Event Provider
 *
 * Durable provider backed by the `platformEventOutbox` table:
 * - publish() inserts a pending row (at-least-once, survives crashes)
 * - subscriber is the claim-based outbox dispatcher (FOR UPDATE SKIP LOCKED,
 *   exponential backoff, dead-letter on max attempts)
 *
 * For transactional atomicity with a business write, use
 * writeToOutbox(tx, ...) inside withTransaction() instead of emit().
 */

import { getActivePool } from '../../../db/pool';
import { startOutboxDispatcher, stopOutboxDispatcher } from './outboxDispatcher';
import { OUTBOX_INSERT_SQL } from './outboxWriter';
import type { EventTransport } from '../../eventTransport';
import { logger } from '../../../logger';

export function createPostgresTransport(): EventTransport {
  return {
    provider: 'postgres',
    publisher: {
      async publish(payload) {
        const pool = getActivePool();
        await pool.query(OUTBOX_INSERT_SQL, [
          payload.type,
          JSON.stringify(payload.data),
          payload.correlationId ?? null,
          payload.source ?? null,
        ]);
        logger.debug('Event published to outbox transport', {
          type: payload.type,
          correlationId: payload.correlationId,
        });
      },
    },
    subscriber: {
      start(dispatch) {
        startOutboxDispatcher(undefined, dispatch);
      },
      stop: () => stopOutboxDispatcher(),
    },
  };
}
