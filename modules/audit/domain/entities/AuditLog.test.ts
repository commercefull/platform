import { AuditLog } from '../entities/AuditLog';

describe('AuditLog entity', () => {
  describe('create', () => {
    it('should create an audit log entry with hash chain', () => {
      const entry = AuditLog.create({
        actorId: 'user-1',
        actorType: 'admin',
        action: 'product.create',
        resourceType: 'product',
        resourceId: 'prod-1',
        resourceName: 'Widget',
      });

      expect(entry.auditLogId).toBeDefined();
      expect(entry.actorId).toBe('user-1');
      expect(entry.actorType).toBe('admin');
      expect(entry.action).toBe('product.create');
      expect(entry.resourceType).toBe('product');
      expect(entry.resourceId).toBe('prod-1');
      expect(entry.previousHash).toBe('genesis');
      expect(entry.hash).toBeDefined();
      expect(entry.hash).not.toBe('genesis');
      expect(entry.hash.length).toBe(64); // SHA-256 hex
    });

    it('should chain to previous hash when provided', () => {
      const prevHash = 'abc123def456';
      const entry = AuditLog.create({
        actorId: 'user-2',
        actorType: 'organization',
        action: 'order.refund',
        resourceType: 'order',
        resourceId: 'ord-1',
      }, prevHash);

      expect(entry.previousHash).toBe(prevHash);
      expect(entry.hash).not.toBe(prevHash);
    });

    it('should store optional fields', () => {
      const entry = AuditLog.create({
        actorId: 'user-3',
        actorType: 'customer',
        actorEmail: 'test@example.com',
        actorName: 'Test User',
        action: 'order.create',
        resourceType: 'order',
        resourceId: 'ord-2',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        correlationId: 'corr-123',
        organizationId: 'org-1',
        storeId: 'store-1',
        metadata: { oldStatus: 'pending', newStatus: 'paid' },
      });

      expect(entry.actorEmail).toBe('test@example.com');
      expect(entry.actorName).toBe('Test User');
      expect(entry.ipAddress).toBe('192.168.1.1');
      expect(entry.userAgent).toBe('Mozilla/5.0');
      expect(entry.correlationId).toBe('corr-123');
      expect(entry.organizationId).toBe('org-1');
      expect(entry.storeId).toBe('store-1');
      expect(entry.metadata).toEqual({ oldStatus: 'pending', newStatus: 'paid' });
    });
  });

  describe('verifyHash', () => {
    it('should verify a valid hash', () => {
      const entry = AuditLog.create({
        actorId: 'user-1',
        actorType: 'admin',
        action: 'product.update',
        resourceType: 'product',
        resourceId: 'prod-1',
      });

      expect(entry.verifyHash()).toBe(true);
    });

    it('should detect tampering via reconstitute', () => {
      const entry = AuditLog.create({
        actorId: 'user-1',
        actorType: 'admin',
        action: 'product.update',
        resourceType: 'product',
        resourceId: 'prod-1',
      });

      // Tamper with the props
      const tampered = AuditLog.reconstitute({
        ...entry.toJSON(),
        actorId: 'hacker',
      });

      expect(tampered.verifyHash()).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should freeze internal props', () => {
      const entry = AuditLog.create({
        actorId: 'user-1',
        actorType: 'admin',
        action: 'product.create',
        resourceType: 'product',
      });

      const json = entry.toJSON();
      expect(Object.isFrozen(json)).toBe(true);
    });
  });

  describe('reconstitute', () => {
    it('should round-trip through create → toJSON → reconstitute', () => {
      const original = AuditLog.create({
        actorId: 'user-5',
        actorType: 'system',
        action: 'config.update',
        resourceType: 'config',
        metadata: { key: 'value' },
      });

      const json = original.toJSON();
      const reconstituted = AuditLog.reconstitute(json);

      expect(reconstituted.auditLogId).toBe(original.auditLogId);
      expect(reconstituted.actorId).toBe(original.actorId);
      expect(reconstituted.action).toBe(original.action);
      expect(reconstituted.hash).toBe(original.hash);
      expect(reconstituted.previousHash).toBe(original.previousHash);
      expect(reconstituted.verifyHash()).toBe(true);
    });
  });
});
