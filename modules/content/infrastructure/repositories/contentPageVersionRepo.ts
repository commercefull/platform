/**
 * Content Page Version Repository
 * Handles database operations for page versioning (snapshots, restore)
 */

import { queryOne, query } from '../../../../libs/db';
import { ContentPageVersion } from '../../../../libs/db/types';

// ============================================================================
// Types
// ============================================================================

export type PageVersionCreateParams = {
  contentPageId: string;
  title: string;
  status: string;
  summary?: string;
  content?: Record<string, unknown>;
  customFields?: Record<string, unknown>;
  comment?: string;
  createdBy?: string | null;
};

// ============================================================================
// Repository
// ============================================================================

export class ContentPageVersionRepo {
  async findVersionById(id: string): Promise<ContentPageVersion | null> {
    return queryOne<ContentPageVersion>('SELECT * FROM "contentPageVersion" WHERE "contentPageVersionId" = $1', [id]);
  }

  async findVersionsByPageId(pageId: string, limit: number = 50, offset: number = 0): Promise<ContentPageVersion[]> {
    const results = await query<ContentPageVersion[]>(
      'SELECT * FROM "contentPageVersion" WHERE "contentPageId" = $1 ORDER BY "version" DESC LIMIT $2 OFFSET $3',
      [pageId, limit, offset],
    );
    return results || [];
  }

  async findLatestVersion(pageId: string): Promise<ContentPageVersion | null> {
    return queryOne<ContentPageVersion>(
      'SELECT * FROM "contentPageVersion" WHERE "contentPageId" = $1 ORDER BY "version" DESC LIMIT 1',
      [pageId],
    );
  }

  async createVersion(params: PageVersionCreateParams): Promise<ContentPageVersion> {
    // Get the next version number
    const latest = await this.findLatestVersion(params.contentPageId);
    const nextVersion = latest ? latest.version + 1 : 1;

    const result = await queryOne<ContentPageVersion>(
      `INSERT INTO "contentPageVersion"
      ("contentPageId", "version", "title", "status", "summary", "content", "customFields", "comment", "createdBy")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        params.contentPageId,
        nextVersion,
        params.title,
        params.status,
        params.summary || null,
        params.content ? JSON.stringify(params.content) : null,
        params.customFields ? JSON.stringify(params.customFields) : null,
        params.comment || null,
        params.createdBy || null,
      ],
    );

    if (!result) {
      throw new Error('Failed to create page version');
    }

    return result;
  }

  async deleteVersion(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "contentPageVersion" WHERE "contentPageVersionId" = $1 RETURNING "contentPageVersionId"',
      [id],
    );
    return !!result;
  }
}
