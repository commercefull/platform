import { CcpaDataSubjectRequest, CCPA_DEADLINE_DAYS } from './CcpaDataSubjectRequest';
import { ComplianceValidationError, DsrStatusError } from '../errors/ComplianceErrors';

describe('CcpaDataSubjectRequest Entity', () => {
  const baseParams = {
    ccpaDsrId: 'dsr-1',
    customerId: 'cust-1',
    organizationId: 'org-1',
    requestType: 'know' as const,
    source: 'web' as const,
  };

  describe('create', () => {
    it('should create with 45-day deadline', () => {
      const dsr = CcpaDataSubjectRequest.create(baseParams);
      expect(dsr.status).toBe('pending');
      expect(dsr.identityVerified).toBe(false);
      const diff = dsr.deadlineAt.getTime() - dsr.requestedAt.getTime();
      expect(Math.round(diff / (1000 * 60 * 60 * 24))).toBe(CCPA_DEADLINE_DAYS);
    });

    it('should store optional fields', () => {
      const dsr = CcpaDataSubjectRequest.create({
        ...baseParams,
        reason: 'Want to know what data you have',
        authorizedAgent: 'agent-1',
        dataCategoriesRequested: ['demographic', 'commercial'],
        ipAddress: '127.0.0.1',
      });
      expect(dsr.reason).toBe('Want to know what data you have');
      expect(dsr.authorizedAgent).toBe('agent-1');
      expect(dsr.dataCategoriesRequested).toEqual(['demographic', 'commercial']);
    });
  });

  describe('reconstitute', () => {
    it('should restore from persistence', () => {
      const now = new Date();
      const dsr = CcpaDataSubjectRequest.reconstitute({
        ccpaDsrId: 'dsr-1',
        customerId: 'cust-1',
        organizationId: 'org-1',
        requestType: 'optOutSale',
        status: 'completed',
        source: 'email',
        identityVerified: true,
        verificationMethod: 'email',
        verifiedAt: now,
        requestedAt: now,
        deadlineAt: new Date(now.getTime() + 45 * 86400000),
        extensionRequested: false,
        completedAt: now,
        processedBy: 'admin-1',
        createdAt: now,
        updatedAt: now,
      });
      expect(dsr.status).toBe('completed');
      expect(dsr.requestType).toBe('optOutSale');
    });
  });

  describe('isOverdue', () => {
    it('should return true when past deadline and not completed', () => {
      const dsr = CcpaDataSubjectRequest.reconstitute({
        ccpaDsrId: 'dsr-1',
        customerId: 'cust-1',
        organizationId: 'org-1',
        requestType: 'delete',
        status: 'pending',
        source: 'web',
        identityVerified: false,
        requestedAt: new Date(Date.now() - 50 * 86400000),
        deadlineAt: new Date(Date.now() - 5 * 86400000),
        extensionRequested: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(dsr.isOverdue()).toBe(true);
    });

    it('should return false when completed', () => {
      const dsr = CcpaDataSubjectRequest.reconstitute({
        ccpaDsrId: 'dsr-1',
        customerId: 'cust-1',
        organizationId: 'org-1',
        requestType: 'delete',
        status: 'completed',
        source: 'web',
        identityVerified: true,
        requestedAt: new Date(Date.now() - 50 * 86400000),
        deadlineAt: new Date(Date.now() - 5 * 86400000),
        extensionRequested: false,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(dsr.isOverdue()).toBe(false);
    });
  });

  describe('daysUntilDeadline', () => {
    it('should return positive days when future', () => {
      const dsr = CcpaDataSubjectRequest.create(baseParams);
      const days = dsr.daysUntilDeadline();
      expect(days).toBeGreaterThan(40);
      expect(days).toBeLessThanOrEqual(45);
    });
  });

  describe('verifyIdentity', () => {
    it('should transition pending → verified', () => {
      const dsr = CcpaDataSubjectRequest.create(baseParams);
      dsr.verifyIdentity('email');
      expect(dsr.status).toBe('verified');
      expect(dsr.identityVerified).toBe(true);
      expect(dsr.verificationMethod).toBe('email');
    });

    it('should throw when not pending', () => {
      const dsr = CcpaDataSubjectRequest.create(baseParams);
      dsr.verifyIdentity('email');
      expect(() => dsr.verifyIdentity('email')).toThrow(DsrStatusError);
    });
  });

  describe('startProcessing', () => {
    it('should transition verified → processing', () => {
      const dsr = CcpaDataSubjectRequest.create(baseParams);
      dsr.verifyIdentity('email');
      dsr.startProcessing();
      expect(dsr.status).toBe('processing');
    });

    it('should throw when not verified', () => {
      const dsr = CcpaDataSubjectRequest.create(baseParams);
      expect(() => dsr.startProcessing()).toThrow(DsrStatusError);
    });
  });

  describe('complete / completeWithDownload', () => {
    it('should complete with download for know requests', () => {
      const dsr = CcpaDataSubjectRequest.create(baseParams);
      dsr.verifyIdentity('email');
      dsr.startProcessing();
      dsr.completeWithDownload('https://example.com/export', 'admin-1');
      expect(dsr.status).toBe('completed');
      expect(dsr.downloadUrl).toBe('https://example.com/export');
      expect(dsr.processedBy).toBe('admin-1');
    });

    it('should complete without download for delete requests', () => {
      const dsr = CcpaDataSubjectRequest.create({ ...baseParams, requestType: 'delete' });
      dsr.verifyIdentity('email');
      dsr.startProcessing();
      dsr.complete('admin-1', 'Data deleted');
      expect(dsr.status).toBe('completed');
      expect(dsr.adminNotes).toBe('Data deleted');
    });
  });

  describe('reject', () => {
    it('should reject from pending', () => {
      const dsr = CcpaDataSubjectRequest.create(baseParams);
      dsr.reject('admin-1', 'Could not verify identity');
      expect(dsr.status).toBe('rejected');
      expect(dsr.rejectionReason).toBe('Could not verify identity');
    });
  });

  describe('cancel', () => {
    it('should cancel from pending', () => {
      const dsr = CcpaDataSubjectRequest.create(baseParams);
      dsr.cancel();
      expect(dsr.status).toBe('cancelled');
    });
  });

  describe('requestExtension', () => {
    it('should extend deadline by 45 days', () => {
      const dsr = CcpaDataSubjectRequest.create(baseParams);
      const originalDeadline = dsr.deadlineAt;
      dsr.requestExtension('Complex request requiring more time');
      expect(dsr.extensionRequested).toBe(true);
      expect(dsr.extendedDeadlineAt).toBeDefined();
      const diff = dsr.extendedDeadlineAt!.getTime() - originalDeadline.getTime();
      expect(Math.round(diff / (1000 * 60 * 60 * 24))).toBe(45);
    });

    it('should throw if extension already requested', () => {
      const dsr = CcpaDataSubjectRequest.create(baseParams);
      dsr.requestExtension('Need more time');
      expect(() => dsr.requestExtension('More time again')).toThrow(ComplianceValidationError);
    });
  });

  describe('type checkers', () => {
    it('should identify opt-out requests', () => {
      const dsr = CcpaDataSubjectRequest.create({ ...baseParams, requestType: 'optOutSale' });
      expect(dsr.isOptOutRequest()).toBe(true);
    });

    it('should identify delete requests', () => {
      const dsr = CcpaDataSubjectRequest.create({ ...baseParams, requestType: 'delete' });
      expect(dsr.isDeleteRequest()).toBe(true);
    });

    it('should identify know requests', () => {
      const dsr = CcpaDataSubjectRequest.create(baseParams);
      expect(dsr.isKnowRequest()).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should include computed fields', () => {
      const dsr = CcpaDataSubjectRequest.create(baseParams);
      const json = dsr.toJSON();
      expect(json.isOverdue).toBe(false);
      expect(json.daysUntilDeadline).toBeGreaterThan(0);
    });
  });
});
