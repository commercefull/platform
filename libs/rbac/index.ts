/**
 * RBAC Library — Granular Role-Based Access Control
 *
 * Policy engine supporting:
 * - Resource + action + field-level scoping
 * - Per-organization role definitions (DB-backed)
 * - Deny rules (override allows)
 * - Runtime conditions (store-scoping, org-scoping)
 * - Backward compatibility with flat string permissions
 *
 * Usage in use cases:
 * ```ts
 * import { assertPermission } from 'libs/rbac';
 * assertPermission(ctx, 'order', 'refund');
 * ```
 *
 * Usage in routers:
 * ```ts
 * import { requirePermission } from 'libs/rbac';
 * router.post('/products', requirePermission('product', 'create'), handler);
 * ```
 */

export * from './types';
export * from './policyEngine';
export * from './defaultRoles';
export * from './checkPermission';
export * from './middleware';
export * from './rolePolicyRepository';
