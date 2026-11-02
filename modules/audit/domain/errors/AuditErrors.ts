import { AppError } from '../../../../libs/errors';




export class AuditLogWriteError extends AppError {
  constructor(reason: string) {
    super(`Failed to write audit log: ${reason}`, 500);
  }
}
