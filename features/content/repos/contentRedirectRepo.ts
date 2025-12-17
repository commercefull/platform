/**
 * Content Redirect Repository
 * Handles database operations for URL redirects
 */

import { queryOne, query } from '../../../libs/db';
import { ContentRedirect } from '../../../libs/db/types';
import { unixTimestamp } from '../../../libs/date';

// ============================================================================
// Types
// ============================================================================

export type ContentRedirectCreateParams = Omit<ContentRedirect, 'contentRedirectId' | 'hits' | 'lastUsed' | 'createdAt' | 'updatedAt'>;
export type ContentRedirectUpdateParams = Partial<Omit<ContentRedirect, 'contentRedirectId' | 'hits' | 'lastUsed' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Repository
// ============================================================================

export class ContentRedirectRepo {
  async findRedirectById(id: string): Promise<ContentRedirect | null> {
    return queryOne<ContentRedirect>(
      'SELECT * FROM "contentRedirect" WHERE "contentRedirectId" = $1',
      [id]
    );
  }

  async findRedirectBySourceUrl(sourceUrl: string): Promise<ContentRedirect | null> {
    return queryOne<ContentRedirect>(
      'SELECT * FROM "contentRedirect" WHERE "sourceUrl" = $1 AND "isActive" = true',
      [sourceUrl]
    );
  }

  async findMatchingRedirect(url: string): Promise<ContentRedirect | null> {
    // First try exact match
    const exactMatch = await this.findRedirectBySourceUrl(url);
    if (exactMatch) {
      return exactMatch;
    }

    // Then try regex matches
    const regexRedirects = await query<ContentRedirect[]>(
      'SELECT * FROM "contentRedirect" WHERE "isRegex" = true AND "isActive" = true'
    );

    if (regexRedirects) {
      for (const redirect of regexRedirects) {
        try {
          const regex = new RegExp(redirect.sourceUrl);
          if (regex.test(url)) {
            return redirect;
          }
        } catch {
          // Invalid regex, skip
        }
      }
    }

    return null;
  }

  async findAllRedirects(
    isActive?: boolean,
    limit: number = 100,
    offset: number = 0
  ): Promise<ContentRedirect[]> {
    let sql = 'SELECT * FROM "contentRedirect"';
    const params: any[] = [];
    let paramIndex = 1;

    if (isActive !== undefined) {
      sql += ` WHERE "isActive" = $${paramIndex++}`;
      params.push(isActive);
    }

    sql += ` ORDER BY "hits" DESC, "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const results = await query<ContentRedirect[]>(sql, params);
    return results || [];
  }

  async createRedirect(params: ContentRedirectCreateParams): Promise<ContentRedirect> {
    const now = unixTimestamp();
    
    // Check for duplicate source URL
    const existing = await queryOne<ContentRedirect>(
      'SELECT * FROM "contentRedirect" WHERE "sourceUrl" = $1',
      [params.sourceUrl]
    );
    if (existing) {
      throw new Error(`Redirect for source URL "${params.sourceUrl}" already exists`);
    }

    // Validate regex if isRegex is true
    if (params.isRegex) {
      try {
        new RegExp(params.sourceUrl);
      } catch {
        throw new Error('Invalid regex pattern in source URL');
      }
    }

    const result = await queryOne<ContentRedirect>(
      `INSERT INTO "contentRedirect" 
      ("sourceUrl", "targetUrl", "statusCode", "isRegex", "isActive", "hits", "notes", 
       "createdAt", "updatedAt", "createdBy", "updatedBy") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        params.sourceUrl,
        params.targetUrl,
        params.statusCode || '301',
        params.isRegex || false,
        params.isActive !== undefined ? params.isActive : true,
        0, // hits
        params.notes || null,
        now,
        now,
        params.createdBy || null,
        params.updatedBy || null
      ]
    );

    if (!result) {
      throw new Error('Failed to create redirect');
    }

    return result;
  }

  async updateRedirect(id: string, params: ContentRedirectUpdateParams): Promise<ContentRedirect> {
    const now = unixTimestamp();
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.sourceUrl !== undefined) {
      updateFields.push(`"sourceUrl" = $${paramIndex++}`);
      values.push(params.sourceUrl);
    }
    if (params.targetUrl !== undefined) {
      updateFields.push(`"targetUrl" = $${paramIndex++}`);
      values.push(params.targetUrl);
    }
    if (params.statusCode !== undefined) {
      updateFields.push(`"statusCode" = $${paramIndex++}`);
      values.push(params.statusCode);
    }
    if (params.isRegex !== undefined) {
      updateFields.push(`"isRegex" = $${paramIndex++}`);
      values.push(params.isRegex);
    }
    if (params.isActive !== undefined) {
      updateFields.push(`"isActive" = $${paramIndex++}`);
      values.push(params.isActive);
    }
    if (params.notes !== undefined) {
      updateFields.push(`"notes" = $${paramIndex++}`);
      values.push(params.notes);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);
    values.push(id);

    const result = await queryOne<ContentRedirect>(
      `UPDATE "contentRedirect" SET ${updateFields.join(', ')} WHERE "contentRedirectId" = $${paramIndex} RETURNING *`,
      values
    );

    if (!result) {
      throw new Error(`Failed to update redirect with ID ${id}`);
    }

    return result;
  }

  async deleteRedirect(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "contentRedirect" WHERE "contentRedirectId" = $1 RETURNING "contentRedirectId"',
      [id]
    );
    return !!result;
  }

  async recordHit(id: string): Promise<void> {
    const now = unixTimestamp();
    await query(
      'UPDATE "contentRedirect" SET "hits" = "hits" + 1, "lastUsed" = $1 WHERE "contentRedirectId" = $2',
      [now, id]
    );
  }

  async getTopRedirects(limit: number = 10): Promise<ContentRedirect[]> {
    const results = await query<ContentRedirect[]>(
      'SELECT * FROM "contentRedirect" WHERE "isActive" = true ORDER BY "hits" DESC LIMIT $1',
      [limit]
    );
    return results || [];
  }

  async getRecentRedirects(limit: number = 10): Promise<ContentRedirect[]> {
    const results = await query<ContentRedirect[]>(
      'SELECT * FROM "contentRedirect" WHERE "lastUsed" IS NOT NULL ORDER BY "lastUsed" DESC LIMIT $1',
      [limit]
    );
    return results || [];
  }
}
