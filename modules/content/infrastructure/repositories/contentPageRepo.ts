/**
 * Content Page Repository
 * Database operations for content pages and their store publications
 */

import { queryOne, query } from '../../../../libs/db';
import { ContentPage, ContentPagePublication } from '../../../../libs/db/types';
import type { ContentPublicationContext } from '../../domain/repositories/ContentRepository';
import { unixTimestamp } from '../../../../libs/date';
import {
  ContentPageNotFoundError,
  FailedToCreateContentError,
  SlugAlreadyExistsError,
} from '../../domain/errors/ContentErrors';
import type { ContentPage as DbContentPage } from '../../../../libs/db/types';
import type { ContentPagePublication as DbContentPagePublication } from '../../../../libs/db/types';
import type { ContentPageTranslation as DbContentPageTranslation } from '../../../../libs/db/types';
import { TABLES } from './contentTables';

export type ContentPageCreateParams = Partial<
  Omit<ContentPage, 'contentPageId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'publishedBy' | 'path' | 'depth'>
> & { title: string; slug: string; contentTypeId: string; status: ContentPage['status']; visibility: ContentPage['visibility'] };
export type ContentPageUpdateParams = Partial<
  Omit<ContentPage, 'contentPageId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'publishedBy'>
>;

export class ContentPageRepo {
  // Content Page methods
  async findPageById(id: string): Promise<ContentPage | null> {
    return queryOne<DbContentPage>(`SELECT * FROM "${TABLES.CONTENT_PAGE}" WHERE "contentPageId" = $1`, [id]);
  }

  async findPageBySlug(slug: string): Promise<ContentPage | null> {
    return queryOne<DbContentPage>(`SELECT * FROM "${TABLES.CONTENT_PAGE}" WHERE "slug" = $1`, [slug]);
  }

  async findHomePage(): Promise<ContentPage | null> {
    return queryOne<DbContentPage>(`SELECT * FROM "${TABLES.CONTENT_PAGE}" WHERE "isHomePage" = true LIMIT 1`);
  }

