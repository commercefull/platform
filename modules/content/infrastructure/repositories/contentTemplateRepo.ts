/**
 * Content Template Repository
 * Database operations for content templates
 */

import { queryOne, query } from '../../../../libs/db';
import { ContentTemplate } from '../../../../libs/db/types';
import { unixTimestamp } from '../../../../libs/date';
import {
  ContentTemplateNotFoundError,
  ContentValidationError,
  FailedToCreateContentError,
} from '../../domain/errors/ContentErrors';
import type { ContentTemplate as DbContentTemplate } from '../../../../libs/db/types';
import { TABLES } from './contentTables';

export type ContentTemplateCreateParams = Omit<ContentTemplate, 'contentTemplateId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
export type ContentTemplateUpdateParams = Partial<
  Omit<ContentTemplate, 'contentTemplateId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
>;

export class ContentTemplateRepo {
  // Content Template methods
  async findTemplateById(id: string): Promise<ContentTemplate | null> {
    return queryOne<DbContentTemplate>(`SELECT * FROM "${TABLES.CONTENT_TEMPLATE}" WHERE "contentTemplateId" = $1`, [id]);
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

    const results = await query<DbContentTemplate[]>(sql, params);
    return results || [];
  }

  async createTemplate(params: ContentTemplateCreateParams): Promise<ContentTemplate> {
    const now = unixTimestamp();

    const result = await queryOne<DbContentTemplate>(
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

    const result = await queryOne<DbContentTemplate>(sql, values);

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
}
