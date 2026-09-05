/**
 * RBAC Permission Checker
 *
 * Provides checkPermission() for use-case-level enforcement and
 * requirePermission() middleware for backward-compatible router-level
 * enforcement. The engine evaluates both new policy-based rules and
 * legacy flat string permissions.
 */

import type { PermissionContext, PermissionResult, Resource, Action, RolePolicy } from './types';
import { evaluatePolicies, checkLegacyPermission } from './policyEngine';
import { getDefaultRolePolicy } from './defaultRoles';
import { UnauthorizedError, ForbiddenError } from '../errors';

/**
 * Cache of org-specific role policies loaded from the database.
 * Populated by RolePolicyRepository on app boot or on-demand.
 */
let orgPolicyCache: Map<string, RolePolicy[]> = new Map();

/**
 * Set the org-specific policy cache (called by RolePolicyRepository).
 */
export function setOrgPolicyCache(policies: Map<string, RolePolicy[]>): void {
  orgPolicyCache = policies;
}

/**
 * Clear the org policy cache.
 */
export function clearOrgPolicyCache(): void {
  orgPolicyCache = new Map();
}

/**
 * Get all applicable policies for a given context.
 * Combines org-specific overrides with system defaults.
 */
function getApplicablePolicies(ctx: PermissionContext): RolePolicy[] {
  const policies: RolePolicy[] = [];

  // Org-specific policies (if any)
  if (ctx.organizationId) {
    const orgPolicies = orgPolicyCache.get(ctx.organizationId);
    if (orgPolicies) {
      policies.push(...orgPolicies);
    }
  }

  // System default for the user's role
  const defaultPolicy = getDefaultRolePolicy(ctx.role);
  if (defaultPolicy) {
    policies.push(defaultPolicy);
  }

  return policies;
}

/**
 * Check whether the given context allows the requested resource+action.
 *
 * This is the primary function for use-case-level permission enforcement.
 * It first checks the new policy engine, then falls back to legacy
 * flat string permissions for backward compatibility.
 *
 * @example
 * ```ts
 * // Inside a use case
 * const result = checkPermission({
 *   userId: user.id,
 *   role: user.role,
 *   userType: 'organization',
 *   organizationId: user.organizationId,
 *   storeId: user.storeId,
 *   permissions: user.permissions,
 * }, 'order', 'refund');
 *
 * if (!result.allowed) {
 *   throw new ForbiddenError(result.reason);
 * }
 * ```
 */
export function checkPermission(
  ctx: PermissionContext,
  resource: Resource,
  action: Action,
): PermissionResult {
  // Build the full context with resource/action
  const fullCtx: PermissionContext = { ...ctx, resource, action };

  // 1. Try policy-based evaluation first
  const policies = getApplicablePolicies(fullCtx);
  if (policies.length > 0) {
    const result = evaluatePolicies(policies, resource, action, fullCtx);
    if (result.allowed || result.reason?.startsWith('Denied')) {
      return result;
    }
  }

  // 2. Fall back to legacy flat string permissions
  if (ctx.permissions && ctx.permissions.length > 0) {
    // Try both formats: 'order.refund' and 'order:refund'
    const dotFormat = `${resource}.${action}`;
    const colonFormat = `${resource}:${action}`;

    if (checkLegacyPermission(ctx.permissions, dotFormat) ||
        checkLegacyPermission(ctx.permissions, colonFormat)) {
      return { allowed: true, allowedFields: ['*'] };
    }

    // Try 'order.manage' which covers all order actions
    const manageFormat = `${resource}.manage`;
    const manageColon = `${resource}:manage`;
    if (action !== 'manage' && action !== '*' &&
        (checkLegacyPermission(ctx.permissions, manageFormat) ||
         checkLegacyPermission(ctx.permissions, manageColon))) {
      return { allowed: true, allowedFields: ['*'] };
    }
  }

  return {
    allowed: false,
    reason: `No permission for ${resource}.${action}`,
  };
}

/**
 * Assert that the given context allows the requested resource+action.
 * Throws ForbiddenError if not allowed.
 *
 * @example
 * ```ts
 * assertPermission(ctx, 'order', 'refund');
 * // proceeds if allowed, throws ForbiddenError if not
 * ```
 */
export function assertPermission(
  ctx: PermissionContext,
  resource: Resource,
  action: Action,
): void {
  if (!ctx.userId) {
    throw new UnauthorizedError('Authentication required');
  }

  const result = checkPermission(ctx, resource, action);
  if (!result.allowed) {
    throw new ForbiddenError(result.reason ?? 'Insufficient permissions');
  }
}

/**
 * Check if the context allows a specific field on a resource.
 * Useful for field-level scoping (e.g., can the user update 'price' on 'product'?).
 */
export function checkFieldPermission(
  ctx: PermissionContext,
  resource: Resource,
  action: Action,
  field: string,
): boolean {
  const result = checkPermission(ctx, resource, action);
  if (!result.allowed) return false;
  if (!result.allowedFields || result.allowedFields.includes('*')) return true;
  return result.allowedFields.includes(field);
}

/**
 * Get the list of allowed fields for a resource+action.
 * Returns ['*'] if all fields are allowed.
 */
export function getAllowedFields(
  ctx: PermissionContext,
  resource: Resource,
  action: Action,
): string[] {
  const result = checkPermission(ctx, resource, action);
  if (!result.allowed) return [];
  return result.allowedFields ?? ['*'];
}

