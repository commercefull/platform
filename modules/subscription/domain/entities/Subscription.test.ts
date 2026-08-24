/**
 * Unit Tests for Subscription Entity
 */

import { Subscription, SubscriptionStatus } from './Subscription';
import { SubscriptionValidationError } from '../errors/SubscriptionErrors';

describe('Subscription', () => {
  function createSubscription(status?: string): Subscription {
    return new Subscription({
      subscriptionId: 'sub-1',
      customerId: 'cust-1',
      planId: 'plan-1',
      status: (status as SubscriptionStatus) || 'active',
      billingInterval: 'monthly',
      billingIntervalCount: 1,
      currentPeriodStart: '2024-01-01',
      currentPeriodEnd: '2024-02-01',
      amount: 29.99,
      currencyCode: 'USD',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    });
  }

  describe('constructor', () => {
    it('should create with all props', () => {
      const sub = createSubscription();

      expect(sub.subscriptionId).toBe('sub-1');
      expect(sub.customerId).toBe('cust-1');
      expect(sub.status).toBe('active');
    });
  });

  describe('isActive', () => {
    it('should be true for active status', () => {
      const sub = createSubscription('active');
      expect(sub.isActive).toBe(true);
    });

    it('should be true for trial status', () => {
      const sub = createSubscription('trial');
      expect(sub.isActive).toBe(true);
    });

    it('should be false for paused status', () => {
      const sub = createSubscription('paused');
      expect(sub.isActive).toBe(false);
    });

    it('should be false for cancelled status', () => {
      const sub = createSubscription('cancelled');
      expect(sub.isActive).toBe(false);
    });
  });

  describe('isCancelled', () => {
    it('should be true for cancelled status', () => {
      const sub = createSubscription('cancelled');
      expect(sub.isCancelled).toBe(true);
    });

    it('should be false for active status', () => {
      const sub = createSubscription('active');
      expect(sub.isCancelled).toBe(false);
    });
  });

  describe('pause', () => {
    it('should pause an active subscription', () => {
      const sub = createSubscription('active');
      sub.pause();
      expect(sub.status).toBe('paused');
    });

    it('should throw when pausing a non-active subscription', () => {
      const sub = createSubscription('paused');
      expect(() => sub.pause()).toThrow(SubscriptionValidationError);
    });

    it('should throw when pausing a cancelled subscription', () => {
      const sub = createSubscription('cancelled');
      expect(() => sub.pause()).toThrow(SubscriptionValidationError);
    });
  });

  describe('resume', () => {
    it('should resume a paused subscription', () => {
      const sub = createSubscription('paused');
      sub.resume();
      expect(sub.status).toBe('active');
    });

    it('should throw when resuming a non-paused subscription', () => {
      const sub = createSubscription('active');
      expect(() => sub.resume()).toThrow(SubscriptionValidationError);
    });
  });

  describe('cancel', () => {
    it('should cancel with reason', () => {
      const sub = createSubscription('active');
      sub.cancel('Customer request');

      expect(sub.status).toBe('cancelled');
      expect(sub.isCancelled).toBe(true);
      expect(sub.toJSON().cancelReason).toBe('Customer request');
      expect(sub.toJSON().cancelledAt).toBeDefined();
    });

    it('should cancel without reason', () => {
      const sub = createSubscription('active');
      sub.cancel();

      expect(sub.status).toBe('cancelled');
      expect(sub.toJSON().cancelReason).toBeUndefined();
    });
  });

  describe('toJSON', () => {
    it('should return all props', () => {
      const sub = createSubscription();
      const json = sub.toJSON();

      expect(json.subscriptionId).toBe('sub-1');
      expect(json.customerId).toBe('cust-1');
      expect(json.planId).toBe('plan-1');
      expect(json.amount).toBe(29.99);
    });
  });
});