  async findAllPages(
    status?: ContentPage['status'],
    contentTypeId?: string,
    limit: number = 50,
    offset: number = 0,
    search?: string,
  ): Promise<ContentPage[]> {
    let sql = `SELECT * FROM "${TABLES.CONTENT_PAGE}"`;
    const whereConditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`"status" = $${paramIndex++}`);
      params.push(status);
    }

    if (contentTypeId) {
      whereConditions.push(`"contentTypeId" = $${paramIndex++}`);
      params.push(contentTypeId);
    }

    if (search) {
      whereConditions.push(`("title" ILIKE $${paramIndex++} OR "slug" ILIKE $${paramIndex++})`);
      params.push(`%${search}%`, `%${search}%`);
    }

    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }

    sql += ' ORDER BY "title" ASC LIMIT $' + paramIndex++ + ' OFFSET $' + paramIndex;
    params.push(limit, offset);

    const results = await query<DbContentPage[]>(sql, params);
    return results || [];
  }

  async createPage(params: ContentPageCreateParams): Promise<ContentPage> {
    const now = unixTimestamp();

    // If setting as home page, clear any existing home page
    if (params.isHomePage) {
      await query(`UPDATE "${TABLES.CONTENT_PAGE}" SET "isHomePage" = false WHERE "isHomePage" = true`);
    }

    // Validate slug uniqueness
    const existingPage = await this.findPageBySlug(params.slug);
    if (existingPage) {
      throw new SlugAlreadyExistsError(params.slug);
    }

    // Build dynamic insert - DB uses camelCase
    const fieldValues: unknown[] = [];
    const fieldNames: string[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        fieldNames.push(`"${key}"`);
        placeholders.push(`$${paramIndex++}`);

        // Special handling for JSON fields
        if (key === 'customFields') {
          fieldValues.push(JSON.stringify(value));
        } else {
          fieldValues.push(value);
        }
      }
    });

    // Add created_at and updated_at
    fieldNames.push('"createdAt"', '"updatedAt"');
    placeholders.push(`$${paramIndex++}`, `$${paramIndex++}`);
    fieldValues.push(now, now);

    const sqlQuery = `
      INSERT INTO "${TABLES.CONTENT_PAGE}" (${fieldNames.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await queryOne<DbContentPage>(sqlQuery, fieldValues);

    if (!result) {
      throw new FailedToCreateContentError('Failed to create content page');
    }

    return result;
  }

  async updatePage(id: string, params: ContentPageUpdateParams): Promise<ContentPage> {
    const now = unixTimestamp();
    const currentPage = await this.findPageById(id);

    if (!currentPage) {
      throw new ContentPageNotFoundError(id);
    }

    // If setting as home page, clear any existing home page
    if (params.isHomePage) {
      await query(`UPDATE "${TABLES.CONTENT_PAGE}" SET "isHomePage" = false WHERE "isHomePage" = true`);
    }

    // Check slug uniqueness if it's being updated
    if (params.slug && params.slug !== currentPage.slug) {
      const existingPage = await this.findPageBySlug(params.slug);
      if (existingPage && existingPage.contentPageId !== id) {
        throw new SlugAlreadyExistsError(params.slug);
      }
    }

    // Build dynamic update - DB uses camelCase
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);

        // Special handling for JSON fields
        if (key === 'customFields') {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    });

    // Always update the updated_at timestamp
    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);

    // Add ID for WHERE clause
    values.push(id);

    const sql = `
      UPDATE "${TABLES.CONTENT_PAGE}"
      SET ${updateFields.join(', ')}
      WHERE "contentPageId" = $${paramIndex}
      RETURNING *
    `;

    const result = await queryOne<DbContentPage>(sql, values);

    if (!result) {
      throw new FailedToCreateContentError(`Failed to update page with ID ${id}`);
    }

    return result;
  }

  async deletePage(id: string): Promise<boolean> {
    // Delete all content blocks associated with the page first
    await query(`DELETE FROM "${TABLES.CONTENT_BLOCK}" WHERE "contentPageId" = $1`, [id]);

    // Now delete the page
    const result = await queryOne<{ id: string }>(
      `DELETE FROM "${TABLES.CONTENT_PAGE}" WHERE "contentPageId" = $1 RETURNING "contentPageId" as id`,
      [id],
    );

    return !!result;
  }

  async publishPage(id: string): Promise<ContentPage> {
    const now = unixTimestamp();

    const result = await queryOne<DbContentPage>(
      `UPDATE "${TABLES.CONTENT_PAGE}"
       SET "status" = 'published', "publishedAt" = $1, "updatedAt" = $1
       WHERE "contentPageId" = $2
       RETURNING *`,
      [now, id],
    );

    if (!result) {
      throw new FailedToCreateContentError(`Failed to publish page with ID ${id}`);
    }

    return result;
  }

  // Content Page Publication methods

  async findPagePublications(contentPageId: string): Promise<ContentPagePublication[]> {
    const rows = await query<DbContentPagePublication[]>(
      `SELECT * FROM "${TABLES.CONTENT_PAGE_PUBLICATION}" WHERE "contentPageId" = $1 ORDER BY "createdAt" ASC`,
      [contentPageId],
    );
    return rows || [];
  }

  async createPagePublication(params: {
    contentPageId: string;
    storeId: string;
    channelId?: string | null;
    locale?: string | null;
  }): Promise<ContentPagePublication> {
    const now = unixTimestamp();
    const result = await queryOne<DbContentPagePublication>(
      `INSERT INTO "${TABLES.CONTENT_PAGE_PUBLICATION}"
         ("contentPageId", "storeId", "channelId", "locale", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $5)
       ON CONFLICT ("contentPageId", "storeId", "channelId", "locale") DO UPDATE SET "updatedAt" = $5
       RETURNING *`,
      [params.contentPageId, params.storeId, params.channelId ?? null, params.locale ?? null, now],
    );
    if (!result) {
      throw new FailedToCreateContentError(`Failed to publish page ${params.contentPageId} to store ${params.storeId}`);
    }
    return result;
  }

  async deletePagePublication(contentPagePublicationId: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      `DELETE FROM "${TABLES.CONTENT_PAGE_PUBLICATION}" WHERE "contentPagePublicationId" = $1 RETURNING "contentPagePublicationId" as id`,
      [contentPagePublicationId],
    );
    return !!result;
  }

  async findPagePublicationByContext(
    contentPageId: string,
    storeId: string,
    channelId?: string | null,
    locale?: string | null,
  ): Promise<ContentPagePublication | null> {
    return queryOne<DbContentPagePublication>(
      `SELECT * FROM "${TABLES.CONTENT_PAGE_PUBLICATION}"
       WHERE "contentPageId" = $1 AND "storeId" = $2
         AND "channelId" IS NOT DISTINCT FROM $3
         AND "locale" IS NOT DISTINCT FROM $4
       LIMIT 1`,
      [contentPageId, storeId, channelId ?? null, locale ?? null],
    );
  }

  private publicationVisibilityClause(context: ContentPublicationContext, paramStart: number): { sql: string; params: unknown[] } {
    // A page with no publication rows stays globally visible; otherwise a row
    // must match the resolved store/channel/locale (null publication fields
    // mean "all channels" / "all locales").
    return {
      sql: `(
        NOT EXISTS (
          SELECT 1 FROM "${TABLES.CONTENT_PAGE_PUBLICATION}" pp
          WHERE pp."contentPageId" = "${TABLES.CONTENT_PAGE}"."contentPageId"
        )
        OR EXISTS (
          SELECT 1 FROM "${TABLES.CONTENT_PAGE_PUBLICATION}" pp
          WHERE pp."contentPageId" = "${TABLES.CONTENT_PAGE}"."contentPageId"
            AND pp."storeId" = $${paramStart}
            AND (pp."channelId" IS NULL OR pp."channelId" = $${paramStart + 1})
            AND (pp."locale" IS NULL OR pp."locale" = $${paramStart + 2})
        )
      )`,
      params: [context.storeId ?? null, context.channelId ?? null, context.locale ?? null],
    };
  }

  async findPublishedPageBySlugForContext(slug: string, context: ContentPublicationContext): Promise<ContentPage | null> {
    // Translated slugs resolve first: a published translation for the
    // requested locale (exact `de-DE`, falling back to the `de` language
    // prefix) maps the slug back to its base page.
    if (context.locale) {
      const language = context.locale.split('-')[0];
      const clause = this.publicationVisibilityClause(context, 4);
      const translated = await queryOne<DbContentPage>(
        `SELECT "${TABLES.CONTENT_PAGE}".* FROM "${TABLES.CONTENT_PAGE}"
         JOIN "${TABLES.CONTENT_PAGE_TRANSLATION}" t
           ON t."contentPageId" = "${TABLES.CONTENT_PAGE}"."contentPageId"
         JOIN "locale" l ON l."localeId" = t."localeId"
         WHERE t."slug" = $1 AND t."isPublished" = true
           AND (l."code" = $2 OR l."language" = $3)
           AND "${TABLES.CONTENT_PAGE}"."status" = 'published' AND ${clause.sql}
         ORDER BY (l."code" = $2) DESC, "${TABLES.CONTENT_PAGE}"."updatedAt" DESC
         LIMIT 1`,
        [slug, context.locale, language, ...clause.params],
      );
      if (translated) {
        return this.overlayPageTranslation(translated, context.locale);
      }
    }

    const { sql, params } = this.publicationVisibilityClause(context, 2);
    const page = await queryOne<DbContentPage>(
      `SELECT * FROM "${TABLES.CONTENT_PAGE}"
       WHERE "slug" = $1 AND "status" = 'published' AND ${sql}
       ORDER BY "updatedAt" DESC
       LIMIT 1`,
      [slug, ...params],
    );
    if (page && context.locale) {
      return this.overlayPageTranslation(page, context.locale);
    }
    return page;
  }

  /**
   * Overlay a published translation's display fields onto the base page
   * for the requested locale (exact match preferred over language prefix).
   */
  private async overlayPageTranslation(page: ContentPage, locale: string): Promise<ContentPage> {
    const language = locale.split('-')[0];
    const translation = await queryOne<DbContentPageTranslation>(
      `SELECT t.* FROM "${TABLES.CONTENT_PAGE_TRANSLATION}" t
       JOIN "locale" l ON l."localeId" = t."localeId"
       WHERE t."contentPageId" = $1 AND t."isPublished" = true
         AND (l."code" = $2 OR l."language" = $3)
       ORDER BY (l."code" = $2) DESC
       LIMIT 1`,
      [page.contentPageId, locale, language],
    );
    if (!translation) return page;
    return {
      ...page,
      title: translation.title ?? page.title,
      summary: translation.summary ?? page.summary,
      metaTitle: translation.metaTitle ?? page.metaTitle,
      metaDescription: translation.metaDescription ?? page.metaDescription,
      metaKeywords: translation.metaKeywords ?? page.metaKeywords,
    };
  }

  async findPublishedPagesForContext(context: ContentPublicationContext, limit: number = 50, offset: number = 0): Promise<ContentPage[]> {
    const { sql, params } = this.publicationVisibilityClause(context, 3);
    const rows = await query<DbContentPage[]>(
      `SELECT * FROM "${TABLES.CONTENT_PAGE}"
       WHERE "status" = 'published' AND ${sql}
       ORDER BY "sortOrder" ASC, "publishedAt" DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset, ...params],
    );
    return rows || [];
  }
}
