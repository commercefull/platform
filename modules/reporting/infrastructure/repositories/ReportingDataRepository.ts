/**
 * Consolidated Reporting Data Repository
 *
 * Merges reportDataProvider, reportingRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Reporting (report generation, schedules, executions)
 */

import * as reportDataProvider from './reportDataProvider';
import * as reportingRepo from './reportingRepo';

// Re-export types for backward compatibility
export type { ReportParameters } from './reportDataProvider';
export type { CreateReportScheduleParams, UpdateReportScheduleParams } from './reportingRepo';

class ReportingDataRepository {
  readonly dataProvider = reportDataProvider;
  readonly schedules = reportingRepo;
}

export default new ReportingDataRepository();
