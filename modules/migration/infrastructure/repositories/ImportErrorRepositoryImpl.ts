import { query, queryOne } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';
import { ImportError, type ImportErrorProps, type ImportErrorSeverity } from '../../domain/entities/ImportError';
import type { ImportErrorRepository } from '../../domain/repositories/MigrationRepository';

interface ImportErrorDbRow {
  importErrorId: string;
  importJobId: string;
  entityType: string;
  sourceId: string | null;
  severity: string;
  message: string;
  stackTrace: string | null;
  rawData: Record<string, unknown> | string | null;
  resolvedAt: Date | null;
  createdAt: Date;
}

export class ImportErrorRepositoryImpl implements ImportErrorRepository {
  async create(error: ImportError): Promise<ImportError> {
    const props = error.toJSON();
    await query(
      `INSERT INTO "${Table.ImportError}" (
        "importErrorId", "importJobId", "entityType", "sourceId", "severity",
        "message", "stackTrace", "rawData", "resolvedAt", "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        props.importErrorId, props.importJobId, props.entityType, props.sourceId, props.severity,
        props.message, props.stackTrace, JSON.stringify(props.rawData || {}),
        props.resolvedAt, props.createdAt,
      ],
    );
    return error;
  }

  async findById(importErrorId: string): Promise<ImportError | null> {
    const row = await queryOne<ImportErrorDbRow>(
      `SELECT * FROM "${Table.ImportError}" WHERE "importErrorId" = $1`,
      [importErrorId],
    );
    if (!row) return null;
    return ImportError.reconstitute(this.mapRowToProps(row));
  }

  async findByJob(importJobId: string, filters?: { severity?: string; resolved?: boolean }): Promise<ImportError[]> {
    let sql = `SELECT * FROM "${Table.ImportError}" WHERE "importJobId" = $1`;
    const params: unknown[] = [importJobId];
    if (filters?.severity) {
      params.push(filters.severity);
      sql += ` AND "severity" = $${params.length}`;
    }
    if (filters?.resolved !== undefined) {
      if (filters.resolved) {
        sql += ` AND "resolvedAt" IS NOT NULL`;
      } else {
        sql += ` AND "resolvedAt" IS NULL`;
      }
    }
    sql += ` ORDER BY "createdAt" DESC`;
    const rows = await query<ImportErrorDbRow[]>(sql, params as unknown[]);
    return (rows ?? []).map((r) => ImportError.reconstitute(this.mapRowToProps(r)));
  }

  async update(error: ImportError): Promise<ImportError> {
    const props = error.toJSON();
    await query(
      `UPDATE "${Table.ImportError}" SET "resolvedAt" = $2 WHERE "importErrorId" = $1`,
      [props.importErrorId, props.resolvedAt],
    );
    return error;
  }

  async deleteByJob(importJobId: string): Promise<boolean> {
    await query(
      `DELETE FROM "${Table.ImportError}" WHERE "importJobId" = $1`,
      [importJobId],
    );
    return true;
  }

  private mapRowToProps(row: ImportErrorDbRow): ImportErrorProps {
    return {
      importErrorId: row.importErrorId,
      importJobId: row.importJobId,
      entityType: row.entityType,
      sourceId: row.sourceId ?? undefined,
      severity: row.severity as ImportErrorSeverity,
      message: row.message,
      stackTrace: row.stackTrace ?? undefined,
      rawData: typeof row.rawData === 'string' ? JSON.parse(row.rawData) : row.rawData,
      resolvedAt: row.resolvedAt ?? undefined,
      createdAt: row.createdAt,
    };
  }
}
