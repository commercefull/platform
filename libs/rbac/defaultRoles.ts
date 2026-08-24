/**
 * Default Role Policies
 *
 * System-defined role policies that ship with the platform.
 * Organizations can override these with custom policies stored
 * in the rolePolicy table.
 */

import type { RolePolicy } from './types';

export const DEFAULT_ROLE_POLICIES: RolePolicy[] = [
  {
    roleName: 'ADMIN',
    description: 'Full system access — all resources, all actions',
    isSystem: true,
    isActive: true,
    permissions: [
      { resource: '*', action: '*' },
    ],
  },
  {
    roleName: 'MANAGER',
    description: 'Store manager — full access within assigned store',
    isSystem: true,
    isActive: true,
    permissions: [
      { resource: 'product', action: '*' },
      { resource: 'order', action: '*' },
      { resource: 'inventory', action: '*' },
      { resource: 'dispatch', action: '*' },
      { resource: 'customer', action: '*' },
      { resource: 'fulfillment', action: '*' },
      { resource: 'shipping', action: '*' },
      { resource: 'promotion', action: '*' },
      { resource: 'coupon', action: '*' },
      { resource: 'pricing', action: '*' },
      { resource: 'tax', action: '*' },
      { resource: 'loyalty', action: '*' },
      { resource: 'membership', action: '*' },
      { resource: 'subscription', action: '*' },
      { resource: 'content', action: '*' },
      { resource: 'media', action: '*' },
      { resource: 'notification', action: '*' },
      { resource: 'analytics', action: 'view' },
      { resource: 'reporting', action: 'view' },
      { resource: 'support', action: '*' },
      { resource: 'store', action: 'view' },
      { resource: 'store', action: 'update' },
      { resource: 'webhook', action: '*' },
      { resource: 'audit', action: 'view' },
      { resource: 'config', action: 'view' },
      { resource: 'config', action: 'update' },
      // Cannot manage users or delete stores
      { resource: 'user', action: 'view' },
      { resource: 'user', action: 'create' },
      { resource: 'user', action: 'update' },
      { resource: 'user', action: 'delete', deny: true },
      { resource: 'store', action: 'delete', deny: true },
      { resource: 'store', action: 'create', deny: true },
      { resource: 'organization', action: '*', deny: true },
    ],
  },
  {
    roleName: 'CASHIER',
    description: 'POS cashier — orders, payments, and basic product lookup',
    isSystem: true,
    isActive: true,
    permissions: [
      { resource: 'order', action: 'view' },
      { resource: 'order', action: 'create' },
      { resource: 'order', action: 'update' },
      { resource: 'product', action: 'view' },
      { resource: 'customer', action: 'view' },
      { resource: 'customer', action: 'create' },
      { resource: 'customer', action: 'update' },
      { resource: 'payment', action: 'view' },
      { resource: 'payment', action: 'create' },
      { resource: 'payment', action: 'refund' },
      { resource: 'inventory', action: 'view' },
      { resource: 'promotion', action: 'view' },
      { resource: 'coupon', action: 'view' },
      { resource: 'loyalty', action: 'view' },
      { resource: 'membership', action: 'view' },
      { resource: 'support', action: 'view' },
      { resource: 'support', action: 'create' },
    ],
  },
  {
    roleName: 'VIEWER',
    description: 'Read-only access to all resources',
    isSystem: true,
    isActive: true,
    permissions: [
      { resource: '*', action: 'view' },
      { resource: '*', action: 'export' },
    ],
  },
  {
    roleName: 'SUPPORT',
    description: 'Customer support — orders, customers, and support tickets',
    isSystem: true,
    isActive: true,
    permissions: [
      { resource: 'order', action: 'view' },
      { resource: 'order', action: 'update' },
      { resource: 'customer', action: 'view' },
      { resource: 'customer', action: 'update' },
      { resource: 'support', action: '*' },
      { resource: 'payment', action: 'view' },
      { resource: 'payment', action: 'refund' },
      { resource: 'product', action: 'view' },
      { resource: 'promotion', action: 'view' },
      { resource: 'coupon', action: 'view' },
      { resource: 'loyalty', action: 'view' },
      { resource: 'membership', action: 'view' },
      { resource: 'notification', action: 'view' },
    ],
  },
  {
    roleName: 'OPERATIONS',
    description: 'Operations — inventory, fulfillment, and shipping',
    isSystem: true,
    isActive: true,
    permissions: [
      { resource: 'order', action: 'view' },
      { resource: 'order', action: 'update' },
      { resource: 'inventory', action: '*' },
      { resource: 'dispatch', action: '*' },
      { resource: 'fulfillment', action: '*' },
      { resource: 'shipping', action: '*' },
      { resource: 'warehouse', action: '*' },
      { resource: 'supplier', action: 'view' },
      { resource: 'supplier', action: 'create' },
      { resource: 'supplier', action: 'update' },
      { resource: 'product', action: 'view' },
      { resource: 'product', action: 'update' },
      { resource: 'reporting', action: 'view' },
    ],
  },
];

/**
 * Get a default system role policy by role name.
 */
export function getDefaultRolePolicy(roleName: string): RolePolicy | undefined {
  return DEFAULT_ROLE_POLICIES.find(p => p.roleName === roleName);
}

/**
 * Get all default system role policies.
 */
export function getAllDefaultRolePolicies(): RolePolicy[] {
  return DEFAULT_ROLE_POLICIES;
}
