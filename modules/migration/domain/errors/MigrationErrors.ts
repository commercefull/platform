import { AppError } from '../../../../libs/errors';

export class MigrationError extends AppError {
  constructor(message: string, statusCode = 500, details?: Record<string, unknown>) {
    super(message, statusCode, { code: 'migration.error', severity: 'error', details });
  }
}

export class ImportJobNotFoundError extends AppError {
  constructor(importJobId: string) {
    super(`Import job not found: ${importJobId}`, 404, { code: 'migration.job_not_found', severity: 'warn', details: { importJobId } });
  }
}

export class ImportJobAlreadyExistsError extends AppError {
  constructor(organizationId: string, jobType: string) {
    super(`An import job of type ${jobType} already exists for organization ${organizationId}`, 409, { code: 'migration.job_already_exists', severity: 'warn', details: { organizationId, jobType } });
  }
}

export class InvalidImportJobError extends AppError {
  constructor(message: string) {
    super(`Invalid import job: ${message}`, 400, { code: 'migration.invalid_job', severity: 'warn' });
  }
}

export class ImportMappingNotFoundError extends AppError {
  constructor(importMappingId: string) {
    super(`Import mapping not found: ${importMappingId}`, 404, { code: 'migration.mapping_not_found', severity: 'warn', details: { importMappingId } });
  }
}

export class ImportErrorNotFoundError extends AppError {
  constructor(importErrorId: string) {
    super(`Import error not found: ${importErrorId}`, 404, { code: 'migration.error_not_found', severity: 'warn', details: { importErrorId } });
  }
}

export class ImportJobNotRunningError extends AppError {
  constructor(importJobId: string, currentStatus: string) {
    super(`Import job ${importJobId} is not running (status: ${currentStatus})`, 409, { code: 'migration.job_not_running', severity: 'warn', details: { importJobId, currentStatus } });
  }
}
