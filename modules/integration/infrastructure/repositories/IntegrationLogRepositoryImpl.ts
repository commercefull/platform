import { query, queryOne } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';
import { IntegrationLog, type IntegrationLogProps, type LogStatus } from '../../domain/entities/IntegrationLog';
import type { IntegrationLogRepository } from '../../domain/repositories/IntegrationRepository';

interface LogDbRow {
  logId: string;
  integrationId: string;
  subscriptionId: string | null;
  eventType: string;
  targetAction: string;
  status: string;
  requestPayload: Record<string, unknown> | string | null;
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: Date;
}

export class IntegrationLogRepositoryImpl implements IntegrationLogRepository {
  async create(log: IntegrationLog): Promise<IntegrationLog> {
    const props = log.toJSON();
    await query(
      `INSERT INTO "${Table.IntegrationLog}" (
        "logId", "integrationId", "subscriptionId", "eventType", "targetAction",
        "status", "requestPayload", "responseStatus", "responseBody",
        "errorMessage", "durationMs", "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        props.logId, props.integrationId, props.subscriptionId, props.eventType, props.targetAction,
        props.status, props.requestPayload ? JSON.stringify(props.requestPayload) : null,
        props.responseStatus, props.responseBody, props.errorMessage, props.durationMs, props.createdAt,
      ],
    );
    return log;
  }

  async findById(logId: string): Promise<IntegrationLog | null> {
    const row = await queryOne<LogDbRow>(
      `SELECT * FROM "${Table.IntegrationLog}" WHERE "logId" = $1`,
      [logId],
    );
    if (!row) return null;
    return IntegrationLog.reconstitute(this.mapRowToProps(row));
  }

  async findByIntegration(integrationId: string, filters?: { status?: LogStatus; limit?: number; offset?: number }): Promise<{ data: IntegrationLog[]; total: number }> {
    let sql = `SELECT * FROM "${Table.IntegrationLog}" WHERE "integrationId" = $1`;
    const params: unknown[] = [integrationId];
    if (filters?.status) {
      params.push(filters.status);
      sql += ` AND "status" = $${params.length}`;
    }
    const countSql = `SELECT COUNT(*) as count FROM (${sql}) as sub`;
    const countRow = await queryOne<{ count: string }>(countSql, params as unknown[]);
    const total = countRow ? parseInt(countRow.count, 10) : 0;

    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;
    params.push(limit);
    sql += ` ORDER BY "createdAt" DESC LIMIT $${params.length}`;
    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    const rows = await query<LogDbRow[]>(sql, params as unknown[]);
    return {
      data: (rows ?? []).map((r) => IntegrationLog.reconstitute(this.mapRowToProps(r))),
      total,
    };
  }

  async findBySubscription(subscriptionId: string, limit = 50): Promise<IntegrationLog[]> {
    const rows = await query<LogDbRow[]>(
      `SELECT * FROM "${Table.IntegrationLog}" WHERE "subscriptionId" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
      [subscriptionId, limit],
    );
    return (rows ?? []).map((r) => IntegrationLog.reconstitute(this.mapRowToProps(r)));
  }

  async deleteByIntegration(integrationId: string): Promise<boolean> {
    await query(
      `DELETE FROM "${Table.IntegrationLog}" WHERE "integrationId" = $1`,
      [integrationId],
    );
    return true;
  }

  private mapRowToProps(row: LogDbRow): IntegrationLogProps {
    return {
      logId: row.logId,
      integrationId: row.integrationId,
      subscriptionId: row.subscriptionId,
      eventType: row.eventType,
      targetAction: row.targetAction,
      status: row.status as LogStatus,
      requestPayload: row.requestPayload
        ? (typeof row.requestPayload === 'string' ? JSON.parse(row.requestPayload) : row.requestPayload)
        : null,
      responseStatus: row.responseStatus,
      responseBody: row.responseBody,
      errorMessage: row.errorMessage,
      durationMs: row.durationMs,
      createdAt: row.createdAt,
    };
  }
}
