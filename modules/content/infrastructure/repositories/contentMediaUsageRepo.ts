/**
 * Content Media Usage Repository
 * Tracks where media assets are used across entities (pages, blocks, products, etc.)
 */

import { queryOne, query } from '../../../../libs/db';
import { ContentMediaUsage } from '../../../../libs/db/types';
import { FailedToCreateContentError } from '../../domain/errors/ContentErrors';

// ============================================================================
// Types
// ============================================================================

export type MediaUsageCreateParams = {
  mediaId: string;
  entityType: 'contentPage' | 'contentBlock' | 'product' | 'category' | 'organization' | 'blog';
  entityId: string;
  field?: string;
  sortOrder?: number;
};

// ============================================================================
// Repository
// ============================================================================

export class ContentMediaUsageRepo {
  async findUsageById(id: string): Promise<ContentMediaUsage | null> {
    return queryOne<ContentMediaUsage>('SELECT * FROM "contentMediaUsage" WHERE "contentMediaUsageId" = $1', [id]);
  }

  async findUsageByMediaId(mediaId: string): Promise<ContentMediaUsage[]> {
    const results = await query<ContentMediaUsage[]>(
      'SELECT * FROM "contentMediaUsage" WHERE "mediaId" = $1 ORDER BY "createdAt" DESC',
      [mediaId],
    );
    return results || [];
  }

  async findUsageByEntity(entityType: string, entityId: string): Promise<ContentMediaUsage[]> {
    const results = await query<ContentMediaUsage[]>(
      'SELECT * FROM "contentMediaUsage" WHERE "entityType" = $1 AND "entityId" = $2 ORDER BY "sortOrder" ASC, "createdAt" DESC',
      [entityType, entityId],
    );
    return results || [];
  }

  async createUsage(params: MediaUsageCreateParams): Promise<ContentMediaUsage> {
    const result = await queryOne<ContentMediaUsage>(
      `INSERT INTO "contentMediaUsage" ("mediaId", "entityType", "entityId", "field", "sortOrder")
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT ("mediaId", "entityType", "entityId", "field") DO UPDATE SET "sortOrder" = EXCLUDED."sortOrder"
      RETURNING *`,
      [
        params.mediaId,
        params.entityType,
        params.entityId,
        params.field || null,
        params.sortOrder || 0,
      ],
    );

    if (!result) {
      throw new FailedToCreateContentError('Failed to create media usage');
    }

    return result;
  }

  async deleteUsage(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "contentMediaUsage" WHERE "contentMediaUsageId" = $1 RETURNING "contentMediaUsageId"',
      [id],
    );
    return !!result;
  }

  async deleteUsageByEntity(entityType: string, entityId: string): Promise<number> {
    const results = await query<{ id: string }[]>(
      'DELETE FROM "contentMediaUsage" WHERE "entityType" = $1 AND "entityId" = $2 RETURNING "contentMediaUsageId"',
      [entityType, entityId],
    );
    return results?.length || 0;
  }

  async getUsageCount(mediaId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM "contentMediaUsage" WHERE "mediaId" = $1',
      [mediaId],
    );
    return result ? parseInt(result.count) : 0;
  }
}
