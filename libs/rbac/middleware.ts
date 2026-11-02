/**
 * RBAC Permission Middleware
 *
 * Express middleware for router-level permission enforcement.
 * Backward-compatible with the old requirePermission() from auth.ts.
 *
 * For use-case-level enforcement, use checkPermission() or
 * assertPermission() from checkPermission.ts instead.
 */

import type { HttpNext, HttpRequest, HttpResponse } from '../http';
import type { Resource, Action, PermissionContext } from './types';
import { checkPermission } from './checkPermission';

const isJsonRequest = (req: HttpRequest): boolean => {
  return Boolean(req.xhr || req.headers.accept?.indexOf('json') !== -1);
};

/**
 * Resolve the storeId referenced by the request (params, body, or query).
 */
function resolveRequestStoreId(req: HttpRequest): string | undefined {
  const fromParams = (req.params as Record<string, string | undefined> | undefined)?.storeId;
  const fromBody = (req.body as Record<string, unknown> | undefined)?.storeId;
  const fromQuery = (req.query as Record<string, string | undefined> | undefined)?.storeId;
  return fromParams || (fromBody as string | undefined) || fromQuery;
}

/**
 * Build a PermissionContext from an Express request.
 */
export function buildContextFromRequest(req: HttpRequest): PermissionContext {
  const user = req.user ?? {};
  return {
    userId: user.userId || user.id || '',
    role: user.role || '',
    userType: (user.type as PermissionContext['userType']) || 'system',
    organizationId: user.organizationId,
    storeId: user.storeId,
    storeIds: user.storeIds,
    permissions: user.permissions,
    resourceStoreId: resolveRequestStoreId(req),
  };
}

/**
 * Middleware that requires the user to have the specified permission.
 *
 * Backward-compatible with the old requirePermission() from auth.ts.
 * Uses the new policy engine first, then falls back to legacy checks.
 *
 * @example
 * ```ts
 * router.post('/products', requirePermission('product', 'create'), handler);
 * ```
 */
export function requirePermission(resource: Resource, action: Action) {
  return (req: HttpRequest, res: HttpResponse, next: HttpNext) => {
    if (!req.user) {
      return denyRequest(req, res, 401, 'Authentication required');
    }

    const ctx = buildContextFromRequest(req);
    const result = checkPermission(ctx, resource, action);

    if (result.allowed) {
      return next();
    }

    return denyRequest(req, res, 403, 'Insufficient permissions', result.reason);
  };
}

/**
 * Send a JSON or plain-text denial response depending on the request type.
 */
function denyRequest(req: HttpRequest, res: HttpResponse, status: number, message: string, reason?: string) {
  if (isJsonRequest(req)) {
    return res.status(status).json({ success: false, message, ...(reason ? { reason } : {}) });
  }
  if (status === 401) {
    return res.status(status).send('Authentication required');
  }
  return res.status(status).send('Forbidden');
}

/**
 * Middleware that requires store-scoped access.
 * Combines permission check with store ownership verification.
 *
 * @example
 * ```ts
 * router.put('/stores/:storeId/inventory', requireStoreAccess('inventory', 'adjust'), handler);
 * ```
 */
export function requireStoreAccess(resource?: Resource, action?: Action) {
  return (req: HttpRequest, res: HttpResponse, next: HttpNext) => {
    if (!req.user) {
      if (isJsonRequest(req)) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      return res.redirect('/admin/login');
    }

    const user = req.user;
    const ctx = buildContextFromRequest(req);

    // Check permission if resource+action specified
    if (resource && action) {
      const result = checkPermission(ctx, resource, action);
      if (!result.allowed) {
        return denyRequest(req, res, 403, 'Insufficient permissions', result.reason);
      }
    }

    // Store scoping: non-admins can only access their own store
    const targetStoreId = resolveRequestStoreId(req);
    if (targetStoreId && user.storeId && targetStoreId !== user.storeId && !user.storeIds?.includes(targetStoreId)) {
      return denyRequest(req, res, 403, 'Access denied to this store');
    }

    return next();
  };
}
