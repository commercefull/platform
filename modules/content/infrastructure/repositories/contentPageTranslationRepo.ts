/**
 * Content Page Translation Repository
 * Handles database operations for multi-language page translations
 */

import { queryOne, query } from '../../../../libs/db';
import { ContentPageTranslation } from '../../../../libs/db/types';

// ============================================================================
// Types
// ============================================================================

export type PageTranslationCreateParams = {
  contentPageId: string;
  localeId: string;
  title: string;
  slug?: string;
  summary?: string;
  content?: Record<string, unknown>;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  featuredImage?: string;
  isAutoTranslated?: boolean;
  translationSource?: string;
  isApproved?: boolean;
  isPublished?: boolean;
  publishedAt?: string;
};

export type PageTranslationUpdateParams = Partial<
  Omit<ContentPageTranslation, 'contentPageTranslationId' | 'createdAt' | 'updatedAt' | 'contentPageId' | 'localeId'>
>;

// ============================================================================
// Repository
// ============================================================================

export class ContentPageTranslationRepo {
  async findTranslationById(id: string): Promise<ContentPageTranslation | null> {
    return queryOne<ContentPageTranslation>(
      'SELECT * FROM "contentPageTranslation" WHERE "contentPageTranslationId" = $1',
      [id],
    );
  }

  async findTranslationsByPageId(pageId: string): Promise<ContentPageTranslation[]> {
    const results = await query<ContentPageTranslation[]>(
      'SELECT * FROM "contentPageTranslation" WHERE "contentPageId" = $1 ORDER BY "createdAt" ASC',
      [pageId],
    );
    return results || [];
  }

  async findTranslationByPageAndLocale(pageId: string, localeId: string): Promise<ContentPageTranslation | null> {
    return queryOne<ContentPageTranslation>(
      'SELECT * FROM "contentPageTranslation" WHERE "contentPageId" = $1 AND "localeId" = $2',
      [pageId, localeId],
    );
  }

  async findPublishedTranslationsByPageId(pageId: string): Promise<ContentPageTranslation[]> {
    const results = await query<ContentPageTranslation[]>(
      'SELECT * FROM "contentPageTranslation" WHERE "contentPageId" = $1 AND "isPublished" = true',
      [pageId],
    );
    return results || [];
  }

  async createTranslation(params: PageTranslationCreateParams): Promise<ContentPageTranslation> {
    // Check for existing translation for this page + locale
    const existing = await this.findTranslationByPageAndLocale(params.contentPageId, params.localeId);
    if (existing) {
      throw new Error(`Translation for page "${params.contentPageId}" and locale "${params.localeId}" already exists`);
    }

    const result = await queryOne<ContentPageTranslation>(
      `INSERT INTO "contentPageTranslation"
      ("contentPageId", "localeId", "title", "slug", "summary", "content",
       "metaTitle", "metaDescription", "metaKeywords", "openGraphTitle", "openGraphDescription",
       "featuredImage", "isAutoTranslated", "translationSource", "isApproved", "isPublished", "publishedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        params.contentPageId,
        params.localeId,
        params.title,
        params.slug || null,
        params.summary || null,
        params.content ? JSON.stringify(params.content) : null,
        params.metaTitle || null,
        params.metaDescription || null,
        params.metaKeywords || null,
        params.openGraphTitle || null,
        params.openGraphDescription || null,
        params.featuredImage || null,
        params.isAutoTranslated || false,
        params.translationSource || null,
        params.isApproved || false,
        params.isPublished || false,
        params.publishedAt || null,
      ],
    );

    if (!result) {
      throw new Error('Failed to create page translation');
    }

    return result;
  }

  async updateTranslation(id: string, params: PageTranslationUpdateParams): Promise<ContentPageTranslation> {
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      title: 'title',
      slug: 'slug',
      summary: 'summary',
      metaTitle: 'metaTitle',
      metaDescription: 'metaDescription',
      metaKeywords: 'metaKeywords',
      openGraphTitle: 'openGraphTitle',
      openGraphDescription: 'openGraphDescription',
      featuredImage: 'featuredImage',
      isAutoTranslated: 'isAutoTranslated',
      translationSource: 'translationSource',
      isApproved: 'isApproved',
      isPublished: 'isPublished',
      publishedAt: 'publishedAt',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      const value = (params as Record<string, unknown>)[key];
      if (value !== undefined) {
        updateFields.push(`"${dbField}" = $${paramIndex++}`);
        values.push(value);
      }
    }

    if (params.content !== undefined) {
      updateFields.push(`"content" = $${paramIndex++}`);
      values.push(params.content ? JSON.stringify(params.content) : null);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(new Date().toISOString());
    values.push(id);

    const result = await queryOne<ContentPageTranslation>(
      `UPDATE "contentPageTranslation" SET ${updateFields.join(', ')} WHERE "contentPageTranslationId" = $${paramIndex} RETURNING *`,
      values,
    );

    if (!result) {
      throw new Error(`Failed to update translation with ID ${id}`);
    }

    return result;
  }

  async deleteTranslation(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "contentPageTranslation" WHERE "contentPageTranslationId" = $1 RETURNING "contentPageTranslationId"',
      [id],
    );
    return !!result;
  }
}
