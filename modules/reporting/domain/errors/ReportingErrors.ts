import { AppError } from '../../../../libs/errors';

export class ReportScheduleNotFoundError extends AppError {
  constructor(scheduleId: string) {
    super(`Report schedule not found: ${scheduleId}`, 404, { code: 'reporting.schedule_not_found' });
  }
}

export class ReportExecutionNotFoundError extends AppError {
  constructor(executionId: string) {
    super(`Report execution not found: ${executionId}`, 404, { code: 'reporting.execution_not_found' });
  }
}

export class ReportNotFoundError extends AppError {
  constructor(reportId: string) {
    super(`Report not found: ${reportId}`, 404, { code: 'reporting.report_not_found' });
  }
}

export class InvalidScheduleFrequencyError extends AppError {
  constructor(frequency: string) {
    super(`Invalid schedule frequency: ${frequency}`, 400, { code: 'reporting.invalid_frequency' });
  }
}

export class ReportGenerationFailedError extends AppError {
  constructor(reason: string) {
    super(`Report generation failed: ${reason}`, 500, { code: 'reporting.generation_failed' });
  }
}

export class FailedToCreateScheduleError extends AppError {
  constructor() {
    super('Failed to create report schedule', 500, { code: 'reporting.schedule_creation_failed' });
  }
}

export class FailedToCreateExecutionError extends AppError {
  constructor() {
    super('Failed to create report execution', 500, { code: 'reporting.execution_creation_failed' });
  }
}

export class UnknownReportTypeError extends AppError {
  constructor(reportType: string) {
    super(`Unknown report type: ${reportType}`, 400, { code: 'reporting.unknown_report_type' });
  }
}
