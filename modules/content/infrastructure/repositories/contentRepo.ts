import { queryOne, query } from '../../../../libs/db';
import {
  Table,
  ContentType,
  ContentPage,
  ContentBlock,
  ContentBlockType,
  ContentTemplate,
  ContentPagePublication,
  ContentPageTranslation,
} from '../../../../libs/db/types';
import type { ContentPublicationContext } from '../../domain/repositories/ContentRepository';
import { unixTimestamp } from '../../../../libs/date';
import {
  ContentTypeNotFoundError,
  ContentPageNotFoundError,
  ContentBlockNotFoundError,
  ContentTemplateNotFoundError,
  ContentValidationError,
  FailedToCreateContentError,
  SlugAlreadyExistsError,
} from '../../domain/errors/ContentErrors';

// Table constants
const TABLES = {
  CONTENT_TYPE: Table.ContentType,
  CONTENT_PAGE: Table.ContentPage,
  CONTENT_BLOCK: Table.ContentBlock,
  CONTENT_BLOCK_TYPE: Table.ContentBlockType,
  CONTENT_TEMPLATE: Table.ContentTemplate,
  CONTENT_PAGE_PUBLICATION: Table.ContentPagePublication,
  CONTENT_PAGE_TRANSLATION: Table.ContentPageTranslation,
};

// Re-export generated types for convenience
export type { ContentType, ContentPage, ContentBlock, ContentTemplate };

// Create / Update params derived from generated types
type ContentTypeCreateParams = Omit<ContentType, 'contentTypeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
type ContentTypeUpdateParams = Partial<Omit<ContentType, 'contentTypeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;

type ContentPageCreateParams = Partial<
  Omit<ContentPage, 'contentPageId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'publishedBy' | 'path' | 'depth'>
> & { title: string; slug: string; contentTypeId: string; status: ContentPage['status']; visibility: ContentPage['visibility'] };
type ContentPageUpdateParams = Partial<
  Omit<ContentPage, 'contentPageId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'publishedBy'>
>;

type ContentBlockCreateParams = Omit<
  ContentBlock,
  | 'contentBlockId'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy'
  | 'parentBlockId'
  | 'cssClasses'
  | 'conditions'
  | 'settings'
  | 'area'
>;
type ContentBlockUpdateParams = Partial<Omit<ContentBlock, 'contentBlockId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;

type ContentTemplateCreateParams = Omit<ContentTemplate, 'contentTemplateId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
type ContentTemplateUpdateParams = Partial<
  Omit<ContentTemplate, 'contentTemplateId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
>;

export class ContentRepo {
  // Content Block Type methods
  async findBlockTypeById(id: string): Promise<ContentBlockType | null> {
    return queryOne<ContentBlockType>(`SELECT * FROM "${TABLES.CONTENT_BLOCK_TYPE}" WHERE "contentBlockTypeId" = $1`, [id]);
  }

  async findAllBlockTypes(isActive?: boolean, limit: number = 50, offset: number = 0): Promise<ContentBlockType[]> {
    let sql = `SELECT * FROM "${TABLES.CONTENT_BLOCK_TYPE}"`;
    const params: unknown[] = [];

    if (isActive !== undefined) {
      sql += ` WHERE "isActive" = $1`;
      params.push(isActive);
    }

    sql += ` ORDER BY "sortOrder" ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const results = await query<ContentBlockType[]>(sql, params);
    return results || [];
  }

  // Content Type methods
  async findContentTypeById(id: string): Promise<ContentType | null> {
    return queryOne<ContentType>(`SELECT * FROM "${TABLES.CONTENT_TYPE}" WHERE "contentTypeId" = $1`, [id]);
  }

  async findContentTypeBySlug(slug: string): Promise<ContentType | null> {
    return queryOne<ContentType>(`SELECT * FROM "${TABLES.CONTENT_TYPE}" WHERE "slug" = $1`, [slug]);
  }

  async findAllContentTypes(isActive?: boolean, limit: number = 50, offset: number = 0): Promise<ContentType[]> {
    let sql = `SELECT * FROM "${TABLES.CONTENT_TYPE}"`;
    const params: unknown[] = [];

    if (isActive !== undefined) {
      sql += ' WHERE "isActive" = $1';
      params.push(isActive);
    }

    sql += ' ORDER BY "name" ASC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const results = await query<ContentType[]>(sql, params);
    return results || [];
  }

  async createContentType(params: ContentTypeCreateParams): Promise<ContentType> {
    const now = unixTimestamp();

    // Validate slug uniqueness
    const existingType = await this.findContentTypeBySlug(params.slug);
    if (existingType) {
      throw new SlugAlreadyExistsError(params.slug);
    }

    const result = await queryOne<ContentType>(
      `INSERT INTO "${TABLES.CONTENT_TYPE}" 
      ("name", "slug", "description", "icon", "allowedBlocks", "defaultTemplate", 
       "requiredFields", "metaFields", "isSystem", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        params.name,
        params.slug,
        params.description || null,
        params.icon || null,
        params.allowedBlocks || null,
        params.defaultTemplate || null,
        params.requiredFields ? JSON.stringify(params.requiredFields) : null,
        params.metaFields ? JSON.stringify(params.metaFields) : null,
        params.isSystem || false,
        params.isActive !== undefined ? params.isActive : true,
        now,
        now,
      ],
    );

