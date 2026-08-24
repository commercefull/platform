/**
 * Analytics Repository Port
 *
 * Domain interface for analytics data access.
 */

import { ReportSchedule, ReportExecution, ReportData, ReportType } from '../entities/AnalyticsReport';

export interface AnalyticsRepository {
  // Report scheduling
  getScheduledReports(): Promise<ReportSchedule[]>;
  getReportExecutionHistory(): Promise<ReportExecution[]>;
  scheduleReport(schedule: Omit<ReportSchedule, 'reportScheduleId' | 'createdAt' | 'updatedAt'>): Promise<ReportSchedule>;
  executeScheduledReport(scheduleId: string): Promise<ReportExecution>;

  // Report generation
  generateReport(reportType: ReportType | string, parameters: Record<string, unknown>): Promise<ReportData>;
}
