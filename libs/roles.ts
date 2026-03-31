export type Roles = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'VIEWER' | 'USER';

export const roles = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  VIEWER: 'VIEWER',
  USER: 'USER',
} as const;

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
