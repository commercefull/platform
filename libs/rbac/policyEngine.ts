/**
 * Policy Engine
 *
 * Evaluates permission rules against a context to determine
 * whether an action is allowed on a resource, with support for:
 * - Resource + action matching (with wildcards)
 * - Field-level scoping
 * - Deny rules (override allows)
 * - Runtime conditions (store-scoping, org-scoping)
 * - Backward compatibility with flat string permissions
 */

import type {
  PermissionRule,
  RolePolicy,
  PermissionContext,
  PermissionResult,
  Resource,
  Action,
} from './types';

/**
 * Check if a wildcard pattern matches a value.
 * '*' matches everything.
 * 'order.*' matches 'order.view', 'order.create', etc.
 */
function wildcardMatch(pattern: string, value: string): boolean {
  if (pattern === '*') return true;
  if (pattern === value) return true;
  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -2);
    return value === prefix || value.startsWith(prefix + '.');
  }
  return false;
}

/**
 * Evaluate a condition against the permission context.
 * Conditions use '$user.fieldName' syntax to reference user attributes.
 */
function evaluateCondition(
  condition: Record<string, unknown>,
  ctx: PermissionContext,
): boolean {
  for (const [key, expected] of Object.entries(condition)) {
    let actual: unknown;

    if (typeof expected === 'string' && expected.startsWith('$user.')) {
      const userField = expected.slice(6); // '$user.'.length
      actual = ctx[userField];
    } else if (typeof expected === 'string' && expected.startsWith('$resource.')) {
      const resourceField = expected.slice(10); // '$resource.'.length
      actual = ctx[resourceField];
    } else {
      // Direct value comparison
      actual = ctx[key];
    }

    if (actual !== expected && actual !== expected) {
      // Handle special case: '$user.storeId' should also check storeIds array
      if (typeof expected === 'string' && expected.startsWith('$user.storeId')) {
        const userStoreId = ctx.storeId;
        const userStoreIds = ctx.storeIds;
        const resourceStoreId = ctx.resourceStoreId;
        if (resourceStoreId && userStoreId && resourceStoreId === userStoreId) {
          continue;
        }
        if (resourceStoreId && userStoreIds && userStoreIds.includes(resourceStoreId)) {
          continue;
        }
      }
      return false;
    }
  }
  return true;
}

/**
 * Check if a specific rule matches the requested resource and action.
 */
function ruleMatches(
  rule: PermissionRule,
  resource: Resource,
  action: Action,
  ctx: PermissionContext,
): boolean {
  // Resource match
  if (!wildcardMatch(rule.resource, resource)) return false;

  // Action match
  if (!wildcardMatch(rule.action, action)) return false;

  // Condition evaluation
  if (rule.condition && !evaluateCondition(rule.condition, ctx)) {
    return false;
  }

  return true;
}

/**
 * Evaluate a role policy against the given context.
 *
 * Deny rules take precedence over allow rules.
 * If any deny rule matches, the result is denied.
 * If any allow rule matches (and no deny), the result is allowed.
 * Otherwise, denied by default.
 */
export function evaluatePolicy(
  policy: RolePolicy,
  resource: Resource,
  action: Action,
  ctx: PermissionContext,
): PermissionResult {
  const denyRules: PermissionRule[] = [];
  const allowRules: PermissionRule[] = [];

  for (const rule of policy.permissions) {
    if (rule.deny) {
      denyRules.push(rule);
    } else {
      allowRules.push(rule);
    }
  }

  // Check deny rules first — they override allows
  for (const rule of denyRules) {
    if (ruleMatches(rule, resource, action, ctx)) {
      return {
        allowed: false,
        reason: `Denied by rule: ${rule.resource}.${rule.action}`,
        matchedRule: rule,
      };
    }
  }

  // Check allow rules
  for (const rule of allowRules) {
    if (ruleMatches(rule, resource, action, ctx)) {
      return {
        allowed: true,
        matchedRule: rule,
        allowedFields: rule.fields ?? ['*'],
      };
    }
  }

  return {
    allowed: false,
    reason: `No matching rule for ${resource}.${action}`,
  };
}

/**
 * Evaluate multiple policies (e.g., system default + org-specific override).
 * Org-specific policies are checked first, then system defaults.
 * First match wins (allow or deny).
 */
export function evaluatePolicies(
  policies: RolePolicy[],
  resource: Resource,
  action: Action,
  ctx: PermissionContext,
): PermissionResult {
  // Sort: org-specific first, then system
  const sorted = [...policies].sort((a, b) => {
    if (a.isSystem && !b.isSystem) return 1;
    if (!a.isSystem && b.isSystem) return -1;
    return 0;
  });

  for (const policy of sorted) {
    if (policy.isActive === false) continue;
    const result = evaluatePolicy(policy, resource, action, ctx);
    if (result.allowed || result.reason?.startsWith('Denied')) {
      return result;
    }
  }

  return { allowed: false, reason: 'No matching policy' };
}

/**
 * Check backward-compatible flat string permission.
 * Supports both old format ('order.create') and new format ('order:view').
 */
export function checkLegacyPermission(
  permissions: string[] | undefined,
  required: string,
): boolean {
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes('*')) return true;

  // Try exact match
  if (permissions.includes(required)) return true;

  // Try wildcard match (e.g., 'order.*' matches 'order.create')
  for (const perm of permissions) {
    if (wildcardMatch(perm, required)) return true;
  }

  // Try cross-format match: 'order.create' == 'order:create'
  const altFormat = required.replace('.', ':');
  if (permissions.includes(altFormat)) return true;
  for (const perm of permissions) {
    if (wildcardMatch(perm.replace('.', ':'), altFormat)) return true;
  }

  return false;
}
