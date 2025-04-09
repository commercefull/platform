import { Request, Response } from 'express';
import { ContentRepo } from '../repos/contentRepo';

export class ContentPublicController {
  private contentRepo: ContentRepo;

  constructor() {
    this.contentRepo = new ContentRepo();
  }

  /**
   * Get published pages with optional filtering
   * Only returns published pages, with limited information
   */
  getPublishedPages = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      // Only return published pages
      const pages = await this.contentRepo.findAllPages('published', limit, offset);

      // Remove sensitive information
      const sanitizedPages = pages.map(page => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        description: page.description,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        publishedAt: page.publishedAt
      }));

      res.status(200).json({
        success: true,
        data: sanitizedPages,
        pagination: {
          limit,
          offset,
          total: pages.length
        }
      });
    } catch (error) {
      console.error('Error fetching published pages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pages',
        error: (error as Error).message
      });
    }
  };

  /**
   * Get a published page by its slug with all content blocks
   */
  getPublishedPageBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      const { slug } = req.params;
      
      try {
        const pageData = await this.contentRepo.getFullPageContentBySlug(slug);
        
        // Check if the page is published
        if (pageData.page.status !== 'published') {
          res.status(404).json({
            success: false,
            message: `Page not found`
          });
          return;
        }
        
        // Sanitize content types to remove sensitive schema information
        const sanitizedBlocks = pageData.blocks.map(block => ({
          id: block.id,
          name: block.name,
          order: block.order,
          content: block.content,
          contentType: {
            id: block.contentType.id,
            name: block.contentType.name,
            slug: block.contentType.slug
          }
        }));
        
        // Sanitize template if present
        const sanitizedTemplate = pageData.template ? {
          id: pageData.template.id,
          name: pageData.template.name,
          type: pageData.template.type,
          structure: pageData.template.structure
        } : undefined;
        
        // Sanitize page data
        const sanitizedPage = {
          id: pageData.page.id,
          title: pageData.page.title,
          slug: pageData.page.slug,
          description: pageData.page.description,
          metaTitle: pageData.page.metaTitle,
          metaDescription: pageData.page.metaDescription,
          publishedAt: pageData.page.publishedAt
        };
        
        res.status(200).json({
          success: true,
          data: {
            page: sanitizedPage,
            blocks: sanitizedBlocks,
            template: sanitizedTemplate
          }
        });
        
      } catch (error: any) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: 'Page not found'
          });
          return;
        }
        throw error;
      }
    } catch (error: any) {
      console.error('Error fetching published page:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch page content',
        error: error.message
      });
    }
  };

  /**
   * Get active content types (sanitized for public use)
   */
  getActiveContentTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      const contentTypes = await this.contentRepo.findAllContentTypes('active');
      
      // Sanitize content types to remove sensitive schema information
      const sanitizedContentTypes = contentTypes.map(type => ({
        id: type.id,
        name: type.name,
        slug: type.slug,
        description: type.description
      }));

      res.status(200).json({
        success: true,
        data: sanitizedContentTypes
      });
    } catch (error: any) {
      console.error('Error fetching content types:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch content types',
        error: error.message
      });
    }
  };
}
