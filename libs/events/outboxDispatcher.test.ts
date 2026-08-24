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

describe('OutboxDispatcher module', () => {
  describe('startOutboxDispatcher / stopOutboxDispatcher', () => {
    it('should start and stop without error', async () => {
      startOutboxDispatcher(60000); // long interval so it only polls once
      await new Promise(resolve => setTimeout(resolve, 10));
      await stopOutboxDispatcher();
    });

    it('should be idempotent — calling start twice does not throw', () => {
      startOutboxDispatcher(60000);
      startOutboxDispatcher(60000);
      return stopOutboxDispatcher();
    });

    it('should be idempotent — calling stop when not running does not throw', async () => {
      await expect(stopOutboxDispatcher()).resolves.not.toThrow();
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
