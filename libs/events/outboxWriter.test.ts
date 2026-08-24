import { writeToOutbox, writeToOutboxBatch, outboxRowToPayload, OutboxEvent } from './outboxWriter';
import type { TxClient } from '../db/transaction';

describe('OutboxWriter', () => {
  function mockTx(returnsId: string = 'outbox-123'): TxClient {
    return {
      query: jest.fn().mockResolvedValue(null),
      queryOne: jest.fn().mockResolvedValue({ eventOutboxId: returnsId }),
    };
  }

  describe('writeToOutbox', () => {
    it('should insert an event into the outbox table', async () => {
      const tx = mockTx('evt-001');
      const id = await writeToOutbox(tx, 'order.created', { orderId: 'o1' });

      expect(id).toBe('evt-001');
      expect(tx.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO "eventOutbox"'),
        expect.arrayContaining(['order.created', JSON.stringify({ orderId: 'o1' })]),
      );
    });

    it('should pass correlationId and source when provided', async () => {
      const tx = mockTx('evt-002');
      await writeToOutbox(tx, 'order.paid', { orderId: 'o2' }, {
        correlationId: 'corr-abc',
        source: 'checkout',
      });

      expect(tx.queryOne).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['order.paid', 'corr-abc', 'checkout']),
      );
    });

    it('should return empty string if insert returns no row', async () => {
      const tx: TxClient = {
        query: jest.fn().mockResolvedValue(null),
        queryOne: jest.fn().mockResolvedValue(null),
      };
      const id = await writeToOutbox(tx, 'order.cancelled', { orderId: 'o3' });
      expect(id).toBe('');
    });
  });

  describe('writeToOutboxBatch', () => {
    it('should write multiple events and return their IDs', async () => {
      let callCount = 0;
      const tx: TxClient = {
        query: jest.fn().mockResolvedValue(null),
        queryOne: jest.fn().mockImplementation(() => {
          callCount++;
          return Promise.resolve({ eventOutboxId: `evt-batch-${callCount}` });
        }),
      };

      const ids = await writeToOutboxBatch(tx, [
        { type: 'order.created', data: { orderId: 'a' } },
        { type: 'order.paid', data: { orderId: 'b' } },
        { type: 'order.shipped', data: { orderId: 'c' } },
      ]);

      expect(ids).toEqual(['evt-batch-1', 'evt-batch-2', 'evt-batch-3']);
      expect(tx.queryOne).toHaveBeenCalledTimes(3);
    });
  });

  describe('outboxRowToPayload', () => {
    it('should convert an outbox row to an EventPayload', () => {
      const row: OutboxEvent = {
        eventOutboxId: 'evt-convert',
        eventType: 'order.completed',
        payload: { orderId: 'o9' },
        correlationId: 'corr-xyz',
        source: 'fulfillment',
        status: 'pending',
        attempts: 0,
        maxAttempts: 10,
        nextRetryAt: new Date(),
        processedAt: null,
        lastError: null,
        createdAt: new Date('2026-01-15T10:00:00Z'),
      };

      const payload = outboxRowToPayload(row);

      expect(payload.type).toBe('order.completed');
      expect(payload.data).toEqual({ orderId: 'o9' });
      expect(payload.correlationId).toBe('corr-xyz');
      expect(payload.source).toBe('fulfillment');
      expect(payload.timestamp).toEqual(new Date('2026-01-15T10:00:00Z'));
    });

    it('should handle null correlationId and source', () => {
      const row: OutboxEvent = {
        eventOutboxId: 'evt-2',
        eventType: 'order.cancelled',
        payload: {},
        correlationId: null,
        source: null,
        status: 'pending',
        attempts: 0,
        maxAttempts: 10,
        nextRetryAt: new Date(),
        processedAt: null,
        lastError: null,
        createdAt: new Date(),
      };

      const payload = outboxRowToPayload(row);
      expect(payload.correlationId).toBeUndefined();
      expect(payload.source).toBeUndefined();
    });
  });
});
