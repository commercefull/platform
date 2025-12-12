/**
 * Content Navigation Repository
 * Handles database operations for content navigation and navigation items
 */

import { queryOne, query } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

// ============================================================================
// Interfaces
// ============================================================================

export interface ContentNavigation {
  id: string;
  name: string;
  slug: string;
  description?: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ContentNavigationItem {
  id: string;
  navigationId: string;
  parentId?: string;
  title: string;
  type: 'url' | 'page' | 'category' | 'product' | 'blog';
  url?: string;
  contentPageId?: string;
  targetId?: string;
  targetSlug?: string;
  icon?: string;
  cssClasses?: string;
  openInNewTab: boolean;
  isActive: boolean;
  sortOrder: number;
  conditions?: Record<string, any>;
  depth: number;
  createdAt: string;
  updatedAt: string;
}

export type ContentNavigationCreateParams = Omit<ContentNavigation, 'id' | 'createdAt' | 'updatedAt'>;
export type ContentNavigationUpdateParams = Partial<Omit<ContentNavigation, 'id' | 'createdAt' | 'updatedAt'>>;
export type ContentNavigationItemCreateParams = Omit<ContentNavigationItem, 'id' | 'createdAt' | 'updatedAt'>;
export type ContentNavigationItemUpdateParams = Partial<Omit<ContentNavigationItem, 'id' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Field Mappings
// ============================================================================

const navigationFields: Record<string, string> = {
  id: 'contentNavigationId',
  name: 'name',
  slug: 'slug',
  description: 'description',
  location: 'location',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  createdBy: 'createdBy',
  updatedBy: 'updatedBy'
};

const navigationItemFields: Record<string, string> = {
  id: 'contentNavigationItemId',
  navigationId: 'navigationId',
  parentId: 'parentId',
  title: 'title',
  type: 'type',
  url: 'url',
  contentPageId: 'contentPageId',
  targetId: 'targetId',
  targetSlug: 'targetSlug',
  icon: 'icon',
  cssClasses: 'cssClasses',
  openInNewTab: 'openInNewTab',
  isActive: 'isActive',
  sortOrder: 'sortOrder',
  conditions: 'conditions',
  depth: 'depth',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
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

export class ContentNavigationRepo {
  // Navigation methods
  async findNavigationById(id: string): Promise<ContentNavigation | null> {
    const result = await queryOne<any>(
      'SELECT * FROM "contentNavigation" WHERE "contentNavigationId" = $1',
      [id]
    );
    return transformDbToTs<ContentNavigation>(result, navigationFields);
  }

  async findNavigationBySlug(slug: string): Promise<ContentNavigation | null> {
    const result = await queryOne<any>(
      'SELECT * FROM "contentNavigation" WHERE "slug" = $1',
      [slug]
    );
    return transformDbToTs<ContentNavigation>(result, navigationFields);
  }

  async findNavigationByLocation(location: string): Promise<ContentNavigation | null> {
    const result = await queryOne<any>(
      'SELECT * FROM "contentNavigation" WHERE "location" = $1 AND "isActive" = true',
      [location]
    );
    return transformDbToTs<ContentNavigation>(result, navigationFields);
  }

  async findAllNavigations(isActive?: boolean): Promise<ContentNavigation[]> {
    let sql = 'SELECT * FROM "contentNavigation"';
    const params: any[] = [];

    if (isActive !== undefined) {
      sql += ' WHERE "isActive" = $1';
      params.push(isActive);
    }

    sql += ' ORDER BY "name" ASC';

    const results = await query<any[]>(sql, params);
    return transformArrayDbToTs<ContentNavigation>(results || [], navigationFields);
  }

  async createNavigation(params: ContentNavigationCreateParams): Promise<ContentNavigation> {
    const now = unixTimestamp();
    
    // Check slug uniqueness
    const existing = await this.findNavigationBySlug(params.slug);
    if (existing) {
      throw new Error(`Navigation with slug "${params.slug}" already exists`);
    }

    const result = await queryOne<any>(
      `INSERT INTO "contentNavigation" 
      ("name", "slug", "description", "location", "isActive", "createdAt", "updatedAt", "createdBy", "updatedBy") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        params.name,
        params.slug,
        params.description || null,
        params.location || null,
        params.isActive !== undefined ? params.isActive : true,
        now,
        now,
        params.createdBy || null,
        params.updatedBy || null
      ]
    );

    if (!result) {
      throw new Error('Failed to create navigation');
    }

    return transformDbToTs<ContentNavigation>(result, navigationFields);
  }

  async updateNavigation(id: string, params: ContentNavigationUpdateParams): Promise<ContentNavigation> {
    const now = unixTimestamp();
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

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
    if (params.location !== undefined) {
      updateFields.push(`"location" = $${paramIndex++}`);
      values.push(params.location);
    }
    if (params.isActive !== undefined) {
      updateFields.push(`"isActive" = $${paramIndex++}`);
      values.push(params.isActive);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);
    values.push(id);

    const result = await queryOne<any>(
      `UPDATE "contentNavigation" SET ${updateFields.join(', ')} WHERE "contentNavigationId" = $${paramIndex} RETURNING *`,
      values
    );

    if (!result) {
      throw new Error(`Failed to update navigation with ID ${id}`);
    }

    return transformDbToTs<ContentNavigation>(result, navigationFields);
  }

  async deleteNavigation(id: string): Promise<boolean> {
    // Delete all navigation items first
    await query('DELETE FROM "contentNavigationItem" WHERE "navigationId" = $1', [id]);
    
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "contentNavigation" WHERE "contentNavigationId" = $1 RETURNING "contentNavigationId"',
      [id]
    );
    return !!result;
  }

  // Navigation Item methods
  async findNavigationItemById(id: string): Promise<ContentNavigationItem | null> {
    const result = await queryOne<any>(
      'SELECT * FROM "contentNavigationItem" WHERE "contentNavigationItemId" = $1',
      [id]
    );
    return transformDbToTs<ContentNavigationItem>(result, navigationItemFields);
  }

  async findNavigationItems(navigationId: string, parentId?: string): Promise<ContentNavigationItem[]> {
    let sql = 'SELECT * FROM "contentNavigationItem" WHERE "navigationId" = $1';
    const params: any[] = [navigationId];

    if (parentId) {
      sql += ' AND "parentId" = $2';
      params.push(parentId);
    } else {
      sql += ' AND "parentId" IS NULL';
    }

    sql += ' ORDER BY "sortOrder" ASC';

    const results = await query<any[]>(sql, params);
    return transformArrayDbToTs<ContentNavigationItem>(results || [], navigationItemFields);
  }

  async findAllNavigationItems(navigationId: string): Promise<ContentNavigationItem[]> {
    const sql = 'SELECT * FROM "contentNavigationItem" WHERE "navigationId" = $1 ORDER BY "depth" ASC, "sortOrder" ASC';
    const results = await query<any[]>(sql, [navigationId]);
    return transformArrayDbToTs<ContentNavigationItem>(results || [], navigationItemFields);
  }

  async createNavigationItem(params: ContentNavigationItemCreateParams): Promise<ContentNavigationItem> {
    const now = unixTimestamp();
    
    const result = await queryOne<any>(
      `INSERT INTO "contentNavigationItem" 
      ("navigationId", "parentId", "title", "type", "url", "contentPageId", "targetId", 
       "targetSlug", "icon", "cssClasses", "openInNewTab", "isActive", "sortOrder", 
       "conditions", "depth", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
      RETURNING *`,
      [
        params.navigationId,
        params.parentId || null,
        params.title,
        params.type,
        params.url || null,
        params.contentPageId || null,
        params.targetId || null,
        params.targetSlug || null,
        params.icon || null,
        params.cssClasses || null,
        params.openInNewTab || false,
        params.isActive !== undefined ? params.isActive : true,
        params.sortOrder || 0,
        params.conditions ? JSON.stringify(params.conditions) : null,
        params.depth || 0,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create navigation item');
    }

    return transformDbToTs<ContentNavigationItem>(result, navigationItemFields);
  }

  async updateNavigationItem(id: string, params: ContentNavigationItemUpdateParams): Promise<ContentNavigationItem> {
    const now = unixTimestamp();
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.title !== undefined) {
      updateFields.push(`"title" = $${paramIndex++}`);
      values.push(params.title);
    }
    if (params.type !== undefined) {
      updateFields.push(`"type" = $${paramIndex++}`);
      values.push(params.type);
    }
    if (params.url !== undefined) {
      updateFields.push(`"url" = $${paramIndex++}`);
      values.push(params.url);
    }
    if (params.contentPageId !== undefined) {
      updateFields.push(`"contentPageId" = $${paramIndex++}`);
      values.push(params.contentPageId);
    }
    if (params.icon !== undefined) {
      updateFields.push(`"icon" = $${paramIndex++}`);
      values.push(params.icon);
    }
    if (params.openInNewTab !== undefined) {
      updateFields.push(`"openInNewTab" = $${paramIndex++}`);
      values.push(params.openInNewTab);
    }
    if (params.isActive !== undefined) {
      updateFields.push(`"isActive" = $${paramIndex++}`);
      values.push(params.isActive);
    }
    if (params.sortOrder !== undefined) {
      updateFields.push(`"sortOrder" = $${paramIndex++}`);
      values.push(params.sortOrder);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);
    values.push(id);

    const result = await queryOne<any>(
      `UPDATE "contentNavigationItem" SET ${updateFields.join(', ')} WHERE "contentNavigationItemId" = $${paramIndex} RETURNING *`,
      values
    );

    if (!result) {
      throw new Error(`Failed to update navigation item with ID ${id}`);
    }

    return transformDbToTs<ContentNavigationItem>(result, navigationItemFields);
  }

  async deleteNavigationItem(id: string): Promise<boolean> {
    // Delete child items first
    await query('DELETE FROM "contentNavigationItem" WHERE "parentId" = $1', [id]);
    
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "contentNavigationItem" WHERE "contentNavigationItemId" = $1 RETURNING "contentNavigationItemId"',
      [id]
    );
    return !!result;
  }

  async reorderNavigationItems(navigationId: string, itemOrders: Array<{ id: string; order: number }>): Promise<void> {
    const now = unixTimestamp();
    
    for (const item of itemOrders) {
      await query(
        'UPDATE "contentNavigationItem" SET "sortOrder" = $1, "updatedAt" = $2 WHERE "contentNavigationItemId" = $3 AND "navigationId" = $4',
        [item.order, now, item.id, navigationId]
      );
    }
  }
}
