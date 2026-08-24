import { GdprDataRequest } from './GdprDataRequest';
import { GdprValidationError } from '../errors/GdprErrors';

describe('GdprDataRequest', () => {
  it('should create a data request (happy path)', () => {
    const req = GdprDataRequest.create({
      gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'export',
    });
    expect(req.gdprDataRequestId).toBe('r1');
    expect(req.status).toBe('pending');
    expect(req.identityVerified).toBe(false);
    expect(req.canProcess()).toBe(false);
    expect(req.deadlineAt).toBeDefined();
  });

  it('should verify identity and allow processing', () => {
    const req = GdprDataRequest.create({ gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'export' });
    req.verifyIdentity('email');
    expect(req.identityVerified).toBe(true);
    expect(req.verificationMethod).toBe('email');
    expect(req.canProcess()).toBe(true);
  });

  it('should start processing', () => {
    const req = GdprDataRequest.create({ gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'export' });
    req.verifyIdentity('email');
    req.startProcessing();
    expect(req.status).toBe('processing');
  });

  it('should throw on start processing non-pending', () => {
    const req = GdprDataRequest.create({ gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'export' });
    req.verifyIdentity('email');
    req.startProcessing();
    expect(() => req.startProcessing()).toThrow(GdprValidationError);
  });

  it('should complete with download for export requests', () => {
    const req = GdprDataRequest.create({ gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'export' });
    req.verifyIdentity('email');
    req.startProcessing();
    req.completeWithDownload('https://download.url', 'json', 'admin1');
    expect(req.status).toBe('completed');
    expect(req.downloadUrl).toBe('https://download.url');
    expect(req.downloadFormat).toBe('json');
    expect(req.downloadExpiresAt).toBeDefined();
    expect(req.processedBy).toBe('admin1');
  });

  it('should complete for deletion requests', () => {
    const req = GdprDataRequest.create({ gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'deletion' });
    req.verifyIdentity('email');
    req.startProcessing();
    req.complete('admin1', 'Data deleted');
    expect(req.status).toBe('completed');
    expect(req.processedBy).toBe('admin1');
    expect(req.adminNotes).toBe('Data deleted');
  });

  it('should throw on complete non-processing', () => {
    const req = GdprDataRequest.create({ gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'export' });
    expect(() => req.complete('admin1')).toThrow(GdprValidationError);
  });

  it('should reject pending request', () => {
    const req = GdprDataRequest.create({ gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'export' });
    req.reject('admin1', 'Invalid identity');
    expect(req.status).toBe('rejected');
    expect(req.rejectionReason).toBe('Invalid identity');
  });

  it('should reject processing request', () => {
    const req = GdprDataRequest.create({ gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'export' });
    req.verifyIdentity('email');
    req.startProcessing();
    req.reject('admin1', 'Cannot verify');
    expect(req.status).toBe('rejected');
  });

  it('should throw on reject completed request', () => {
    const req = GdprDataRequest.create({ gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'export' });
    req.verifyIdentity('email');
    req.startProcessing();
    req.complete('admin1');
    expect(() => req.reject('admin1', 'too late')).toThrow(GdprValidationError);
  });

  it('should cancel pending request', () => {
    const req = GdprDataRequest.create({ gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'export' });
    req.cancel();
    expect(req.status).toBe('cancelled');
  });

  it('should throw on cancel completed request', () => {
    const req = GdprDataRequest.create({ gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'export' });
    req.verifyIdentity('email');
    req.startProcessing();
    req.complete('admin1');
    expect(() => req.cancel()).toThrow(GdprValidationError);
  });

  it('should request extension', () => {
    const req = GdprDataRequest.create({ gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'export' });
    req.requestExtension('Complex request');
    expect(req.extensionRequested).toBe(true);
    expect(req.extensionReason).toBe('Complex request');
    expect(req.extendedDeadlineAt).toBeDefined();
  });

  it('should throw on double extension request', () => {
    const req = GdprDataRequest.create({ gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'export' });
    req.requestExtension('Complex');
    expect(() => req.requestExtension('Another')).toThrow(GdprValidationError);
  });

  it('should detect overdue request', () => {
    const req = GdprDataRequest.reconstitute({
      gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'export', status: 'pending',
      identityVerified: false, deadlineAt: new Date(Date.now() - 86400000), extensionRequested: false,
      createdAt: new Date(), updatedAt: new Date(),
    });
    expect(req.isOverdue()).toBe(true);
  });

  it('should not be overdue for completed requests', () => {
    const req = GdprDataRequest.reconstitute({
      gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'export', status: 'completed',
      identityVerified: true, deadlineAt: new Date(Date.now() - 86400000), extensionRequested: false,
      createdAt: new Date(), updatedAt: new Date(),
    });
    expect(req.isOverdue()).toBe(false);
  });

  it('should use extended deadline for overdue check', () => {
    const req = GdprDataRequest.reconstitute({
      gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'export', status: 'pending',
      identityVerified: false, deadlineAt: new Date(Date.now() - 86400000),
      extensionRequested: true, extendedDeadlineAt: new Date(Date.now() + 86400000),
      createdAt: new Date(), updatedAt: new Date(),
    });
    expect(req.isOverdue()).toBe(false);
  });

  it('should serialize to JSON', () => {
    const req = GdprDataRequest.create({ gdprDataRequestId: 'r1', customerId: 'c1', requestType: 'access', reason: 'Need data' });
    const json = req.toJSON();
    expect(json.gdprDataRequestId).toBe('r1');
    expect(json.isOverdue).toBeDefined();
  });
});
