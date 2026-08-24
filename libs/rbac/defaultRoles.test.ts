/**
 * Tests for default role policies.
 */

import { DEFAULT_ROLE_POLICIES, getDefaultRolePolicy, getAllDefaultRolePolicies } from './defaultRoles';

describe('defaultRoles', () => {
  describe('DEFAULT_ROLE_POLICIES', () => {
    it('should include all expected system roles', () => {
      const roleNames = DEFAULT_ROLE_POLICIES.map(p => p.roleName);
      expect(roleNames).toContain('ADMIN');
      expect(roleNames).toContain('MANAGER');
      expect(roleNames).toContain('CASHIER');
      expect(roleNames).toContain('VIEWER');
      expect(roleNames).toContain('SUPPORT');
      expect(roleNames).toContain('OPERATIONS');
    });

    it('should have all system policies marked as system', () => {
      for (const policy of DEFAULT_ROLE_POLICIES) {
        expect(policy.isSystem).toBe(true);
        expect(policy.isActive).toBe(true);
      }
    });

    it('should have ADMIN with wildcard access', () => {
      const admin = getDefaultRolePolicy('ADMIN');
      expect(admin).toBeDefined();
      expect(admin!.permissions).toHaveLength(1);
      expect(admin!.permissions[0].resource).toBe('*');
      expect(admin!.permissions[0].action).toBe('*');
    });

    it('should have MANAGER with deny rules for store.delete and store.create', () => {
      const manager = getDefaultRolePolicy('MANAGER');
      expect(manager).toBeDefined();
      const denyRules = manager!.permissions.filter(r => r.deny);
      expect(denyRules.length).toBeGreaterThan(0);
      expect(denyRules.some(r => r.resource === 'store' && r.action === 'delete')).toBe(true);
      expect(denyRules.some(r => r.resource === 'store' && r.action === 'create')).toBe(true);
    });

    it('should have CASHIER with limited permissions', () => {
      const cashier = getDefaultRolePolicy('CASHIER');
      expect(cashier).toBeDefined();
      const resources = cashier!.permissions.map(r => r.resource);
      expect(resources).toContain('order');
      expect(resources).toContain('product');
      expect(resources).toContain('payment');
      expect(resources).not.toContain('store');
    });

    it('should have VIEWER with view-only access', () => {
      const viewer = getDefaultRolePolicy('VIEWER');
      expect(viewer).toBeDefined();
      for (const rule of viewer!.permissions) {
        expect(rule.action === 'view' || rule.action === 'export').toBe(true);
      }
    });
  });

  describe('getDefaultRolePolicy', () => {
    it('should return the policy for a known role', () => {
      const policy = getDefaultRolePolicy('ADMIN');
      expect(policy).toBeDefined();
      expect(policy!.roleName).toBe('ADMIN');
    });

    it('should return undefined for unknown role', () => {
      const policy = getDefaultRolePolicy('NONEXISTENT');
      expect(policy).toBeUndefined();
    });
  });

  describe('getAllDefaultRolePolicies', () => {
    it('should return all policies', () => {
      const policies = getAllDefaultRolePolicies();
      expect(policies.length).toBe(DEFAULT_ROLE_POLICIES.length);
    });
  });
});
