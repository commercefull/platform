import type { Resource, Action } from './rbac/types';

export type Roles = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'VIEWER' | 'USER';

export const roles = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  VIEWER: 'VIEWER',
  USER: 'USER',
} as const;

/**
 * Legacy permission constants — kept for backward compatibility.
 * New code should use the RBAC policy engine (libs/rbac) with
 * resource + action pairs instead of flat string permissions.
 *
 * @deprecated Use libs/rbac checkPermission() / requirePermission() instead.
 */
export const STORE_PERMISSIONS = {
  ORDER_CREATE: 'order.create',
  ORDER_VIEW: 'order.view',
  ORDER_MANAGE: 'order.manage',
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_ADJUST: 'inventory.adjust',
  DISPATCH_CREATE: 'dispatch.create',
  DISPATCH_APPROVE: 'dispatch.approve',
  DISPATCH_RECEIVE: 'dispatch.receive',
  USER_MANAGE: 'user.manage',
  STORE_VIEW: 'store.view',
  STORE_MANAGE: 'store.manage',
  ANALYTICS_VIEW: 'analytics.view',
  ALL: '*',
} as const;

// Re-export RBAC types for convenience
export type { Resource, Action };
