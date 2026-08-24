/**
 * Tests for checkPermission and assertPermission.
 */

import { checkPermission, assertPermission, checkFieldPermission, getAllowedFields } from './checkPermission';
import { clearOrgPolicyCache } from './checkPermission';
import type { PermissionContext } from './types';
import { ForbiddenError, UnauthorizedError } from '../errors';

describe('checkPermission', () => {
  afterEach(() => {
    clearOrgPolicyCache();
  });

  describe('with default role policies', () => {
    it('should allow ADMIN full access', () => {
      const ctx: PermissionContext = {
        userId: 'admin-1',
        role: 'ADMIN',
        userType: 'admin',
      };
      const result = checkPermission(ctx, 'product', 'create');
      expect(result.allowed).toBe(true);
    });

    it('should allow MANAGER to create products', () => {
      const ctx: PermissionContext = {
        userId: 'mgr-1',
        role: 'MANAGER',
        userType: 'organization',
        organizationId: 'org-1',
      };
      const result = checkPermission(ctx, 'product', 'create');
      expect(result.allowed).toBe(true);
    });

    it('should deny MANAGER from deleting stores', () => {
      const ctx: PermissionContext = {
        userId: 'mgr-1',
        role: 'MANAGER',
        userType: 'organization',
      };
      const result = checkPermission(ctx, 'store', 'delete');
      expect(result.allowed).toBe(false);
    });

    it('should allow CASHIER to view products', () => {
      const ctx: PermissionContext = {
        userId: 'cash-1',
        role: 'CASHIER',
        userType: 'organization',
      };
      const result = checkPermission(ctx, 'product', 'view');
      expect(result.allowed).toBe(true);
    });

    it('should deny CASHIER from creating products', () => {
      const ctx: PermissionContext = {
        userId: 'cash-1',
        role: 'CASHIER',
        userType: 'organization',
      };
      const result = checkPermission(ctx, 'product', 'create');
      expect(result.allowed).toBe(false);
    });

    it('should allow VIEWER to view anything', () => {
      const ctx: PermissionContext = {
        userId: 'viewer-1',
        role: 'VIEWER',
        userType: 'organization',
      };
      const result = checkPermission(ctx, 'product', 'view');
      expect(result.allowed).toBe(true);
    });

    it('should deny VIEWER from creating anything', () => {
      const ctx: PermissionContext = {
        userId: 'viewer-1',
        role: 'VIEWER',
        userType: 'organization',
      };
      const result = checkPermission(ctx, 'product', 'create');
      expect(result.allowed).toBe(false);
    });
  });

  describe('with legacy flat permissions fallback', () => {
    it('should allow when legacy permission matches', () => {
      const ctx: PermissionContext = {
        userId: 'user-1',
        role: 'CUSTOM_ROLE',
        userType: 'organization',
        permissions: ['order.refund'],
      };
      const result = checkPermission(ctx, 'order', 'refund');
      expect(result.allowed).toBe(true);
    });

    it('should allow with wildcard legacy permission', () => {
      const ctx: PermissionContext = {
        userId: 'user-1',
        role: 'CUSTOM_ROLE',
        userType: 'organization',
        permissions: ['*'],
      };
      const result = checkPermission(ctx, 'order', 'refund');
      expect(result.allowed).toBe(true);
    });

    it('should allow with manage permission covering action', () => {
      const ctx: PermissionContext = {
        userId: 'user-1',
        role: 'CUSTOM_ROLE',
        userType: 'organization',
        permissions: ['order.manage'],
      };
      const result = checkPermission(ctx, 'order', 'refund');
      expect(result.allowed).toBe(true);
    });

    it('should deny when legacy permission does not match', () => {
      const ctx: PermissionContext = {
        userId: 'user-1',
        role: 'CUSTOM_ROLE',
        userType: 'organization',
        permissions: ['order.view'],
      };
      const result = checkPermission(ctx, 'order', 'refund');
      expect(result.allowed).toBe(false);
    });
  });

  describe('assertPermission', () => {
    it('should throw UnauthorizedError when no userId', () => {
      expect(() =>
        assertPermission({ userId: '', role: 'ADMIN', userType: 'system' }, 'product', 'create'),
      ).toThrow(UnauthorizedError);
    });

    it('should throw ForbiddenError when not allowed', () => {
      expect(() =>
        assertPermission(
          { userId: 'user-1', role: 'CASHIER', userType: 'organization' },
          'product',
          'create',
        ),
      ).toThrow(ForbiddenError);
    });

    it('should not throw when allowed', () => {
      expect(() =>
        assertPermission(
          { userId: 'admin-1', role: 'ADMIN', userType: 'admin' },
          'product',
          'create',
        ),
      ).not.toThrow();
    });
  });

  describe('checkFieldPermission', () => {
    it('should allow all fields when fields is ["*"]', () => {
      const ctx: PermissionContext = {
        userId: 'admin-1',
        role: 'ADMIN',
        userType: 'admin',
      };
      expect(checkFieldPermission(ctx, 'product', 'update', 'price')).toBe(true);
    });
  });

  describe('getAllowedFields', () => {
    it('should return ["*"] for ADMIN', () => {
      const ctx: PermissionContext = {
        userId: 'admin-1',
        role: 'ADMIN',
        userType: 'admin',
      };
      expect(getAllowedFields(ctx, 'product', 'create')).toEqual(['*']);
    });

    it('should return [] when denied', () => {
      const ctx: PermissionContext = {
        userId: 'cash-1',
        role: 'CASHIER',
        userType: 'organization',
      };
      expect(getAllowedFields(ctx, 'product', 'create')).toEqual([]);
    });
  });
});
