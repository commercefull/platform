/**
 * Wired singletons for the audit module.
 */

import { AuditRepositoryImpl } from '../../infrastructure/repositories/AuditRepositoryImpl';
import { RecordAuditLogUseCase } from './RecordAuditLog';
import { ManageAuditLogsUseCase } from './ManageAuditLogs';

const auditRepository = new AuditRepositoryImpl();
const recordAuditLogUseCase = new RecordAuditLogUseCase(auditRepository);
const manageAuditLogsUseCase = new ManageAuditLogsUseCase(auditRepository);

export { auditRepository, recordAuditLogUseCase, manageAuditLogsUseCase };
