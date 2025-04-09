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
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  layout?: string; // Can reference a layout template
  createdAt: string;
  updatedAt: string;
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
    return await queryOne<ContentType>('SELECT * FROM "public"."content_type" WHERE "id" = $1', [id]);
  }

  async findContentTypeBySlug(slug: string): Promise<ContentType | null> {
    return await queryOne<ContentType>('SELECT * FROM "public"."content_type" WHERE "slug" = $1', [slug]);
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
    
    const results = await query<ContentType[]>(sql, params);
    return results || [];
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

    const result = await queryOne<ContentType>(
      `INSERT INTO "public"."content_type" 
      ("name", "slug", "description", "schema", "status", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [name, slug, description || null, JSON.stringify(schema), status, now, now]
    );

    if (!result) {
      throw new Error('Failed to create content type');
    }

    return result;
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

    // Build dynamic query based on provided update params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        // Handle schema as a special case for JSON data
        values.push(key === 'schema' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    });

    // Always update the updatedAt timestamp
    updateFields.push(`"updatedAt" = $${paramIndex}`);
    values.push(now);
    paramIndex++;

    // Add ID for WHERE clause
    values.push(id);

    const query = `
      UPDATE "public"."content_type" 
      SET ${updateFields.join(', ')} 
      WHERE "id" = $${paramIndex} 
      RETURNING *
    `;

    const result = await queryOne<ContentType>(query, values);

    if (!result) {
      throw new Error(`Failed to update content type with ID ${id}`);
    }

    return result;
  }

  async deleteContentType(id: string): Promise<boolean> {
    // Check if the content type is being used by any content blocks
    const blocksUsingType = await query<Array<{count: string}>>(
      'SELECT COUNT(*) as count FROM "public"."content_block" WHERE "contentTypeId" = $1', 
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
    return await queryOne<ContentPage>('SELECT * FROM "public"."content_page" WHERE "id" = $1', [id]);
  }

  async findPageBySlug(slug: string): Promise<ContentPage | null> {
    return await queryOne<ContentPage>('SELECT * FROM "public"."content_page" WHERE "slug" = $1', [slug]);
  }

  async findAllPages(status?: ContentPage['status'], limit: number = 50, offset: number = 0): Promise<ContentPage[]> {
    let sql = 'SELECT * FROM "public"."content_page"';
    const params: any[] = [];
    
    if (status) {
      sql += ' WHERE "status" = $1';
      params.push(status);
    }
    
    sql += ' ORDER BY "updatedAt" DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit.toString(), offset.toString());
    
    const results = await query<ContentPage[]>(sql, params);
    return results || [];
  }

  async createPage(params: ContentPageCreateParams): Promise<ContentPage> {
    const now = unixTimestamp();
    const {
      title,
      slug,
      description,
      metaTitle,
      metaDescription,
      status,
      publishedAt,
      layout
    } = params;

    // Validate slug uniqueness
    const existingPage = await this.findPageBySlug(slug);
    if (existingPage) {
      throw new Error(`Page with slug "${slug}" already exists`);
    }

    const result = await queryOne<ContentPage>(
      `INSERT INTO "public"."content_page" 
      ("title", "slug", "description", "metaTitle", "metaDescription", "status", "publishedAt", "layout", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [
        title, 
        slug, 
        description || null, 
        metaTitle || null, 
        metaDescription || null, 
        status, 
        publishedAt || null, 
        layout || null, 
        now, 
        now
      ]
    );

    if (!result) {
      throw new Error('Failed to create content page');
    }

    return result;
  }

  async updatePage(id: string, params: ContentPageUpdateParams): Promise<ContentPage> {
    const now = unixTimestamp();
    const currentPage = await this.findPageById(id);
    
    if (!currentPage) {
      throw new Error(`Content page with ID ${id} not found`);
    }

    // Check slug uniqueness if it's being updated
    if (params.slug && params.slug !== currentPage.slug) {
      const existingPage = await this.findPageBySlug(params.slug);
      if (existingPage) {
        throw new Error(`Page with slug "${params.slug}" already exists`);
      }
    }

    // Handle publishing logic
    if (params.status === 'published' && currentPage.status !== 'published') {
      params.publishedAt = params.publishedAt || unixTimestamp();
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic query based on provided update params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    // Always update the updatedAt timestamp
    updateFields.push(`"updatedAt" = $${paramIndex}`);
    values.push(now);
    paramIndex++;

    // Add ID for WHERE clause
    values.push(id);

    const query = `
      UPDATE "public"."content_page" 
      SET ${updateFields.join(', ')} 
      WHERE "id" = $${paramIndex} 
      RETURNING *
    `;

    const result = await queryOne<ContentPage>(query, values);

    if (!result) {
      throw new Error(`Failed to update content page with ID ${id}`);
    }

    return result;
  }

  async deletePage(id: string): Promise<boolean> {
    // First delete all content blocks for this page
    await query('DELETE FROM "public"."content_block" WHERE "pageId" = $1', [id]);
    
    // Then delete the page itself
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."content_page" WHERE "id" = $1 RETURNING "id"',
      [id]
    );
    
    return !!result;
  }

  // Content Block methods
  async findBlockById(id: string): Promise<ContentBlock | null> {
    return await queryOne<ContentBlock>('SELECT * FROM "public"."content_block" WHERE "id" = $1', [id]);
  }

  async findBlocksByPageId(pageId: string, orderByPosition: boolean = true): Promise<ContentBlock[]> {
    let sql = 'SELECT * FROM "public"."content_block" WHERE "pageId" = $1';
    
    if (orderByPosition) {
      sql += ' ORDER BY "order" ASC';
    }
    
    const results = await query<ContentBlock[]>(sql, [pageId]);
    return results || [];
  }

  async createBlock(params: ContentBlockCreateParams): Promise<ContentBlock> {
    const now = unixTimestamp();
    const {
      pageId,
      contentTypeId,
      name,
      order,
      content,
      status
    } = params;

    // Validate content type exists
    const contentType = await this.findContentTypeById(contentTypeId);
    if (!contentType) {
      throw new Error(`Content type with ID ${contentTypeId} not found`);
    }

    // Validate page exists
    const page = await this.findPageById(pageId);
    if (!page) {
      throw new Error(`Page with ID ${pageId} not found`);
    }

    // TODO: Validate content against schema from content type

    const result = await queryOne<ContentBlock>(
      `INSERT INTO "public"."content_block" 
      ("pageId", "contentTypeId", "name", "order", "content", "status", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [pageId, contentTypeId, name, order, JSON.stringify(content), status, now, now]
    );

    if (!result) {
      throw new Error('Failed to create content block');
    }

    return result;
  }

  async updateBlock(id: string, params: ContentBlockUpdateParams): Promise<ContentBlock> {
    const now = unixTimestamp();
    const currentBlock = await this.findBlockById(id);
    
    if (!currentBlock) {
      throw new Error(`Content block with ID ${id} not found`);
    }

    // If content type is being changed, validate it exists
    if (params.contentTypeId && params.contentTypeId !== currentBlock.contentTypeId) {
      const contentType = await this.findContentTypeById(params.contentTypeId);
      if (!contentType) {
        throw new Error(`Content type with ID ${params.contentTypeId} not found`);
      }
      
      // TODO: Validate content against new content type schema
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic query based on provided update params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        // Handle content as a special case for JSON data
        values.push(key === 'content' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    });

    // Always update the updatedAt timestamp
    updateFields.push(`"updatedAt" = $${paramIndex}`);
    values.push(now);
    paramIndex++;

    // Add ID for WHERE clause
    values.push(id);

    const query = `
      UPDATE "public"."content_block" 
      SET ${updateFields.join(', ')} 
      WHERE "id" = $${paramIndex} 
      RETURNING *
    `;

    const result = await queryOne<ContentBlock>(query, values);

    if (!result) {
      throw new Error(`Failed to update content block with ID ${id}`);
    }

    return result;
  }

  async deleteBlock(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."content_block" WHERE "id" = $1 RETURNING "id"',
      [id]
    );
    
    return !!result;
  }

  async reorderBlocks(pageId: string, blockOrders: {id: string, order: number}[]): Promise<boolean> {
    // Get all blocks for this page to verify they exist
    const existingBlocks = await this.findBlocksByPageId(pageId);
    const existingBlockIds = new Set(existingBlocks.map(block => block.id));
    
    // Validate all blocks are for this page
    for (const blockOrder of blockOrders) {
      if (!existingBlockIds.has(blockOrder.id)) {
        throw new Error(`Block with ID ${blockOrder.id} not found for page ${pageId}`);
      }
    }
    
    // Update the order of each block
    const now = unixTimestamp();
    for (const blockOrder of blockOrders) {
      await queryOne(
        'UPDATE "public"."content_block" SET "order" = $1, "updatedAt" = $2 WHERE "id" = $3',
        [blockOrder.order, now, blockOrder.id]
      );
    }
    
    return true;
  }

  // Content Template methods
  async findTemplateById(id: string): Promise<ContentTemplate | null> {
    return await queryOne<ContentTemplate>('SELECT * FROM "public"."content_template" WHERE "id" = $1', [id]);
  }

  async findAllTemplates(type?: ContentTemplate['type'], status: ContentTemplate['status'] = 'active', limit: number = 50, offset: number = 0): Promise<ContentTemplate[]> {
    let sql = 'SELECT * FROM "public"."content_template" WHERE "status" = $1';
    const params: any[] = [status];
    
    if (type) {
      sql += ' AND "type" = $2';
      params.push(type);
    }
    
    sql += ' ORDER BY "name" ASC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit.toString(), offset.toString());
    
    const results = await query<ContentTemplate[]>(sql, params);
    return results || [];
  }

  async createTemplate(params: ContentTemplateCreateParams): Promise<ContentTemplate> {
    const now = unixTimestamp();
    const {
      name,
      type,
      description,
      structure,
      status
    } = params;

    const result = await queryOne<ContentTemplate>(
      `INSERT INTO "public"."content_template" 
      ("name", "type", "description", "structure", "status", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [name, type, description || null, JSON.stringify(structure), status, now, now]
    );

    if (!result) {
      throw new Error('Failed to create content template');
    }

    return result;
  }

  async updateTemplate(id: string, params: ContentTemplateUpdateParams): Promise<ContentTemplate> {
    const now = unixTimestamp();
    const currentTemplate = await this.findTemplateById(id);
    
    if (!currentTemplate) {
      throw new Error(`Content template with ID ${id} not found`);
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic query based on provided update params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        // Handle structure as a special case for JSON data
        values.push(key === 'structure' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    });

    // Always update the updatedAt timestamp
    updateFields.push(`"updatedAt" = $${paramIndex}`);
    values.push(now);
    paramIndex++;

    // Add ID for WHERE clause
    values.push(id);

    const query = `
      UPDATE "public"."content_template" 
      SET ${updateFields.join(', ')} 
      WHERE "id" = $${paramIndex} 
      RETURNING *
    `;

    const result = await queryOne<ContentTemplate>(query, values);

    if (!result) {
      throw new Error(`Failed to update content template with ID ${id}`);
    }

    return result;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    // Check if any pages are using this template as a layout
    if (await this.isTemplateInUse(id)) {
      throw new Error(`Cannot delete template as it is being used by one or more pages`);
    }
    
    const result = await queryOne<{ id: string }>(
      'DELETE FROM "public"."content_template" WHERE "id" = $1 RETURNING "id"',
      [id]
    );
    
    return !!result;
  }

  private async isTemplateInUse(templateId: string): Promise<boolean> {
    // Check pages that use this template as layout
    const pagesUsingTemplate = await query<Array<{count: string}>>(
      'SELECT COUNT(*) as count FROM "public"."content_page" WHERE "layout" = $1', 
      [templateId]
    );
    
    return !!(pagesUsingTemplate && pagesUsingTemplate.length > 0 && parseInt(pagesUsingTemplate[0].count) > 0);
  }

  // Composite methods that join multiple entities
  async getFullPageContent(pageId: string): Promise<{page: ContentPage, blocks: (ContentBlock & {contentType: ContentType})[]}> {
    const page = await this.findPageById(pageId);
    
    if (!page) {
      throw new Error(`Page with ID ${pageId} not found`);
    }
    
    const blocks = await this.findBlocksByPageId(pageId);
    
    // Fetch content type details for each block
    const blocksWithTypes = await Promise.all(blocks.map(async (block) => {
      const contentType = await this.findContentTypeById(block.contentTypeId);
      return {
        ...block,
        contentType: contentType || {} as ContentType
      };
    }));
    
    return {
      page,
      blocks: blocksWithTypes
    };
  }

  async getFullPageContentBySlug(slug: string): Promise<{page: ContentPage, blocks: (ContentBlock & {contentType: ContentType})[], template?: ContentTemplate}> {
    const page = await this.findPageBySlug(slug);
    
    if (!page) {
      throw new Error(`Page with slug "${slug}" not found`);
    }
    
    const blocks = await this.findBlocksByPageId(page.id);
    
    // Fetch content type details for each block
    const blocksWithTypes = await Promise.all(blocks.map(async (block) => {
      const contentType = await this.findContentTypeById(block.contentTypeId);
      return {
        ...block,
        contentType: contentType || {} as ContentType
      };
    }));
    
    // Fetch layout template if specified
    let template: ContentTemplate | undefined;
    if (page.layout) {
      const foundTemplate = await this.findTemplateById(page.layout);
      template = foundTemplate || undefined; // Convert null to undefined
    }
    
    return {
      page,
      blocks: blocksWithTypes,
      template
    };
  }
}
