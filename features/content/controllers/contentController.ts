import { Request, Response } from 'express';
import { ContentRepo, ContentType, ContentPage, ContentBlock, ContentTemplate } from '../repos/contentRepo';

export class ContentController {
  private contentRepo: ContentRepo;

  constructor() {
    this.contentRepo = new ContentRepo();
  }

  // Content Type Handlers
  
  /**
   * Get all content types with optional filtering
   */
  getContentTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as ContentType['status'] | undefined;

      const contentTypes = await this.contentRepo.findAllContentTypes(status, limit, offset);

      res.status(200).json({
        success: true,
        data: contentTypes,
        pagination: {
          limit,
          offset,
          total: contentTypes.length // This should ideally be the total count from DB
        }
      });
    } catch (error) {
      console.error('Error fetching content types:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch content types',
        error: (error as Error).message
      });
    }
  };

  /**
   * Get content type by ID
   */
  getContentTypeById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const contentType = await this.contentRepo.findContentTypeById(id);

      if (!contentType) {
        res.status(404).json({
          success: false,
          message: `Content type with ID ${id} not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: contentType
      });
    } catch (error) {
      console.error('Error fetching content type:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch content type',
        error: (error as Error).message
      });
    }
  };

  /**
   * Get content type by slug
   */
  getContentTypeBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      const { slug } = req.params;
      const contentType = await this.contentRepo.findContentTypeBySlug(slug);

      if (!contentType) {
        res.status(404).json({
          success: false,
          message: `Content type with slug ${slug} not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: contentType
      });
    } catch (error) {
      console.error('Error fetching content type:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch content type',
        error: (error as Error).message
      });
    }
  };

  /**
   * Create a new content type
   */
  createContentType = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        slug,
        description,
        schema,
        status = 'active'
      } = req.body;

      // Basic validation
      if (!name || !slug || !schema) {
        res.status(400).json({
          success: false,
          message: 'Name, slug, and schema are required'
        });
        return;
      }

      const contentType = await this.contentRepo.createContentType({
        name,
        slug,
        description,
        schema,
        status
      });

      res.status(201).json({
        success: true,
        data: contentType,
        message: 'Content type created successfully'
      });
    } catch (error:any) {
      console.error('Error creating content type:', error);
      res.status(error.message.includes('already exists') ? 409 : 500).json({
        success: false,
        message: 'Failed to create content type',
        error: error.message
      });
    }
  };

  /**
   * Update a content type
   */
  updateContentType = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        name,
        slug,
        description,
        schema,
        status
      } = req.body;

      // Check if content type exists
      const existingContentType = await this.contentRepo.findContentTypeById(id);
      if (!existingContentType) {
        res.status(404).json({
          success: false,
          message: `Content type with ID ${id} not found`
        });
        return;
      }

      const updatedContentType = await this.contentRepo.updateContentType(id, {
        name,
        slug,
        description,
        schema,
        status
      });

      res.status(200).json({
        success: true,
        data: updatedContentType,
        message: 'Content type updated successfully'
      });
    } catch (error:any) {
      console.error('Error updating content type:', error);
      res.status(error.message.includes('already exists') ? 409 : 500).json({
        success: false,
        message: 'Failed to update content type',
        error: (error as Error).message
      });
    }
  };

  /**
   * Delete a content type
   */
  deleteContentType = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if content type exists
      const existingContentType = await this.contentRepo.findContentTypeById(id);
      if (!existingContentType) {
        res.status(404).json({
          success: false,
          message: `Content type with ID ${id} not found`
        });
        return;
      }

      await this.contentRepo.deleteContentType(id);

      res.status(200).json({
        success: true,
        message: 'Content type deleted successfully'
      });
    } catch (error:any) {
      console.error('Error deleting content type:', error);
      
      // Handle case where content type is in use
      if (error.message.includes('being used')) {
        res.status(409).json({
          success: false,
          message: error.message,
          error: 'Content type is in use'
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete content type',
        error: (error as Error).message
      });
    }
  };

  // Content Page Handlers

  /**
   * Get all content pages with optional filtering
   */
  getPages = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as ContentPage['status'] | undefined;

      const pages = await this.contentRepo.findAllPages(status, limit, offset);

      res.status(200).json({
        success: true,
        data: pages,
        pagination: {
          limit,
          offset,
          total: pages.length // This should ideally be the total count from DB
        }
      });
    } catch (error:any) {
      console.error('Error fetching pages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pages',
        error: error.message
      });
    }
  };

  /**
   * Get page by ID
   */
  getPageById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const page = await this.contentRepo.findPageById(id);

      if (!page) {
        res.status(404).json({
          success: false,
          message: `Page with ID ${id} not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: page
      });
    } catch (error:any) {
      console.error('Error fetching page:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch page',
        error: error.message
      });
    }
  };

  /**
   * Get page with full content by ID
   */
  getFullPageById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const fullPage = await this.contentRepo.getFullPageContent(id);

      res.status(200).json({
        success: true,
        data: fullPage
      });
    } catch (error:any) {
      console.error('Error fetching full page:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch page with content',
        error: error.message
      });
    }
  };

  /**
   * Create a new page
   */
  createPage = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        title,
        slug,
        description,
        metaTitle,
        metaDescription,
        status = 'draft',
        publishedAt,
        layout
      } = req.body;

      // Basic validation
      if (!title || !slug) {
        res.status(400).json({
          success: false,
          message: 'Title and slug are required'
        });
        return;
      }

      // Validate layout if provided
      if (layout) {
        const template = await this.contentRepo.findTemplateById(layout);
        if (!template || template.type !== 'layout') {
          res.status(400).json({
            success: false,
            message: 'Invalid layout template specified'
          });
          return;
        }
      }

      const page = await this.contentRepo.createPage({
        title,
        slug,
        description,
        metaTitle,
        metaDescription,
        status,
        publishedAt,
        layout
      });

      res.status(201).json({
        success: true,
        data: page,
        message: 'Page created successfully'
      });
    } catch (error:any) {
      console.error('Error creating page:', error);
      res.status(error.message.includes('already exists') ? 409 : 500).json({
        success: false,
        message: 'Failed to create page',
        error: error.message
      });
    }
  };

  /**
   * Update a page
   */
  updatePage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        title,
        slug,
        description,
        metaTitle,
        metaDescription,
        status,
        publishedAt,
        layout
      } = req.body;

      // Check if page exists
      const existingPage = await this.contentRepo.findPageById(id);
      if (!existingPage) {
        res.status(404).json({
          success: false,
          message: `Page with ID ${id} not found`
        });
        return;
      }

      // Validate layout if provided
      if (layout) {
        const template = await this.contentRepo.findTemplateById(layout);
        if (!template || template.type !== 'layout') {
          res.status(400).json({
            success: false,
            message: 'Invalid layout template specified'
          });
          return;
        }
      }

      const updatedPage = await this.contentRepo.updatePage(id, {
        title,
        slug,
        description,
        metaTitle,
        metaDescription,
        status,
        publishedAt,
        layout
      });

      res.status(200).json({
        success: true,
        data: updatedPage,
        message: 'Page updated successfully'
      });
    } catch (error:any) {
      console.error('Error updating page:', error);
      res.status(error.message.includes('already exists') ? 409 : 500).json({
        success: false,
        message: 'Failed to update page',
        error: error.message
      });
    }
  };

  /**
   * Delete a page
   */
  deletePage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if page exists
      const existingPage = await this.contentRepo.findPageById(id);
      if (!existingPage) {
        res.status(404).json({
          success: false,
          message: `Page with ID ${id} not found`
        });
        return;
      }

      await this.contentRepo.deletePage(id);

      res.status(200).json({
        success: true,
        message: 'Page deleted successfully'
      });
    } catch (error:any) {
      console.error('Error deleting page:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete page',
        error: error.message
      });
    }
  };

  // Content Block Handlers

  /**
   * Get blocks for a page
   */
  getPageBlocks = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pageId } = req.params;
      
      // Check if page exists
      const page = await this.contentRepo.findPageById(pageId);
      if (!page) {
        res.status(404).json({
          success: false,
          message: `Page with ID ${pageId} not found`
        });
        return;
      }
      
      const blocks = await this.contentRepo.findBlocksByPageId(pageId);

      res.status(200).json({
        success: true,
        data: blocks
      });
    } catch (error:any) {
      console.error('Error fetching page blocks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch page blocks',
        error: error.message
      });
    }
  };

  /**
   * Get block by ID
   */
  getBlockById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const block = await this.contentRepo.findBlockById(id);

      if (!block) {
        res.status(404).json({
          success: false,
          message: `Content block with ID ${id} not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: block
      });
    } catch (error:any) {
      console.error('Error fetching content block:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch content block',
        error: error.message
      });
    }
  };

  /**
   * Create a new content block
   */
  createBlock = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        pageId,
        contentTypeId,
        name,
        order,
        content,
        status = 'active'
      } = req.body;

      // Basic validation
      if (!pageId || !contentTypeId || !name || order === undefined || !content) {
        res.status(400).json({
          success: false,
          message: 'Page ID, content type ID, name, order, and content are required'
        });
        return;
      }

      const block = await this.contentRepo.createBlock({
        pageId,
        contentTypeId,
        name,
        order,
        content,
        status
      });

      res.status(201).json({
        success: true,
        data: block,
        message: 'Content block created successfully'
      });
    } catch (error:any) {
      console.error('Error creating content block:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create content block',
        error: error.message
      });
    }
  };

  /**
   * Update a content block
   */
  updateBlock = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        contentTypeId,
        name,
        order,
        content,
        status
      } = req.body;

      // Check if block exists
      const existingBlock = await this.contentRepo.findBlockById(id);
      if (!existingBlock) {
        res.status(404).json({
          success: false,
          message: `Content block with ID ${id} not found`
        });
        return;
      }

      const updatedBlock = await this.contentRepo.updateBlock(id, {
        contentTypeId,
        name,
        order,
        content,
        status
      });

      res.status(200).json({
        success: true,
        data: updatedBlock,
        message: 'Content block updated successfully'
      });
    } catch (error:any) {
      console.error('Error updating content block:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to update content block',
        error: error.message
      });
    }
  };

  /**
   * Delete a content block
   */
  deleteBlock = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if block exists
      const existingBlock = await this.contentRepo.findBlockById(id);
      if (!existingBlock) {
        res.status(404).json({
          success: false,
          message: `Content block with ID ${id} not found`
        });
        return;
      }

      await this.contentRepo.deleteBlock(id);

      res.status(200).json({
        success: true,
        message: 'Content block deleted successfully'
      });
    } catch (error:any) {
      console.error('Error deleting content block:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete content block',
        error: error.message
      });
    }
  };

  /**
   * Reorder content blocks
   */
  reorderBlocks = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pageId } = req.params;
      const { blockOrders } = req.body;
      
      // Validate input
      if (!Array.isArray(blockOrders) || blockOrders.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Block orders must be a non-empty array'
        });
        return;
      }
      
      for (const order of blockOrders) {
        if (!order.id || order.order === undefined) {
          res.status(400).json({
            success: false,
            message: 'Each block order must have id and order properties'
          });
          return;
        }
      }
      
      // Check if page exists
      const page = await this.contentRepo.findPageById(pageId);
      if (!page) {
        res.status(404).json({
          success: false,
          message: `Page with ID ${pageId} not found`
        });
        return;
      }

      await this.contentRepo.reorderBlocks(pageId, blockOrders);

      res.status(200).json({
        success: true,
        message: 'Content blocks reordered successfully'
      });
    } catch (error:any) {
      console.error('Error reordering content blocks:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to reorder content blocks',
        error: error.message
      });
    }
  };

  // Content Template Handlers
  
  /**
   * Get all templates with optional filtering
   */
  getTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const type = req.query.type as ContentTemplate['type'] | undefined;
      const status = req.query.status as ContentTemplate['status'] || 'active';

      const templates = await this.contentRepo.findAllTemplates(type, status, limit, offset);

      res.status(200).json({
        success: true,
        data: templates,
        pagination: {
          limit,
          offset,
          total: templates.length // This should ideally be the total count from DB
        }
      });
    } catch (error:any) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch templates',
        error: error.message
      });
    }
  };

  /**
   * Get template by ID
   */
  getTemplateById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const template = await this.contentRepo.findTemplateById(id);

      if (!template) {
        res.status(404).json({
          success: false,
          message: `Template with ID ${id} not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: template
      });
    } catch (error:any) {
      console.error('Error fetching template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch template',
        error: error.message
      });
    }
  };

  /**
   * Create a new template
   */
  createTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        type,
        description,
        structure,
        status = 'active'
      } = req.body;

      // Basic validation
      if (!name || !type || !structure) {
        res.status(400).json({
          success: false,
          message: 'Name, type, and structure are required'
        });
        return;
      }

      // Validate template type
      if (type !== 'layout' && type !== 'section') {
        res.status(400).json({
          success: false,
          message: 'Template type must be either "layout" or "section"'
        });
        return;
      }

      const template = await this.contentRepo.createTemplate({
        name,
        type,
        description,
        structure,
        status
      });

      res.status(201).json({
        success: true,
        data: template,
        message: 'Template created successfully'
      });
    } catch (error:any) {
      console.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create template',
        error: error.message
      });
    }
  };

  /**
   * Update a template
   */
  updateTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        name,
        type,
        description,
        structure,
        status
      } = req.body;

      // Check if template exists
      const existingTemplate = await this.contentRepo.findTemplateById(id);
      if (!existingTemplate) {
        res.status(404).json({
          success: false,
          message: `Template with ID ${id} not found`
        });
        return;
      }

      // Validate template type if being updated
      if (type && type !== 'layout' && type !== 'section') {
        res.status(400).json({
          success: false,
          message: 'Template type must be either "layout" or "section"'
        });
        return;
      }

      const updatedTemplate = await this.contentRepo.updateTemplate(id, {
        name,
        type,
        description,
        structure,
        status
      });

      res.status(200).json({
        success: true,
        data: updatedTemplate,
        message: 'Template updated successfully'
      });
    } catch (error:any) {
      console.error('Error updating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update template',
        error: error.message
      });
    }
  };

  /**
   * Delete a template
   */
  deleteTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if template exists
      const existingTemplate = await this.contentRepo.findTemplateById(id);
      if (!existingTemplate) {
        res.status(404).json({
          success: false,
          message: `Template with ID ${id} not found`
        });
        return;
      }

      await this.contentRepo.deleteTemplate(id);

      res.status(200).json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error:any) {
      console.error('Error deleting template:', error);
      
      // Handle case where template is in use
      if (error.message.includes('being used')) {
        res.status(409).json({
          success: false,
          message: error.message,
          error: 'Template is in use'
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete template',
        error: error.message
      });
    }
  };
}
