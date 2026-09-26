/**
 * Audit Admin UI Controller
 * Read-only admin views for audit logs
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { manageAuditLogsUseCase } from '../../application/useCases/wired';
import { adminRespond } from '../../../../libs/adminRespond';

export const listAuditLogs = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const filters: Record<string, string | undefined> = {
    actorId: req.query.actorId as string | undefined,
    actorType: req.query.actorType as string | undefined,
    action: req.query.action as string | undefined,
    resourceType: req.query.resourceType as string | undefined,
    organizationId: req.query.organizationId as string | undefined,
  };
  const pagination = {
    limit: parseInt(String(req.query.limit ?? '50'), 10),
    offset: parseInt(String(req.query.offset ?? '0'), 10),
  };

  const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const result = await manageAuditLogsUseCase.findAll(Object.keys(activeFilters).length > 0 ? (activeFilters as never) : undefined, pagination);

  adminRespond(req, res, 'audit/index', {
    pageName: 'Audit Logs',
    logs: result.data,
    total: result.total,
    filters: activeFilters,
    pagination,
    success: req.query.success || null,
  });
};

export const viewAuditLog = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { logId } = req.params;
  const log = await manageAuditLogsUseCase.findById(logId);

  if (!log) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Audit log entry not found' });
    return;
  }

  adminRespond(req, res, 'audit/view', {
    pageName: `Audit Log: ${log.action}`,
    log: log.toJSON(),
  });
};

export const auditStats = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const [byAction, byActor] = await Promise.all([manageAuditLogsUseCase.countByAction(), manageAuditLogsUseCase.countByActor()]);

  adminRespond(req, res, 'audit/stats', {
    pageName: 'Audit Statistics',
    byAction,
    byActor,
  });
};

export const verifyChain = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const fromId = req.query.fromId as string | undefined;
  const toId = req.query.toId as string | undefined;
  const result = await manageAuditLogsUseCase.verifyChain(fromId, toId);

  adminRespond(req, res, 'audit/verify-chain', {
    pageName: 'Verify Chain Integrity',
    result,
    fromId: fromId || '',
    toId: toId || '',
  });
};
