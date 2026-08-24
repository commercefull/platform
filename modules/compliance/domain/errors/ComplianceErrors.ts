import { AppError } from '../../../../libs/errors';

export class ComplianceValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'compliance.validation_error' });
  }
}

export class KeyRotationPolicyNotFoundError extends AppError {
  constructor() {
    super('Key rotation policy not found', 404, { code: 'compliance.key_rotation_not_found' });
  }
}

export class KeyRotationPolicyAlreadyExistsError extends AppError {
  constructor() {
    super('Key rotation policy already exists for this key', 409, { code: 'compliance.key_rotation_already_exists' });
  }
}

export class KeyRotationOverdueError extends AppError {
  constructor(keyIdentifier: string) {
    super(`Key rotation is overdue for: ${keyIdentifier}`, 410, { code: 'compliance.key_rotation_overdue' });
  }
}

export class AuditLogNotFoundError extends AppError {
  constructor() {
    super('Audit log entry not found', 404, { code: 'compliance.audit_log_not_found' });
  }
}

export class DsrNotFoundError extends AppError {
  constructor() {
    super('Data subject request not found', 404, { code: 'compliance.dsr_not_found' });
  }
}

export class DsrAlreadyExistsError extends AppError {
  constructor() {
    super('A data subject request of this type already exists for this customer', 409, { code: 'compliance.dsr_already_exists' });
  }
}

export class DsrStatusError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'compliance.dsr_status_error' });
  }
}
