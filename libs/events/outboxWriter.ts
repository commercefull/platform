/**
 * Outbox Writer
 *
 * Writes domain events to the `eventOutbox` table within the same database
 * transaction as the business operation that produced them. This guarantees
 * that events are not lost if the process crashes after the business write
 * but before the event is dispatched.
 *
 * The OutboxDispatcher polls the table and dispatches pending events to
 * the in-process eventBus, where registered handlers execute with
 * per-handler error boundaries.
 */

import type { TxClient } from '../db/transaction';
import { logger } from '../logger';
import { getCorrelationId } from '../correlationId';
import type { EventType, EventPayload } from './eventBus';

export interface OutboxEvent {
  eventOutboxId: string;
  eventType: EventType;
  payload: unknown;
  correlationId: string | null;
  source: string | null;
  status: 'pending' | 'processing' | 'processed' | 'dead_letter';
  attempts: number;
  maxAttempts: number;
  nextRetryAt: Date;
  processedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
}

/**
 * Write a single event to the outbox table using the provided transaction client.
 * Must be called inside a `withTransaction()` callback so the event write
 * commits atomically with the business operation.
 */
export async function writeToOutbox(
  tx: TxClient,
  type: EventType,
  data: unknown,
  options?: { correlationId?: string; source?: string },
): Promise<string> {
  const correlationId = options?.correlationId ?? getCorrelationId();
  const source = options?.source;

  const row = await tx.queryOne<{ eventOutboxId: string }>(
    `INSERT INTO "eventOutbox" ("eventType", "payload", "correlationId", "source", "status", "attempts", "maxAttempts", "nextRetryAt")
     VALUES ($1, $2, $3, $4, 'pending', 0, 10, now())
     RETURNING "eventOutboxId"`,
    [type, JSON.stringify(data), correlationId ?? null, source ?? null],
  );

  const id = row?.eventOutboxId ?? '';
  logger.debug('Event written to outbox', { eventOutboxId: id, type, correlationId });
  return id;
}

/**
 * Write multiple events to the outbox in a single batch.
 * Must be called inside a `withTransaction()` callback.
 */
export async function writeToOutboxBatch(
  tx: TxClient,
  events: Array<{ type: EventType; data: unknown; source?: string }>,
  options?: { correlationId?: string },
): Promise<string[]> {
  const correlationId = options?.correlationId ?? getCorrelationId();
  const ids: string[] = [];

  for (const event of events) {
    const id = await writeToOutbox(tx, event.type, event.data, {
      correlationId,
      source: event.source,
    });
    ids.push(id);
  }

  return ids;
}

/**
 * Convert an outbox row to an EventPayload for dispatching.
 */
export function outboxRowToPayload(row: OutboxEvent): EventPayload {
  return {
    type: row.eventType,
    data: row.payload,
    timestamp: row.createdAt,
    correlationId: row.correlationId ?? undefined,
    source: row.source ?? undefined,
  };
}
