/**
 * Unit tests for OutboxDispatcher pure functions and module structure.
 * Tests that don't require a database connection.
 */

import {
  startOutboxDispatcher,
  stopOutboxDispatcher,
  replayEvent,
  replayAllDeadLetter,
  getOutboxStats,
  listDeadLetterEvents,
  cleanupProcessedEvents,
} from './outboxDispatcher';
import { getActivePool } from '../../../db/pool';

jest.mock('../../../db/pool', () => ({ getActivePool: jest.fn() }));

describe('OutboxDispatcher module', () => {
  describe('startOutboxDispatcher / stopOutboxDispatcher', () => {
    it('should start and stop without error', async () => {
      startOutboxDispatcher(60000, jest.fn()); // long interval so it only polls once
      await new Promise(resolve => setTimeout(resolve, 10));
      await stopOutboxDispatcher();
    });

    it('should be idempotent — calling start twice does not throw', () => {
      startOutboxDispatcher(60000, jest.fn());
      startOutboxDispatcher(60000, jest.fn());
      return stopOutboxDispatcher();
    });

    it('should be idempotent — calling stop when not running does not throw', async () => {
      await expect(stopOutboxDispatcher()).resolves.not.toThrow();
    });
  });

  describe('stale-lock recovery', () => {
    const savedHost = process.env.POSTGRES_HOST;

    afterEach(() => {
      if (savedHost === undefined) delete process.env.POSTGRES_HOST;
      else process.env.POSTGRES_HOST = savedHost;
    });

    it('should re-queue processing rows whose lock is stale before claiming', async () => {
      process.env.POSTGRES_HOST = 'unit-test';
      const query = jest.fn().mockResolvedValue({ rows: [] });
      const release = jest.fn();
      (getActivePool as jest.Mock).mockReturnValue({ connect: jest.fn().mockResolvedValue({ query, release }) });

      startOutboxDispatcher(60000, jest.fn());
      await new Promise(resolve => setTimeout(resolve, 20));
      await stopOutboxDispatcher();

      expect(query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(`"status" = 'processing'`),
        [expect.any(String)],
      );
      expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining('FOR UPDATE SKIP LOCKED'), expect.any(Array));
      expect(release).toHaveBeenCalled();
    });
  });

  describe('replayEvent', () => {
    it('should be a function', () => {
      expect(typeof replayEvent).toBe('function');
    });
  });

  describe('replayAllDeadLetter', () => {
    it('should be a function', () => {
      expect(typeof replayAllDeadLetter).toBe('function');
    });
  });

  describe('getOutboxStats', () => {
    it('should be a function', () => {
      expect(typeof getOutboxStats).toBe('function');
    });
  });

  describe('listDeadLetterEvents', () => {
    it('should be a function', () => {
      expect(typeof listDeadLetterEvents).toBe('function');
    });
  });

  describe('cleanupProcessedEvents', () => {
    it('should be a function', () => {
      expect(typeof cleanupProcessedEvents).toBe('function');
    });
  });
});
