import { query, queryOne } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';
import { ImportJob, type ImportJobProps, type ImportJobStatus, type ImportJobType, type ImportSource } from '../../domain/entities/ImportJob';
import type { ImportJobRepository } from '../../domain/repositories/MigrationRepository';

interface ImportJobDbRow {
  importJobId: string;
  organizationId: string;
  jobType: string;
  source: string;
  status: string;
  sourceStoreUrl: string | null;
  sourceApiKey: string | null;
  sourceConfig: Record<string, unknown> | string | null;
  stats: Record<string, unknown> | string;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  dryRun: boolean;
  autoActivate: boolean;
  metadata: Record<string, unknown> | string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ImportJobRepositoryImpl implements ImportJobRepository {
  async create(job: ImportJob): Promise<ImportJob> {
    const props = job.toJSON();
    await query(
      `INSERT INTO "${Table.ImportJob}" (
        "importJobId", "organizationId", "jobType", "source", "status",
        "sourceStoreUrl", "sourceApiKey", "sourceConfig", "stats",
        "startedAt", "completedAt", "errorMessage", "dryRun", "autoActivate",
        "metadata", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        props.importJobId, props.organizationId, props.jobType, props.source, props.status,
        props.sourceStoreUrl, props.sourceApiKey, JSON.stringify(props.sourceConfig || {}),
        JSON.stringify(props.stats),
        props.startedAt, props.completedAt, props.errorMessage, props.dryRun, props.autoActivate,
        JSON.stringify(props.metadata || {}),
        props.createdAt, props.updatedAt,
      ],
    );
    return job;
  }

  async findById(importJobId: string): Promise<ImportJob | null> {
    const row = await queryOne<ImportJobDbRow>(
      `SELECT * FROM "${Table.ImportJob}" WHERE "importJobId" = $1`,
      [importJobId],
    );
    if (!row) return null;
    return ImportJob.reconstitute(this.mapRowToProps(row));
  }

  async findByOrganization(organizationId: string, filters?: { status?: ImportJobStatus; jobType?: ImportJobType }): Promise<ImportJob[]> {
    let sql = `SELECT * FROM "${Table.ImportJob}" WHERE "organizationId" = $1`;
    const params: unknown[] = [organizationId];
    if (filters?.status) {
      params.push(filters.status);
      sql += ` AND "status" = $${params.length}`;
    }
    if (filters?.jobType) {
      params.push(filters.jobType);
      sql += ` AND "jobType" = $${params.length}`;
    }
    sql += ` ORDER BY "createdAt" DESC`;
    const rows = await query<ImportJobDbRow[]>(sql, params as unknown[]);
    return (rows ?? []).map((r) => ImportJob.reconstitute(this.mapRowToProps(r)));
  }

  async update(job: ImportJob): Promise<ImportJob> {
    const props = job.toJSON();
    await query(
      `UPDATE "${Table.ImportJob}" SET
        "status" = $2, "stats" = $3, "startedAt" = $4, "completedAt" = $5,
        "errorMessage" = $6, "updatedAt" = $7
      WHERE "importJobId" = $1`,
      [
        props.importJobId, props.status, JSON.stringify(props.stats),
        props.startedAt, props.completedAt, props.errorMessage, props.updatedAt,
      ],
    );
    return job;
  }

  async delete(importJobId: string): Promise<boolean> {
    const result = await queryOne<{ importJobId: string }>(
      `DELETE FROM "${Table.ImportJob}" WHERE "importJobId" = $1 RETURNING "importJobId"`,
      [importJobId],
    );
    return !!result;
  }

  private mapRowToProps(row: ImportJobDbRow): ImportJobProps {
    return {
      importJobId: row.importJobId,
      organizationId: row.organizationId,
      jobType: row.jobType as ImportJobType,
      source: row.source as ImportSource,
      status: row.status as ImportJobStatus,
      sourceStoreUrl: row.sourceStoreUrl ?? undefined,
      sourceApiKey: row.sourceApiKey ?? undefined,
      sourceConfig: typeof row.sourceConfig === 'string' ? JSON.parse(row.sourceConfig) : row.sourceConfig ?? undefined,
      stats: typeof row.stats === 'string' ? JSON.parse(row.stats) : row.stats,
      startedAt: row.startedAt ?? undefined,
      completedAt: row.completedAt ?? undefined,
      errorMessage: row.errorMessage ?? undefined,
      dryRun: row.dryRun,
      autoActivate: row.autoActivate,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
