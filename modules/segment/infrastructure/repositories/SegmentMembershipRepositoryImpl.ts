import { query, queryOne } from '../../../../libs/db';
import type { SegmentMembershipRepository } from '../../domain/repositories/SegmentRepository';

export class SegmentMembershipRepositoryImpl implements SegmentMembershipRepository {
  async findBySegment(segmentId: string): Promise<{ customerId: string; matchScore: number | null }[]> {
    const rows = await query<{ customerId: string; matchScore: string | null }[]>(
      `SELECT "customerId", "matchScore" FROM "segmentMembership" WHERE "segmentId" = $1 AND "isActive" = true`,
      [segmentId],
    );
    return (rows || []).map(r => ({
      customerId: r.customerId,
      matchScore: r.matchScore ? parseFloat(r.matchScore) : null,
    }));
  }

  async findByCustomer(customerId: string): Promise<{ segmentId: string; matchScore: number | null }[]> {
    const rows = await query<{ segmentId: string; matchScore: string | null }[]>(
      `SELECT "segmentId", "matchScore" FROM "segmentMembership" WHERE "customerId" = $1 AND "isActive" = true`,
      [customerId],
    );
    return (rows || []).map(r => ({
      segmentId: r.segmentId,
      matchScore: r.matchScore ? parseFloat(r.matchScore) : null,
    }));
  }

  async upsert(segmentId: string, customerId: string, matchScore?: number): Promise<void> {
    await queryOne(
      `INSERT INTO "segmentMembership" ("segmentId", "customerId", "matchScore", "firstMatchedAt", "lastMatchedAt", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, NOW(), NOW(), true, NOW(), NOW())
       ON CONFLICT ("segmentId", "customerId") DO UPDATE SET
         "matchScore" = EXCLUDED."matchScore",
         "lastMatchedAt" = NOW(),
         "isActive" = true,
         "updatedAt" = NOW()`,
      [segmentId, customerId, matchScore ?? null],
    );
  }

  async remove(segmentId: string, customerId: string): Promise<void> {
    await query(
      `UPDATE "segmentMembership" SET "isActive" = false, "updatedAt" = NOW() WHERE "segmentId" = $1 AND "customerId" = $2`,
      [segmentId, customerId],
    );
  }

  async removeAllForSegment(segmentId: string): Promise<void> {
    await query(
      `UPDATE "segmentMembership" SET "isActive" = false, "updatedAt" = NOW() WHERE "segmentId" = $1`,
      [segmentId],
    );
  }

  async countBySegment(segmentId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "segmentMembership" WHERE "segmentId" = $1 AND "isActive" = true`,
      [segmentId],
    );
    return result ? parseInt(result.count, 10) : 0;
  }
}
