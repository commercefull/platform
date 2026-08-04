/**
 * Content Categorization Repository
 * Handles database operations for linking pages to categories
 */

import { queryOne, query } from '../../../../libs/db';
import { ContentCategorization } from '../../../../libs/db/types';

// ============================================================================
// Types
// ============================================================================

export type CategorizationCreateParams = {
  contentPageId: string;
  categoryId: string;
  isPrimary?: boolean;
};

// ============================================================================
// Repository
// ============================================================================

export class ContentCategorizationRepo {
  async findCategorizationById(id: string): Promise<ContentCategorization | null> {
    return queryOne<ContentCategorization>(
      'SELECT * FROM "contentCategorization" WHERE "contentCategorizationId" = $1',
      [id],
    );
  }

  async findCategorizationsByPageId(pageId: string): Promise<ContentCategorization[]> {
    const results = await query<ContentCategorization[]>(
      'SELECT * FROM "contentCategorization" WHERE "contentPageId" = $1 ORDER BY "isPrimary" DESC, "createdAt" ASC',
      [pageId],
    );
    return results || [];
  }

  async findCategorizationsByCategoryId(categoryId: string, limit: number = 50, offset: number = 0): Promise<ContentCategorization[]> {
    const results = await query<ContentCategorization[]>(
      'SELECT * FROM "contentCategorization" WHERE "categoryId" = $1 ORDER BY "isPrimary" DESC, "createdAt" ASC LIMIT $2 OFFSET $3',
      [categoryId, limit, offset],
    );
    return results || [];
  }

  async findPrimaryCategory(pageId: string): Promise<ContentCategorization | null> {
    return queryOne<ContentCategorization>(
      'SELECT * FROM "contentCategorization" WHERE "contentPageId" = $1 AND "isPrimary" = true LIMIT 1',
      [pageId],
    );
  }

  async createCategorization(params: CategorizationCreateParams): Promise<ContentCategorization> {
    // If setting as primary, clear existing primary for this page
    if (params.isPrimary) {
      await query(
        'UPDATE "contentCategorization" SET "isPrimary" = false WHERE "contentPageId" = $1',
        [params.contentPageId],
      );
    }

    const result = await queryOne<ContentCategorization>(
      `INSERT INTO "contentCategorization" ("contentPageId", "categoryId", "isPrimary")
      VALUES ($1, $2, $3)
      RETURNING *`,
      [
        params.contentPageId,
        params.categoryId,
        params.isPrimary || false,
      ],
    );

    if (!result) {
      throw new Error('Failed to create categorization');
    }

    return result;
  }

  async setPrimaryCategory(pageId: string, categorizationId: string): Promise<ContentCategorization> {
    // Clear existing primary
    await query('UPDATE "contentCategorization" SET "isPrimary" = false WHERE "contentPageId" = $1', [pageId]);

    const result = await queryOne<ContentCategorization>(
      'UPDATE "contentCategorization" SET "isPrimary" = true, "updatedAt" = $1 WHERE "contentCategorizationId" = $2 AND "contentPageId" = $3 RETURNING *',
      [new Date().toISOString(), categorizationId, pageId],
    );

    if (!result) {
      throw new Error(`Failed to set primary category with ID ${categorizationId}`);
    }

    return result;
  }

  async deleteCategorization(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "contentCategorization" WHERE "contentCategorizationId" = $1 RETURNING "contentCategorizationId"',
      [id],
    );
    return !!result;
  }

  async deleteCategorizationByPageAndCategory(pageId: string, categoryId: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "contentCategorization" WHERE "contentPageId" = $1 AND "categoryId" = $2 RETURNING "contentCategorizationId"',
      [pageId, categoryId],
    );
    return !!result;
  }
}
