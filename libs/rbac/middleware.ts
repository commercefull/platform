/**
 * RBAC Permission Middleware
 *
 * Express middleware for router-level permission enforcement.
 * Backward-compatible with the old requirePermission() from auth.ts.
 *
 * For use-case-level enforcement, use checkPermission() or
 * assertPermission() from checkPermission.ts instead.
 */

import { Request, Response, NextFunction } from 'express';
import type { Resource, Action, PermissionContext } from './types';
import { checkPermission } from './checkPermission';

const isJsonRequest = (req: Request): boolean => {
  return Boolean(req.xhr || req.headers.accept?.indexOf('json') !== -1);
};

/**
 * Build a PermissionContext from an Express request.
 */
export function buildContextFromRequest(req: Request): PermissionContext {
  const user = req.user;
  return {
    userId: user?.userId || user?.id || '',
    role: user?.role || '',
    userType: (user?.type as PermissionContext['userType']) || 'system',
    organizationId: user?.organizationId,
    storeId: user?.storeId,
    storeIds: user?.storeIds,
    permissions: user?.permissions,
    resourceStoreId:
      (req.params as Record<string, string | undefined>)?.storeId ||
      ((req.body as Record<string, unknown> | undefined)?.storeId as string | undefined) ||
      (req.query as Record<string, string | undefined>)?.storeId,
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
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      if (isJsonRequest(req)) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      return res.status(401).send('Authentication required');
    }

    const ctx = buildContextFromRequest(req);
    const result = checkPermission(ctx, resource, action);

    if (result.allowed) {
      return next();
    }

    if (isJsonRequest(req)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions', reason: result.reason });
    }

    return res.status(403).send('Forbidden');
  };
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
  return (req: Request, res: Response, next: NextFunction) => {
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
        if (isJsonRequest(req)) {
          return res.status(403).json({ success: false, message: 'Insufficient permissions', reason: result.reason });
        }
        return res.status(403).send('Forbidden');
      }
    }

    // Store scoping: non-admins can only access their own store
    const targetStoreId =
      (req.params as Record<string, string | undefined>)?.storeId ||
      ((req.body as Record<string, unknown> | undefined)?.storeId as string | undefined) ||
      (req.query as Record<string, string | undefined>)?.storeId;

    if (targetStoreId && user.storeId && targetStoreId !== user.storeId) {
      // Allow if user has access to multiple stores
      if (!user.storeIds || !user.storeIds.includes(targetStoreId)) {
        if (isJsonRequest(req)) {
          return res.status(403).json({ success: false, message: 'Access denied to this store' });
        }
        return res.status(403).send('Forbidden');
      }
    }

    return next();
  };
}
