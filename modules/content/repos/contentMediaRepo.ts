/**
 * Content Media Repository
 * Handles database operations for content media and media folders
 */

import { queryOne, query } from '../../../libs/db';
import { ContentMedia, ContentMediaFolder } from '../../../libs/db/types';
import { unixTimestamp } from '../../../libs/date';

// ============================================================================
// Types
// ============================================================================

export type ContentMediaCreateParams = Omit<ContentMedia, 'contentMediaId' | 'createdAt' | 'updatedAt'>;
export type ContentMediaUpdateParams = Partial<Omit<ContentMedia, 'contentMediaId' | 'createdAt' | 'updatedAt'>>;
export type ContentMediaFolderCreateParams = Omit<ContentMediaFolder, 'contentMediaFolderId' | 'createdAt' | 'updatedAt'>;
export type ContentMediaFolderUpdateParams = Partial<Omit<ContentMediaFolder, 'contentMediaFolderId' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Repository
// ============================================================================

export class ContentMediaRepo {
  // Media methods
  async findMediaById(id: string): Promise<ContentMedia | null> {
    return queryOne<ContentMedia>('SELECT * FROM "contentMedia" WHERE "contentMediaId" = $1', [id]);
  }

  async findAllMedia(folderId?: string, fileType?: string, limit: number = 50, offset: number = 0): Promise<ContentMedia[]> {
    let sql = 'SELECT * FROM "contentMedia"';
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (folderId) {
      conditions.push(`"contentMediaFolderId" = $${paramIndex++}`);
      params.push(folderId);
    }

    if (fileType) {
      conditions.push(`"fileType" LIKE $${paramIndex++}`);
      params.push(`${fileType}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ` ORDER BY "sortOrder" ASC, "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const results = await query<ContentMedia[]>(sql, params);
    return results || [];
  }

  async searchMedia(searchTerm: string, limit: number = 50): Promise<ContentMedia[]> {
    const sql = `
      SELECT * FROM "contentMedia" 
      WHERE "title" ILIKE $1 OR "fileName" ILIKE $1 OR "altText" ILIKE $1
      ORDER BY "createdAt" DESC 
      LIMIT $2
    `;
    const results = await query<ContentMedia[]>(sql, [`%${searchTerm}%`, limit]);
    return results || [];
  }

  async createMedia(params: ContentMediaCreateParams): Promise<ContentMedia> {
    const now = unixTimestamp();

    const result = await queryOne<ContentMedia>(
      `INSERT INTO "contentMedia" 
      ("title", "fileName", "filePath", "fileType", "fileSize", "width", "height", 
       "duration", "altText", "caption", "description", "contentMediaFolderId", 
       "url", "thumbnailUrl", "sortOrder", "tags", "isExternal", "externalService", 
       "externalId", "createdAt", "updatedAt", "createdBy", "updatedBy") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) 
      RETURNING *`,
      [
        params.title,
        params.fileName,
        params.filePath,
        params.fileType,
        params.fileSize,
        params.width || null,
        params.height || null,
        params.duration || null,
        params.altText || null,
        params.caption || null,
        params.description || null,
        params.contentMediaFolderId || null,
        params.url,
        params.thumbnailUrl || null,
        params.sortOrder || 0,
        params.tags || null,
        params.isExternal || false,
        params.externalService || null,
        params.externalId || null,
        now,
        now,
        params.createdBy || null,
        params.updatedBy || null,
      ],
    );

    if (!result) {
      throw new Error('Failed to create media');
    }

    return result;
  }

  async updateMedia(id: string, params: ContentMediaUpdateParams): Promise<ContentMedia> {
    const now = unixTimestamp();
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.title !== undefined) {
      updateFields.push(`"title" = $${paramIndex++}`);
      values.push(params.title);
    }
    if (params.altText !== undefined) {
      updateFields.push(`"altText" = $${paramIndex++}`);
      values.push(params.altText);
    }
    if (params.caption !== undefined) {
      updateFields.push(`"caption" = $${paramIndex++}`);
      values.push(params.caption);
    }
    if (params.description !== undefined) {
      updateFields.push(`"description" = $${paramIndex++}`);
      values.push(params.description);
    }
    if (params.contentMediaFolderId !== undefined) {
      updateFields.push(`"contentMediaFolderId" = $${paramIndex++}`);
      values.push(params.contentMediaFolderId);
    }
    if (params.tags !== undefined) {
      updateFields.push(`"tags" = $${paramIndex++}`);
      values.push(params.tags);
    }
    if (params.sortOrder !== undefined) {
      updateFields.push(`"sortOrder" = $${paramIndex++}`);
      values.push(params.sortOrder);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);
    values.push(id);

    const result = await queryOne<ContentMedia>(
      `UPDATE "contentMedia" SET ${updateFields.join(', ')} WHERE "contentMediaId" = $${paramIndex} RETURNING *`,
      values,
    );

    if (!result) {
      throw new Error(`Failed to update media with ID ${id}`);
    }

    return result;
  }

  async deleteMedia(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>('DELETE FROM "contentMedia" WHERE "contentMediaId" = $1 RETURNING "contentMediaId"', [
      id,
    ]);
    return !!result;
  }

  // Folder methods
  async findFolderById(id: string): Promise<ContentMediaFolder | null> {
    return queryOne<ContentMediaFolder>('SELECT * FROM "contentMediaFolder" WHERE "contentMediaFolderId" = $1', [id]);
  }

  async findAllFolders(parentId?: string): Promise<ContentMediaFolder[]> {
    let sql = 'SELECT * FROM "contentMediaFolder"';
    const params: any[] = [];

    if (parentId) {
      sql += ' WHERE "parentId" = $1';
      params.push(parentId);
    } else {
      sql += ' WHERE "parentId" IS NULL';
    }

    sql += ' ORDER BY "sortOrder" ASC, "name" ASC';

    const results = await query<ContentMediaFolder[]>(sql, params);
    return results || [];
  }

  async createFolder(params: ContentMediaFolderCreateParams): Promise<ContentMediaFolder> {
    const now = unixTimestamp();

    const result = await queryOne<ContentMediaFolder>(
      `INSERT INTO "contentMediaFolder" 
      ("name", "parentId", "path", "depth", "sortOrder", "createdAt", "updatedAt", "createdBy", "updatedBy") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        params.name,
        params.parentId || null,
        params.path || null,
        params.depth || 0,
        params.sortOrder || 0,
        now,
        now,
        params.createdBy || null,
        params.updatedBy || null,
      ],
    );

    if (!result) {
      throw new Error('Failed to create folder');
    }

    return result;
  }

  async updateFolder(id: string, params: ContentMediaFolderUpdateParams): Promise<ContentMediaFolder> {
    const now = unixTimestamp();
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.name !== undefined) {
      updateFields.push(`"name" = $${paramIndex++}`);
      values.push(params.name);
    }
    if (params.parentId !== undefined) {
      updateFields.push(`"parentId" = $${paramIndex++}`);
      values.push(params.parentId);
    }
    if (params.sortOrder !== undefined) {
      updateFields.push(`"sortOrder" = $${paramIndex++}`);
      values.push(params.sortOrder);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);
    values.push(id);

    const result = await queryOne<ContentMediaFolder>(
      `UPDATE "contentMediaFolder" SET ${updateFields.join(', ')} WHERE "contentMediaFolderId" = $${paramIndex} RETURNING *`,
      values,
    );

    if (!result) {
      throw new Error(`Failed to update folder with ID ${id}`);
    }

    return result;
  }

  async deleteFolder(id: string): Promise<boolean> {
    // Check if folder has media
    const mediaCount = await query<Array<{ count: string }>>(
      'SELECT COUNT(*) as count FROM "contentMedia" WHERE "contentMediaFolderId" = $1',
      [id],
    );

    if (mediaCount && mediaCount.length > 0 && parseInt(mediaCount[0].count) > 0) {
      throw new Error(`Cannot delete folder as it contains ${mediaCount[0].count} media items`);
    }

    // Check if folder has subfolders
    const subfolderCount = await query<Array<{ count: string }>>(
      'SELECT COUNT(*) as count FROM "contentMediaFolder" WHERE "parentId" = $1',
      [id],
    );

    if (subfolderCount && subfolderCount.length > 0 && parseInt(subfolderCount[0].count) > 0) {
      throw new Error(`Cannot delete folder as it contains ${subfolderCount[0].count} subfolders`);
    }

    const result = await queryOne<{ id: string }>(
      'DELETE FROM "contentMediaFolder" WHERE "contentMediaFolderId" = $1 RETURNING "contentMediaFolderId"',
      [id],
    );
    return !!result;
  }
}
