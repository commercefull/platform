import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import contentDataRepository from '../../infrastructure/repositories/ContentDataRepository';

const contentRepo = contentDataRepository.pages;

/**
 * Get published pages with optional filtering
 * Only returns published pages, with limited information
 */
export const getPublishedPages = async (req: TypedRequest, res: Response): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  // Only return published pages
  const pages = await contentRepo.findAllPages('published', undefined, limit, offset);

  // Remove sensitive information
  const sanitizedPages = pages.map(page => ({
    id: page.contentPageId,
    title: page.title,
    slug: page.slug,
    summary: page.summary,
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
  
};

/**
 * Get a published page by its slug with all content blocks
 */
export const getPublishedPageBySlug = async (req: TypedRequest, res: Response): Promise<void> => {
  const { slug } = req.params;

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
  const blocks = await contentRepo.findBlocksByPageId(page.contentPageId);

  // Get the template if one is assigned to the page
  const template = page.templateId ? await contentRepo.findTemplateById(page.templateId) : undefined;

  // Combine into a pageData object for consistency with existing code
  const pageData = {
    page,
    blocks: await Promise.all(
      blocks.map(async block => {
        const contentType = await contentRepo.findBlockTypeById(block.blockTypeId);
        return {
          ...block,
          contentType: contentType || {
            contentBlockTypeId: block.blockTypeId,
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
  const sanitizedBlocks = pageData.blocks.map((block) => ({
    id: block.contentBlockId,
    title: block.title,
    sortOrder: block.sortOrder,
    content: block.content,
    contentType: {
      id: block.contentType.contentBlockTypeId,
      name: block.contentType.name,
      slug: block.contentType.slug,
    },
  }));

  // Sanitize template if present
  const sanitizedTemplate = pageData.template
    ? {
        id: pageData.template.contentTemplateId,
        name: pageData.template.name,
        slug: pageData.template.slug,
        htmlStructure: pageData.template.htmlStructure,
      }
    : undefined;

  // Sanitize page data
  const sanitizedPage = {
    id: pageData.page.contentPageId,
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
};

/**
 * Get active content types (sanitized for public use)
 */
export const getActiveContentTypes = async (req: TypedRequest, res: Response): Promise<void> => {
  const contentTypes = await contentRepo.findAllContentTypes(true);

  // Sanitize content types to remove sensitive schema information
  const sanitizedContentTypes = contentTypes.map(type => ({
    id: type.contentTypeId,
    name: type.name,
    slug: type.slug,
    description: type.description,
  }));

  res.status(200).json({
    success: true,
    data: sanitizedContentTypes,
  });
  
};