    if (!result) {
      throw new FailedToCreateContentError('Failed to create content type');
    }

    return result;
  }

  async updateContentType(id: string, params: ContentTypeUpdateParams): Promise<ContentType> {
    const now = unixTimestamp();
    const currentType = await this.findContentTypeById(id);

    if (!currentType) {
      throw new ContentTypeNotFoundError(id);
    }

    // Check slug uniqueness if it's being updated
    if (params.slug && params.slug !== currentType.slug) {
      const existingType = await this.findContentTypeBySlug(params.slug);
      if (existingType) {
        throw new SlugAlreadyExistsError(params.slug);
      }
    }

    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    // Build dynamic query
    if (params.name !== undefined) {
      updateFields.push(`"name" = $${paramIndex++}`);
      values.push(params.name);
    }
    if (params.slug !== undefined) {
      updateFields.push(`"slug" = $${paramIndex++}`);
      values.push(params.slug);
    }
    if (params.description !== undefined) {
      updateFields.push(`"description" = $${paramIndex++}`);
      values.push(params.description);
    }
    if (params.icon !== undefined) {
      updateFields.push(`"icon" = $${paramIndex++}`);
      values.push(params.icon);
    }
    if (params.requiredFields !== undefined) {
      updateFields.push(`"requiredFields" = $${paramIndex++}`);
      values.push(JSON.stringify(params.requiredFields));
    }
    if (params.metaFields !== undefined) {
      updateFields.push(`"metaFields" = $${paramIndex++}`);
      values.push(JSON.stringify(params.metaFields));
    }
    if (params.isActive !== undefined) {
      updateFields.push(`"isActive" = $${paramIndex++}`);
      values.push(params.isActive);
    }

    // Always update the updated_at timestamp
    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);

    // Add ID for WHERE clause
    values.push(id);

    const query = `
      UPDATE "${TABLES.CONTENT_TYPE}" 
      SET ${updateFields.join(', ')} 
      WHERE "contentTypeId" = $${paramIndex} 
      RETURNING *
    `;

    const result = await queryOne<ContentType>(query, values);

    if (!result) {
      throw new FailedToCreateContentError(`Failed to update content type with ID ${id}`);
    }

    return result;
  }

  async deleteContentType(id: string): Promise<boolean> {
    // Check if the content type is being used by any content blocks
    const blocksUsingType = await query<Array<{ count: string }>>(
      `SELECT COUNT(*) as count FROM "${TABLES.CONTENT_BLOCK}" WHERE "blockTypeId" = $1`,
      [id],
    );

    if (blocksUsingType && blocksUsingType.length > 0 && parseInt(blocksUsingType[0].count) > 0) {
      throw new ContentValidationError(`Cannot delete content type as it is being used by ${blocksUsingType[0].count} content blocks`);
    }

    const result = await queryOne<{ id: string }>(
      `DELETE FROM "${TABLES.CONTENT_TYPE}" WHERE "contentTypeId" = $1 RETURNING "contentTypeId" as id`,
      [id],
    );

    return !!result;
  }

  // Content Page methods
  async findPageById(id: string): Promise<ContentPage | null> {
    return queryOne<ContentPage>(`SELECT * FROM "${TABLES.CONTENT_PAGE}" WHERE "contentPageId" = $1`, [id]);
  }

  async findPageBySlug(slug: string): Promise<ContentPage | null> {
    return queryOne<ContentPage>(`SELECT * FROM "${TABLES.CONTENT_PAGE}" WHERE "slug" = $1`, [slug]);
  }

  async findHomePage(): Promise<ContentPage | null> {
    return queryOne<ContentPage>(`SELECT * FROM "${TABLES.CONTENT_PAGE}" WHERE "isHomePage" = true LIMIT 1`);
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

    const results = await query<ContentPage[]>(sql, params);
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

    const result = await queryOne<ContentPage>(sqlQuery, fieldValues);

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

    const result = await queryOne<ContentPage>(sql, values);

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

    const result = await queryOne<ContentPage>(
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
    const rows = await query<ContentPagePublication[]>(
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
    const result = await queryOne<ContentPagePublication>(
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
    return queryOne<ContentPagePublication>(
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
      const translated = await queryOne<ContentPage>(
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
    const page = await queryOne<ContentPage>(
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
    const translation = await queryOne<ContentPageTranslation>(
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
    const rows = await query<ContentPage[]>(
      `SELECT * FROM "${TABLES.CONTENT_PAGE}"
       WHERE "status" = 'published' AND ${sql}
       ORDER BY "sortOrder" ASC, "publishedAt" DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset, ...params],
    );
    return rows || [];
  }

  // Content Block methods
  async findBlockById(id: string): Promise<ContentBlock | null> {
    return queryOne<ContentBlock>(`SELECT * FROM "${TABLES.CONTENT_BLOCK}" WHERE "contentBlockId" = $1`, [id]);
  }

  async findBlocksByPageId(pageId: string): Promise<ContentBlock[]> {
    const results = await query<ContentBlock[]>(
      `SELECT * FROM "${TABLES.CONTENT_BLOCK}" WHERE "contentPageId" = $1 ORDER BY "sortOrder" ASC`,
      [pageId],
    );
    return results || [];
  }

  async createBlock(params: ContentBlockCreateParams): Promise<ContentBlock> {
    const now = unixTimestamp();

    // Validate that page exists
    const page = await this.findPageById(params.contentPageId);
    if (!page) {
      throw new ContentPageNotFoundError(params.contentPageId);
    }

    // Validate that block type exists
    const blockType = await this.findBlockTypeById(params.blockTypeId);
    if (!blockType) {
      throw new ContentTypeNotFoundError(params.blockTypeId);
    }

    const result = await queryOne<ContentBlock>(
      `INSERT INTO "${TABLES.CONTENT_BLOCK}" 
      ("contentPageId", "blockTypeId", "title", "area", "sortOrder", "content", "isVisible", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        params.contentPageId,
        params.blockTypeId,
        params.title || null,
        'main',
        params.sortOrder,
        JSON.stringify(params.content),
        params.isVisible,
        now,
        now,
      ],
    );

    if (!result) {
      throw new FailedToCreateContentError('Failed to create content block');
    }

    return result;
  }

  async updateBlock(id: string, params: ContentBlockUpdateParams): Promise<ContentBlock> {
    const now = unixTimestamp();
    const currentBlock = await this.findBlockById(id);

    if (!currentBlock) {
      throw new ContentBlockNotFoundError(id);
    }

    // Build dynamic query with DB column names
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        if (key === 'content' || key === 'settings' || key === 'conditions') {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    });

    // Always update the updatedAt timestamp
    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);

    // If no fields to update, just return the current block
    if (updateFields.length === 1) {
      return currentBlock;
    }

    // Add ID for WHERE clause
    values.push(id);

    const sql = `
      UPDATE "${TABLES.CONTENT_BLOCK}" 
      SET ${updateFields.join(', ')} 
      WHERE "contentBlockId" = $${paramIndex} 
      RETURNING *
    `;

    const result = await queryOne<ContentBlock>(sql, values);

    if (!result) {
      throw new FailedToCreateContentError(`Failed to update content block with ID ${id}`);
    }

    return result;
  }

  async deleteBlock(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      `DELETE FROM "${TABLES.CONTENT_BLOCK}" WHERE "contentBlockId" = $1 RETURNING "contentBlockId" as id`,
      [id],
    );

    return !!result;
  }

  // Content Template methods
  async findTemplateById(id: string): Promise<ContentTemplate | null> {
    return queryOne<ContentTemplate>(`SELECT * FROM "${TABLES.CONTENT_TEMPLATE}" WHERE "contentTemplateId" = $1`, [id]);
  }

  async findAllTemplates(isActive?: boolean, limit: number = 50, offset: number = 0): Promise<ContentTemplate[]> {
    let sql = `SELECT * FROM "${TABLES.CONTENT_TEMPLATE}"`;
    const whereConditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (isActive !== undefined) {
      whereConditions.push(`"isActive" = $${paramIndex++}`);
      params.push(isActive);
    }

    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }

    sql += ' ORDER BY "name" ASC LIMIT $' + paramIndex++ + ' OFFSET $' + paramIndex;
    params.push(limit, offset);

    const results = await query<ContentTemplate[]>(sql, params);
    return results || [];
  }

  async createTemplate(params: ContentTemplateCreateParams): Promise<ContentTemplate> {
    const now = unixTimestamp();

    const result = await queryOne<ContentTemplate>(
      `INSERT INTO "${TABLES.CONTENT_TEMPLATE}" 
      ("name", "slug", "description", "thumbnail", "htmlStructure", "cssStyles", "jsScripts", 
       "areas", "defaultBlocks", "compatibleContentTypes", "isSystem", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING *`,
      [
        params.name,
        params.slug,
        params.description || null,
        params.thumbnail || null,
        params.htmlStructure || null,
        params.cssStyles || null,
        params.jsScripts || null,
        params.areas ? JSON.stringify(params.areas) : null,
        params.defaultBlocks ? JSON.stringify(params.defaultBlocks) : null,
        params.compatibleContentTypes || null,
        params.isSystem || false,
        params.isActive !== undefined ? params.isActive : true,
        now,
        now,
      ],
    );

    if (!result) {
      throw new FailedToCreateContentError('Failed to create content template');
    }

    return result;
  }

  async updateTemplate(id: string, params: ContentTemplateUpdateParams): Promise<ContentTemplate> {
    const now = unixTimestamp();
    const currentTemplate = await this.findTemplateById(id);

    if (!currentTemplate) {
      throw new ContentTemplateNotFoundError(id);
    }

    // Build dynamic query
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        if (key === 'areas' || key === 'defaultBlocks') {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    });

    // Always update the updatedAt timestamp
    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);

    // If no fields to update, just return the current template
    if (updateFields.length === 1) {
      return currentTemplate;
    }

    // Add ID for WHERE clause
    values.push(id);

    const sql = `
      UPDATE "${TABLES.CONTENT_TEMPLATE}" 
      SET ${updateFields.join(', ')} 
      WHERE "contentTemplateId" = $${paramIndex} 
      RETURNING *
    `;

    const result = await queryOne<ContentTemplate>(sql, values);

    if (!result) {
      throw new FailedToCreateContentError(`Failed to update content template with ID ${id}`);
    }

    return result;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    // Check if any pages are using this template
    const pagesUsingTemplate = await query<Array<{ count: string }>>(
      `SELECT COUNT(*) as count FROM "${TABLES.CONTENT_PAGE}" WHERE "templateId" = $1`,
      [id],
    );

    if (pagesUsingTemplate && pagesUsingTemplate.length > 0 && parseInt(pagesUsingTemplate[0].count) > 0) {
      throw new ContentValidationError(`Cannot delete template as it is being used by ${pagesUsingTemplate[0].count} pages`);
    }

    const result = await queryOne<{ id: string }>(
      `DELETE FROM "${TABLES.CONTENT_TEMPLATE}" WHERE "contentTemplateId" = $1 RETURNING "contentTemplateId" as id`,
      [id],
    );

    return !!result;
  }

  /**
   * Reorders content blocks for a specific page
   * @param pageId The ID of the page
   * @param blockOrders Array of {id, order} objects representing new block ordering
   * @returns Promise resolving to true if successful
   */
  async reorderBlocks(pageId: string, blockOrders: Array<{ id: string; order: number }>): Promise<boolean> {
    // Verify page exists
    const page = await this.findPageById(pageId);
    if (!page) {
      throw new ContentPageNotFoundError(pageId);
    }

    // Process each block order update individually
    for (const blockOrder of blockOrders) {
      // Verify block exists and belongs to this page
      const block = await this.findBlockById(blockOrder.id);
      if (!block) {
        throw new ContentBlockNotFoundError(blockOrder.id);
      }

      if (block.contentPageId !== pageId) {
        throw new ContentValidationError(`Block with ID ${blockOrder.id} does not belong to page ${pageId}`);
      }

      // Update the block order
      await query(`UPDATE "${TABLES.CONTENT_BLOCK}" SET "sortOrder" = $1, "updatedAt" = $2 WHERE "contentBlockId" = $3`, [
        blockOrder.order,
        unixTimestamp(),
        blockOrder.id,
      ]);
    }

    return true;
  }
}

export default new ContentRepo();
