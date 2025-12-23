/**
 * Segment Repository Implementation
 * PostgreSQL implementation of the segment repository interface
 */

import { query, queryOne } from '../../../../libs/db';
import { Segment, SegmentType } from '../../domain/entities/Segment';
import {
  ISegmentRepository,
  SegmentFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/SegmentRepository';

export class SegmentRepository implements ISegmentRepository {
  async save(segment: Segment): Promise<Segment> {
    const props = segment.toPersistence();
    const now = new Date().toISOString();

    const existing = await queryOne<Record<string, any>>(
      'SELECT "segmentId" FROM segment WHERE "segmentId" = $1',
      [props.segmentId]
    );

    if (existing) {
      // Update
      await query(
        `UPDATE segment SET
          name = $1,
          description = $2,
          type = $3,
          rules = $4,
          "staticMemberIds" = $5,
          "evaluationFrequency" = $6,
          "lastEvaluatedAt" = $7,
          "memberCount" = $8,
          "isActive" = $9,
          metadata = $10,
          "updatedAt" = $11
        WHERE "segmentId" = $12`,
        [
          props.name,
          props.description || null,
          props.type,
          JSON.stringify(props.rules || []),
          JSON.stringify(props.staticMemberIds || []),
          props.evaluationFrequency,
          props.lastEvaluatedAt?.toISOString() || null,
          props.memberCount,
          props.isActive,
          props.metadata ? JSON.stringify(props.metadata) : null,
          now,
          props.segmentId,
        ]
      );
    } else {
      // Insert
      await query(
        `INSERT INTO segment (
          "segmentId", name, description, type, rules, "staticMemberIds",
          "evaluationFrequency", "lastEvaluatedAt", "memberCount", "isActive",
          metadata, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          props.segmentId,
          props.name,
          props.description || null,
          props.type,
          JSON.stringify(props.rules || []),
          JSON.stringify(props.staticMemberIds || []),
          props.evaluationFrequency,
          props.lastEvaluatedAt?.toISOString() || null,
          props.memberCount,
          props.isActive,
          props.metadata ? JSON.stringify(props.metadata) : null,
          now,
          now,
        ]
      );
    }

    const saved = await this.findById(props.segmentId);
    return saved!;
  }

  async findById(segmentId: string): Promise<Segment | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM segment WHERE "segmentId" = $1',
      [segmentId]
    );

    if (!row) return null;
    return this.mapToSegment(row);
  }

  async findAll(
    filters?: SegmentFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Segment>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const { whereClause, params } = this.buildWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM segment ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0', 10);

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM segment ${whereClause}
       ORDER BY name ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const data = (rows || []).map((row) => this.mapToSegment(row));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByCustomerId(customerId: string): Promise<Segment[]> {
    // Find segments where customer is a static member
    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM segment WHERE "staticMemberIds"::jsonb ? $1 AND "isActive" = true`,
      [customerId]
    );

    return (rows || []).map((row) => this.mapToSegment(row));
  }

  async delete(segmentId: string): Promise<boolean> {
    // First delete memberships
    await query('DELETE FROM "segmentMember" WHERE "segmentId" = $1', [segmentId]);

    const result = await query<{ rowCount?: number }>(
      'DELETE FROM segment WHERE "segmentId" = $1',
      [segmentId]
    );

    return (result as any)?.rowCount > 0;
  }

  // ===== Membership Operations =====

  async addMember(segmentId: string, customerId: string): Promise<void> {
    const existing = await queryOne<Record<string, any>>(
      'SELECT * FROM "segmentMember" WHERE "segmentId" = $1 AND "customerId" = $2',
      [segmentId, customerId]
    );

    if (!existing) {
      await query(
        `INSERT INTO "segmentMember" ("segmentId", "customerId", "addedAt")
         VALUES ($1, $2, NOW())`,
        [segmentId, customerId]
      );
    }
  }

  async removeMember(segmentId: string, customerId: string): Promise<void> {
    await query(
      'DELETE FROM "segmentMember" WHERE "segmentId" = $1 AND "customerId" = $2',
      [segmentId, customerId]
    );
  }

  async getMembers(
    segmentId: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<string>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const countResult = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM "segmentMember" WHERE "segmentId" = $1',
      [segmentId]
    );
    const total = parseInt(countResult?.count || '0', 10);

    const rows = await query<{ customerId: string }[]>(
      `SELECT "customerId" FROM "segmentMember" WHERE "segmentId" = $1
       ORDER BY "addedAt" DESC
       LIMIT $2 OFFSET $3`,
      [segmentId, limit, offset]
    );

    const data = (rows || []).map((row) => row.customerId);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async isMember(segmentId: string, customerId: string): Promise<boolean> {
    // Check dynamic membership table
    const memberRow = await queryOne<Record<string, any>>(
      'SELECT * FROM "segmentMember" WHERE "segmentId" = $1 AND "customerId" = $2',
      [segmentId, customerId]
    );

    if (memberRow) return true;

    // Check static membership
    const segment = await this.findById(segmentId);
    if (segment && segment.staticMemberIds.includes(customerId)) {
      return true;
    }

    return false;
  }

  // ===== Evaluation =====

  async evaluateSegment(segmentId: string): Promise<string[]> {
    const segment = await this.findById(segmentId);
    if (!segment) return [];

    // For static segments, return static members
    if (segment.type === 'static') {
      return segment.staticMemberIds;
    }

    // For dynamic segments, query based on rules
    // This is a simplified implementation - real implementation would
    // build dynamic queries based on segment rules
    const members = await this.getMembers(segmentId, { page: 1, limit: 10000 });
    return members.data;
  }

  async updateMemberCount(segmentId: string, count: number): Promise<void> {
    await query(
      `UPDATE segment SET "memberCount" = $1, "lastEvaluatedAt" = NOW(), "updatedAt" = NOW()
       WHERE "segmentId" = $2`,
      [count, segmentId]
    );
  }

  // ===== Helper Methods =====

  private buildWhereClause(filters?: SegmentFilters): {
    whereClause: string;
    params: any[];
  } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.type) {
      conditions.push(`type = $${params.length + 1}`);
      params.push(filters.type);
    }

    if (filters?.isActive !== undefined) {
      conditions.push(`"isActive" = $${params.length + 1}`);
      params.push(filters.isActive);
    }

    if (filters?.search) {
      conditions.push(
        `(name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`
      );
      params.push(`%${filters.search}%`);
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private mapToSegment(row: Record<string, any>): Segment {
    return Segment.fromPersistence({
      segmentId: row.segmentId,
      name: row.name,
      description: row.description || undefined,
      type: row.type as SegmentType,
      rules: this.parseJson(row.rules, []),
      staticMemberIds: this.parseJson(row.staticMemberIds, []),
      evaluationFrequency: row.evaluationFrequency,
      lastEvaluatedAt: row.lastEvaluatedAt ? new Date(row.lastEvaluatedAt) : undefined,
      memberCount: parseInt(row.memberCount || '0', 10),
      isActive: Boolean(row.isActive),
      metadata: row.metadata
        ? typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata
        : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  private parseJson<T>(value: any, defaultValue: T): T {
    if (!value) return defaultValue;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return defaultValue;
      }
    }
    return value;
  }
}

export const segmentRepository = new SegmentRepository();
export default segmentRepository;
