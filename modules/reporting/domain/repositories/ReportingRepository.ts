/**
 * Reporting Repository Port
 *
 * Domain interface for reporting data access (schedules, executions, report generation).
 */

import type {
  ReportScheduleProps,
  ReportExecutionProps,
  ReportData,
  ReportType,
  ReportFrequency,
  ReportFormat,
} from '../entities/ReportEntities';

export interface CreateReportScheduleParams {
  organizationId?: string;
  name: string;
  reportType: ReportType;
  frequency: ReportFrequency;
  parameters?: Record<string, unknown>;
  recipients?: string[];
  format?: ReportFormat;
  isActive?: boolean;
}

export interface UpdateReportScheduleParams {
  name?: string;
  frequency?: ReportFrequency;
  parameters?: Record<string, unknown>;
  recipients?: string[];
  format?: ReportFormat;
  isActive?: boolean;
}

export interface ReportParameters {
  dateFrom?: string;
  dateTo?: string;
  storeId?: string;
  organizationId?: string;
  categoryId?: string;
  customerGroupId?: string;
  warehouseId?: string;
  lowStockOnly?: boolean;
  region?: string;
  taxClassId?: string;
  status?: string;
  paymentMethod?: string;
  gateway?: string;
  carrierId?: string;
  limit?: number;
}

export interface ReportingRepository {
  // Schedules
  createSchedule(params: CreateReportScheduleParams): Promise<ReportScheduleProps>;
  findScheduleById(id: string): Promise<ReportScheduleProps | null>;
  listSchedules(organizationId?: string): Promise<ReportScheduleProps[]>;
  listActiveSchedules(): Promise<ReportScheduleProps[]>;
  updateSchedule(id: string, params: UpdateReportScheduleParams): Promise<ReportScheduleProps | null>;
  deleteSchedule(id: string): Promise<boolean>;
  markScheduleRun(id: string, nextRunAt: Date): Promise<void>;

  // Executions
  createExecution(scheduleId: string): Promise<ReportExecutionProps>;
  updateExecution(
    id: string,
    updates: { status?: string; completedAt?: Date; fileUrl?: string; fileSize?: number; errorMessage?: string; metadata?: Record<string, unknown> },
  ): Promise<ReportExecutionProps | null>;
  listExecutions(scheduleId: string, limit?: number): Promise<ReportExecutionProps[]>;
  findExecutionById(id: string): Promise<ReportExecutionProps | null>;

  // Report Generation
  generateReport(reportType: ReportType, params: ReportParameters): Promise<ReportData>;
}
