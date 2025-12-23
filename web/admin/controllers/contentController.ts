/**
 * Content Controller
 * Handles content management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import ContentRepo from '../../../modules/content/repos/contentRepo';
import { CreatePageUseCase, CreatePageCommand } from '../../../modules/content/application/useCases/CreatePage';
import { UpdatePageUseCase, UpdatePageCommand } from '../../../modules/content/application/useCases/UpdatePage';
import { PublishPageUseCase, PublishPageCommand } from '../../../modules/content/application/useCases/PublishPage';
import { adminRespond } from 'web/respond';

// ============================================================================
// Content Pages
// ============================================================================

export const listContentPages = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const contentTypeId = req.query.contentTypeId as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const pages = await ContentRepo.findAllPages(status as any, contentTypeId, limit, offset);

    // Get content types for filtering
    const contentTypes = await ContentRepo.findAllContentTypes(true);

    adminRespond(req, res, 'content/pages/index', {
      pageName: 'Content Pages',
      pages,
      contentTypes,
      filters: { status, contentTypeId },
      pagination: { limit, offset },

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load content pages',
    });
  }
};

export const createContentPageForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const contentTypes = await ContentRepo.findAllContentTypes(true);
    const templates = await ContentRepo.findAllTemplates(true);

    adminRespond(req, res, 'content/pages/create', {
      pageName: 'Create Content Page',
      contentTypes,
      templates,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createContentPage = async (req: Request, res: Response): Promise<void> => {
  try {
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
    } = req.body;

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

    const useCase = new CreatePageUseCase(ContentRepo);
    const result = await useCase.execute(command);

    res.redirect(`/hub/content/pages/${result.id}?success=Content page created successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    try {
      const contentTypes = await ContentRepo.findAllContentTypes(true);
      const templates = await ContentRepo.findAllTemplates(true);

      adminRespond(req, res, 'content/pages/create', {
        pageName: 'Create Content Page',
        contentTypes,
        templates,
        error: error.message || 'Failed to create content page',
        formData: req.body,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to create content page',
      });
    }
  }
};

export const viewContentPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pageId } = req.params;

    const page = await ContentRepo.findPageById(pageId);

    if (!page) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Content page not found',
      });
      return;
    }

    // Get content blocks for this page
    const blocks = await ContentRepo.findBlocksByPageId(pageId);

    adminRespond(req, res, 'content/pages/view', {
      pageName: `Page: ${page.title}`,
      page,
      blocks,

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load content page',
    });
  }
};

export const editContentPageForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pageId } = req.params;

    const page = await ContentRepo.findPageById(pageId);

    if (!page) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Content page not found',
      });
      return;
    }

    const contentTypes = await ContentRepo.findAllContentTypes(true);
    const templates = await ContentRepo.findAllTemplates(true);

    adminRespond(req, res, 'content/pages/edit', {
      pageName: `Edit: ${page.title}`,
      page,
      contentTypes,
      templates,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateContentPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pageId } = req.params;
    const updates: any = {};

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
    } = req.body;

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

    const command = new UpdatePageCommand(pageId, updates);
    const useCase = new UpdatePageUseCase(ContentRepo);
    await useCase.execute(command);

    res.redirect(`/hub/content/pages/${pageId}?success=Content page updated successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    try {
      const page = await ContentRepo.findPageById(req.params.pageId);
      const contentTypes = await ContentRepo.findAllContentTypes(true);
      const templates = await ContentRepo.findAllTemplates(true);

      adminRespond(req, res, 'content/pages/edit', {
        pageName: `Edit: ${page?.title || 'Page'}`,
        page,
        contentTypes,
        templates,
        error: error.message || 'Failed to update content page',
        formData: req.body,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to update content page',
      });
    }
  }
};

export const publishContentPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pageId } = req.params;

    const command = new PublishPageCommand(pageId);
    const useCase = new PublishPageUseCase(ContentRepo);
    await useCase.execute(command);

    res.json({ success: true, message: 'Content page published successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to publish content page' });
  }
};

export const deleteContentPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pageId } = req.params;

    const success = await ContentRepo.deletePage(pageId);

    if (!success) {
      throw new Error('Failed to delete content page');
    }

    res.json({ success: true, message: 'Content page deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to delete content page' });
  }
};

// ============================================================================
// Content Templates
// ============================================================================

export const listContentTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = await ContentRepo.findAllTemplates();

    adminRespond(req, res, 'content/templates/index', {
      pageName: 'Content Templates',
      templates,

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load content templates',
    });
  }
};

// ============================================================================
// Content Media
// ============================================================================

export const listContentMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    // For now, show basic media interface - can be expanded later
    const mediaItems: any[] = [];

    adminRespond(req, res, 'content/media/index', {
      pageName: 'Media Library',
      mediaItems,

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load media library',
    });
  }
};
