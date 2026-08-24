/**
 * Wired singletons for the audit module.
 */

import { AuditRepositoryImpl } from '../../infrastructure/repositories/AuditRepositoryImpl';
import { RecordAuditLogUseCase } from './RecordAuditLog';

const auditRepository = new AuditRepositoryImpl();
const recordAuditLogUseCase = new RecordAuditLogUseCase(auditRepository);

export { auditRepository, recordAuditLogUseCase };
