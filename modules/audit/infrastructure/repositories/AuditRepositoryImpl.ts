/**
 * Audit Repository Implementation
 *
 * PostgreSQL implementation of AuditRepository.
 * Enforces append-only semantics — only INSERT and SELECT are used.
 * Hash chaining: each record's hash is computed from the previous record's hash.
 */

import { query, queryOne } from '../../../../libs/db';
import { logger } from '../../../../libs/logger';
import { AuditLog} from '../../domain/entities/AuditLog';
import type { AuditAction, ActorType, ResourceType } from '../../domain/enums/AuditAction';
import { AuditRepository, AuditLogFilters } from '../../domain/repositories/AuditRepository';
import type { PaginatedResult, PaginationOptions } from '../../../../libs/types/shared';
import { AuditLogWriteError } from '../../domain/errors/AuditErrors';

interface AuditLogRow {
  auditLogId: string;
  createdAt: Date;
  actorId: string;
  actorType: string;
  actorEmail: string | null;
  actorName: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  resourceName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
  organizationId: string | null;
  storeId: string | null;
  metadata: Record<string, unknown> | null;
  previousHash: string;
  hash: string;
}

function rowToEntity(row: AuditLogRow): AuditLog {
  return AuditLog.reconstitute({
    auditLogId: row.auditLogId,
    createdAt: row.createdAt,
    actorId: row.actorId,
    actorType: row.actorType as ActorType,
    actorEmail: row.actorEmail ?? undefined,
    actorName: row.actorName ?? undefined,
    action: row.action as AuditAction,
    resourceType: row.resourceType as ResourceType,
    resourceId: row.resourceId ?? undefined,
    resourceName: row.resourceName ?? undefined,
    ipAddress: row.ipAddress ?? undefined,
    userAgent: row.userAgent ?? undefined,
    correlationId: row.correlationId ?? undefined,
    organizationId: row.organizationId ?? undefined,
    storeId: row.storeId ?? undefined,
    metadata: row.metadata ?? undefined,
    previousHash: row.previousHash,
    hash: row.hash,
  });
}

export class AuditRepositoryImpl implements AuditRepository {
  async append(entry: AuditLog): Promise<AuditLog> {
    const sql = `INSERT INTO "auditLog"
      ("auditLogId", "createdAt", "actorId", "actorType", "actorEmail", "actorName",
       "action", "resourceType", "resourceId", "resourceName",
       "ipAddress", "userAgent", "correlationId", "organizationId", "storeId",
       "metadata", "previousHash", "hash")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`;

    const params = [
      entry.auditLogId,
      entry.createdAt,
      entry.actorId,
      entry.actorType,
      entry.actorEmail ?? null,
      entry.actorName ?? null,
      entry.action,
      entry.resourceType,
      entry.resourceId ?? null,
      entry.resourceName ?? null,
      entry.ipAddress ?? null,
      entry.userAgent ?? null,
      entry.correlationId ?? null,
      entry.organizationId ?? null,
      entry.storeId ?? null,
      JSON.stringify(entry.metadata ?? null),
      entry.previousHash,
      entry.hash,
    ];

    const row = await queryOne<AuditLogRow>(sql, params);
    if (!row) {
      throw new AuditLogWriteError('Failed to append audit log entry');
    }

    logger.debug('Audit log appended', { auditLogId: entry.auditLogId, action: entry.action });
    return rowToEntity(row);
  }

  async findById(auditLogId: string): Promise<AuditLog | null> {
    const row = await queryOne<AuditLogRow>(
      'SELECT * FROM "auditLog" WHERE "auditLogId" = $1',
      [auditLogId],
    );
    return row ? rowToEntity(row) : null;
  }

