import { jsonResponse, redirectResponse } from 'libs/apiResponse';
/**
 * Content Controller
 * Handles content management for the Admin Hub
 */

import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { CreatePageCommand } from '../../application/useCases/CreatePage';
import { UpdatePageCommand } from '../../application/useCases/UpdatePage';
import { PublishPageCommand } from '../../application/useCases/PublishPage';
import { createPageUseCase, updatePageUseCase, publishPageUseCase, manageContentUseCase } from '../../application/useCases/wired';
import { adminRespond } from '../../../../libs/adminRespond';

// ============================================================================
// Content Pages
// ============================================================================

export const listContentPages = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const status = req.query.status as string | undefined;
  const contentTypeId = req.query.contentTypeId as string | undefined;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const pages = await manageContentUseCase.findAllPages(
    status as 'draft' | 'published' | 'scheduled' | 'archived' | undefined,
    contentTypeId,
    limit,
    offset,
  );

  // Get content types for filtering
  const contentTypes = await manageContentUseCase.findAllContentTypes(true);

  adminRespond(req, res, 'content/pages/index', {
    pageName: 'Content Pages',
    pages,
    contentTypes,
    filters: { status, contentTypeId },
    pagination: { limit, offset },

    success: req.query.success || null,
  });
};

export const createContentPageForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const contentTypes = await manageContentUseCase.findAllContentTypes(true);
  const templates = await manageContentUseCase.findAllTemplates(true);

  adminRespond(req, res, 'content/pages/create', {
    pageName: 'Create Content Page',
    contentTypes,
    templates,
  });
};

export const createContentPage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as HttpRequestBody;
  const {
    title,
    slug,
    contentTypeId,
    templateId,
    summary,
    featuredImage,
    metaTitle,
    metaDescription,
    metaKeywords,
    status,
    visibility,
    _accessPassword,
    isHomePage,
  } = body as {
    title: string;
    slug: string;
    contentTypeId: string;
    templateId?: string;
    summary?: string;
    featuredImage?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    status?: string;
    visibility?: string;
    _accessPassword?: string;
    isHomePage?: string;
  };

  const command = new CreatePageCommand({
    title: title,
    slug: slug,
    contentTypeId: contentTypeId,
    templateId: templateId || undefined,
    status: status as 'draft' | 'published' | 'scheduled' | 'archived',
    visibility: visibility as 'public' | 'private' | 'passwordProtected',
    summary: summary || undefined,
    featuredImage: featuredImage || undefined,
    metaTitle: metaTitle || undefined,
    metaDescription: metaDescription || undefined,
    metaKeywords: metaKeywords || undefined,
    isHomePage: isHomePage === 'true',
  });

  const result = await createPageUseCase.execute(command);

  redirectResponse(res, `/hub/content/pages/${result.contentPageId}?success=Content page created successfully`);
};

export const viewContentPage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { pageId } = req.params;

  const page = await manageContentUseCase.findPageById(pageId);

  if (!page) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Content page not found',
    });
    return;
  }

  // Get content blocks for this page
  const blocks = await manageContentUseCase.findBlocksByPageId(pageId);

  adminRespond(req, res, 'content/pages/view', {
    pageName: `Page: ${page.title}`,
    page,
    blocks,

    success: req.query.success || null,
  });
};

export const editContentPageForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { pageId } = req.params;

  const page = await manageContentUseCase.findPageById(pageId);

  if (!page) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Content page not found',
    });
    return;
  }

  const contentTypes = await manageContentUseCase.findAllContentTypes(true);
  const templates = await manageContentUseCase.findAllTemplates(true);

  adminRespond(req, res, 'content/pages/edit', {
    pageName: `Edit: ${page.title}`,
    page,
    contentTypes,
    templates,
  });
};

export const updateContentPage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { pageId } = req.params;
  const updates: Record<string, unknown> = {};

  const body = req.body as HttpRequestBody;
  const {
    title,
    slug,
    contentTypeId,
    templateId,
    summary,
    featuredImage,
    metaTitle,
    metaDescription,
    metaKeywords,
    status,
    visibility,
    accessPassword,
    isHomePage,
  } = body;

  if (title !== undefined) updates.title = title;
  if (slug !== undefined) updates.slug = slug;
  if (contentTypeId !== undefined) updates.contentTypeId = contentTypeId;
  if (templateId !== undefined) updates.templateId = templateId || undefined;
  if (summary !== undefined) updates.summary = summary || undefined;
  if (featuredImage !== undefined) updates.featuredImage = featuredImage || undefined;
  if (metaTitle !== undefined) updates.metaTitle = metaTitle || undefined;
  if (metaDescription !== undefined) updates.metaDescription = metaDescription || undefined;
  if (metaKeywords !== undefined) updates.metaKeywords = metaKeywords || undefined;
  if (status !== undefined) updates.status = status;
  if (visibility !== undefined) updates.visibility = visibility;
  if (accessPassword !== undefined) updates.accessPassword = accessPassword || undefined;
  if (isHomePage !== undefined) updates.isHomePage = isHomePage === 'true';

  const command = new UpdatePageCommand({
    pageId: pageId,
    title: updates.title as string | undefined,
    slug: updates.slug as string | undefined,
    templateId: updates.templateId as string | undefined,
    status: updates.status as 'draft' | 'published' | 'scheduled' | 'archived' | undefined,
    visibility: updates.visibility as 'public' | 'private' | 'passwordProtected' | undefined,
    summary: updates.summary as string | undefined,
    featuredImage: updates.featuredImage as string | undefined,
    metaTitle: updates.metaTitle as string | undefined,
    metaDescription: updates.metaDescription as string | undefined,
    metaKeywords: updates.metaKeywords as string | undefined,
    isHomePage: updates.isHomePage as boolean | undefined,
  });
  await updatePageUseCase.execute(command);

  redirectResponse(res, `/hub/content/pages/${pageId}?success=Content page updated successfully`);
};

export const publishContentPage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { pageId } = req.params;

  const command = new PublishPageCommand(pageId);
  await publishPageUseCase.execute(command);

  jsonResponse(res, 200, { success: true, message: 'Content page published successfully' });
};

export const deleteContentPage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { pageId } = req.params;

  const success = await manageContentUseCase.deletePage(pageId);

  if (!success) {
    throw new Error('Failed to delete content page');
  }

  jsonResponse(res, 200, { success: true, message: 'Content page deleted successfully' });
};

// ============================================================================
// Content Templates
// ============================================================================

export const listContentTemplates = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const templates = await manageContentUseCase.findAllTemplates();

  adminRespond(req, res, 'content/templates/index', {
    pageName: 'Content Templates',
    templates,

    success: req.query.success || null,
  });
};

// ============================================================================
// Content Media
// ============================================================================

export const listContentMedia = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  // For now, show basic media interface - can be expanded later
  const mediaItems: unknown[] = [];

  adminRespond(req, res, 'content/media/index', {
    pageName: 'Media Library',
    mediaItems,

    success: req.query.success || null,
  });
};
