import { jsonResponse } from 'libs/apiResponse';
/**
 * Audit Log Admin Controller
 *
 * Read-only endpoints for viewing and verifying the audit log.
 * Mounted at /business/audit/*
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { manageAuditLogsUseCase } from '../../application/useCases/wired';

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

    const result = await manageAuditLogsUseCase.findAll(
      Object.keys(activeFilters).length > 0 ? (activeFilters as never) : undefined,
      pagination,
    );

    jsonResponse(res, 200, { success: true, data: result });
  });

  getLog = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const log = await manageAuditLogsUseCase.findById(String(req.params.id));
    if (!log) {
      jsonResponse(res, 404, { success: false, error: 'Audit log entry not found' });
      return;
    }
    jsonResponse(res, 200, { success: true, data: log.toJSON() });
  });

  verifyChain = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const fromId = req.query.fromId as string | undefined;
    const toId = req.query.toId as string | undefined;
    const result = await manageAuditLogsUseCase.verifyChain(fromId, toId);
    jsonResponse(res, 200, { success: true, data: result });
  });

  getStats = asyncHandler(async (_req: HttpRequest, res: HttpResponse) => {
    const [byAction, byActor] = await Promise.all([manageAuditLogsUseCase.countByAction(), manageAuditLogsUseCase.countByActor()]);
    jsonResponse(res, 200, { success: true, data: { byAction, byActor } });
  });

  findByCorrelationId = asyncHandler(async (req: HttpRequest, res: HttpResponse) => {
    const logs = await manageAuditLogsUseCase.findByCorrelationId(String(req.params.correlationId));
    if (logs.length === 0) {
      jsonResponse(res, 404, { success: false, error: 'No audit logs found for correlation ID' });
      return;
    }
    jsonResponse(res, 200, { success: true, data: logs.map(l => l.toJSON()) });
  });
}
