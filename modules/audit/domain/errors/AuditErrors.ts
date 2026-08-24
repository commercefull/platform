import { AppError } from '../../../../libs/errors';

export class AuditLogNotFoundError extends AppError {
  constructor(auditLogId: string) {
    super(`Audit log entry not found: ${auditLogId}`, 404);
  }
}

export class AuditLogHashMismatchError extends AppError {
  constructor(auditLogId: string) {
    super(`Audit log hash verification failed for: ${auditLogId} — possible tampering detected`, 500);
  }
}

export class AuditLogImmutableError extends AppError {
  constructor() {
    super('Audit log entries are immutable and cannot be modified or deleted', 403);
  }
}

export class AuditLogWriteError extends AppError {
  constructor(reason: string) {
    super(`Failed to write audit log: ${reason}`, 500);
  }
}
