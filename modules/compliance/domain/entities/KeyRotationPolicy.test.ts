import { KeyRotationPolicy, DEFAULT_ROTATION_INTERVALS } from './KeyRotationPolicy';
import { ComplianceValidationError } from '../errors/ComplianceErrors';

describe('KeyRotationPolicy Entity', () => {
  const baseParams = {
    keyRotationPolicyId: 'krp-1',
    organizationId: 'org-1',
    keyType: 'paymentWebhookSecret' as const,
    keyIdentifier: 'stripe-webhook-secret',
  };

  describe('create', () => {
    it('should create with default rotation interval for key type', () => {
      const policy = KeyRotationPolicy.create(baseParams);
      expect(policy.keyType).toBe('paymentWebhookSecret');
      expect(policy.rotationIntervalDays).toBe(DEFAULT_ROTATION_INTERVALS.paymentWebhookSecret);
      expect(policy.status).toBe('active');
      expect(policy.rotationCount).toBe(0);
    });

    it('should use custom rotation interval when provided', () => {
      const policy = KeyRotationPolicy.create({ ...baseParams, rotationIntervalDays: 60 });
      expect(policy.rotationIntervalDays).toBe(60);
    });

    it('should set nextRotationAt based on interval', () => {
      const policy = KeyRotationPolicy.create({ ...baseParams, rotationIntervalDays: 30 });
      const diff = policy.nextRotationAt.getTime() - policy.lastRotatedAt.getTime();
      expect(Math.round(diff / (1000 * 60 * 60 * 24))).toBe(30);
    });

    it('should throw if rotation interval is too short', () => {
      expect(() => KeyRotationPolicy.create({ ...baseParams, rotationIntervalDays: 3 }))
        .toThrow(ComplianceValidationError);
    });

    it('should throw if rotation interval is too long', () => {
      expect(() => KeyRotationPolicy.create({ ...baseParams, rotationIntervalDays: 800 }))
        .toThrow(ComplianceValidationError);
    });
  });

  describe('reconstitute', () => {
    it('should restore from persistence', () => {
      const now = new Date();
      const policy = KeyRotationPolicy.reconstitute({
        keyRotationPolicyId: 'krp-1',
        organizationId: 'org-1',
        keyType: 'jwtSigningKey',
        keyIdentifier: 'jwt-main',
        rotationIntervalDays: 30,
        lastRotatedAt: now,
        nextRotationAt: new Date(now.getTime() + 30 * 86400000),
        status: 'active',
        rotationCount: 5,
        gracePeriodDays: 7,
        notifyBeforeDays: 14,
        createdAt: now,
        updatedAt: now,
      });
      expect(policy.rotationCount).toBe(5);
      expect(policy.keyType).toBe('jwtSigningKey');
    });
  });

  describe('isDueForRotation', () => {
    it('should return true when nextRotationAt has passed', () => {
      const policy = KeyRotationPolicy.reconstitute({
        keyRotationPolicyId: 'krp-1',
        organizationId: 'org-1',
        keyType: 'paymentApiKey',
        keyIdentifier: 'stripe-api-key',
        rotationIntervalDays: 90,
        lastRotatedAt: new Date(Date.now() - 100 * 86400000),
        nextRotationAt: new Date(Date.now() - 10 * 86400000),
        status: 'active',
        rotationCount: 1,
        gracePeriodDays: 7,
        notifyBeforeDays: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(policy.isDueForRotation()).toBe(true);
    });

    it('should return false when nextRotationAt is in the future', () => {
      const policy = KeyRotationPolicy.create(baseParams);
      expect(policy.isDueForRotation()).toBe(false);
    });

    it('should return false when status is not active', () => {
      const policy = KeyRotationPolicy.create(baseParams);
      policy.retire();
      expect(policy.isDueForRotation()).toBe(false);
    });
  });

  describe('isRotationApproaching', () => {
    it('should return true when within notify window', () => {
      const policy = KeyRotationPolicy.reconstitute({
        keyRotationPolicyId: 'krp-1',
        organizationId: 'org-1',
        keyType: 'hmacSigningKey',
        keyIdentifier: 'hmac-main',
        rotationIntervalDays: 90,
        lastRotatedAt: new Date(Date.now() - 80 * 86400000),
        nextRotationAt: new Date(Date.now() + 10 * 86400000),
        status: 'active',
        rotationCount: 0,
        gracePeriodDays: 7,
        notifyBeforeDays: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(policy.isRotationApproaching()).toBe(true);
    });

    it('should return false when far from rotation', () => {
      const policy = KeyRotationPolicy.create(baseParams);
      expect(policy.isRotationApproaching()).toBe(false);
    });
  });

  describe('isOverdue', () => {
    it('should return true when past grace period', () => {
      const policy = KeyRotationPolicy.reconstitute({
        keyRotationPolicyId: 'krp-1',
        organizationId: 'org-1',
        keyType: 'encryptionKey',
        keyIdentifier: 'db-encryption',
        rotationIntervalDays: 365,
        lastRotatedAt: new Date(Date.now() - 400 * 86400000),
        nextRotationAt: new Date(Date.now() - 35 * 86400000),
        status: 'active',
        rotationCount: 0,
        gracePeriodDays: 7,
        notifyBeforeDays: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(policy.isOverdue()).toBe(true);
    });
  });

  describe('daysUntilRotation', () => {
    it('should return positive days when future', () => {
      const policy = KeyRotationPolicy.create({ ...baseParams, rotationIntervalDays: 90 });
      const days = policy.daysUntilRotation();
      expect(days).toBeGreaterThan(80);
      expect(days).toBeLessThanOrEqual(91);
    });

    it('should return approximately the rotation interval for a fresh policy', () => {
      const policy = KeyRotationPolicy.create({ ...baseParams, rotationIntervalDays: 30 });
      const days = policy.daysUntilRotation();
      expect(days).toBeGreaterThanOrEqual(29);
      expect(days).toBeLessThanOrEqual(30);
    });

    it('should return negative days when overdue', () => {
      const policy = KeyRotationPolicy.reconstitute({
        keyRotationPolicyId: 'krp-1',
        organizationId: 'org-1',
        keyType: 'jwtSigningKey',
        keyIdentifier: 'jwt-main',
        rotationIntervalDays: 30,
        lastRotatedAt: new Date(Date.now() - 40 * 86400000),
        nextRotationAt: new Date(Date.now() - 10 * 86400000),
        status: 'active',
        rotationCount: 0,
        gracePeriodDays: 7,
        notifyBeforeDays: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(policy.daysUntilRotation()).toBeLessThan(0);
    });
  });

  describe('startRotation / completeRotation', () => {
    it('should transition active → rotating → active', () => {
      const policy = KeyRotationPolicy.create(baseParams);
      expect(policy.status).toBe('active');

      policy.startRotation('old-key-id');
      expect(policy.status).toBe('rotating');
      expect(policy.previousKeyId).toBe('old-key-id');

      policy.completeRotation();
      expect(policy.status).toBe('active');
      expect(policy.rotationCount).toBe(1);
      expect(policy.previousKeyId).toBeUndefined();
    });

    it('should throw when starting rotation from non-active status', () => {
      const policy = KeyRotationPolicy.create(baseParams);
      policy.retire();
      expect(() => policy.startRotation('old')).toThrow(ComplianceValidationError);
    });

    it('should throw when completing rotation from non-rotating status', () => {
      const policy = KeyRotationPolicy.create(baseParams);
      expect(() => policy.completeRotation()).toThrow(ComplianceValidationError);
    });
  });

  describe('retire', () => {
    it('should set status to retired', () => {
      const policy = KeyRotationPolicy.create(baseParams);
      policy.retire();
      expect(policy.status).toBe('retired');
    });

    it('should be idempotent', () => {
      const policy = KeyRotationPolicy.create(baseParams);
      policy.retire();
      policy.retire();
      expect(policy.status).toBe('retired');
    });
  });

  describe('updateInterval', () => {
    it('should update interval and recalculate nextRotationAt', () => {
      const policy = KeyRotationPolicy.create({ ...baseParams, rotationIntervalDays: 90 });
      policy.updateInterval(60);
      expect(policy.rotationIntervalDays).toBe(60);
      const diff = policy.nextRotationAt.getTime() - policy.lastRotatedAt.getTime();
      expect(Math.round(diff / (1000 * 60 * 60 * 24))).toBe(60);
    });

    it('should throw for invalid interval', () => {
      const policy = KeyRotationPolicy.create(baseParams);
      expect(() => policy.updateInterval(1)).toThrow(ComplianceValidationError);
    });
  });

  describe('toJSON', () => {
    it('should include computed fields', () => {
      const policy = KeyRotationPolicy.create(baseParams);
      const json = policy.toJSON();
      expect(json.isDueForRotation).toBe(false);
      expect(json.isRotationApproaching).toBe(false);
      expect(json.isOverdue).toBe(false);
      expect(json.daysUntilRotation).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_ROTATION_INTERVALS', () => {
    it('should have correct defaults for all key types', () => {
      expect(DEFAULT_ROTATION_INTERVALS.paymentWebhookSecret).toBe(90);
      expect(DEFAULT_ROTATION_INTERVALS.paymentApiKey).toBe(90);
      expect(DEFAULT_ROTATION_INTERVALS.jwtSigningKey).toBe(30);
      expect(DEFAULT_ROTATION_INTERVALS.hmacSigningKey).toBe(90);
      expect(DEFAULT_ROTATION_INTERVALS.encryptionKey).toBe(365);
    });
  });
});
