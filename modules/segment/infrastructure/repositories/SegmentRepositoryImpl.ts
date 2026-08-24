import { query, queryOne } from '../../../../libs/db';
import { SegmentDefinition } from '../../domain/entities/SegmentDefinition';
import type { SegmentRepository } from '../../domain/repositories/SegmentRepository';
import type { SegmentCondition, MatchMode } from '../../domain/entities/SegmentDefinition';
import { SegmentValidationError } from '../../domain/errors/SegmentErrors';

interface SegmentDbRow {
  segmentId: string;
  name: string;
  code: string;
  description: string | null;
  conditions: SegmentCondition[];
  matchMode: string;
  isActive: boolean;
  isSystem: boolean;
  color: string | null;
  icon: string | null;
  memberCount: number;
  lastEvaluatedAt: Date | null;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

function rowToEntity(row: SegmentDbRow): SegmentDefinition {
  return SegmentDefinition.reconstitute({
    ...row,
    matchMode: row.matchMode as MatchMode,
  });
}

export class SegmentRepositoryImpl implements SegmentRepository {
  async findById(id: string): Promise<SegmentDefinition | null> {
    const row = await queryOne<SegmentDbRow>(
      `SELECT * FROM "segmentDefinition" WHERE "segmentId" = $1 AND "deletedAt" IS NULL`,
      [id],
    );
    return row ? rowToEntity(row) : null;
  }

  async findByCode(code: string): Promise<SegmentDefinition | null> {
    const row = await queryOne<SegmentDbRow>(
      `SELECT * FROM "segmentDefinition" WHERE "code" = $1 AND "deletedAt" IS NULL`,
      [code],
    );
    return row ? rowToEntity(row) : null;
  }

  async findAll(activeOnly = false): Promise<SegmentDefinition[]> {
    let sql = `SELECT * FROM "segmentDefinition" WHERE "deletedAt" IS NULL`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    sql += ` ORDER BY "createdAt" DESC`;
    const rows = await query<SegmentDbRow[]>(sql);
    return (rows || []).map(rowToEntity);
  }

  async findByOrganization(organizationId: string, activeOnly = false): Promise<SegmentDefinition[]> {
    let sql = `SELECT * FROM "segmentDefinition" WHERE "organizationId" = $1 AND "deletedAt" IS NULL`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    sql += ` ORDER BY "createdAt" DESC`;
    const rows = await query<SegmentDbRow[]>(sql, [organizationId]);
    return (rows || []).map(rowToEntity);
  }

  async create(segment: SegmentDefinition): Promise<SegmentDefinition> {
    const props = segment.toJSON();
    const row = await queryOne<SegmentDbRow>(
      `INSERT INTO "segmentDefinition" (
        "name", "code", "description", "conditions", "matchMode",
        "isActive", "isSystem", "color", "icon", "memberCount",
        "lastEvaluatedAt", "organizationId", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        props.name,
        props.code,
        props.description,
        JSON.stringify(props.conditions),
        props.matchMode,
        props.isActive,
        props.isSystem,
        props.color,
        props.icon,
        props.memberCount,
        props.lastEvaluatedAt,
        props.organizationId,
        props.createdAt,
        props.updatedAt,
      ],
    );
    if (!row) throw new SegmentValidationError('Failed to create segment');
    return rowToEntity(row);
  }

  async update(segment: SegmentDefinition): Promise<SegmentDefinition | null> {
    const props = segment.toJSON();
    const row = await queryOne<SegmentDbRow>(
      `UPDATE "segmentDefinition" SET
        "name" = $1, "description" = $2, "conditions" = $3, "matchMode" = $4,
        "isActive" = $5, "color" = $6, "icon" = $7, "memberCount" = $8,
        "lastEvaluatedAt" = $9, "updatedAt" = NOW()
       WHERE "segmentId" = $10 AND "deletedAt" IS NULL RETURNING *`,
      [
        props.name,
        props.description,
        JSON.stringify(props.conditions),
        props.matchMode,
        props.isActive,
        props.color,
        props.icon,
        props.memberCount,
        props.lastEvaluatedAt,
        props.segmentId,
      ],
    );
    return row ? rowToEntity(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const row = await queryOne<{ segmentId: string }>(
      `UPDATE "segmentDefinition" SET "deletedAt" = NOW() WHERE "segmentId" = $1 AND "deletedAt" IS NULL RETURNING "segmentId"`,
      [id],
    );
    return !!row;
  }

  async activate(id: string): Promise<SegmentDefinition | null> {
    const row = await queryOne<SegmentDbRow>(
      `UPDATE "segmentDefinition" SET "isActive" = true, "updatedAt" = NOW() WHERE "segmentId" = $1 AND "deletedAt" IS NULL RETURNING *`,
      [id],
    );
    return row ? rowToEntity(row) : null;
  }

  async deactivate(id: string): Promise<SegmentDefinition | null> {
    const row = await queryOne<SegmentDbRow>(
      `UPDATE "segmentDefinition" SET "isActive" = false, "updatedAt" = NOW() WHERE "segmentId" = $1 AND "deletedAt" IS NULL RETURNING *`,
      [id],
    );
    return row ? rowToEntity(row) : null;
  }

  async count(activeOnly = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "segmentDefinition" WHERE "deletedAt" IS NULL`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    const result = await queryOne<{ count: string }>(sql);
    return result ? parseInt(result.count, 10) : 0;
  }
}
