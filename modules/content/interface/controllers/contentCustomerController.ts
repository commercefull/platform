import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import { manageContentUseCase, getNavigationWithItemsUseCase } from '../../application/useCases/wired';
import { GetNavigationWithItemsQuery } from '../../application/useCases/navigation/GetNavigationWithItems';
import { matchesContentScope } from '../../domain/valueObjects/contentScope';

const contentUC = manageContentUseCase;

function publicationContext(res: HttpResponse) {
  const local = (key: string) => {
    const value = res.locals[key] as string | undefined;
    return value || undefined;
  };
  return { storeId: local('storeId'), channelId: local('channelId'), locale: local('locale') };
}

/**
 * Get published pages with optional filtering
 * Only returns published pages visible to the resolved store/channel/locale,
 * with limited information
 */
export const getPublishedPages = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  // Only return published pages visible in this context
  const pages = await contentUC.findPublishedPagesForContext(publicationContext(res), limit, offset);

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

  jsonResponse(res, 200, {
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
export const getPublishedPageBySlug = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { slug } = req.params;
  const context = publicationContext(res);

  // First get the page by slug scoped to the resolved store/channel/locale
  const page = await contentUC.findPublishedPageBySlugForContext(slug, context);

  if (!page) {
    jsonResponse(res, 404, {
      success: false,
      message: 'Page not found',
    });
    return;
  }

  // Then get content blocks for the page — drop blocks whose
  // store/channel/locale conditions don't match this context
  const blocks = (await contentUC.findBlocksByPageId(page.contentPageId)).filter(block => matchesContentScope(block.conditions, context));

  // Get the template if one is assigned to the page
  const template = page.templateId ? await contentUC.findTemplateById(page.templateId) : undefined;

  // Combine into a pageData object for consistency with existing code
  const pageData = {
    page,
    blocks: await Promise.all(
      blocks.map(async block => {
        const contentType = await contentUC.findBlockTypeById(block.blockTypeId);
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
    jsonResponse(res, 404, {
      success: false,
      message: `Page not found`,
    });
    return;
  }

  // Sanitize content types to remove sensitive schema information
  const sanitizedBlocks = pageData.blocks.map(block => ({
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

  jsonResponse(res, 200, {
    success: true,
    data: {
      page: sanitizedPage,
      blocks: sanitizedBlocks,
      template: sanitizedTemplate,
    },
  });
};

/**
 * Get an active navigation with its item tree, scoped to the resolved
 * store/channel/locale via item `conditions`.
 */
export const getNavigationBySlug = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { slug } = req.params;

  const navigation = await getNavigationWithItemsUseCase.execute(
    new GetNavigationWithItemsQuery(undefined, slug, undefined, false, publicationContext(res)),
  );

  if (!navigation || !navigation.isActive) {
    jsonResponse(res, 404, { success: false, message: 'Navigation not found' });
    return;
  }

  jsonResponse(res, 200, { success: true, data: navigation });
};

/**
 * Get active content types (sanitized for public use)
 */
export const getActiveContentTypes = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const contentTypes = await contentUC.findAllContentTypes(true);

  // Sanitize content types to remove sensitive schema information
  const sanitizedContentTypes = contentTypes.map(type => ({
    id: type.contentTypeId,
    name: type.name,
    slug: type.slug,
    description: type.description,
  }));

  jsonResponse(res, 200, {
    success: true,
    data: sanitizedContentTypes,
  });
};