  async findAll(filters?: AuditLogFilters, pagination?: PaginationOptions): Promise<PaginatedResult<AuditLog>> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (filters) {
      if (filters.actorId) { conditions.push(`"actorId" = $${paramIdx++}`); params.push(filters.actorId); }
      if (filters.actorType) { conditions.push(`"actorType" = $${paramIdx++}`); params.push(filters.actorType); }
      if (filters.action) { conditions.push(`"action" = $${paramIdx++}`); params.push(filters.action); }
      if (filters.resourceType) { conditions.push(`"resourceType" = $${paramIdx++}`); params.push(filters.resourceType); }
      if (filters.resourceId) { conditions.push(`"resourceId" = $${paramIdx++}`); params.push(filters.resourceId); }
      if (filters.organizationId) { conditions.push(`"organizationId" = $${paramIdx++}`); params.push(filters.organizationId); }
      if (filters.storeId) { conditions.push(`"storeId" = $${paramIdx++}`); params.push(filters.storeId); }
      if (filters.correlationId) { conditions.push(`"correlationId" = $${paramIdx++}`); params.push(filters.correlationId); }
      if (filters.createdAfter) { conditions.push(`"createdAt" >= $${paramIdx++}`); params.push(filters.createdAfter); }
      if (filters.createdBefore) { conditions.push(`"createdAt" <= $${paramIdx++}`); params.push(filters.createdBefore); }
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;

    const countSql = `SELECT COUNT(*) as total FROM "auditLog" ${where}`;
    const countResult = await queryOne<{ total: string }>(countSql, params);
    const total = parseInt(countResult?.total ?? '0', 10);

    const dataSql = `SELECT * FROM "auditLog" ${where} ORDER BY "createdAt" DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    const rows = await query<AuditLogRow[]>(dataSql, [...params, limit, offset]);

    const data = (rows ?? []).map(rowToEntity);

    return {
      data,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
      length: data.length,
    };
  }

  async findByActor(actorId: string, pagination?: PaginationOptions): Promise<PaginatedResult<AuditLog>> {
    return this.findAll({ actorId }, pagination);
  }

  async findByResource(resourceType: ResourceType, resourceId: string, pagination?: PaginationOptions): Promise<PaginatedResult<AuditLog>> {
    return this.findAll({ resourceType, resourceId }, pagination);
  }

  async findByCorrelationId(correlationId: string): Promise<AuditLog[]> {
    const rows = await query<AuditLogRow[]>(
      'SELECT * FROM "auditLog" WHERE "correlationId" = $1 ORDER BY "createdAt" ASC',
      [correlationId],
    );
    return (rows ?? []).map(rowToEntity);
  }

  async getLatestHash(): Promise<string> {
    const row = await queryOne<{ hash: string }>(
      'SELECT "hash" FROM "auditLog" ORDER BY "createdAt" DESC, "auditLogId" DESC LIMIT 1',
    );
    return row?.hash ?? 'genesis';
  }

  async verifyChain(fromId?: string, toId?: string): Promise<{ valid: boolean; brokenAt?: string }> {
    let sql = 'SELECT * FROM "auditLog" ORDER BY "createdAt" ASC, "auditLogId" ASC';
    const params: unknown[] = [];

    if (fromId) {
      sql = `SELECT * FROM "auditLog" WHERE "createdAt" >= (SELECT "createdAt" FROM "auditLog" WHERE "auditLogId" = $1) ORDER BY "createdAt" ASC, "auditLogId" ASC`;
      params.push(fromId);
    }

    const rows = await query<AuditLogRow[]>(sql, params);
    if (!rows || rows.length === 0) {
      return { valid: true };
    }

    let expectedPreviousHash = rows[0].previousHash;
    for (const row of rows) {
      if (row.previousHash !== expectedPreviousHash) {
        return { valid: false, brokenAt: row.auditLogId };
      }

      const entity = rowToEntity(row);
      if (!entity.verifyHash()) {
        return { valid: false, brokenAt: row.auditLogId };
      }

      expectedPreviousHash = row.hash;

      if (toId && row.auditLogId === toId) break;
    }

    return { valid: true };
  }

  async countByAction(): Promise<Record<string, number>> {
    const rows = await query<{ action: string; count: string }[]>(
      'SELECT "action", COUNT(*) as count FROM "auditLog" GROUP BY "action" ORDER BY count DESC',
    );
    const result: Record<string, number> = {};
    for (const row of rows ?? []) {
      result[row.action] = parseInt(row.count, 10);
    }
    return result;
  }

  async countByActor(): Promise<Record<string, number>> {
    const rows = await query<{ actorId: string; count: string }[]>(
      'SELECT "actorId", COUNT(*) as count FROM "auditLog" GROUP BY "actorId" ORDER BY count DESC',
    );
    const result: Record<string, number> = {};
    for (const row of rows ?? []) {
      result[row.actorId] = parseInt(row.count, 10);
    }
    return result;
  }
}
