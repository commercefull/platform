/**
 * Content Category Repository
 * Handles database operations for content categories
 */

import { queryOne, query } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

// ============================================================================
// Interfaces
// ============================================================================

export interface ContentCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  description?: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  sortOrder: number;
  isActive: boolean;
  path?: string;
  depth: number;
  createdAt: string;
  updatedAt: string;
}

export type ContentCategoryCreateParams = Omit<ContentCategory, 'id' | 'createdAt' | 'updatedAt'>;
export type ContentCategoryUpdateParams = Partial<Omit<ContentCategory, 'id' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Field Mappings
// ============================================================================

const categoryFields: Record<string, string> = {
  id: 'contentCategoryId',
  name: 'name',
  slug: 'slug',
  parentId: 'parentId',
  description: 'description',
  featuredImage: 'featuredImage',
  metaTitle: 'metaTitle',
  metaDescription: 'metaDescription',
  sortOrder: 'sortOrder',
  isActive: 'isActive',
  path: 'path',
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

export class ContentCategoryRepo {
  async findCategoryById(id: string): Promise<ContentCategory | null> {
    const result = await queryOne<any>(
      'SELECT * FROM "contentCategory" WHERE "contentCategoryId" = $1',
      [id]
    );
    return transformDbToTs<ContentCategory>(result, categoryFields);
  }

  async findCategoryBySlug(slug: string): Promise<ContentCategory | null> {
    const result = await queryOne<any>(
      'SELECT * FROM "contentCategory" WHERE "slug" = $1',
      [slug]
    );
    return transformDbToTs<ContentCategory>(result, categoryFields);
  }

  async findAllCategories(
    parentId?: string,
    isActive?: boolean,
    limit: number = 100,
    offset: number = 0
  ): Promise<ContentCategory[]> {
    let sql = 'SELECT * FROM "contentCategory"';
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (parentId !== undefined) {
      if (parentId === null || parentId === '') {
        conditions.push('"parentId" IS NULL');
      } else {
        conditions.push(`"parentId" = $${paramIndex++}`);
        params.push(parentId);
      }
    }

    if (isActive !== undefined) {
      conditions.push(`"isActive" = $${paramIndex++}`);
      params.push(isActive);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ` ORDER BY "sortOrder" ASC, "name" ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const results = await query<any[]>(sql, params);
    return transformArrayDbToTs<ContentCategory>(results || [], categoryFields);
  }

  async findRootCategories(isActive?: boolean): Promise<ContentCategory[]> {
    return this.findAllCategories(null as any, isActive);
  }

  async findChildCategories(parentId: string, isActive?: boolean): Promise<ContentCategory[]> {
    return this.findAllCategories(parentId, isActive);
  }

  async getCategoryTree(isActive?: boolean): Promise<ContentCategory[]> {
    let sql = 'SELECT * FROM "contentCategory"';
    const params: any[] = [];

    if (isActive !== undefined) {
      sql += ' WHERE "isActive" = $1';
      params.push(isActive);
    }

    sql += ' ORDER BY "depth" ASC, "sortOrder" ASC, "name" ASC';

    const results = await query<any[]>(sql, params);
    return transformArrayDbToTs<ContentCategory>(results || [], categoryFields);
  }

  async createCategory(params: ContentCategoryCreateParams): Promise<ContentCategory> {
    const now = unixTimestamp();
    
    // Check slug uniqueness within parent
    const existing = await queryOne<any>(
      'SELECT * FROM "contentCategory" WHERE "slug" = $1 AND ("parentId" = $2 OR ($2 IS NULL AND "parentId" IS NULL))',
      [params.slug, params.parentId || null]
    );
    if (existing) {
      throw new Error(`Category with slug "${params.slug}" already exists in this parent`);
    }

    // Calculate depth and path
    let depth = 0;
    let path = params.slug;
    
    if (params.parentId) {
      const parent = await this.findCategoryById(params.parentId);
      if (parent) {
        depth = parent.depth + 1;
        path = parent.path ? `${parent.path}/${params.slug}` : params.slug;
      }
    }

    const result = await queryOne<any>(
      `INSERT INTO "contentCategory" 
      ("name", "slug", "parentId", "description", "featuredImage", "metaTitle", 
       "metaDescription", "sortOrder", "isActive", "path", "depth", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING *`,
      [
        params.name,
        params.slug,
        params.parentId || null,
        params.description || null,
        params.featuredImage || null,
        params.metaTitle || null,
        params.metaDescription || null,
        params.sortOrder || 0,
        params.isActive !== undefined ? params.isActive : true,
        path,
        depth,
        now,
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create category');
    }

    return transformDbToTs<ContentCategory>(result, categoryFields);
  }

  async updateCategory(id: string, params: ContentCategoryUpdateParams): Promise<ContentCategory> {
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
    if (params.featuredImage !== undefined) {
      updateFields.push(`"featuredImage" = $${paramIndex++}`);
      values.push(params.featuredImage);
    }
    if (params.metaTitle !== undefined) {
      updateFields.push(`"metaTitle" = $${paramIndex++}`);
      values.push(params.metaTitle);
    }
    if (params.metaDescription !== undefined) {
      updateFields.push(`"metaDescription" = $${paramIndex++}`);
      values.push(params.metaDescription);
    }
    if (params.sortOrder !== undefined) {
      updateFields.push(`"sortOrder" = $${paramIndex++}`);
      values.push(params.sortOrder);
    }
    if (params.isActive !== undefined) {
      updateFields.push(`"isActive" = $${paramIndex++}`);
      values.push(params.isActive);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);
    values.push(id);

    const result = await queryOne<any>(
      `UPDATE "contentCategory" SET ${updateFields.join(', ')} WHERE "contentCategoryId" = $${paramIndex} RETURNING *`,
      values
    );

    if (!result) {
      throw new Error(`Failed to update category with ID ${id}`);
    }

    return transformDbToTs<ContentCategory>(result, categoryFields);
  }

  async deleteCategory(id: string): Promise<boolean> {
    // Check if category has children
    const childCount = await query<Array<{ count: string }>>(
      'SELECT COUNT(*) as count FROM "contentCategory" WHERE "parentId" = $1',
      [id]
    );

    if (childCount && childCount.length > 0 && parseInt(childCount[0].count) > 0) {
      throw new Error(`Cannot delete category as it has ${childCount[0].count} child categories`);
    }

    const result = await queryOne<{ id: string }>(
      'DELETE FROM "contentCategory" WHERE "contentCategoryId" = $1 RETURNING "contentCategoryId"',
      [id]
    );
    return !!result;
  }

  async moveCategory(id: string, newParentId: string | null): Promise<ContentCategory> {
    const category = await this.findCategoryById(id);
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }

    // Calculate new depth and path
    let depth = 0;
    let path = category.slug;
    
    if (newParentId) {
      const parent = await this.findCategoryById(newParentId);
      if (parent) {
        depth = parent.depth + 1;
        path = parent.path ? `${parent.path}/${category.slug}` : category.slug;
      }
    }

    return this.updateCategory(id, {
      parentId: newParentId || undefined,
      path,
      depth
    });
  }
}
