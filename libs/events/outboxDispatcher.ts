/**
 * Outbox Dispatcher
 *
 * A claim-based polling worker that reads pending events from the
 * `eventOutbox` table and dispatches them to the in-process eventBus.
 *
 * Multi-node safe: uses `SELECT ... FOR UPDATE SKIP LOCKED` so multiple
 * workers can run concurrently without double-processing.
 *
 * Features:
 * - At-least-once delivery (events are marked 'processing' before dispatch,
 *   only marked 'processed' after all handlers complete)
 * - Exponential backoff on failure (base 2s, max 5 min)
 * - Dead-letter queue: events exceeding maxAttempts are marked 'dead_letter'
 * - Replay: `replayEvent()` re-queues a dead_letter event
 * - Graceful shutdown: `stop()` waits for in-flight events
 */

import { getActivePool } from '../db/pool';
import { eventBus} from './eventBus';
import { outboxRowToPayload, type OutboxEvent } from './outboxWriter';
import { logger } from '../logger';

const POLL_INTERVAL_MS = 500;
const BATCH_SIZE = 20;
const _LOCK_TIMEOUT_MS = 30_000; // auto-release lock after 30s
const BASE_BACKOFF_MS = 2_000;
const MAX_BACKOFF_MS = 300_000; // 5 minutes
const MAX_ATTEMPTS_DEFAULT = 10;

const nodeId = `${process.pid}-${Date.now()}`;

let isRunning = false;
let pollTimer: NodeJS.Timeout | null = null;
let inFlight = 0;
let shuttingDown = false;

/**
 * Start the outbox dispatcher polling loop.
 */
export function startOutboxDispatcher(intervalMs: number = POLL_INTERVAL_MS): void {
  if (isRunning) return;
  isRunning = true;
  shuttingDown = false;
  logger.info('Outbox dispatcher started', { nodeId, intervalMs });

  const poll = async () => {
    if (shuttingDown) return;

    try {
      await dispatchBatch();
    } catch (err: unknown) {
      logger.error('Outbox dispatcher poll error', { error: (err as Error).message });
    }

    if (!shuttingDown) {
      pollTimer = setTimeout(poll, intervalMs);
      pollTimer.unref();
    }
  };

  poll();
}

/**
 * Stop the dispatcher. Waits for in-flight events to finish.
 */
export async function stopOutboxDispatcher(): Promise<void> {
  shuttingDown = true;
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }

  // Wait for in-flight events to complete (max 10s)
  const deadline = Date.now() + 10_000;
  while (inFlight > 0 && Date.now() < deadline) {
    await sleep(100);
  }

  isRunning = false;
  logger.info('Outbox dispatcher stopped', { nodeId, inFlight });
}

/**
 * Process a single batch of pending events.
 * Uses FOR UPDATE SKIP LOCKED for multi-node safety.
 */
async function dispatchBatch(): Promise<void> {
  // Skip when no DB is configured (e.g. unit test environment)
  if (!process.env.POSTGRES_HOST) return;

  const pool = getActivePool();
  const client = await pool.connect();

  try {
    // Claim pending events
    const claimResult = await client.query(
      `UPDATE "eventOutbox"
       SET "status" = 'processing',
           "lockedBy" = $1,
           "lockedAt" = now(),
           "attempts" = "attempts" + 1,
           "updatedAt" = now()
       WHERE "eventOutboxId" IN (
         SELECT "eventOutboxId" FROM "eventOutbox"
         WHERE "status" = 'pending'
           AND "nextRetryAt" <= now()
         ORDER BY "createdAt"
         LIMIT $2
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`,
      [nodeId, BATCH_SIZE],
    );

    if (claimResult.rows.length === 0) return;

    logger.debug('Outbox dispatcher claimed events', { count: claimResult.rows.length });

    // Dispatch each event — handlers run in parallel for throughput
    const dispatchPromises = claimResult.rows.map(row =>
      dispatchOne(client, row as unknown as OutboxEvent),
    );

    inFlight += dispatchPromises.length;
    await Promise.all(dispatchPromises);
    inFlight -= dispatchPromises.length;
  } finally {
    client.release();
  }
}

/**
 * Dispatch a single outbox event to all registered handlers.
 * Marks the event as 'processed' on success, or schedules a retry on failure.
 */
