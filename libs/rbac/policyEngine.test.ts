/**
 * Tests for the RBAC policy engine.
 */

import { evaluatePolicy, evaluatePolicies, checkLegacyPermission } from './policyEngine';
import type { RolePolicy, PermissionContext} from './types';

describe('policyEngine', () => {
  describe('evaluatePolicy', () => {
    const policy: RolePolicy = {
      roleName: 'TEST',
      permissions: [
        { resource: 'product', action: 'view' },
        { resource: 'product', action: 'create' },
        { resource: 'order', action: '*' },
        { resource: 'inventory', action: 'adjust', deny: true },
      ],
    };

    const ctx: PermissionContext = {
      userId: 'user-1',
      role: 'TEST',
      userType: 'organization',
    };

    it('should allow when rule matches', () => {
      const result = evaluatePolicy(policy, 'product', 'view', ctx);
      expect(result.allowed).toBe(true);
      expect(result.matchedRule?.resource).toBe('product');
      expect(result.matchedRule?.action).toBe('view');
    });

    it('should allow wildcard action', () => {
      const result = evaluatePolicy(policy, 'order', 'view', ctx);
      expect(result.allowed).toBe(true);
    });

    it('should allow wildcard action for any action', () => {
      const result = evaluatePolicy(policy, 'order', 'create', ctx);
      expect(result.allowed).toBe(true);
    });

    it('should deny when deny rule matches', () => {
      const result = evaluatePolicy(policy, 'inventory', 'adjust', ctx);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Denied');
    });

    it('should deny when no rule matches', () => {
      const result = evaluatePolicy(policy, 'customer', 'delete', ctx);
      expect(result.allowed).toBe(false);
    });

    it('should deny takes precedence over allow', () => {
      const mixedPolicy: RolePolicy = {
        roleName: 'MIXED',
        permissions: [
          { resource: 'product', action: '*' },
          { resource: 'product', action: 'delete', deny: true },
        ],
      };
      const result = evaluatePolicy(mixedPolicy, 'product', 'delete', ctx);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Denied');
    });

    it('should allow non-denied actions even when deny rule exists for same resource', () => {
      const mixedPolicy: RolePolicy = {
        roleName: 'MIXED',
        permissions: [
          { resource: 'product', action: '*' },
          { resource: 'product', action: 'delete', deny: true },
        ],
      };
      const result = evaluatePolicy(mixedPolicy, 'product', 'view', ctx);
      expect(result.allowed).toBe(true);
    });
  });

  describe('evaluatePolicies', () => {
    const systemPolicy: RolePolicy = {
      roleName: 'MANAGER',
      isSystem: true,
      permissions: [
        { resource: 'product', action: '*' },
        { resource: 'order', action: '*' },
      ],
    };

    const orgPolicy: RolePolicy = {
      roleName: 'MANAGER',
      isSystem: false,
      permissions: [
        { resource: 'product', action: '*' },
        { resource: 'product', action: 'delete', deny: true },
      ],
    };

    const ctx: PermissionContext = {
      userId: 'user-1',
      role: 'MANAGER',
      userType: 'organization',
      organizationId: 'org-1',
    };

    it('should check org-specific policy first', () => {
      const result = evaluatePolicies([systemPolicy, orgPolicy], 'product', 'delete', ctx);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Denied');
    });

    it('should allow when org policy allows', () => {
      const result = evaluatePolicies([systemPolicy, orgPolicy], 'product', 'view', ctx);
      expect(result.allowed).toBe(true);
    });

    it('should fall through to system policy if org policy has no match', () => {
      const result = evaluatePolicies([systemPolicy, orgPolicy], 'order', 'view', ctx);
      expect(result.allowed).toBe(true);
    });

    it('should deny when no policies match', () => {
      const result = evaluatePolicies([systemPolicy, orgPolicy], 'customer', 'delete', ctx);
      expect(result.allowed).toBe(false);
    });

    it('should skip inactive policies', () => {
      const inactivePolicy: RolePolicy = {
        roleName: 'INACTIVE',
        isSystem: true,
        isActive: false,
        permissions: [{ resource: '*', action: '*' }],
      };
      const result = evaluatePolicies([inactivePolicy], 'product', 'view', ctx);
      expect(result.allowed).toBe(false);
    });
  });

  describe('checkLegacyPermission', () => {
    it('should allow wildcard', () => {
      expect(checkLegacyPermission(['*'], 'order.create')).toBe(true);
    });

    it('should allow exact match', () => {
      expect(checkLegacyPermission(['order.create'], 'order.create')).toBe(true);
    });

    it('should allow wildcard resource', () => {
      expect(checkLegacyPermission(['order.*'], 'order.create')).toBe(true);
    });

    it('should deny when no match', () => {
      expect(checkLegacyPermission(['order.view'], 'order.create')).toBe(false);
    });

    it('should support colon format cross-match', () => {
      expect(checkLegacyPermission(['order:create'], 'order.create')).toBe(true);
    });

    it('should support empty permissions', () => {
      expect(checkLegacyPermission([], 'order.create')).toBe(false);
    });

    it('should support undefined permissions', () => {
      expect(checkLegacyPermission(undefined, 'order.create')).toBe(false);
    });
  });
});
