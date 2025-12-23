import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { ContentRepo } from '../repos/contentRepo';

const contentRepo = new ContentRepo();

/**
 * Get published pages with optional filtering
 * Only returns published pages, with limited information
 */
export const getPublishedPages = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Only return published pages
    const pages = await contentRepo.findAllPages('published', undefined, limit, offset);

    // Remove sensitive information
    const sanitizedPages = pages.map(page => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      summary: page.summary, // Using summary instead of description as per ContentPage interface
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      publishedAt: page.publishedAt,
    }));

    res.status(200).json({
      success: true,
      data: sanitizedPages,
      pagination: {
        limit,
        offset,
        total: pages.length,
      },
    });
  } catch (error) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch pages',
      error: (error as Error).message,
    });
  }
};

/**
 * Get a published page by its slug with all content blocks
 */
export const getPublishedPageBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    try {
      // First get the page by slug
      const page = await contentRepo.findPageBySlug(slug);

      if (!page) {
        res.status(404).json({
          success: false,
          message: 'Page not found',
        });
        return;
      }

      // Then get content blocks for the page
      const blocks = await contentRepo.findBlocksByPageId(page.id);

      // Get the template if one is assigned to the page
      const template = page.templateId ? await contentRepo.findTemplateById(page.templateId) : undefined;

      // Combine into a pageData object for consistency with existing code
      const pageData = {
        page,
        blocks: await Promise.all(
          blocks.map(async block => {
            const contentType = await contentRepo.findContentTypeById(block.contentTypeId);
            return {
              ...block,
              contentType: contentType || {
                id: block.contentTypeId,
                name: 'Unknown',
                slug: 'unknown',
              },
            };
          }),
        ),
        template,
      };

      // Check if the page is published
      if (pageData.page.status !== 'published') {
        res.status(404).json({
          success: false,
          message: `Page not found`,
        });
        return;
      }

      // Sanitize content types to remove sensitive schema information
      const sanitizedBlocks = pageData.blocks.map((block: any) => ({
        id: block.id,
        name: block.name,
        order: block.order,
        content: block.content,
        contentType: {
          id: block.contentType.id,
          name: block.contentType.name,
          slug: block.contentType.slug,
        },
      }));

      // Sanitize template if present
      const sanitizedTemplate = pageData.template
        ? {
            id: pageData.template.id,
            name: pageData.template.name,
            slug: pageData.template.slug,
            htmlStructure: pageData.template.htmlStructure,
          }
        : undefined;

      // Sanitize page data
      const sanitizedPage = {
        id: pageData.page.id,
        title: pageData.page.title,
        slug: pageData.page.slug,
        summary: pageData.page.summary,
        metaTitle: pageData.page.metaTitle,
        metaDescription: pageData.page.metaDescription,
        publishedAt: pageData.page.publishedAt,
      };

      res.status(200).json({
        success: true,
        data: {
          page: sanitizedPage,
          blocks: sanitizedBlocks,
          template: sanitizedTemplate,
        },
      });
    } catch (error: any) {
      logger.error('Error:', error);
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'Page not found',
        });
        return;
      }
      throw error;
    }
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch page content',
      error: error.message,
    });
  }
};

/**
 * Get active content types (sanitized for public use)
 */
export const getActiveContentTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const contentTypes = await contentRepo.findAllContentTypes(true);

    // Sanitize content types to remove sensitive schema information
    const sanitizedContentTypes = contentTypes.map(type => ({
      id: type.id,
      name: type.name,
      slug: type.slug,
      description: type.description,
    }));

    res.status(200).json({
      success: true,
      data: sanitizedContentTypes,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch content types',
      error: error.message,
    });
  }
};
