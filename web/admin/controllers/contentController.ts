/**
 * Content Controller
 * Handles content management for the Admin Hub
 */

import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { CreatePageCommand } from '../../../modules/content/application/useCases/CreatePage';
import { UpdatePageCommand } from '../../../modules/content/application/useCases/UpdatePage';
import { PublishPageCommand } from '../../../modules/content/application/useCases/PublishPage';
import {
  createPageUseCase,
  updatePageUseCase,
  publishPageUseCase,
  manageContentUseCase,
} from '../../../modules/content/application/useCases/wired';
import { adminRespond } from '../../respond';

// ============================================================================
// Content Pages
// ============================================================================

export const listContentPages = async (req: TypedRequest, res: Response): Promise<void> => {
  const status = req.query.status as string | undefined;
  const contentTypeId = req.query.contentTypeId as string | undefined;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const pages = await manageContentUseCase.findAllPages(status as string | undefined, contentTypeId, limit, offset);

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

export const createContentPageForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const contentTypes = await manageContentUseCase.findAllContentTypes(true);
  const templates = await manageContentUseCase.findAllTemplates(true);

  adminRespond(req, res, 'content/pages/create', {
    pageName: 'Create Content Page',
    contentTypes,
    templates,
  });
  
};

export const createContentPage = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as RequestBody;
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
  } = body;

  const command = new CreatePageCommand(
    title, // 1. title
    slug, // 2. slug
    contentTypeId, // 3. contentTypeId
    templateId || undefined, // 4. templateId
    status as 'draft' | 'published' | 'scheduled' | 'archived', // 5. status
    visibility as 'public' | 'private' | 'password_protected', // 6. visibility
    summary || undefined, // 7. summary
    featuredImage || undefined, // 8. featuredImage
    undefined, // 9. parentId (not implemented yet)
    metaTitle || undefined, // 10. metaTitle
    metaDescription || undefined, // 11. metaDescription
    metaKeywords || undefined, // 12. metaKeywords
    undefined, // 13. customFields (not implemented yet)
    undefined, // 14. publishedAt (handled by status)
    undefined, // 15. scheduledAt (not implemented yet)
    isHomePage === 'true', // 16. isHomePage
    undefined, // 17. createdBy (not implemented yet)
  );

  const result = await createPageUseCase.execute(command);

  res.redirect(`/hub/content/pages/${result.contentPageId}?success=Content page created successfully`);
  
};

export const viewContentPage = async (req: TypedRequest, res: Response): Promise<void> => {
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

export const editContentPageForm = async (req: TypedRequest, res: Response): Promise<void> => {
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

export const updateContentPage = async (req: TypedRequest, res: Response): Promise<void> => {
  const { pageId } = req.params;
  const updates: Record<string, unknown> = {};

  const body = req.body as RequestBody;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const command = new UpdatePageCommand(pageId, updates as any);
  await updatePageUseCase.execute(command);

  res.redirect(`/hub/content/pages/${pageId}?success=Content page updated successfully`);
  
};

export const publishContentPage = async (req: TypedRequest, res: Response): Promise<void> => {
  const { pageId } = req.params;

  const command = new PublishPageCommand(pageId);
  await publishPageUseCase.execute(command);

  res.json({ success: true, message: 'Content page published successfully' });
  
};

export const deleteContentPage = async (req: TypedRequest, res: Response): Promise<void> => {
  const { pageId } = req.params;

  const success = await manageContentUseCase.deletePage(pageId);

  if (!success) {
    throw new Error('Failed to delete content page');
  }

  res.json({ success: true, message: 'Content page deleted successfully' });
  
};

// ============================================================================
// Content Templates
// ============================================================================

export const listContentTemplates = async (req: TypedRequest, res: Response): Promise<void> => {
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

export const listContentMedia = async (req: TypedRequest, res: Response): Promise<void> => {
  // For now, show basic media interface - can be expanded later
  const mediaItems: unknown[] = [];

  adminRespond(req, res, 'content/media/index', {
    pageName: 'Media Library',
    mediaItems,

    success: req.query.success || null,
  });
  
};
