import { AuditLog, AuditCategory, AuditOutcome } from './AuditLog';

describe('AuditLog Entity', () => {
  const baseParams = {
    auditLogId: 'al-1',
    organizationId: 'org-1',
    actorId: 'user-1',
    actorType: 'user' as const,
    category: 'authentication' as AuditCategory,
    action: 'login',
    resourceType: 'session',
  };

  describe('create', () => {
    it('should create with defaults for outcome and severity', () => {
      const log = AuditLog.create(baseParams);
      expect(log.outcome).toBe('success');
      expect(log.severity).toBe('info');
      expect(log.createdAt).toBeInstanceOf(Date);
    });

    it('should infer warning severity for security category', () => {
      const log = AuditLog.create({ ...baseParams, category: 'security', action: 'password_change' });
      expect(log.severity).toBe('warning');
    });

    it('should infer warning severity for compliance category', () => {
      const log = AuditLog.create({ ...baseParams, category: 'compliance', action: 'key_rotation' });
      expect(log.severity).toBe('warning');
    });

    it('should infer warning severity for failed outcome', () => {
      const log = AuditLog.create({ ...baseParams, outcome: 'failure' as AuditOutcome });
      expect(log.severity).toBe('warning');
    });

    it('should infer warning severity for denied outcome', () => {
      const log = AuditLog.create({ ...baseParams, outcome: 'denied' as AuditOutcome });
      expect(log.severity).toBe('warning');
    });

    it('should infer critical severity for payment failure', () => {
      const log = AuditLog.create({
        ...baseParams,
        category: 'payment',
        action: 'refund',
        outcome: 'failure' as AuditOutcome,
      });
      expect(log.severity).toBe('critical');
    });

    it('should store optional fields when provided', () => {
      const log = AuditLog.create({
        ...baseParams,
        actorEmail: 'admin@test.com',
        actorName: 'Admin User',
        resourceId: 'res-1',
        resourceName: 'Order #123',
        storeId: 'store-1',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        requestId: 'req-1',
        correlationId: 'corr-1',
        metadata: { key: 'value' },
        previousState: { status: 'pending' },
        newState: { status: 'completed' },
      });
      expect(log.actorEmail).toBe('admin@test.com');
      expect(log.actorName).toBe('Admin User');
      expect(log.resourceId).toBe('res-1');
      expect(log.resourceName).toBe('Order #123');
      expect(log.storeId).toBe('store-1');
      expect(log.ipAddress).toBe('127.0.0.1');
      expect(log.metadata).toEqual({ key: 'value' });
      expect(log.previousState).toEqual({ status: 'pending' });
      expect(log.newState).toEqual({ status: 'completed' });
    });
  });

  describe('reconstitute', () => {
    it('should restore from persistence', () => {
      const now = new Date();
      const log = AuditLog.reconstitute({
        auditLogId: 'al-1',
        organizationId: 'org-1',
        actorId: 'system',
        actorType: 'system',
        category: 'dataModification',
        action: 'customer_anonymize',
        resourceType: 'customer',
        resourceId: 'cust-1',
        outcome: 'success',
        severity: 'warning',
        previousHash: 'abc123',
        hash: 'def456',
        createdAt: now,
      });
      expect(log.actorType).toBe('system');
      expect(log.severity).toBe('warning');
      expect(log.previousHash).toBe('abc123');
      expect(log.hash).toBe('def456');
    });
  });

  describe('isFailure', () => {
    it('should return true for failure outcome', () => {
      const log = AuditLog.create({ ...baseParams, outcome: 'failure' as AuditOutcome });
      expect(log.isFailure()).toBe(true);
    });

    it('should return true for denied outcome', () => {
      const log = AuditLog.create({ ...baseParams, outcome: 'denied' as AuditOutcome });
      expect(log.isFailure()).toBe(true);
    });

    it('should return false for success outcome', () => {
      const log = AuditLog.create(baseParams);
      expect(log.isFailure()).toBe(false);
    });
  });

  describe('isCritical', () => {
    it('should return true for critical severity', () => {
      const log = AuditLog.create({
        ...baseParams,
        category: 'payment',
        outcome: 'failure' as AuditOutcome,
      });
      expect(log.isCritical()).toBe(true);
    });

    it('should return false for info severity', () => {
      const log = AuditLog.create(baseParams);
      expect(log.isCritical()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should include all props', () => {
      const log = AuditLog.create({ ...baseParams, resourceId: 'res-1', storeId: 'store-1' });
      const json = log.toJSON();
      expect(json.auditLogId).toBe('al-1');
      expect(json.organizationId).toBe('org-1');
      expect(json.action).toBe('login');
      expect(json.resourceId).toBe('res-1');
      expect(json.storeId).toBe('store-1');
      expect(json.previousHash).toBe('genesis');
    });
  });
});
