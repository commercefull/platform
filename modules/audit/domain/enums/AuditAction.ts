/**
 * Audit Action Types
 *
 * Canonical action identifiers for the audit log.
 * Format: <resource>.<verb>
 */

export type AuditAction =
  | 'product.create'
  | 'product.update'
  | 'product.delete'
  | 'product.publish'
  | 'product.unpublish'
  | 'order.create'
  | 'order.update'
  | 'order.cancel'
  | 'order.refund'
  | 'order.status_change'
  | 'inventory.adjust'
  | 'inventory.reserve'
  | 'inventory.release'
  | 'inventory.restock'
  | 'dispatch.create'
  | 'dispatch.approve'
  | 'dispatch.ship'
  | 'dispatch.receive'
  | 'dispatch.cancel'
  | 'customer.create'
  | 'customer.update'
  | 'customer.delete'
  | 'customer.anonymize'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.assign_store'
  | 'user.unassign_store'
  | 'config.update'
  | 'config.flag_toggle'
  | 'payment.refund'
  | 'payment.void'
  | 'data.export'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.password_reset'
  | 'auth.role_change'
  | 'store.create'
  | 'store.update'
  | 'store.delete'
  | 'webhook.create'
  | 'webhook.update'
  | 'webhook.delete'
  | 'system.migration'
  | string; // allow arbitrary actions for extensibility

export type ActorType = 'admin' | 'organization' | 'customer' | 'system';

export type ResourceType =
  | 'product'
  | 'order'
  | 'inventory'
  | 'dispatch'
  | 'customer'
  | 'user'
  | 'config'
  | 'payment'
  | 'store'
  | 'webhook'
  | 'system'
  | string;
