/**
 * Audit Logging Service
 * Provides comprehensive audit trail for compliance and security
 * for the CommerceFull platform - Phase 8
 */

import { query, queryOne } from '../../../libs/db';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export interface AuditLog {
  auditLogId: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import' | 'custom';
  actorType: 'user' | 'admin' | 'system' | 'api';
  actorId?: string;
  actorEmail?: string;
  actorIp?: string;
  userAgent?: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  changedFields?: string[];
  metadata?: Record<string, any>;
  status: 'success' | 'failure' | 'pending';
  errorMessage?: string;
  duration?: number;
  createdAt: Date;
}

export interface AuditLogFilter {
  entityType?: string;
  entityId?: string;
  action?: string;
  actorType?: string;
  actorId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

export interface AuditLogCreateInput {
  entityType: string;
  entityId: string;
  action: AuditLog['action'];
  actorType: AuditLog['actorType'];
  actorId?: string;
  actorEmail?: string;
  actorIp?: string;
  userAgent?: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  metadata?: Record<string, any>;
  status?: AuditLog['status'];
  errorMessage?: string;
  duration?: number;
}

// ============================================================================
// Audit Log Creation
// ============================================================================

export async function createAuditLog(input: AuditLogCreateInput): Promise<AuditLog> {
  const auditLogId = uuidv4();
  const now = new Date();

  // Calculate changed fields if both previous and new data provided
  let changedFields: string[] = [];
  if (input.previousData && input.newData) {
    changedFields = calculateChangedFields(input.previousData, input.newData);
  }

  await query(
    `INSERT INTO "auditLog" (
      "auditLogId", "entityType", "entityId", "action", "actorType",
      "actorId", "actorEmail", "actorIp", "userAgent",
      "previousData", "newData", "changedFields", "metadata",
      "status", "errorMessage", "duration", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    [
      auditLogId,
      input.entityType,
      input.entityId,
      input.action,
      input.actorType,
      input.actorId || null,
      input.actorEmail || null,
      input.actorIp || null,
      input.userAgent || null,
      input.previousData ? JSON.stringify(input.previousData) : null,
      input.newData ? JSON.stringify(input.newData) : null,
      changedFields.length > 0 ? JSON.stringify(changedFields) : null,
      input.metadata ? JSON.stringify(input.metadata) : null,
      input.status || 'success',
      input.errorMessage || null,
      input.duration || null,
      now
    ]
  );

  return {
    auditLogId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    actorType: input.actorType,
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    actorIp: input.actorIp,
    userAgent: input.userAgent,
    previousData: input.previousData,
    newData: input.newData,
    changedFields,
    metadata: input.metadata,
    status: input.status || 'success',
    errorMessage: input.errorMessage,
    duration: input.duration,
    createdAt: now
  };
}

// ============================================================================
// Audit Log Retrieval
// ============================================================================

export async function getAuditLogs(
  filters: AuditLogFilter,
  pagination: { limit?: number; offset?: number } = {}
): Promise<{ data: AuditLog[]; total: number }> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.entityType) {
    conditions.push(`"entityType" = $${paramIndex++}`);
    params.push(filters.entityType);
  }

  if (filters.entityId) {
    conditions.push(`"entityId" = $${paramIndex++}`);
    params.push(filters.entityId);
  }

  if (filters.action) {
    conditions.push(`"action" = $${paramIndex++}`);
    params.push(filters.action);
  }

  if (filters.actorType) {
    conditions.push(`"actorType" = $${paramIndex++}`);
    params.push(filters.actorType);
  }

  if (filters.actorId) {
    conditions.push(`"actorId" = $${paramIndex++}`);
    params.push(filters.actorId);
  }

  if (filters.startDate) {
    conditions.push(`"createdAt" >= $${paramIndex++}`);
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    conditions.push(`"createdAt" <= $${paramIndex++}`);
    params.push(filters.endDate);
  }

  if (filters.status) {
    conditions.push(`"status" = $${paramIndex++}`);
    params.push(filters.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "auditLog" ${whereClause}`,
    params
  );

  // Get paginated data
  const limit = pagination.limit || 50;
  const offset = pagination.offset || 0;

  const rows = await query<Array<any>>(
    `SELECT * FROM "auditLog" ${whereClause}
     ORDER BY "createdAt" DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    data: (rows || []).map(mapToAuditLog),
    total: parseInt(countResult?.count || '0')
  };
}

export async function getAuditLogById(auditLogId: string): Promise<AuditLog | null> {
  const row = await queryOne<any>(
    `SELECT * FROM "auditLog" WHERE "auditLogId" = $1`,
    [auditLogId]
  );

  return row ? mapToAuditLog(row) : null;
}

export async function getEntityAuditHistory(
  entityType: string,
  entityId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  const rows = await query<Array<any>>(
    `SELECT * FROM "auditLog"
     WHERE "entityType" = $1 AND "entityId" = $2
     ORDER BY "createdAt" DESC
     LIMIT $3`,
    [entityType, entityId, limit]
  );

  return (rows || []).map(mapToAuditLog);
}

export async function getActorAuditHistory(
  actorId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  const rows = await query<Array<any>>(
    `SELECT * FROM "auditLog"
     WHERE "actorId" = $1
     ORDER BY "createdAt" DESC
     LIMIT $2`,
    [actorId, limit]
  );

  return (rows || []).map(mapToAuditLog);
}

// ============================================================================
// Audit Log Analytics
// ============================================================================

export async function getAuditSummary(
  startDate: Date,
  endDate: Date
): Promise<{
  totalActions: number;
  byAction: Record<string, number>;
  byEntityType: Record<string, number>;
  byActorType: Record<string, number>;
  failureRate: number;
}> {
  const summaryResult = await queryOne<{
    total: string;
    failures: string;
  }>(
    `SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'failure' THEN 1 END) as failures
     FROM "auditLog"
     WHERE "createdAt" >= $1 AND "createdAt" <= $2`,
    [startDate, endDate]
  );

  const byActionResult = await query<Array<{ action: string; count: string }>>(
    `SELECT action, COUNT(*) as count
     FROM "auditLog"
     WHERE "createdAt" >= $1 AND "createdAt" <= $2
     GROUP BY action`,
    [startDate, endDate]
  );

  const byEntityTypeResult = await query<Array<{ entityType: string; count: string }>>(
    `SELECT "entityType", COUNT(*) as count
     FROM "auditLog"
     WHERE "createdAt" >= $1 AND "createdAt" <= $2
     GROUP BY "entityType"`,
    [startDate, endDate]
  );

  const byActorTypeResult = await query<Array<{ actorType: string; count: string }>>(
    `SELECT "actorType", COUNT(*) as count
     FROM "auditLog"
     WHERE "createdAt" >= $1 AND "createdAt" <= $2
     GROUP BY "actorType"`,
    [startDate, endDate]
  );

  const total = parseInt(summaryResult?.total || '0');
  const failures = parseInt(summaryResult?.failures || '0');

  return {
    totalActions: total,
    byAction: (byActionResult || []).reduce((acc, row) => {
      acc[row.action] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>),
    byEntityType: (byEntityTypeResult || []).reduce((acc, row) => {
      acc[row.entityType] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>),
    byActorType: (byActorTypeResult || []).reduce((acc, row) => {
      acc[row.actorType] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>),
    failureRate: total > 0 ? (failures / total) * 100 : 0
  };
}

// ============================================================================
// Audit Log Cleanup
// ============================================================================

export async function deleteOldAuditLogs(retentionDays: number): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await query(
    `DELETE FROM "auditLog" WHERE "createdAt" < $1`,
    [cutoffDate]
  );

  // Return count of deleted rows (simplified - actual implementation would use RETURNING)
  return 0;
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateChangedFields(
  previousData: Record<string, any>,
  newData: Record<string, any>
): string[] {
  const changedFields: string[] = [];
  const allKeys = new Set([...Object.keys(previousData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    if (JSON.stringify(previousData[key]) !== JSON.stringify(newData[key])) {
      changedFields.push(key);
    }
  }

  return changedFields;
}

function mapToAuditLog(row: any): AuditLog {
  return {
    auditLogId: row.auditLogId,
    entityType: row.entityType,
    entityId: row.entityId,
    action: row.action,
    actorType: row.actorType,
    actorId: row.actorId,
    actorEmail: row.actorEmail,
    actorIp: row.actorIp,
    userAgent: row.userAgent,
    previousData: row.previousData ? (typeof row.previousData === 'string' ? JSON.parse(row.previousData) : row.previousData) : undefined,
    newData: row.newData ? (typeof row.newData === 'string' ? JSON.parse(row.newData) : row.newData) : undefined,
    changedFields: row.changedFields ? (typeof row.changedFields === 'string' ? JSON.parse(row.changedFields) : row.changedFields) : undefined,
    metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
    status: row.status,
    errorMessage: row.errorMessage,
    duration: row.duration,
    createdAt: new Date(row.createdAt)
  };
}

// ============================================================================
// Audit Middleware Helper
// ============================================================================

export function createAuditMiddleware(entityType: string) {
  return {
    logCreate: async (entityId: string, newData: any, actor: { id?: string; email?: string; ip?: string; type: AuditLog['actorType'] }) => {
      return createAuditLog({
        entityType,
        entityId,
        action: 'create',
        actorType: actor.type,
        actorId: actor.id,
        actorEmail: actor.email,
        actorIp: actor.ip,
        newData
      });
    },
    logUpdate: async (entityId: string, previousData: any, newData: any, actor: { id?: string; email?: string; ip?: string; type: AuditLog['actorType'] }) => {
      return createAuditLog({
        entityType,
        entityId,
        action: 'update',
        actorType: actor.type,
        actorId: actor.id,
        actorEmail: actor.email,
        actorIp: actor.ip,
        previousData,
        newData
      });
    },
    logDelete: async (entityId: string, previousData: any, actor: { id?: string; email?: string; ip?: string; type: AuditLog['actorType'] }) => {
      return createAuditLog({
        entityType,
        entityId,
        action: 'delete',
        actorType: actor.type,
        actorId: actor.id,
        actorEmail: actor.email,
        actorIp: actor.ip,
        previousData
      });
    },
    logRead: async (entityId: string, actor: { id?: string; email?: string; ip?: string; type: AuditLog['actorType'] }) => {
      return createAuditLog({
        entityType,
        entityId,
        action: 'read',
        actorType: actor.type,
        actorId: actor.id,
        actorEmail: actor.email,
        actorIp: actor.ip
      });
    }
  };
}
