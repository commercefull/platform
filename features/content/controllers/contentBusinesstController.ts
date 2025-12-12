import { Request, Response } from 'express';
import { ContentRepo } from '../repos/contentRepo';
import { ContentCategoryRepo } from '../repos/contentCategoryRepo';
import { ContentNavigationRepo } from '../repos/contentNavigationRepo';
import { ContentMediaRepo } from '../repos/contentMediaRepo';
import { ContentRedirectRepo } from '../repos/contentRedirectRepo';
import { eventBus } from '../../../libs/events/eventBus';

export class ContentController {
  private contentRepo: ContentRepo;
  private categoryRepo: ContentCategoryRepo;
  private navigationRepo: ContentNavigationRepo;
  private mediaRepo: ContentMediaRepo;
  private redirectRepo: ContentRedirectRepo;

  constructor() {
    this.contentRepo = new ContentRepo();
    this.categoryRepo = new ContentCategoryRepo();
    this.navigationRepo = new ContentNavigationRepo();
    this.mediaRepo = new ContentMediaRepo();
    this.redirectRepo = new ContentRedirectRepo();
  }

  // Content Type Handlers
  
  /**
   * Get all content types with optional filtering
   */
  getContentTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

      const contentTypes = await this.contentRepo.findAllContentTypes(isActive, limit, offset);

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
        icon,
        allowedBlocks,
        defaultTemplate,
        requiredFields,
        metaFields,
        isSystem = false,
        isActive = true
      } = req.body;

      // Basic validation
      if (!name || !slug) {
        res.status(400).json({
          success: false,
          message: 'Name and slug are required'
        });
        return;
      }

      const contentType = await this.contentRepo.createContentType({
        name,
        slug,
        description,
        icon,
        allowedBlocks,
        defaultTemplate,
        requiredFields,
        metaFields,
        isSystem,
        isActive
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
        icon,
        requiredFields,
        metaFields,
        isActive
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
        icon,
        requiredFields,
        metaFields,
        isActive
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
      const status = req.query.status as 'draft' | 'published' | 'scheduled' | 'archived' | undefined;

      const pages = await this.contentRepo.findAllPages(status, undefined, limit, offset);

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
      
      // Fetch the basic page data
      const page = await this.contentRepo.findPageById(id);
      if (!page) {
        res.status(404).json({
          success: false,
          message: `Page with ID ${id} not found`
        });
        return;
      }
      
      // Fetch all content blocks for this page
      const blocks = await this.contentRepo.findBlocksByPageId(id);
      
      // If the page has a template, fetch it as well
      let template = null;
      if (page.templateId) {
        template = await this.contentRepo.findTemplateById(page.templateId);
      }
      
      // Fetch content type if specified
      let contentType = null;
      if (page.contentTypeId) {
        contentType = await this.contentRepo.findContentTypeById(page.contentTypeId);
      }
      
      // Construct the full page data
      const fullPage = {
        page,
        blocks,
        template,
        contentType
      };

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
        layout,
        contentTypeId = '1', // Default content type ID if not provided
        visibility = 'public' // Default to public visibility
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
        if (!template) {
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
        summary: description, // Using description value but assigning to the correct field name 'summary'
        metaTitle,
        metaDescription,
        status,
        publishedAt,
        templateId: layout, // Layout corresponds to templateId
        contentTypeId, // Using default from destructuring
        visibility // Using default from destructuring
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
        if (!template) {
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
        summary: description, // Using description value but mapping to 'summary' field
        metaTitle,
        metaDescription,
        status,
        publishedAt,
        templateId: layout // Layout corresponds to templateId
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

  /**
   * Get all templates with optional filtering
   */
  getTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

      const templates = await this.contentRepo.findAllTemplates(isActive, limit, offset);

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
        slug,
        description,
        thumbnail,
        htmlStructure,
        cssStyles,
        jsScripts,
        areas,
        defaultBlocks,
        compatibleContentTypes,
        isSystem = false,
        isActive = true
      } = req.body;

      // Basic validation
      if (!name || !slug) {
        res.status(400).json({
          success: false,
          message: 'Name and slug are required'
        });
        return;
      }

      const template = await this.contentRepo.createTemplate({
        name,
        slug,
        description,
        thumbnail,
        htmlStructure,
        cssStyles,
        jsScripts,
        areas,
        defaultBlocks,
        compatibleContentTypes,
        isSystem,
        isActive
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
        slug,
        description,
        htmlStructure,
        areas,
        isActive
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

      const updatedTemplate = await this.contentRepo.updateTemplate(id, {
        name,
        slug,
        description,
        htmlStructure,
        areas,
        isActive
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

  /**
   * Duplicate a template
   */
  duplicateTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, slug } = req.body;

      if (!name || !slug) {
        res.status(400).json({ success: false, message: 'Name and slug are required' });
        return;
      }

      const original = await this.contentRepo.findTemplateById(id);
      if (!original) {
        res.status(404).json({ success: false, message: `Template with ID ${id} not found` });
        return;
      }

      const duplicate = await this.contentRepo.createTemplate({
        name,
        slug,
        description: original.description,
        thumbnail: original.thumbnail,
        htmlStructure: original.htmlStructure,
        cssStyles: original.cssStyles,
        jsScripts: original.jsScripts,
        areas: original.areas,
        defaultBlocks: original.defaultBlocks,
        compatibleContentTypes: original.compatibleContentTypes,
        isSystem: false,
        isActive: true
      });

      eventBus.emit('content.template.created', { templateId: duplicate.id, name: duplicate.name, slug: duplicate.slug });
      res.status(201).json({ success: true, data: duplicate, message: 'Template duplicated successfully' });
    } catch (error: any) {
      console.error('Error duplicating template:', error);
      res.status(500).json({ success: false, message: 'Failed to duplicate template', error: error.message });
    }
  };

  // Page Action Handlers

  /**
   * Publish a page
   */
  publishPage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const page = await this.contentRepo.findPageById(id);
      if (!page) {
        res.status(404).json({ success: false, message: `Page with ID ${id} not found` });
        return;
      }

      const updatedPage = await this.contentRepo.updatePage(id, {
        status: 'published',
        publishedAt: new Date().toISOString()
      });

      eventBus.emit('content.page.published', { pageId: id, title: updatedPage.title, slug: updatedPage.slug });
      res.status(200).json({ success: true, data: updatedPage, message: 'Page published successfully' });
    } catch (error: any) {
      console.error('Error publishing page:', error);
      res.status(500).json({ success: false, message: 'Failed to publish page', error: error.message });
    }
  };

  /**
   * Unpublish a page
   */
  unpublishPage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const page = await this.contentRepo.findPageById(id);
      if (!page) {
        res.status(404).json({ success: false, message: `Page with ID ${id} not found` });
        return;
      }

      const updatedPage = await this.contentRepo.updatePage(id, { status: 'draft' });
      eventBus.emit('content.page.unpublished', { pageId: id, title: updatedPage.title, slug: updatedPage.slug });
      res.status(200).json({ success: true, data: updatedPage, message: 'Page unpublished successfully' });
    } catch (error: any) {
      console.error('Error unpublishing page:', error);
      res.status(500).json({ success: false, message: 'Failed to unpublish page', error: error.message });
    }
  };

  /**
   * Schedule a page for future publication
   */
  schedulePage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { scheduledAt } = req.body;

      if (!scheduledAt) {
        res.status(400).json({ success: false, message: 'Scheduled date is required' });
        return;
      }

      const page = await this.contentRepo.findPageById(id);
      if (!page) {
        res.status(404).json({ success: false, message: `Page with ID ${id} not found` });
        return;
      }

      const updatedPage = await this.contentRepo.updatePage(id, { status: 'scheduled', scheduledAt });
      res.status(200).json({ success: true, data: updatedPage, message: 'Page scheduled successfully' });
    } catch (error: any) {
      console.error('Error scheduling page:', error);
      res.status(500).json({ success: false, message: 'Failed to schedule page', error: error.message });
    }
  };

  /**
   * Duplicate a page with all its blocks
   */
  duplicatePage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, slug } = req.body;

      if (!title || !slug) {
        res.status(400).json({ success: false, message: 'Title and slug are required' });
        return;
      }

      const original = await this.contentRepo.findPageById(id);
      if (!original) {
        res.status(404).json({ success: false, message: `Page with ID ${id} not found` });
        return;
      }

      const duplicatePage = await this.contentRepo.createPage({
        title,
        slug,
        contentTypeId: original.contentTypeId,
        templateId: original.templateId,
        status: 'draft',
        visibility: original.visibility,
        summary: original.summary,
        featuredImage: original.featuredImage,
        metaTitle: original.metaTitle,
        metaDescription: original.metaDescription,
        metaKeywords: original.metaKeywords,
        customFields: original.customFields
        // isHomePage defaults to false in DB, don't pass explicitly
      });

      // Duplicate blocks
      const blocks = await this.contentRepo.findBlocksByPageId(id);
      for (const block of blocks) {
        await this.contentRepo.createBlock({
          pageId: duplicatePage.id,
          contentTypeId: block.contentTypeId,
          name: block.name,
          order: block.order,
          content: block.content,
          status: block.status
        });
      }

      eventBus.emit('content.page.created', { pageId: duplicatePage.id, title: duplicatePage.title, slug: duplicatePage.slug });
      res.status(201).json({ success: true, data: duplicatePage, message: 'Page duplicated successfully' });
    } catch (error: any) {
      console.error('Error duplicating page:', error);
      res.status(500).json({ success: false, message: 'Failed to duplicate page', error: error.message });
    }
  };

  // Category Handlers

  getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const parentId = req.query.parentId as string | undefined;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

      const categories = await this.categoryRepo.findAllCategories(parentId, isActive, limit, offset);
      res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
    }
  };

  getCategoryTree = async (req: Request, res: Response): Promise<void> => {
    try {
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const categories = await this.categoryRepo.getCategoryTree(isActive);
      res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
      console.error('Error fetching category tree:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch category tree', error: error.message });
    }
  };

  createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, slug, parentId, description, featuredImage, metaTitle, metaDescription, sortOrder, isActive } = req.body;

      if (!name || !slug) {
        res.status(400).json({ success: false, message: 'Name and slug are required' });
        return;
      }

      const category = await this.categoryRepo.createCategory({
        name, slug, parentId, description, featuredImage, metaTitle, metaDescription,
        sortOrder: sortOrder || 0, isActive: isActive !== undefined ? isActive : true, depth: 0
      });

      eventBus.emit('content.category.created', { categoryId: category.id, name: category.name, slug: category.slug, parentId: category.parentId });
      res.status(201).json({ success: true, data: category, message: 'Category created successfully' });
    } catch (error: any) {
      console.error('Error creating category:', error);
      res.status(500).json({ success: false, message: 'Failed to create category', error: error.message });
    }
  };

  getCategoryById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const category = await this.categoryRepo.findCategoryById(id);
      if (!category) {
        res.status(404).json({ success: false, message: `Category with ID ${id} not found` });
        return;
      }
      res.status(200).json({ success: true, data: category });
    } catch (error: any) {
      console.error('Error fetching category:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch category', error: error.message });
    }
  };

  updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, slug, description, featuredImage, metaTitle, metaDescription, sortOrder, isActive } = req.body;

      const existing = await this.categoryRepo.findCategoryById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: `Category with ID ${id} not found` });
        return;
      }

      const updated = await this.categoryRepo.updateCategory(id, { name, slug, description, featuredImage, metaTitle, metaDescription, sortOrder, isActive });
      eventBus.emit('content.category.updated', { categoryId: id, name: updated.name, slug: updated.slug });
      res.status(200).json({ success: true, data: updated, message: 'Category updated successfully' });
    } catch (error: any) {
      console.error('Error updating category:', error);
      res.status(500).json({ success: false, message: 'Failed to update category', error: error.message });
    }
  };

  deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const existing = await this.categoryRepo.findCategoryById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: `Category with ID ${id} not found` });
        return;
      }

      await this.categoryRepo.deleteCategory(id);
      eventBus.emit('content.category.deleted', { categoryId: id, name: existing.name });
      res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      res.status(500).json({ success: false, message: 'Failed to delete category', error: error.message });
    }
  };

  moveCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { newParentId } = req.body;

      const updated = await this.categoryRepo.moveCategory(id, newParentId);
      res.status(200).json({ success: true, data: updated, message: 'Category moved successfully' });
    } catch (error: any) {
      console.error('Error moving category:', error);
      res.status(500).json({ success: false, message: 'Failed to move category', error: error.message });
    }
  };

  // Navigation Handlers

  getNavigations = async (req: Request, res: Response): Promise<void> => {
    try {
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const navigations = await this.navigationRepo.findAllNavigations(isActive);
      res.status(200).json({ success: true, data: navigations });
    } catch (error: any) {
      console.error('Error fetching navigations:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch navigations', error: error.message });
    }
  };

  createNavigation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, slug, description, location, isActive } = req.body;

      if (!name || !slug) {
        res.status(400).json({ success: false, message: 'Name and slug are required' });
        return;
      }

      const navigation = await this.navigationRepo.createNavigation({ name, slug, description, location, isActive: isActive !== undefined ? isActive : true });
      eventBus.emit('content.navigation.created', { navigationId: navigation.id, name: navigation.name, slug: navigation.slug, location: navigation.location });
      res.status(201).json({ success: true, data: navigation, message: 'Navigation created successfully' });
    } catch (error: any) {
      console.error('Error creating navigation:', error);
      res.status(500).json({ success: false, message: 'Failed to create navigation', error: error.message });
    }
  };

  getNavigationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const navigation = await this.navigationRepo.findNavigationById(id);
      if (!navigation) {
        res.status(404).json({ success: false, message: `Navigation with ID ${id} not found` });
        return;
      }
      res.status(200).json({ success: true, data: navigation });
    } catch (error: any) {
      console.error('Error fetching navigation:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch navigation', error: error.message });
    }
  };

  getNavigationWithItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const navigation = await this.navigationRepo.findNavigationById(id);
      if (!navigation) {
        res.status(404).json({ success: false, message: `Navigation with ID ${id} not found` });
        return;
      }

      const items = await this.navigationRepo.findAllNavigationItems(id);
      res.status(200).json({ success: true, data: { navigation, items } });
    } catch (error: any) {
      console.error('Error fetching navigation with items:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch navigation with items', error: error.message });
    }
  };

  updateNavigation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, slug, description, location, isActive } = req.body;

      const existing = await this.navigationRepo.findNavigationById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: `Navigation with ID ${id} not found` });
        return;
      }

      const updated = await this.navigationRepo.updateNavigation(id, { name, slug, description, location, isActive });
      eventBus.emit('content.navigation.updated', { navigationId: id, name: updated.name });
      res.status(200).json({ success: true, data: updated, message: 'Navigation updated successfully' });
    } catch (error: any) {
      console.error('Error updating navigation:', error);
      res.status(500).json({ success: false, message: 'Failed to update navigation', error: error.message });
    }
  };

  deleteNavigation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.navigationRepo.deleteNavigation(id);
      res.status(200).json({ success: true, message: 'Navigation deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting navigation:', error);
      res.status(500).json({ success: false, message: 'Failed to delete navigation', error: error.message });
    }
  };

  addNavigationItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const { navigationId } = req.params;
      const { parentId, title, type, url, contentPageId, targetId, targetSlug, icon, cssClasses, openInNewTab, isActive, sortOrder, conditions } = req.body;

      if (!title || !type) {
        res.status(400).json({ success: false, message: 'Title and type are required' });
        return;
      }

      const item = await this.navigationRepo.createNavigationItem({
        navigationId, parentId, title, type, url, contentPageId, targetId, targetSlug, icon, cssClasses,
        openInNewTab: openInNewTab || false, isActive: isActive !== undefined ? isActive : true, sortOrder: sortOrder || 0, conditions, depth: 0
      });

      eventBus.emit('content.navigation.item_added', { navigationId, itemId: item.id, title: item.title, type: item.type });
      res.status(201).json({ success: true, data: item, message: 'Navigation item added successfully' });
    } catch (error: any) {
      console.error('Error adding navigation item:', error);
      res.status(500).json({ success: false, message: 'Failed to add navigation item', error: error.message });
    }
  };

  updateNavigationItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, type, url, contentPageId, icon, openInNewTab, isActive, sortOrder } = req.body;

      const updated = await this.navigationRepo.updateNavigationItem(id, { title, type, url, contentPageId, icon, openInNewTab, isActive, sortOrder });
      res.status(200).json({ success: true, data: updated, message: 'Navigation item updated successfully' });
    } catch (error: any) {
      console.error('Error updating navigation item:', error);
      res.status(500).json({ success: false, message: 'Failed to update navigation item', error: error.message });
    }
  };

  deleteNavigationItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.navigationRepo.deleteNavigationItem(id);
      res.status(200).json({ success: true, message: 'Navigation item deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting navigation item:', error);
      res.status(500).json({ success: false, message: 'Failed to delete navigation item', error: error.message });
    }
  };

  reorderNavigationItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const { navigationId } = req.params;
      const { itemOrders } = req.body;

      if (!itemOrders || !Array.isArray(itemOrders)) {
        res.status(400).json({ success: false, message: 'Item orders array is required' });
        return;
      }

      await this.navigationRepo.reorderNavigationItems(navigationId, itemOrders);
      res.status(200).json({ success: true, message: 'Navigation items reordered successfully' });
    } catch (error: any) {
      console.error('Error reordering navigation items:', error);
      res.status(500).json({ success: false, message: 'Failed to reorder navigation items', error: error.message });
    }
  };

  // Media Handlers

  getMedia = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const folderId = req.query.folderId as string | undefined;
      const fileType = req.query.fileType as string | undefined;

      const media = await this.mediaRepo.findAllMedia(folderId, fileType, limit, offset);
      res.status(200).json({ success: true, data: media });
    } catch (error: any) {
      console.error('Error fetching media:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch media', error: error.message });
    }
  };

  uploadMedia = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, fileName, filePath, fileType, fileSize, url, width, height, duration, altText, caption, description, folderId, thumbnailUrl, tags, isExternal, externalService, externalId } = req.body;

      if (!title || !fileName || !url) {
        res.status(400).json({ success: false, message: 'Title, fileName, and URL are required' });
        return;
      }

      const media = await this.mediaRepo.createMedia({
        title, fileName, filePath: filePath || '', fileType: fileType || 'application/octet-stream', fileSize: fileSize || 0, url,
        width, height, duration, altText, caption, description, folderId, thumbnailUrl, sortOrder: 0, tags, isExternal: isExternal || false, externalService, externalId
      });

      eventBus.emit('content.media.uploaded', { mediaId: media.id, title: media.title, fileName: media.fileName, fileType: media.fileType, fileSize: media.fileSize });
      res.status(201).json({ success: true, data: media, message: 'Media uploaded successfully' });
    } catch (error: any) {
      console.error('Error uploading media:', error);
      res.status(500).json({ success: false, message: 'Failed to upload media', error: error.message });
    }
  };

  getMediaById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const media = await this.mediaRepo.findMediaById(id);
      if (!media) {
        res.status(404).json({ success: false, message: `Media with ID ${id} not found` });
        return;
      }
      res.status(200).json({ success: true, data: media });
    } catch (error: any) {
      console.error('Error fetching media:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch media', error: error.message });
    }
  };

  updateMedia = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, altText, caption, description, folderId, tags, sortOrder } = req.body;

      const updated = await this.mediaRepo.updateMedia(id, { title, altText, caption, description, folderId, tags, sortOrder });
      res.status(200).json({ success: true, data: updated, message: 'Media updated successfully' });
    } catch (error: any) {
      console.error('Error updating media:', error);
      res.status(500).json({ success: false, message: 'Failed to update media', error: error.message });
    }
  };

  deleteMedia = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const media = await this.mediaRepo.findMediaById(id);
      if (!media) {
        res.status(404).json({ success: false, message: `Media with ID ${id} not found` });
        return;
      }

      await this.mediaRepo.deleteMedia(id);
      eventBus.emit('content.media.deleted', { mediaId: id, fileName: media.fileName });
      res.status(200).json({ success: true, message: 'Media deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting media:', error);
      res.status(500).json({ success: false, message: 'Failed to delete media', error: error.message });
    }
  };

  moveMediaToFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { mediaIds, folderId } = req.body;

      if (!mediaIds || !Array.isArray(mediaIds)) {
        res.status(400).json({ success: false, message: 'Media IDs array is required' });
        return;
      }

      let movedCount = 0;
      for (const mediaId of mediaIds) {
        try {
          await this.mediaRepo.updateMedia(mediaId, { folderId: folderId || undefined });
          movedCount++;
        } catch { /* skip */ }
      }

      res.status(200).json({ success: true, data: { movedCount }, message: `${movedCount} media items moved successfully` });
    } catch (error: any) {
      console.error('Error moving media:', error);
      res.status(500).json({ success: false, message: 'Failed to move media', error: error.message });
    }
  };

  // Media Folder Handlers

  getMediaFolders = async (req: Request, res: Response): Promise<void> => {
    try {
      const parentId = req.query.parentId as string | undefined;
      const folders = await this.mediaRepo.findAllFolders(parentId);
      res.status(200).json({ success: true, data: folders });
    } catch (error: any) {
      console.error('Error fetching media folders:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch media folders', error: error.message });
    }
  };

  getMediaFolderTree = async (req: Request, res: Response): Promise<void> => {
    try {
      const folders = await this.mediaRepo.findAllFolders();
      res.status(200).json({ success: true, data: folders });
    } catch (error: any) {
      console.error('Error fetching media folder tree:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch media folder tree', error: error.message });
    }
  };

  createMediaFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, parentId } = req.body;

      if (!name) {
        res.status(400).json({ success: false, message: 'Folder name is required' });
        return;
      }

      const folder = await this.mediaRepo.createFolder({ name, parentId, depth: 0, sortOrder: 0 });
      res.status(201).json({ success: true, data: folder, message: 'Folder created successfully' });
    } catch (error: any) {
      console.error('Error creating media folder:', error);
      res.status(500).json({ success: false, message: 'Failed to create media folder', error: error.message });
    }
  };

  updateMediaFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, parentId, sortOrder } = req.body;

      const updated = await this.mediaRepo.updateFolder(id, { name, parentId, sortOrder });
      res.status(200).json({ success: true, data: updated, message: 'Folder updated successfully' });
    } catch (error: any) {
      console.error('Error updating media folder:', error);
      res.status(500).json({ success: false, message: 'Failed to update media folder', error: error.message });
    }
  };

  deleteMediaFolder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.mediaRepo.deleteFolder(id);
      res.status(200).json({ success: true, message: 'Folder deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting media folder:', error);
      res.status(500).json({ success: false, message: 'Failed to delete media folder', error: error.message });
    }
  };

  // Redirect Handlers

  getRedirects = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

      const redirects = await this.redirectRepo.findAllRedirects(isActive, limit, offset);
      res.status(200).json({ success: true, data: redirects });
    } catch (error: any) {
      console.error('Error fetching redirects:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch redirects', error: error.message });
    }
  };

  createRedirect = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sourceUrl, targetUrl, statusCode, isRegex, isActive, notes } = req.body;

      if (!sourceUrl || !targetUrl) {
        res.status(400).json({ success: false, message: 'Source URL and target URL are required' });
        return;
      }

      const redirect = await this.redirectRepo.createRedirect({
        sourceUrl, targetUrl, statusCode: statusCode || 301, isRegex: isRegex || false, isActive: isActive !== undefined ? isActive : true, notes
      });

      eventBus.emit('content.redirect.created', { redirectId: redirect.id, sourceUrl: redirect.sourceUrl, targetUrl: redirect.targetUrl, statusCode: redirect.statusCode });
      res.status(201).json({ success: true, data: redirect, message: 'Redirect created successfully' });
    } catch (error: any) {
      console.error('Error creating redirect:', error);
      res.status(500).json({ success: false, message: 'Failed to create redirect', error: error.message });
    }
  };

  getRedirectById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const redirect = await this.redirectRepo.findRedirectById(id);
      if (!redirect) {
        res.status(404).json({ success: false, message: `Redirect with ID ${id} not found` });
        return;
      }
      res.status(200).json({ success: true, data: redirect });
    } catch (error: any) {
      console.error('Error fetching redirect:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch redirect', error: error.message });
    }
  };

  updateRedirect = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { sourceUrl, targetUrl, statusCode, isRegex, isActive, notes } = req.body;

      const updated = await this.redirectRepo.updateRedirect(id, { sourceUrl, targetUrl, statusCode, isRegex, isActive, notes });
      eventBus.emit('content.redirect.updated', { redirectId: id, sourceUrl: updated.sourceUrl, targetUrl: updated.targetUrl });
      res.status(200).json({ success: true, data: updated, message: 'Redirect updated successfully' });
    } catch (error: any) {
      console.error('Error updating redirect:', error);
      res.status(500).json({ success: false, message: 'Failed to update redirect', error: error.message });
    }
  };

  deleteRedirect = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const redirect = await this.redirectRepo.findRedirectById(id);
      if (!redirect) {
        res.status(404).json({ success: false, message: `Redirect with ID ${id} not found` });
        return;
      }

      await this.redirectRepo.deleteRedirect(id);
      eventBus.emit('content.redirect.deleted', { redirectId: id, sourceUrl: redirect.sourceUrl });
      res.status(200).json({ success: true, message: 'Redirect deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting redirect:', error);
      res.status(500).json({ success: false, message: 'Failed to delete redirect', error: error.message });
    }
  };
}
