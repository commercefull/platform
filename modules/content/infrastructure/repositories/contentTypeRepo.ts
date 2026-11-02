/**
 * Content Type Repository
 * Database operations for content types and content block types
 */

import { queryOne, query } from '../../../../libs/db';
import { ContentType, ContentBlockType } from '../../../../libs/db/types';
import { unixTimestamp } from '../../../../libs/date';
import {
  ContentTypeNotFoundError,
  ContentValidationError,
  FailedToCreateContentError,
  SlugAlreadyExistsError,
} from '../../domain/errors/ContentErrors';
import type { ContentBlockType as DbContentBlockType } from '../../../../libs/db/types';
import type { ContentType as DbContentType } from '../../../../libs/db/types';
import { TABLES } from './contentTables';

export type ContentTypeCreateParams = Omit<ContentType, 'contentTypeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
export type ContentTypeUpdateParams = Partial<Omit<ContentType, 'contentTypeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;

export class ContentTypeRepo {
  // Content Block Type methods
  async findBlockTypeById(id: string): Promise<ContentBlockType | null> {
    return queryOne<DbContentBlockType>(`SELECT * FROM "${TABLES.CONTENT_BLOCK_TYPE}" WHERE "contentBlockTypeId" = $1`, [id]);
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

    const results = await query<DbContentBlockType[]>(sql, params);
    return results || [];
  }

  // Content Type methods
  async findContentTypeById(id: string): Promise<ContentType | null> {
    return queryOne<DbContentType>(`SELECT * FROM "${TABLES.CONTENT_TYPE}" WHERE "contentTypeId" = $1`, [id]);
  }

  async findContentTypeBySlug(slug: string): Promise<ContentType | null> {
    return queryOne<DbContentType>(`SELECT * FROM "${TABLES.CONTENT_TYPE}" WHERE "slug" = $1`, [slug]);
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

    const results = await query<DbContentType[]>(sql, params);
    return results || [];
  }

  async createContentType(params: ContentTypeCreateParams): Promise<ContentType> {
    const now = unixTimestamp();

    // Validate slug uniqueness
    const existingType = await this.findContentTypeBySlug(params.slug);
    if (existingType) {
      throw new SlugAlreadyExistsError(params.slug);
    }

    const result = await queryOne<DbContentType>(
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

    const result = await queryOne<DbContentType>(query, values);

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
}
