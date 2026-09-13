/**
 * audit module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/AuditRepository';
export * from './domain/errors/AuditErrors';
export * from './domain/entities/AuditLog';
export * from './domain/enums/AuditAction';

// Interface exports (routers, GraphQL)
export { auditAdminRouter } from './interface/controllers/auditAdminRouter';
export { auditMiddleware } from './interface/middleware/auditMiddleware';
export { listAuditLogs, viewAuditLog, auditStats, verifyChain } from './interface/controllers/adminAuditController';
