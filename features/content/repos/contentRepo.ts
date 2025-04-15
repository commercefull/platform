import { queryOne, query } from "../../../libs/db";
import { unixTimestamp } from "../../../libs/date";

// Content Type defines the structure of content blocks
export interface ContentType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  schema: Record<string, any>; // JSON schema defining the content structure
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// ContentPage represents a full page with a collection of content blocks
export interface ContentPage {
  id: string;
  title: string;
  slug: string;
  contentTypeId: string;
  templateId?: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  visibility: 'public' | 'private' | 'password_protected';
  accessPassword?: string;
  summary?: string;
  featuredImage?: string;
  parentId?: string;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  openGraphImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  customFields?: Record<string, any>;
  publishedAt?: string;
  scheduledAt?: string;
  expiresAt?: string;
  isHomePage?: boolean;
  path?: string;
  depth?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// ContentBlock represents a single content section within a page
export interface ContentBlock {
  id: string;
  pageId: string;
  contentTypeId: string;
  name: string;
  order: number;
  content: Record<string, any>; // JSON content matching the type schema
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// ContentTemplate provides reusable page layouts and section templates
export interface ContentTemplate {
  id: string;
  name: string;
  type: 'layout' | 'section';
  description?: string;
  structure: Record<string, any>; // Template definition
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Field mapping dictionaries for database to TypeScript conversion
const contentTypeFields: Record<string, string> = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  schema: 'schema',
  status: 'status',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const contentPageFields: Record<string, string> = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  contentTypeId: 'content_type_id',
  templateId: 'template_id',
  status: 'status',
  visibility: 'visibility', 
  accessPassword: 'access_password',
  summary: 'summary',
  featuredImage: 'featured_image',
  parentId: 'parent_id',
  sortOrder: 'sort_order',
  metaTitle: 'meta_title',
  metaDescription: 'meta_description',
  metaKeywords: 'meta_keywords',
  openGraphImage: 'open_graph_image',
  canonicalUrl: 'canonical_url',
  noIndex: 'no_index',
  customFields: 'custom_fields',
  publishedAt: 'published_at',
  scheduledAt: 'scheduled_at',
  expiresAt: 'expires_at',
  isHomePage: 'is_home_page',
  path: 'path',
  depth: 'depth',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  createdBy: 'created_by'
};

const contentBlockFields: Record<string, string> = {
  id: 'id',
  pageId: 'page_id',
  contentTypeId: 'content_type_id',
  name: 'name',
  order: 'order',
  content: 'content',
  status: 'status',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const contentTemplateFields: Record<string, string> = {
  id: 'id',
  name: 'name',
  type: 'type',
  description: 'description',
  structure: 'structure',
  status: 'status',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

/**
 * Transform a database record to a TypeScript object using field mapping
 */
function transformDbToTs<T>(dbRecord: any, fieldMap: Record<string, string>): T {
  if (!dbRecord) return null as any;
  
  const result: any = {};
  
  Object.entries(fieldMap).forEach(([tsKey, dbKey]) => {
    if (dbRecord[dbKey] !== undefined) {
      result[tsKey] = dbRecord[dbKey];
    }
  });
  
  return result as T;
}

/**
 * Transform an array of database records to TypeScript objects
 */
function transformArrayDbToTs<T>(dbRecords: any[], fieldMap: Record<string, string>): T[] {
  if (!dbRecords || !Array.isArray(dbRecords)) return [];
  return dbRecords.map(record => transformDbToTs<T>(record, fieldMap));
}

type ContentTypeCreateParams = Omit<ContentType, 'id' | 'createdAt' | 'updatedAt'>;
type ContentTypeUpdateParams = Partial<Omit<ContentType, 'id' | 'createdAt' | 'updatedAt'>>;

type ContentPageCreateParams = Omit<ContentPage, 'id' | 'createdAt' | 'updatedAt'>;
type ContentPageUpdateParams = Partial<Omit<ContentPage, 'id' | 'createdAt' | 'updatedAt'>>;

type ContentBlockCreateParams = Omit<ContentBlock, 'id' | 'createdAt' | 'updatedAt'>;
type ContentBlockUpdateParams = Partial<Omit<ContentBlock, 'id' | 'createdAt' | 'updatedAt'>>;

type ContentTemplateCreateParams = Omit<ContentTemplate, 'id' | 'createdAt' | 'updatedAt'>;
type ContentTemplateUpdateParams = Partial<Omit<ContentTemplate, 'id' | 'createdAt' | 'updatedAt'>>;

export class ContentRepo {
  // Content Type methods
  async findContentTypeById(id: string): Promise<ContentType | null> {
    const result = await queryOne<any>('SELECT * FROM "public"."content_type" WHERE "id" = $1', [id]);
    return transformDbToTs<ContentType>(result, contentTypeFields);
  }

  async findContentTypeBySlug(slug: string): Promise<ContentType | null> {
    const result = await queryOne<any>('SELECT * FROM "public"."content_type" WHERE "slug" = $1', [slug]);
    return transformDbToTs<ContentType>(result, contentTypeFields);
  }

  async findAllContentTypes(status?: ContentType['status'], limit: number = 50, offset: number = 0): Promise<ContentType[]> {
    let sql = 'SELECT * FROM "public"."content_type"';
    const params: any[] = [];
    
    if (status) {
      sql += ' WHERE "status" = $1';
      params.push(status);
    }
    
    sql += ' ORDER BY "name" ASC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit.toString(), offset.toString());
    
    const results = await query<any[]>(sql, params);
    return transformArrayDbToTs<ContentType>(results || [], contentTypeFields);
  }

  async createContentType(params: ContentTypeCreateParams): Promise<ContentType> {
    const now = unixTimestamp();
    const {
      name,
      slug,
      description,
      schema,
      status
    } = params;

    // Validate slug uniqueness
    const existingType = await this.findContentTypeBySlug(slug);
    if (existingType) {
      throw new Error(`Content type with slug "${slug}" already exists`);
    }

    const result = await queryOne<any>(
      `INSERT INTO "public"."content_type" 
      ("name", "slug", "description", "schema", "status", "created_at", "updated_at") 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [name, slug, description || null, JSON.stringify(schema), status, now, now]
    );

    if (!result) {
      throw new Error('Failed to create content type');
    }

    return transformDbToTs<ContentType>(result, contentTypeFields);
  }

  async updateContentType(id: string, params: ContentTypeUpdateParams): Promise<ContentType> {
    const now = unixTimestamp();
    const currentType = await this.findContentTypeById(id);
    
    if (!currentType) {
      throw new Error(`Content type with ID ${id} not found`);
    }

    // Check slug uniqueness if it's being updated
    if (params.slug && params.slug !== currentType.slug) {
      const existingType = await this.findContentTypeBySlug(params.slug);
      if (existingType) {
        throw new Error(`Content type with slug "${params.slug}" already exists`);
      }
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic query with snake_case field names
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
    if (params.schema !== undefined) {
      updateFields.push(`"schema" = $${paramIndex++}`);
      values.push(JSON.stringify(params.schema));
    }
    if (params.status !== undefined) {
      updateFields.push(`"status" = $${paramIndex++}`);
      values.push(params.status);
    }

    // Always update the updated_at timestamp
    updateFields.push(`"updated_at" = $${paramIndex++}`);
    values.push(now);

    // Add ID for WHERE clause
    values.push(id);

    const query = `
      UPDATE "public"."content_type" 
      SET ${updateFields.join(', ')} 
      WHERE "id" = $${paramIndex} 
      RETURNING *
    `;

    const result = await queryOne<any>(query, values);

    if (!result) {
      throw new Error(`Failed to update content type with ID ${id}`);
    }

    return transformDbToTs<ContentType>(result, contentTypeFields);
  }

  async deleteContentType(id: string): Promise<boolean> {
    // Check if the content type is being used by any content blocks
    const blocksUsingType = await query<Array<{count: string}>>(
      'SELECT COUNT(*) as count FROM "public"."content_block" WHERE "content_type_id" = $1', 
      [id]
    );
    
    if (blocksUsingType && blocksUsingType.length > 0 && parseInt(blocksUsingType[0].count) > 0) {
      throw new Error(`Cannot delete content type as it is being used by ${blocksUsingType[0].count} content blocks`);
    }
    
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."content_type" WHERE "id" = $1 RETURNING "id"',
      [id]
    );
    
    return !!result;
  }

  // Content Page methods
  async findPageById(id: string): Promise<ContentPage | null> {
    const result = await queryOne<any>('SELECT * FROM "public"."content_page" WHERE "id" = $1', [id]);
    return transformDbToTs<ContentPage>(result, contentPageFields);
  }

  async findPageBySlug(slug: string): Promise<ContentPage | null> {
    const result = await queryOne<any>('SELECT * FROM "public"."content_page" WHERE "slug" = $1', [slug]);
    return transformDbToTs<ContentPage>(result, contentPageFields);
  }

  async findHomePage(): Promise<ContentPage | null> {
    const result = await queryOne<any>('SELECT * FROM "public"."content_page" WHERE "is_home_page" = true LIMIT 1');
    return transformDbToTs<ContentPage>(result, contentPageFields);
  }

  async findAllPages(
    status?: ContentPage['status'], 
    contentTypeId?: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<ContentPage[]> {
    let sql = 'SELECT * FROM "public"."content_page"';
    const whereConditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (status) {
      whereConditions.push(`"status" = $${paramIndex++}`);
      params.push(status);
    }
    
    if (contentTypeId) {
      whereConditions.push(`"content_type_id" = $${paramIndex++}`);
      params.push(contentTypeId);
    }
    
    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    sql += ' ORDER BY "title" ASC LIMIT $' + (paramIndex++) + ' OFFSET $' + (paramIndex++);
    params.push(limit, offset);
    
    const results = await query<any[]>(sql, params);
    return transformArrayDbToTs<ContentPage>(results || [], contentPageFields);
  }

  async createPage(params: ContentPageCreateParams): Promise<ContentPage> {
    const now = unixTimestamp();
    
    // If setting as home page, clear any existing home page
    if (params.isHomePage) {
      await query('UPDATE "public"."content_page" SET "is_home_page" = false WHERE "is_home_page" = true');
    }

    // Validate slug uniqueness
    const existingPage = await this.findPageBySlug(params.slug);
    if (existingPage) {
      throw new Error(`Page with slug "${params.slug}" already exists`);
    }

    // Convert from camelCase params to snake_case database fields
    const fieldValues: any[] = [];
    const fieldNames: string[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    Object.entries(contentPageFields).forEach(([tsKey, dbKey]) => {
      // Skip id, createdAt, updatedAt as they're handled separately
      if (tsKey !== 'id' && tsKey !== 'createdAt' && tsKey !== 'updatedAt') {
        if (params[tsKey as keyof ContentPageCreateParams] !== undefined) {
          fieldNames.push(`"${dbKey}"`);
          placeholders.push(`$${paramIndex++}`);
          
          // Special handling for JSON fields
          if (tsKey === 'customFields') {
            fieldValues.push(JSON.stringify(params[tsKey as keyof ContentPageCreateParams]));
          } else {
            fieldValues.push(params[tsKey as keyof ContentPageCreateParams]);
          }
        }
      }
    });

    // Add created_at and updated_at
    fieldNames.push('"created_at"', '"updated_at"');
    placeholders.push(`$${paramIndex++}`, `$${paramIndex++}`);
    fieldValues.push(now, now);

    const sqlQuery = `
      INSERT INTO "public"."content_page" (${fieldNames.join(', ')}) 
      VALUES (${placeholders.join(', ')}) 
      RETURNING *
    `;

    const result = await queryOne<any>(sqlQuery, fieldValues);

    if (!result) {
      throw new Error('Failed to create content page');
    }

    return transformDbToTs<ContentPage>(result, contentPageFields);
  }

  async updatePage(id: string, params: ContentPageUpdateParams): Promise<ContentPage> {
    const now = unixTimestamp();
    const currentPage = await this.findPageById(id);
    
    if (!currentPage) {
      throw new Error(`Page with ID ${id} not found`);
    }

    // If setting as home page, clear any existing home page
    if (params.isHomePage) {
      await query('UPDATE "public"."content_page" SET "is_home_page" = false WHERE "is_home_page" = true');
    }

    // Check slug uniqueness if it's being updated
    if (params.slug && params.slug !== currentPage.slug) {
      const existingPage = await this.findPageBySlug(params.slug);
      if (existingPage && existingPage.id !== id) {
        throw new Error(`Page with slug "${params.slug}" already exists`);
      }
    }

    // Build dynamic query with snake_case field names
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
        const dbKey = contentPageFields[key];
        if (dbKey) {
          updateFields.push(`"${dbKey}" = $${paramIndex++}`);
          
          // Special handling for JSON fields
          if (key === 'customFields') {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
        }
      }
    });

    // Always update the updated_at timestamp
    updateFields.push(`"updated_at" = $${paramIndex++}`);
    values.push(now);

    // Add ID for WHERE clause
    values.push(id);

    const sql = `
      UPDATE "public"."content_page" 
      SET ${updateFields.join(', ')} 
      WHERE "id" = $${paramIndex} 
      RETURNING *
    `;

    const result = await queryOne<any>(sql, values);

    if (!result) {
      throw new Error(`Failed to update page with ID ${id}`);
    }

    return transformDbToTs<ContentPage>(result, contentPageFields);
  }

  async deletePage(id: string): Promise<boolean> {
    // Delete all content blocks associated with the page first
    await query('DELETE FROM "public"."content_block" WHERE "page_id" = $1', [id]);
    
    // Now delete the page
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."content_page" WHERE "id" = $1 RETURNING "id"',
      [id]
    );
    
    return !!result;
  }

  async publishPage(id: string): Promise<ContentPage> {
    const now = unixTimestamp();
    
    const result = await queryOne<any>(
      `UPDATE "public"."content_page" 
       SET "status" = 'published', "published_at" = $1, "updated_at" = $1 
       WHERE "id" = $2 
       RETURNING *`,
      [now, id]
    );
    
    if (!result) {
      throw new Error(`Failed to publish page with ID ${id}`);
    }
    
    return transformDbToTs<ContentPage>(result, contentPageFields);
  }

  // Content Block methods
  async findBlockById(id: string): Promise<ContentBlock | null> {
    const result = await queryOne<any>('SELECT * FROM "public"."content_block" WHERE "id" = $1', [id]);
    return transformDbToTs<ContentBlock>(result, contentBlockFields);
  }

  async findBlocksByPageId(pageId: string): Promise<ContentBlock[]> {
    const results = await query<any[]>(
      'SELECT * FROM "public"."content_block" WHERE "page_id" = $1 ORDER BY "order" ASC',
      [pageId]
    );
    
    return transformArrayDbToTs<ContentBlock>(results || [], contentBlockFields);
  }

  async createBlock(params: ContentBlockCreateParams): Promise<ContentBlock> {
    const now = unixTimestamp();
    
    // Validate that page exists
    const page = await this.findPageById(params.pageId);
    if (!page) {
      throw new Error(`Page with ID ${params.pageId} not found`);
    }
    
    // Validate that content type exists
    const contentType = await this.findContentTypeById(params.contentTypeId);
    if (!contentType) {
      throw new Error(`Content type with ID ${params.contentTypeId} not found`);
    }

    const result = await queryOne<any>(
      `INSERT INTO "public"."content_block" 
      ("page_id", "content_type_id", "name", "order", "content", "status", "created_at", "updated_at") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [
        params.pageId, 
        params.contentTypeId, 
        params.name, 
        params.order, 
        JSON.stringify(params.content), 
        params.status,
        now, 
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create content block');
    }

    return transformDbToTs<ContentBlock>(result, contentBlockFields);
  }

  async updateBlock(id: string, params: ContentBlockUpdateParams): Promise<ContentBlock> {
    const now = unixTimestamp();
    const currentBlock = await this.findBlockById(id);
    
    if (!currentBlock) {
      throw new Error(`Content block with ID ${id} not found`);
    }

    // Build dynamic query with snake_case field names
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Handle each field that might be updated
    if (params.pageId !== undefined) {
      updateFields.push(`"page_id" = $${paramIndex++}`);
      values.push(params.pageId);
    }
    
    if (params.contentTypeId !== undefined) {
      updateFields.push(`"content_type_id" = $${paramIndex++}`);
      values.push(params.contentTypeId);
    }
    
    if (params.name !== undefined) {
      updateFields.push(`"name" = $${paramIndex++}`);
      values.push(params.name);
    }
    
    if (params.order !== undefined) {
      updateFields.push(`"order" = $${paramIndex++}`);
      values.push(params.order);
    }
    
    if (params.content !== undefined) {
      updateFields.push(`"content" = $${paramIndex++}`);
      values.push(JSON.stringify(params.content));
    }
    
    if (params.status !== undefined) {
      updateFields.push(`"status" = $${paramIndex++}`);
      values.push(params.status);
    }

    // Always update the updated_at timestamp
    updateFields.push(`"updated_at" = $${paramIndex++}`);
    values.push(now);

    // If no fields to update, just return the current block
    if (updateFields.length === 1) {
      return currentBlock;
    }

    // Add ID for WHERE clause
    values.push(id);

    const query = `
      UPDATE "public"."content_block" 
      SET ${updateFields.join(', ')} 
      WHERE "id" = $${paramIndex} 
      RETURNING *
    `;

    const result = await queryOne<any>(query, values);

    if (!result) {
      throw new Error(`Failed to update content block with ID ${id}`);
    }

    return transformDbToTs<ContentBlock>(result, contentBlockFields);
  }

  async deleteBlock(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."content_block" WHERE "id" = $1 RETURNING "id"',
      [id]
    );
    
    return !!result;
  }

  // Content Template methods
  async findTemplateById(id: string): Promise<ContentTemplate | null> {
    const result = await queryOne<any>('SELECT * FROM "public"."content_template" WHERE "id" = $1', [id]);
    return transformDbToTs<ContentTemplate>(result, contentTemplateFields);
  }

  async findAllTemplates(type?: ContentTemplate['type'], status?: ContentTemplate['status']): Promise<ContentTemplate[]> {
    let sql = 'SELECT * FROM "public"."content_template"';
    const whereConditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (type) {
      whereConditions.push(`"type" = $${paramIndex++}`);
      params.push(type);
    }
    
    if (status) {
      whereConditions.push(`"status" = $${paramIndex++}`);
      params.push(status);
    }
    
    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    sql += ' ORDER BY "name" ASC';
    
    const results = await query<any[]>(sql, params);
    return transformArrayDbToTs<ContentTemplate>(results || [], contentTemplateFields);
  }

  async createTemplate(params: ContentTemplateCreateParams): Promise<ContentTemplate> {
    const now = unixTimestamp();
    
    const result = await queryOne<any>(
      `INSERT INTO "public"."content_template" 
      ("name", "type", "description", "structure", "status", "created_at", "updated_at") 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [
        params.name, 
        params.type, 
        params.description || null, 
        JSON.stringify(params.structure), 
        params.status,
        now, 
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create content template');
    }

    return transformDbToTs<ContentTemplate>(result, contentTemplateFields);
  }

  async updateTemplate(id: string, params: ContentTemplateUpdateParams): Promise<ContentTemplate> {
    const now = unixTimestamp();
    const currentTemplate = await this.findTemplateById(id);
    
    if (!currentTemplate) {
      throw new Error(`Content template with ID ${id} not found`);
    }

    // Build dynamic query with snake_case field names
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Handle each field that might be updated
    if (params.name !== undefined) {
      updateFields.push(`"name" = $${paramIndex++}`);
      values.push(params.name);
    }
    
    if (params.type !== undefined) {
      updateFields.push(`"type" = $${paramIndex++}`);
      values.push(params.type);
    }
    
    if (params.description !== undefined) {
      updateFields.push(`"description" = $${paramIndex++}`);
      values.push(params.description);
    }
    
    if (params.structure !== undefined) {
      updateFields.push(`"structure" = $${paramIndex++}`);
      values.push(JSON.stringify(params.structure));
    }
    
    if (params.status !== undefined) {
      updateFields.push(`"status" = $${paramIndex++}`);
      values.push(params.status);
    }

    // Always update the updated_at timestamp
    updateFields.push(`"updated_at" = $${paramIndex++}`);
    values.push(now);

    // If no fields to update, just return the current template
    if (updateFields.length === 1) {
      return currentTemplate;
    }

    // Add ID for WHERE clause
    values.push(id);

    const query = `
      UPDATE "public"."content_template" 
      SET ${updateFields.join(', ')} 
      WHERE "id" = $${paramIndex} 
      RETURNING *
    `;

    const result = await queryOne<any>(query, values);

    if (!result) {
      throw new Error(`Failed to update content template with ID ${id}`);
    }

    return transformDbToTs<ContentTemplate>(result, contentTemplateFields);
  }

  async deleteTemplate(id: string): Promise<boolean> {
    // Check if any pages are using this template
    const pagesUsingTemplate = await query<Array<{count: string}>>(
      'SELECT COUNT(*) as count FROM "public"."content_page" WHERE "template_id" = $1', 
      [id]
    );
    
    if (pagesUsingTemplate && pagesUsingTemplate.length > 0 && parseInt(pagesUsingTemplate[0].count) > 0) {
      throw new Error(`Cannot delete template as it is being used by ${pagesUsingTemplate[0].count} pages`);
    }
    
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."content_template" WHERE "id" = $1 RETURNING "id"',
      [id]
    );
    
    return !!result;
  }
}

export default new ContentRepo();
