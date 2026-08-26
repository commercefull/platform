import { query, queryOne } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';
import { ImportMapping, type ImportMappingProps } from '../../domain/entities/ImportMapping';
import type { ImportMappingRepository } from '../../domain/repositories/MigrationRepository';

interface ImportMappingDbRow {
  importMappingId: string;
  importJobId: string;
  entityType: string;
  sourceId: string;
  platformId: string;
  sourceData: Record<string, unknown> | string | null;
  metadata: Record<string, unknown> | string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ImportMappingRepositoryImpl implements ImportMappingRepository {
  async create(mapping: ImportMapping): Promise<ImportMapping> {
    const props = mapping.toJSON();
    await query(
      `INSERT INTO "${Table.ImportMapping}" (
        "importMappingId", "importJobId", "entityType", "sourceId", "platformId",
        "sourceData", "metadata", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        props.importMappingId, props.importJobId, props.entityType, props.sourceId, props.platformId,
        JSON.stringify(props.sourceData || {}), JSON.stringify(props.metadata || {}),
        props.createdAt, props.updatedAt,
      ],
    );
    return mapping;
  }

  async findById(importMappingId: string): Promise<ImportMapping | null> {
    const row = await queryOne<ImportMappingDbRow>(
      `SELECT * FROM "${Table.ImportMapping}" WHERE "importMappingId" = $1`,
      [importMappingId],
    );
    if (!row) return null;
    return ImportMapping.reconstitute(this.mapRowToProps(row));
  }

  async findByJobAndSource(importJobId: string, entityType: string, sourceId: string): Promise<ImportMapping | null> {
    const row = await queryOne<ImportMappingDbRow>(
      `SELECT * FROM "${Table.ImportMapping}" WHERE "importJobId" = $1 AND "entityType" = $2 AND "sourceId" = $3`,
      [importJobId, entityType, sourceId],
    );
    if (!row) return null;
    return ImportMapping.reconstitute(this.mapRowToProps(row));
  }

  async findByJob(importJobId: string, entityType?: string): Promise<ImportMapping[]> {
    let sql = `SELECT * FROM "${Table.ImportMapping}" WHERE "importJobId" = $1`;
    const params: unknown[] = [importJobId];
    if (entityType) {
      params.push(entityType);
      sql += ` AND "entityType" = $${params.length}`;
    }
    const rows = await query<ImportMappingDbRow[]>(sql, params as unknown[]);
    return (rows ?? []).map((r) => ImportMapping.reconstitute(this.mapRowToProps(r)));
  }

  async findByPlatformId(entityType: string, platformId: string): Promise<ImportMapping | null> {
    const row = await queryOne<ImportMappingDbRow>(
      `SELECT * FROM "${Table.ImportMapping}" WHERE "entityType" = $1 AND "platformId" = $2`,
      [entityType, platformId],
    );
    if (!row) return null;
    return ImportMapping.reconstitute(this.mapRowToProps(row));
  }

  async deleteByJob(importJobId: string): Promise<boolean> {
    await query(
      `DELETE FROM "${Table.ImportMapping}" WHERE "importJobId" = $1`,
      [importJobId],
    );
    return true;
  }

  private mapRowToProps(row: ImportMappingDbRow): ImportMappingProps {
    return {
      importMappingId: row.importMappingId,
      importJobId: row.importJobId,
      entityType: row.entityType,
      sourceId: row.sourceId,
      platformId: row.platformId,
      sourceData: typeof row.sourceData === 'string' ? JSON.parse(row.sourceData) : row.sourceData,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
