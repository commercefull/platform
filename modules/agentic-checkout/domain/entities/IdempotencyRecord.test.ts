/**
 * Tests for the IdempotencyRecord entity — ACP Idempotency-Key state machine.
 */

import { IdempotencyRecord } from './IdempotencyRecord';

describe('IdempotencyRecord', () => {
  const baseParams = {
    integrationId: 'int-1',
    key: 'key-abc',
    requestHash: 'hash-1',
    method: 'POST',
    path: '/acp/checkout_sessions',
  };

  describe('createInFlight', () => {
    it('should create a record in in_flight state with no stored response', () => {
      const record = IdempotencyRecord.createInFlight(baseParams);

      expect(record.state).toBe('in_flight');
      expect(record.responseStatus).toBeNull();
      expect(record.responseBody).toBeNull();
      expect(record.key).toBe('key-abc');
      expect(record.isExpired).toBe(false);
    });

    it('should default the TTL to 24 hours', () => {
      const before = Date.now();
      const record = IdempotencyRecord.createInFlight(baseParams);

      expect(record.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 24 * 3_600_000);
      expect(record.expiresAt.getTime()).toBeLessThan(Date.now() + 25 * 3_600_000);
    });

    it('should honour a custom TTL', () => {
      const record = IdempotencyRecord.createInFlight({ ...baseParams, ttlHours: 1 });

      expect(record.expiresAt.getTime()).toBeLessThan(Date.now() + 2 * 3_600_000);
    });
  });

  describe('matchesRequest', () => {
    it('should return true for the same request hash and false otherwise', () => {
      const record = IdempotencyRecord.createInFlight(baseParams);

      expect(record.matchesRequest('hash-1')).toBe(true);
      expect(record.matchesRequest('hash-2')).toBe(false);
    });
  });

  describe('complete', () => {
    it('should mark the record completed with the stored response', () => {
      const record = IdempotencyRecord.createInFlight(baseParams);

      record.complete(201, { id: 'sess-1' });

      expect(record.state).toBe('completed');
      expect(record.responseStatus).toBe(201);
      expect(record.responseBody).toEqual({ id: 'sess-1' });
    });
  });

  describe('isExpired', () => {
    it('should return true once expiresAt has passed', () => {
      const record = IdempotencyRecord.reconstitute({
        idempotencyRecordId: 'rec-1',
        ...baseParams,
        state: 'completed',
        responseStatus: 200,
        responseBody: {},
        createdAt: new Date(Date.now() - 48 * 3_600_000),
        expiresAt: new Date(Date.now() - 1000),
      });

      expect(record.isExpired).toBe(true);
    });
  });
});
