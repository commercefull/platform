/**
 * Tests for RBAC middleware.
 */

import { Request, Response} from 'express';
import { requirePermission, requireStoreAccess, buildContextFromRequest } from './middleware';

// Mock checkPermission to control results
jest.mock('./checkPermission', () => ({
  checkPermission: jest.fn(),
  setOrgPolicyCache: jest.fn(),
  clearOrgPolicyCache: jest.fn(),
}));

import { checkPermission } from './checkPermission';
import type { PermissionResult } from './types';

describe('RBAC middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      method: 'GET',
      xhr: true,
      headers: { accept: 'application/json' },
      user: {
        userId: 'user-1',
        id: 'user-1',
        role: 'MANAGER',
        type: 'organization',
        organizationId: 'org-1',
        storeId: 'store-1',
        permissions: [],
      } as never,
      params: {},
      body: {},
      query: {},
    };
    nextFn = jest.fn();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
    };
  });

  describe('requirePermission', () => {
    it('should call next() when permission is allowed', () => {
      (checkPermission as jest.Mock).mockReturnValue({ allowed: true } as PermissionResult);
      const middleware = requirePermission('product', 'create');
      middleware(mockReq as Request, mockRes as Response, nextFn);
      expect(nextFn).toHaveBeenCalled();
    });

    it('should return 403 when permission is denied', () => {
      (checkPermission as jest.Mock).mockReturnValue({ allowed: false, reason: 'No permission' } as PermissionResult);
      const middleware = requirePermission('product', 'delete');
      middleware(mockReq as Request, mockRes as Response, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(nextFn).not.toHaveBeenCalled();
    });

    it('should return 401 when no user', () => {
      mockReq.user = undefined;
      const middleware = requirePermission('product', 'create');
      middleware(mockReq as Request, mockRes as Response, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(nextFn).not.toHaveBeenCalled();
    });
  });

  describe('requireStoreAccess', () => {
    it('should allow when user has access to the store', () => {
      (checkPermission as jest.Mock).mockReturnValue({ allowed: true } as PermissionResult);
      mockReq.params = { storeId: 'store-1' };
      const middleware = requireStoreAccess('inventory', 'adjust');
      middleware(mockReq as Request, mockRes as Response, nextFn);
      expect(nextFn).toHaveBeenCalled();
    });

    it('should deny when user accesses different store', () => {
      (checkPermission as jest.Mock).mockReturnValue({ allowed: true } as PermissionResult);
      mockReq.params = { storeId: 'store-other' };
      const middleware = requireStoreAccess('inventory', 'adjust');
      middleware(mockReq as Request, mockRes as Response, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(nextFn).not.toHaveBeenCalled();
    });

    it('should allow different store when user has storeIds', () => {
      (checkPermission as jest.Mock).mockReturnValue({ allowed: true } as PermissionResult);
      mockReq.params = { storeId: 'store-2' };
      (mockReq.user as Express.User).storeIds = ['store-1', 'store-2'];
      const middleware = requireStoreAccess('inventory', 'adjust');
      middleware(mockReq as Request, mockRes as Response, nextFn);
      expect(nextFn).toHaveBeenCalled();
    });
  });

  describe('buildContextFromRequest', () => {
    it('should build context from request user', () => {
      const ctx = buildContextFromRequest(mockReq as Request);
      expect(ctx.userId).toBe('user-1');
      expect(ctx.role).toBe('MANAGER');
      expect(ctx.userType).toBe('organization');
      expect(ctx.organizationId).toBe('org-1');
      expect(ctx.storeId).toBe('store-1');
    });

    it('should extract resourceStoreId from params', () => {
      mockReq.params = { storeId: 'store-from-param' };
      const ctx = buildContextFromRequest(mockReq as Request);
      expect(ctx.resourceStoreId).toBe('store-from-param');
    });
  });
});
