/**
 * Consolidated Reporting Data Repository
 *
 * Merges reportDataProvider, reportingRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Reporting (report generation, schedules, executions)
 */

import {
  generateReport,
} from './reportDataProvider';
const reportDataProvider = {
  generateReport,
};
import {
  findScheduleById,
  listActiveSchedules,
  markScheduleRun,
  createExecution,
  updateExecution,
  computeNextRunDate,
  createSchedule,
  listSchedules,
  updateSchedule,
  deleteSchedule,
  listExecutions,
  findExecutionById,
} from './reportingRepo';

// Re-export types for backward compatibility
export type { ReportParameters } from './reportDataProvider';
export type { CreateReportScheduleParams, UpdateReportScheduleParams } from './reportingRepo';

const reportingRepo = {
  findScheduleById,
  listActiveSchedules,
  markScheduleRun,
  createExecution,
  updateExecution,
  computeNextRunDate,
  createSchedule,
  listSchedules,
  updateSchedule,
  deleteSchedule,
  listExecutions,
  findExecutionById,
};

class ReportingDataRepository {
  readonly dataProvider = reportDataProvider;
  readonly schedules = reportingRepo;
}

export default new ReportingDataRepository();
