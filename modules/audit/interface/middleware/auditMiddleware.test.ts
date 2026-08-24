/**
 * Tests for audit middleware.
 *
 * Verifies that mutating requests trigger audit log entries
 * and that sensitive fields are redacted.
 */

import { Request, Response } from 'express';

// Mock the wired use case
jest.mock('../../application/useCases/wired', () => ({
  recordAuditLogUseCase: {
    execute: jest.fn().mockResolvedValue({}),
  },
}));

import { auditMiddleware, recordAudit } from './auditMiddleware';
import { recordAuditLogUseCase } from '../../application/useCases/wired';

describe('auditMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      method: 'POST',
      path: '/business/products',
      route: { path: '/business/products' } as never,
      params: {},
      body: { name: 'Widget', price: 10 },
      ip: '192.168.1.1',
      socket: { remoteAddress: '192.168.1.1' } as never,
      headers: { 'user-agent': 'Mozilla/5.0' },
      user: {
        userId: 'user-1',
        id: 'user-1',
        email: 'admin@test.com',
        name: 'Admin',
        type: 'organization',
        organizationId: 'org-1',
        storeId: 'store-1',
        permissions: ['*'],
        role: 'ADMIN',
      } as never,
    };

    const sendFn = jest.fn(function (this: Response, _body: unknown) {
      return this;
    });
    mockRes = {
      statusCode: 200,
      send: sendFn,
    };
    nextFn = jest.fn();
  });

  it('should call next() for non-mutating requests', () => {
    mockReq.method = 'GET';
    auditMiddleware(mockReq as Request, mockRes as Response, nextFn);
    expect(nextFn).toHaveBeenCalled();
  });

  it('should call next() for unrecognized paths', () => {
    (mockReq as { path: string }).path = '/health';
    mockReq.route = undefined;
    auditMiddleware(mockReq as Request, mockRes as Response, nextFn);
    expect(nextFn).toHaveBeenCalled();
  });

  it('should record audit entry on successful POST', async () => {
    auditMiddleware(mockReq as Request, mockRes as Response, nextFn);
    expect(nextFn).toHaveBeenCalled();

    // Simulate response
    (mockRes.send as jest.Mock).call(mockRes as Response, JSON.stringify({ name: 'Widget', id: 'prod-1' }));

    // Wait for fire-and-forget
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(recordAuditLogUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'user-1',
        actorType: 'organization',
        action: expect.any(String),
        resourceType: 'product',
      }),
    );
  });

  it('should NOT record audit entry on error responses', async () => {
    mockRes.statusCode = 500;
    auditMiddleware(mockReq as Request, mockRes as Response, nextFn);

    (mockRes.send as jest.Mock).call(mockRes as Response, 'Internal Error');

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(recordAuditLogUseCase.execute).not.toHaveBeenCalled();
  });

  it('should redact sensitive fields from body', async () => {
    mockReq.body = { name: 'Widget', password: 'secret123', apiKey: 'key-abc' };
    auditMiddleware(mockReq as Request, mockRes as Response, nextFn);

    (mockRes.send as jest.Mock).call(mockRes as Response, '{}');

    await new Promise(resolve => setTimeout(resolve, 10));

    const callArg = (recordAuditLogUseCase.execute as jest.Mock).mock.calls[0][0];
    expect(callArg.metadata.body.password).toBe('[REDACTED]');
    expect(callArg.metadata.body.apiKey).toBe('[REDACTED]');
    expect(callArg.metadata.body.name).toBe('Widget');
  });
});

describe('recordAudit helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call the use case with provided data', async () => {
    await recordAudit(
      'order.refund',
      'order',
      { id: 'user-1', type: 'admin', email: 'admin@test.com', organizationId: 'org-1' },
      { id: 'ord-1', name: 'ORD-100' },
      { amount: 50 },
    );

    expect(recordAuditLogUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'order.refund',
        resourceType: 'order',
        actorId: 'user-1',
        actorType: 'admin',
        resourceId: 'ord-1',
        resourceName: 'ORD-100',
        organizationId: 'org-1',
        metadata: { amount: 50 },
      }),
    );
  });
});
