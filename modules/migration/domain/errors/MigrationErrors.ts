import { AppError } from '../../../../libs/errors';

export class ImportJobNotFoundError extends AppError {
  constructor(importJobId: string) {
    super(`Import job not found: ${importJobId}`, 404, { code: 'migration.job_not_found', severity: 'warn', details: { importJobId } });
  }
}

