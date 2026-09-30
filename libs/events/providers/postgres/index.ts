/**
 * Postgres Event Provider (outbox)
 *
 * The `platformEventOutbox` table + writer + dispatcher are entirely owned
 * by the `postgres` event provider — nothing else in the codebase should
 * reach into this directory's internals.
 *
 * Public surface:
 * - createPostgresTransport — wired by providers/index.ts
 * - writeToOutbox / writeToOutboxBatch — transactional event writes for
 *   callers that need atomicity with a business write (withTransaction)
 * - dispatcher admin API — replayEvent / replayAllDeadLetter /
 *   getOutboxStats / listDeadLetterEvents / cleanupProcessedEvents
 */

export { createPostgresTransport } from './postgresProvider';
export { writeToOutbox, writeToOutboxBatch, outboxRowToPayload } from './outboxWriter';
export type { OutboxEvent } from './outboxWriter';
export {
  replayEvent,
  replayAllDeadLetter,
  getOutboxStats,
  listDeadLetterEvents,
  cleanupProcessedEvents,
} from './outboxDispatcher';
