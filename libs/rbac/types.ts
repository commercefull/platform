/**
 * RBAC Types
 *
 * Core type definitions for the policy-based RBAC engine.
 * Supports resource + action + field-level scoping with
 * per-organization role definitions.
 */

/** Resource identifier — maps to a domain module/entity. */
export type Resource =
  | '*'
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
  | 'analytics'
  | 'reporting'
  | 'fulfillment'
  | 'shipping'
  | 'promotion'
  | 'coupon'
  | 'tax'
  | 'pricing'
  | 'loyalty'
  | 'membership'
  | 'subscription'
  | 'content'
  | 'media'
  | 'notification'
  | 'gdpr'
  | 'support'
  | 'supplier'
  | 'warehouse'
  | 'basket'
  | 'checkout'
  | 'organization'
  | 'audit'
  | 'localization'
  | string;

/** Action on a resource. */
export type Action =
  | '*'
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'manage'
  | 'export'
  | 'import'
  | 'approve'
  | 'refund'
  | 'adjust'
  | 'publish'
  | string;

/**
 * A single permission rule within a role policy.
 */
export interface PermissionRule {
  resource: Resource;
  action: Action;
  /** Field-level scoping: ['*'] for all, or specific fields like ['price', 'stock']. */
  fields?: string[];
  /** Deny rule — if true, this permission is explicitly forbidden (overrides allows). */
  deny?: boolean;
  /**
   * Runtime condition — evaluated against the PermissionContext.
   * e.g. { storeId: '$user.storeId' } means the user can only access
   * resources within their own store.
   */
  condition?: Record<string, unknown>;
}

/**
 * A role policy — a named collection of permission rules.
 */
export interface RolePolicy {
  roleName: string;
  description?: string;
  permissions: PermissionRule[];
  isSystem?: boolean;
  isActive?: boolean;
}

/**
 * Context provided to the policy engine for permission evaluation.
 * Contains information about the actor and the resource being accessed.
 */
export interface PermissionContext {
  /** The user's ID. */
  userId: string;
  /** The user's role name. */
  role: string;
  /** The user's type. */
  userType: 'admin' | 'organization' | 'b2b' | 'customer' | 'system';
  /** The user's organization ID, if applicable. */
  organizationId?: string;
  /** The user's store ID, if applicable. */
  storeId?: string;
  /** Store IDs the user has access to, if multiple. */
  storeIds?: string[];
  /** Legacy flat permissions array (for backward compatibility). */
  permissions?: string[];
  /** The resource being accessed. */
  resource?: Resource;
  /** The action being performed. */
  action?: Action;
  /** The specific resource instance ID. */
  resourceId?: string;
  /** The store ID of the resource being accessed (for store-scoping). */
  resourceStoreId?: string;
  /** The organization ID of the resource being accessed. */
  resourceOrganizationId?: string;
  /** Additional context for condition evaluation. */
  [key: string]: unknown;
}

/**
 * Result of a permission check.
 */
export interface PermissionResult {
  allowed: boolean;
  /** Why the permission was denied, if applicable. */
  reason?: string;
  /** The matched rule, if allowed. */
  matchedRule?: PermissionRule;
  /** Field-level scoping from the matched rule. */
  allowedFields?: string[];
}