async function dispatchOne(
  client: import('pg').PoolClient,
  row: OutboxEvent,
): Promise<void> {
  const payload = outboxRowToPayload(row);

  try {
    // Dispatch to the eventBus — handlers run with error boundaries
    await eventBus.dispatchFromOutbox(payload);

    // Mark as processed
    await client.query(
      `UPDATE "eventOutbox"
       SET "status" = 'processed',
           "processedAt" = now(),
           "lastError" = NULL,
           "lockedBy" = NULL,
           "lockedAt" = NULL,
           "updatedAt" = now()
       WHERE "eventOutboxId" = $1`,
      [row.eventOutboxId],
    );

    logger.debug('Outbox event processed', {
      eventOutboxId: row.eventOutboxId,
      type: row.eventType,
      attempts: row.attempts,
    });
  } catch (err: unknown) {
    const errorMsg = (err as Error).message;
    const maxAttempts = row.maxAttempts || MAX_ATTEMPTS_DEFAULT;

    if (row.attempts >= maxAttempts) {
      // Move to dead-letter
      await client.query(
        `UPDATE "eventOutbox"
         SET "status" = 'dead_letter',
             "lastError" = $2,
             "lockedBy" = NULL,
             "lockedAt" = NULL,
             "updatedAt" = now()
         WHERE "eventOutboxId" = $1`,
        [row.eventOutboxId, errorMsg],
      );
      logger.warn('Outbox event moved to dead-letter', {
        eventOutboxId: row.eventOutboxId,
        type: row.eventType,
        attempts: row.attempts,
        error: errorMsg,
      });
    } else {
      // Schedule retry with exponential backoff
      const backoff = Math.min(
        BASE_BACKOFF_MS * Math.pow(2, row.attempts - 1),
        MAX_BACKOFF_MS,
      );
      const nextRetry = new Date(Date.now() + backoff);

      await client.query(
        `UPDATE "eventOutbox"
         SET "status" = 'pending',
             "lastError" = $2,
             "nextRetryAt" = $3,
             "lockedBy" = NULL,
             "lockedAt" = NULL,
             "updatedAt" = now()
         WHERE "eventOutboxId" = $1`,
        [row.eventOutboxId, errorMsg, nextRetry],
      );
      logger.warn('Outbox event retry scheduled', {
        eventOutboxId: row.eventOutboxId,
        type: row.eventType,
        attempts: row.attempts,
        nextRetryAt: nextRetry.toISOString(),
        error: errorMsg,
      });
    }
  }
}

/**
 * Replay a dead-lettered event by resetting it to pending.
 */
export async function replayEvent(eventOutboxId: string): Promise<boolean> {
  const pool = getActivePool();
  const result = await pool.query(
    `UPDATE "eventOutbox"
     SET "status" = 'pending',
         "attempts" = 0,
         "lastError" = NULL,
         "nextRetryAt" = now(),
         "lockedBy" = NULL,
         "lockedAt" = NULL,
         "updatedAt" = now()
     WHERE "eventOutboxId" = $1 AND "status" = 'dead_letter'
     RETURNING "eventOutboxId"`,
    [eventOutboxId],
  );

  if (result.rows.length > 0) {
    logger.info('Outbox event replayed', { eventOutboxId });
    return true;
  }
  return false;
}

/**
 * Replay all dead-lettered events.
 */
export async function replayAllDeadLetter(): Promise<number> {
  const pool = getActivePool();
  const result = await pool.query(
    `UPDATE "eventOutbox"
     SET "status" = 'pending',
         "attempts" = 0,
         "lastError" = NULL,
         "nextRetryAt" = now(),
         "lockedBy" = NULL,
         "lockedAt" = NULL,
         "updatedAt" = now()
     WHERE "status" = 'dead_letter'
     RETURNING "eventOutboxId"`,
  );

  const count = result.rows.length;
  if (count > 0) {
    logger.info('Replayed all dead-letter events', { count });
  }
  return count;
}

/**
 * Get outbox statistics for monitoring.
 */
export async function getOutboxStats(): Promise<{
  pending: number;
  processing: number;
  processed: number;
  deadLetter: number;
  oldestPending: Date | null;
}> {
  const pool = getActivePool();
  const result = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE "status" = 'pending') AS "pending",
       COUNT(*) FILTER (WHERE "status" = 'processing') AS "processing",
       COUNT(*) FILTER (WHERE "status" = 'processed') AS "processed",
       COUNT(*) FILTER (WHERE "status" = 'dead_letter') AS "deadLetter",
       MIN("createdAt") FILTER (WHERE "status" = 'pending') AS "oldestPending"
     FROM "eventOutbox"`,
  );

  const row = result.rows[0] as Record<string, string | null>;
  return {
    pending: parseInt(row.pending ?? '0', 10),
    processing: parseInt(row.processing ?? '0', 10),
    processed: parseInt(row.processed ?? '0', 10),
    deadLetter: parseInt(row.deadLetter ?? '0', 10),
    oldestPending: row.oldestPending ? new Date(row.oldestPending) : null,
  };
}

/**
 * List dead-lettered events (for admin inspection).
 */
export async function listDeadLetterEvents(limit: number = 50): Promise<OutboxEvent[]> {
  const pool = getActivePool();
  const result = await pool.query(
    `SELECT * FROM "eventOutbox"
     WHERE "status" = 'dead_letter'
     ORDER BY "updatedAt" DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows as unknown as OutboxEvent[];
}

/**
 * Clean up old processed events (retention policy).
 */
export async function cleanupProcessedEvents(olderThanDays: number = 30): Promise<number> {
  const pool = getActivePool();
  const result = await pool.query(
    `DELETE FROM "eventOutbox"
     WHERE "status" = 'processed'
       AND "processedAt" < now() - ($1 || ' days')::interval
     RETURNING "eventOutboxId"`,
    [String(olderThanDays)],
  );
  const count = result.rows.length;
  if (count > 0) {
    logger.info('Cleaned up processed outbox events', { count, olderThanDays });
  }
  return count;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
