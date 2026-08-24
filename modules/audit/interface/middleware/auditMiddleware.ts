/**
 * Audit Middleware
 *
 * Express middleware that automatically records audit log entries for
 * mutating HTTP requests (POST, PUT, PATCH, DELETE) on /business and
 * /admin routes.
 *
 * The middleware runs AFTER the route handler completes successfully,
 * capturing the actor from req.user and the resource from the response
 * or request params.
 */

import { Request, Response, NextFunction } from 'express';
import { recordAuditLogUseCase } from '../../application/useCases/wired';
import { logger } from '../../../../libs/logger';
import type { AuditAction, ActorType, ResourceType } from '../../domain/enums/AuditAction';

interface AuditConfig {
  action: AuditAction;
  resourceType: ResourceType;
  resourceIdParam?: string;
  resourceNameField?: string;
}

/**
 * Map HTTP method + route path to an audit config.
 * This is used for automatic audit logging on mutating routes.
 */
function inferAuditConfig(req: Request): AuditConfig | null {
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return null;
  }

  const path = req.route?.path || req.path;
  const segments = path.split('/').filter(Boolean);

  // /business/{resource} or /admin/{resource}
  if (segments.length < 2) return null;

  const resourceSegment = segments[1]; // e.g. 'products', 'orders', 'inventory'
  const resourceId = segments[2];

  const resourceType = inferResourceType(resourceSegment);
  if (!resourceType) return null;

  const action = inferAction(method, resourceSegment, !!resourceId);
  if (!action) return null;

  return {
    action,
    resourceType,
    resourceIdParam: resourceId ? segments[2] : undefined,
  };
}

function inferResourceType(segment: string): ResourceType | null {
  const map: Record<string, ResourceType> = {
    products: 'product',
    orders: 'order',
    inventory: 'inventory',
    dispatches: 'dispatch',
    customers: 'customer',
    users: 'user',
    config: 'config',
    configuration: 'config',
    payments: 'payment',
    stores: 'store',
    webhooks: 'webhook',
  };
  return map[segment] ?? null;
}

function inferAction(method: string, _segment: string, hasId: boolean): AuditAction | null {
  if (method === 'POST') return hasId ? 'order.update' : 'product.create'; // fallback
  if (method === 'PUT' || method === 'PATCH') return 'product.update'; // fallback
  if (method === 'DELETE') return 'product.delete'; // fallback
  return null;
}

/**
 * Express middleware that records an audit entry after a mutating request.
 * Only logs if the response status is 2xx.
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  const config = inferAuditConfig(req);
  if (!config) {
    return next();
  }

  // Hook into response finish to capture the result
  const originalSend = res.send.bind(res);
  res.send = function (body: unknown): Response {
    // Restore original send
    res.send = originalSend;

    // Only audit successful mutations
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const user = req.user;
      const actorId = user?.userId || user?.id || 'anonymous';
      const actorType: ActorType = (user?.type as ActorType) || 'system';
      const actorEmail = user?.email;
      const actorName = user?.name;

      const resourceId = config.resourceIdParam
        ? (req.params[config.resourceIdParam] as string) || (req.params.id as string)
        : (req.params.id as string) || undefined;

      // Extract resource name from response body if available
      let resourceName: string | undefined;
      try {
        if (typeof body === 'string') {
          const parsed = JSON.parse(body);
          resourceName = parsed.name || parsed.productName || parsed.orderNumber || parsed.title;
        } else if (body && typeof body === 'object') {
          const obj = body as Record<string, unknown>;
          resourceName = (obj.name as string) || (obj.productName as string) || (obj.orderNumber as string) || (obj.title as string);
        }
      } catch {
        // Ignore parse errors
      }

      // Fire-and-forget — audit logging must not block the response
      recordAuditLogUseCase
        .execute({
          actorId,
          actorType,
          actorEmail,
          actorName,
          action: config.action,
          resourceType: config.resourceType,
          resourceId,
          resourceName,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
          correlationId: (req.headers['x-correlation-id'] as string) || undefined,
          organizationId: user?.organizationId,
          storeId: user?.storeId,
          metadata: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            body: sanitizeBody(req.body),
          },
        })
        .catch((err: unknown) => {
          logger.error('Audit middleware failed to record entry', {
            action: config.action,
            error: (err as Error).message,
          });
        });
    }

    return originalSend(body);
  } as typeof res.send;

  next();
}

/**
 * Remove sensitive fields from the request body before storing in audit log.
 */
function sanitizeBody(body: unknown): Record<string, unknown> | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const sanitized: Record<string, unknown> = {};
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'cvv'];

  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (sensitiveFields.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Manual audit logging helper for use in use cases or controllers
 * where automatic middleware doesn't capture enough context.
 */
export async function recordAudit(
  action: AuditAction,
  resourceType: ResourceType,
  actor: { id: string; type: ActorType; email?: string; name?: string; organizationId?: string; storeId?: string },
  resource: { id?: string; name?: string },
  metadata?: Record<string, unknown>,
  req?: Request,
): Promise<void> {
  await recordAuditLogUseCase.execute({
    actorId: actor.id,
    actorType: actor.type,
    actorEmail: actor.email,
    actorName: actor.name,
    action,
    resourceType,
    resourceId: resource.id,
    resourceName: resource.name,
    ipAddress: req?.ip || req?.socket.remoteAddress,
    userAgent: req?.headers['user-agent'],
    correlationId: (req?.headers['x-correlation-id'] as string) || undefined,
    organizationId: actor.organizationId,
    storeId: actor.storeId,
    metadata,
  });
}
