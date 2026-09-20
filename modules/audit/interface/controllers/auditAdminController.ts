/**
 * Audit Log Admin Controller
 *
 * Read-only endpoints for viewing and verifying the audit log.
 * Mounted at /business/audit/*
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { auditRepository } from '../../application/useCases/wired';

export class AuditAdminController {
  listLogs = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const filters: Record<string, string | undefined> = {
      actorId: req.query.actorId as string | undefined,
      actorType: req.query.actorType as string | undefined,
      action: req.query.action as string | undefined,
      resourceType: req.query.resourceType as string | undefined,
      resourceId: req.query.resourceId as string | undefined,
      organizationId: req.query.organizationId as string | undefined,
      storeId: req.query.storeId as string | undefined,
      correlationId: req.query.correlationId as string | undefined,
    };

    const pagination = {
      limit: parseInt(String(req.query.limit ?? '50'), 10),
      offset: parseInt(String(req.query.offset ?? '0'), 10),
    };

    const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));

    const result = await auditRepository.findAll(Object.keys(activeFilters).length > 0 ? (activeFilters as never) : undefined, pagination);

    res.json({ success: true, data: result });
  });

  getLog = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const log = await auditRepository.findById(String(req.params.id));
    if (!log) {
      res.status(404).json({ success: false, error: 'Audit log entry not found' });
      return;
    }
    res.json({ success: true, data: log.toJSON() });
  });

  verifyChain = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const fromId = req.query.fromId as string | undefined;
    const toId = req.query.toId as string | undefined;
    const result = await auditRepository.verifyChain(fromId, toId);
    res.json({ success: true, data: result });
  });

  getStats = asyncHandler(async (_req: HttpRequest, res: HttpResponse) => {
    const [byAction, byActor] = await Promise.all([auditRepository.countByAction(), auditRepository.countByActor()]);
    res.json({ success: true, data: { byAction, byActor } });
  });

  findByCorrelationId = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const logs = await auditRepository.findByCorrelationId(String(req.params.correlationId));
    if (logs.length === 0) {
      res.status(404).json({ success: false, error: 'No audit logs found for correlation ID' });
      return;
    }
    res.json({ success: true, data: logs.map(l => l.toJSON()) });
  });
}
