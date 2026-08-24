/**
 * Reporting Repository
 * Handles persistence for report schedules and executions
 */

import { query, queryOne } from '../../../../libs/db';
import { ReportingReportSchedule, ReportingReportExecution } from '../../../../libs/db/types';
import { FailedToCreateScheduleError, FailedToCreateExecutionError } from '../../domain/errors/ReportingErrors';
import type {
  ReportScheduleProps,
  ReportExecutionProps,
  ReportExecutionStatus,
  ReportType,
  ReportFrequency,
  ReportFormat,
} from '../../domain/entities/ReportEntities';

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

export async function createSchedule(params: CreateReportScheduleParams): Promise<ReportScheduleProps> {
  const now = new Date();
  const sql = `
    INSERT INTO "reportingReportSchedule" (
      "organizationId", "name", "reportType", "type", "parameters",
      "recipients", "format", "isActive", "nextRunAt",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  const nextRunAt = computeNextRunDate(params.frequency || 'daily', now);
  const row = await queryOne<ReportingReportSchedule>(sql, [
    params.organizationId || null,
    params.name,
    params.reportType,
    params.frequency || 'daily',
    JSON.stringify(params.parameters || {}),
    JSON.stringify(params.recipients || []),
    params.format || 'pdf',
    params.isActive ?? true,
    nextRunAt,
    now,
    now,
  ]);
  if (!row) {
    throw new FailedToCreateScheduleError();
  }
  return mapScheduleRow(row);
}

export async function findScheduleById(id: string): Promise<ReportScheduleProps | null> {
  const row = await queryOne<ReportingReportSchedule>(`SELECT * FROM "reportingReportSchedule" WHERE "reportScheduleId" = $1`, [id]);
  return row ? mapScheduleRow(row) : null;
}

export async function listSchedules(organizationId?: string): Promise<ReportScheduleProps[]> {
  let sql = `SELECT * FROM "reportingReportSchedule"`;
  const params: unknown[] = [];
  if (organizationId) {
    sql += ` WHERE "organizationId" = $1`;
    params.push(organizationId);
  }
  sql += ` ORDER BY "createdAt" DESC`;
  const rows = await query<ReportingReportSchedule[]>(sql, params);
  return (rows || []).map(mapScheduleRow);
}

export async function listActiveSchedules(): Promise<ReportScheduleProps[]> {
  const rows = await query<ReportingReportSchedule[]>(
    `SELECT * FROM "reportingReportSchedule" WHERE "isActive" = true ORDER BY "nextRunAt" ASC`,
  );
  return (rows || []).map(mapScheduleRow);
}

export async function updateSchedule(id: string, params: UpdateReportScheduleParams): Promise<ReportScheduleProps | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.name !== undefined) { fields.push(`"name" = $${idx++}`); values.push(params.name); }
  if (params.frequency !== undefined) { fields.push(`"type" = $${idx++}`); values.push(params.frequency); }
  if (params.parameters !== undefined) { fields.push(`"parameters" = $${idx++}`); values.push(JSON.stringify(params.parameters)); }
  if (params.recipients !== undefined) { fields.push(`"recipients" = $${idx++}`); values.push(JSON.stringify(params.recipients)); }
  if (params.format !== undefined) { fields.push(`"format" = $${idx++}`); values.push(params.format); }
  if (params.isActive !== undefined) { fields.push(`"isActive" = $${idx++}`); values.push(params.isActive); }

  if (fields.length === 0) return findScheduleById(id);

  fields.push(`"updatedAt" = $${idx++}`);
  values.push(new Date());
  values.push(id);

  const row = await queryOne<ReportingReportSchedule>(
    `UPDATE "reportingReportSchedule" SET ${fields.join(', ')} WHERE "reportScheduleId" = $${idx} RETURNING *`,
    values,
  );
  return row ? mapScheduleRow(row) : null;
}

export async function deleteSchedule(id: string): Promise<boolean> {
  const result = await queryOne<ReportingReportSchedule>(
    `DELETE FROM "reportingReportSchedule" WHERE "reportScheduleId" = $1 RETURNING "reportScheduleId"`,
    [id],
  );
  return !!result;
}

export async function markScheduleRun(id: string, nextRunAt: Date): Promise<void> {
  await query(
    `UPDATE "reportingReportSchedule" SET "lastRunAt" = $1, "nextRunAt" = $2, "updatedAt" = $3 WHERE "reportScheduleId" = $4`,
    [new Date(), nextRunAt, new Date(), id],
  );
}

export async function createExecution(scheduleId: string): Promise<ReportExecutionProps> {
  const row = await queryOne<ReportingReportExecution>(
    `INSERT INTO "reportingReportExecution" ("reportScheduleId", "status", "startedAt")
     VALUES ($1, 'running', $2) RETURNING *`,
    [scheduleId, new Date()],
  );
  if (!row) {
    throw new FailedToCreateExecutionError();
  }
  return mapExecutionRow(row);
}

export async function updateExecution(
  id: string,
  updates: { status?: string; completedAt?: Date; fileUrl?: string; fileSize?: number; errorMessage?: string; metadata?: Record<string, unknown> },
): Promise<ReportExecutionProps | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.status !== undefined) { fields.push(`"status" = $${idx++}`); values.push(updates.status); }
  if (updates.completedAt !== undefined) { fields.push(`"completedAt" = $${idx++}`); values.push(updates.completedAt); }
  if (updates.fileUrl !== undefined) { fields.push(`"fileUrl" = $${idx++}`); values.push(updates.fileUrl); }
  if (updates.fileSize !== undefined) { fields.push(`"fileSize" = $${idx++}`); values.push(updates.fileSize); }
  if (updates.errorMessage !== undefined) { fields.push(`"errorMessage" = $${idx++}`); values.push(updates.errorMessage); }
  if (updates.metadata !== undefined) { fields.push(`"metadata" = $${idx++}`); values.push(JSON.stringify(updates.metadata)); }

  if (fields.length === 0) return null;

  values.push(id);
  const row = await queryOne<ReportingReportExecution>(
    `UPDATE "reportingReportExecution" SET ${fields.join(', ')} WHERE "reportExecutionId" = $${idx} RETURNING *`,
    values,
  );
  return row ? mapExecutionRow(row) : null;
}

export async function listExecutions(scheduleId: string, limit: number = 20): Promise<ReportExecutionProps[]> {
  const rows = await query<ReportingReportExecution[]>(
    `SELECT * FROM "reportingReportExecution" WHERE "reportScheduleId" = $1 ORDER BY "startedAt" DESC LIMIT $2`,
    [scheduleId, limit],
  );
  return (rows || []).map(mapExecutionRow);
}

export async function findExecutionById(id: string): Promise<ReportExecutionProps | null> {
  const row = await queryOne<ReportingReportExecution>(`SELECT * FROM "reportingReportExecution" WHERE "reportExecutionId" = $1`, [id]);
  return row ? mapExecutionRow(row) : null;
}

// ============================================================================
// Helpers
// ============================================================================

function mapScheduleRow(row: ReportingReportSchedule): ReportScheduleProps {
  return {
    reportScheduleId: row.reportScheduleId,
    organizationId: row.organizationId ?? undefined,
    name: row.name,
    reportType: row.reportType as ReportType,
    frequency: (row.type || 'daily') as ReportFrequency,
    parameters: typeof row.parameters === 'string' ? JSON.parse(row.parameters) : row.parameters || {},
    recipients: typeof row.recipients === 'string' ? JSON.parse(row.recipients as string) : (row.recipients as string[]) || [],
    format: (row.format || 'pdf') as ReportFormat,
    isActive: row.isActive ?? true,
    lastRunAt: row.lastRunAt ? new Date(row.lastRunAt) : undefined,
    nextRunAt: row.nextRunAt ? new Date(row.nextRunAt) : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapExecutionRow(row: ReportingReportExecution): ReportExecutionProps {
  return {
    reportExecutionId: row.reportExecutionId,
    reportScheduleId: row.reportScheduleId,
    status: row.status as ReportExecutionStatus,
    startedAt: new Date(row.startedAt),
    completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
    fileUrl: row.fileUrl ?? undefined,
    fileSize: row.fileSize ?? undefined,
    errorMessage: row.errorMessage ?? undefined,
    metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata as string) : row.metadata as Record<string, unknown>) : undefined,
  };
}

export function computeNextRunDate(frequency: ReportFrequency, from: Date): Date {
  const next = new Date(from);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      next.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      next.setHours(0, 0, 0, 0);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      next.setDate(1);
      next.setHours(0, 0, 0, 0);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      next.setMonth(0);
      next.setDate(1);
      next.setHours(0, 0, 0, 0);
      break;
  }
  return next;
}
