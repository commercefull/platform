import { AppError } from '../../../../libs/errors';

export class ReportNotFoundError extends AppError {
  constructor(reportId: string) {
    super(`Report not found: ${reportId}`, 404, { code: 'analytics.report_not_found' });
  }
}

export class ReportScheduleNotFoundError extends AppError {
  constructor(scheduleId: string) {
    super(`Report schedule not found: ${scheduleId}`, 404, { code: 'analytics.schedule_not_found' });
  }
}

export class InvalidDateRangeError extends AppError {
  constructor() {
    super('Start date must be before end date', 400, { code: 'analytics.invalid_date_range' });
  }
}

export class MetricNotFoundError extends AppError {
  constructor(metric: string) {
    super(`Metric not found: ${metric}`, 404, { code: 'analytics.metric_not_found' });
  }
}

export class DashboardNotFoundError extends AppError {
  constructor(dashboardId: string) {
    super(`Dashboard not found: ${dashboardId}`, 404, { code: 'analytics.dashboard_not_found' });
  }
}

export class FailedToGenerateReportError extends AppError {
  constructor() {
    super('Failed to generate report', 500, { code: 'analytics.report_generation_failed' });
  }
}

export class AnalyticsValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'analytics.validation_error' });
  }
}
