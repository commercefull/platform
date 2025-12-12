/**
 * Content Media Repository
 * Handles database operations for content media and media folders
 */

import { queryOne, query } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

// ============================================================================
// Interfaces
// ============================================================================

export interface ContentMedia {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number;
  altText?: string;
  caption?: string;
  description?: string;
  folderId?: string;
  url: string;
  thumbnailUrl?: string;
  sortOrder: number;
  tags?: string[];
  isExternal: boolean;
  externalService?: string;
  externalId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ContentMediaFolder {
  id: string;
  name: string;
  parentId?: string;
  path?: string;
  depth: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export type ContentMediaCreateParams = Omit<ContentMedia, 'id' | 'createdAt' | 'updatedAt'>;
export type ContentMediaUpdateParams = Partial<Omit<ContentMedia, 'id' | 'createdAt' | 'updatedAt'>>;
export type ContentMediaFolderCreateParams = Omit<ContentMediaFolder, 'id' | 'createdAt' | 'updatedAt'>;
export type ContentMediaFolderUpdateParams = Partial<Omit<ContentMediaFolder, 'id' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Field Mappings
// ============================================================================

const mediaFields: Record<string, string> = {
  id: 'contentMediaId',
  title: 'title',
  fileName: 'fileName',
  filePath: 'filePath',
  fileType: 'fileType',
  fileSize: 'fileSize',
  width: 'width',
  height: 'height',
  duration: 'duration',
  altText: 'altText',
  caption: 'caption',
  description: 'description',
  folderId: 'contentMediaFolderId',
  url: 'url',
  thumbnailUrl: 'thumbnailUrl',
  sortOrder: 'sortOrder',
  tags: 'tags',
  isExternal: 'isExternal',
  externalService: 'externalService',
  externalId: 'externalId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdBy: 'createdBy',
  updatedBy: 'updatedBy'
};

const folderFields: Record<string, string> = {
  id: 'contentMediaFolderId',
  name: 'name',
  parentId: 'parentId',
  path: 'path',
  depth: 'depth',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdBy: 'createdBy',
  updatedBy: 'updatedBy'
};

// ============================================================================
// Transform Functions
// ============================================================================

function transformDbToTs<T>(dbRecord: any, fieldMap: Record<string, string>): T {
  if (!dbRecord) return null as any;
  
  const result: any = {};
  for (const [tsKey, dbKey] of Object.entries(fieldMap)) {
    if (dbRecord[dbKey] !== undefined) {
      result[tsKey] = dbRecord[dbKey];
    }
  }
  return result as T;
}

function transformArrayDbToTs<T>(dbRecords: any[], fieldMap: Record<string, string>): T[] {
  return dbRecords.map(record => transformDbToTs<T>(record, fieldMap));
}

// ============================================================================
// Repository
// ============================================================================

export class ContentMediaRepo {
  // Media methods
  async findMediaById(id: string): Promise<ContentMedia | null> {
    const result = await queryOne<any>(
      'SELECT * FROM "contentMedia" WHERE "contentMediaId" = $1',
      [id]
    );
    return transformDbToTs<ContentMedia>(result, mediaFields);
  }

  async findAllMedia(
    folderId?: string,
    fileType?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ContentMedia[]> {
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

    const results = await query<any[]>(sql, params);
    return transformArrayDbToTs<ContentMedia>(results || [], mediaFields);
  }

  async searchMedia(searchTerm: string, limit: number = 50): Promise<ContentMedia[]> {
    const sql = `
      SELECT * FROM "contentMedia" 
      WHERE "title" ILIKE $1 OR "fileName" ILIKE $1 OR "altText" ILIKE $1
      ORDER BY "createdAt" DESC 
      LIMIT $2
    `;
    const results = await query<any[]>(sql, [`%${searchTerm}%`, limit]);
    return transformArrayDbToTs<ContentMedia>(results || [], mediaFields);
  }

  async createMedia(params: ContentMediaCreateParams): Promise<ContentMedia> {
    const now = unixTimestamp();
    
    const result = await queryOne<any>(
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
        params.folderId || null,
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
        params.updatedBy || null
      ]
    );

    if (!result) {
      throw new Error('Failed to create media');
    }

    return transformDbToTs<ContentMedia>(result, mediaFields);
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
    if (params.folderId !== undefined) {
      updateFields.push(`"contentMediaFolderId" = $${paramIndex++}`);
      values.push(params.folderId);
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

    const result = await queryOne<any>(
      `UPDATE "contentMedia" SET ${updateFields.join(', ')} WHERE "contentMediaId" = $${paramIndex} RETURNING *`,
      values
    );

    if (!result) {
      throw new Error(`Failed to update media with ID ${id}`);
    }

    return transformDbToTs<ContentMedia>(result, mediaFields);
  }

  async deleteMedia(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "contentMedia" WHERE "contentMediaId" = $1 RETURNING "contentMediaId"',
      [id]
    );
    return !!result;
  }

  // Folder methods
  async findFolderById(id: string): Promise<ContentMediaFolder | null> {
    const result = await queryOne<any>(
      'SELECT * FROM "contentMediaFolder" WHERE "contentMediaFolderId" = $1',
      [id]
    );
    return transformDbToTs<ContentMediaFolder>(result, folderFields);
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

    const results = await query<any[]>(sql, params);
    return transformArrayDbToTs<ContentMediaFolder>(results || [], folderFields);
  }

  async createFolder(params: ContentMediaFolderCreateParams): Promise<ContentMediaFolder> {
    const now = unixTimestamp();
    
    const result = await queryOne<any>(
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
        params.updatedBy || null
      ]
    );

    if (!result) {
      throw new Error('Failed to create folder');
    }

    return transformDbToTs<ContentMediaFolder>(result, folderFields);
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

    const result = await queryOne<any>(
      `UPDATE "contentMediaFolder" SET ${updateFields.join(', ')} WHERE "contentMediaFolderId" = $${paramIndex} RETURNING *`,
      values
    );

    if (!result) {
      throw new Error(`Failed to update folder with ID ${id}`);
    }

    return transformDbToTs<ContentMediaFolder>(result, folderFields);
  }

  async deleteFolder(id: string): Promise<boolean> {
    // Check if folder has media
    const mediaCount = await query<Array<{ count: string }>>(
      'SELECT COUNT(*) as count FROM "contentMedia" WHERE "contentMediaFolderId" = $1',
      [id]
    );

    if (mediaCount && mediaCount.length > 0 && parseInt(mediaCount[0].count) > 0) {
      throw new Error(`Cannot delete folder as it contains ${mediaCount[0].count} media items`);
    }

    // Check if folder has subfolders
    const subfolderCount = await query<Array<{ count: string }>>(
      'SELECT COUNT(*) as count FROM "contentMediaFolder" WHERE "parentId" = $1',
      [id]
    );

    if (subfolderCount && subfolderCount.length > 0 && parseInt(subfolderCount[0].count) > 0) {
      throw new Error(`Cannot delete folder as it contains ${subfolderCount[0].count} subfolders`);
    }

    const result = await queryOne<{ id: string }>(
      'DELETE FROM "contentMediaFolder" WHERE "contentMediaFolderId" = $1 RETURNING "contentMediaFolderId"',
      [id]
    );
    return !!result;
  }
}
