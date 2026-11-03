import {jsonResponse} from 'libs/apiResponse';
import type {HttpRequest, HttpResponse} from 'libs/http';
import {publishPageUseCase, unpublishPageUseCase, schedulePageUseCase, duplicatePageUseCase, manageContentUseCase} from '../../../application/useCases/wired';
import {PublishPageCommand} from '../../../application/useCases/PublishPage';
import {UnpublishPageCommand} from '../../../application/useCases/page/UnpublishPage';
import {SchedulePageCommand} from '../../../application/useCases/page/SchedulePage';
import {DuplicatePageCommand} from '../../../application/useCases/page/DuplicatePage';
import {manageSalesChannelsUseCase} from '../../../../store/application/useCases/wired';
import type {CreateContentTypeBody, UpdateContentTypeBody, CreatePageBody, UpdatePageBody, SchedulePageBody, DuplicatePageBody} from './types';

/** Content type, page, page-action, and page-publication handlers. */
export class TypeAndPageHandlers {
  private contentUC = manageContentUseCase;

  // Content Type Handlers

  /**
   * Get all content types with optional filtering
   */
  getContentTypes = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const contentTypes = await this.contentUC.findAllContentTypes(isActive, limit, offset);

    jsonResponse(res, 200, {
      success: true,
      data: contentTypes,
      pagination: {
        limit,
        offset,
        total: contentTypes.length, // This should ideally be the total count from DB
      },
    });
  };

  /**
   * Get content type by ID
   */
  getContentTypeById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const contentType = await this.contentUC.findContentTypeById(id);

    if (!contentType) {
      jsonResponse(res, 404, {
        success: false,
        message: `Content type with ID ${id} not found`,
      });
      return;
    }

    jsonResponse(res, 200, {
      success: true,
      data: contentType,
    });
  };

  /**
   * Get content type by slug
   */
  getContentTypeBySlug = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { slug } = req.params;
    const contentType = await this.contentUC.findContentTypeBySlug(slug);

    if (!contentType) {
      jsonResponse(res, 404, {
        success: false,
        message: `Content type with slug ${slug} not found`,
      });
      return;
    }

    jsonResponse(res, 200, {
      success: true,
      data: contentType,
    });
  };

  /**
   * Create a new content type
   */
  createContentType = async (
    req: HttpRequest<Record<string, string>, unknown, CreateContentTypeBody>,
    res: HttpResponse,
  ): Promise<void> => {
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
      isActive = true,
    } = req.body;

    // Basic validation
    if (!name || !slug) {
      jsonResponse(res, 400, {
        success: false,
        message: 'Name and slug are required',
      });
      return;
    }

    const contentType = await this.contentUC.createContentType({
      name,
      slug,
      description: description ?? null,
      icon: icon ?? null,
      allowedBlocks: allowedBlocks ?? null,
      defaultTemplate: defaultTemplate ?? null,
      requiredFields: requiredFields ?? null,
      metaFields: metaFields ?? null,
      isSystem,
      isActive,
    });

    jsonResponse(res, 201, {
      success: true,
      data: contentType,
      message: 'Content type created successfully',
    });
  };

  /**
   * Update a content type
   */
  updateContentType = async (
    req: HttpRequest<Record<string, string>, unknown, UpdateContentTypeBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { id } = req.params;
    const { name, slug, description, icon, requiredFields, metaFields, isActive } = req.body;

    // Check if content type exists
    const existingContentType = await this.contentUC.findContentTypeById(id);
    if (!existingContentType) {
      jsonResponse(res, 404, {
        success: false,
        message: `Content type with ID ${id} not found`,
      });
      return;
    }

    const updatedContentType = await this.contentUC.updateContentType(id, {
      name,
      slug,
      description,
      icon,
      requiredFields,
      metaFields,
      isActive,
    });

    jsonResponse(res, 200, {
      success: true,
      data: updatedContentType,
      message: 'Content type updated successfully',
    });
  };

  /**
   * Delete a content type
   */
  deleteContentType = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;

    // Check if content type exists
    const existingContentType = await this.contentUC.findContentTypeById(id);
    if (!existingContentType) {
      jsonResponse(res, 404, {
        success: false,
        message: `Content type with ID ${id} not found`,
      });
      return;
    }

    await this.contentUC.deleteContentType(id);

    jsonResponse(res, 200, {
      success: true,
      message: 'Content type deleted successfully',
    });
  };

  // Content Page Handlers

  /**
   * Get all content pages with optional filtering
   */
  getPages = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as 'draft' | 'published' | 'scheduled' | 'archived' | undefined;
    const contentTypeId = req.query.contentTypeId as string | undefined;
    const search = req.query.search as string | undefined;

    const pages = await this.contentUC.findAllPages(status, contentTypeId, limit, offset, search);

    jsonResponse(res, 200, {
      success: true,
      data: pages,
      pagination: {
        limit,
        offset,
        total: pages.length, // This should ideally be the total count from DB
      },
    });
  };

  /**
   * Get page by ID
   */
  getPageById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const page = await this.contentUC.findPageById(id);

    if (!page) {
      jsonResponse(res, 404, {
        success: false,
        message: `Page with ID ${id} not found`,
      });
      return;
    }

    jsonResponse(res, 200, {
      success: true,
      data: page,
    });
  };

  /**
   * Get page with full content by ID
   */
  getFullPageById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;

    // Fetch the basic page data
    const page = await this.contentUC.findPageById(id);
    if (!page) {
      jsonResponse(res, 404, {
        success: false,
        message: `Page with ID ${id} not found`,
      });
      return;
    }

    // Fetch all content blocks for this page
    const blocks = await this.contentUC.findBlocksByPageId(id);

    // If the page has a template, fetch it as well
    let template = null;
    if (page.templateId) {
      template = await this.contentUC.findTemplateById(page.templateId);
    }

    // Fetch content type if specified
    let contentType = null;
    if (page.contentTypeId) {
      contentType = await this.contentUC.findContentTypeById(page.contentTypeId);
    }

    // Construct the full page data
    const fullPage = {
      page,
      blocks,
      template,
      contentType,
    };

    jsonResponse(res, 200, {
      success: true,
      data: fullPage,
    });
  };

  /**
   * Create a new page
   */
  createPage = async (req: HttpRequest<Record<string, string>, unknown, CreatePageBody>, res: HttpResponse): Promise<void> => {
    const {
      title,
      slug,
      description,
      metaTitle,
      metaDescription,
      status = 'draft',
      publishedAt,
      layout,
      contentTypeId,
      visibility = 'public', // Default to public visibility
    } = req.body;

    // Basic validation
    if (!title || !slug || !contentTypeId) {
      jsonResponse(res, 400, {
        success: false,
        message: 'Title, slug, and contentTypeId are required',
      });
      return;
    }

    // Validate layout if provided
    if (layout) {
      const template = await this.contentUC.findTemplateById(layout);
      if (!template) {
        jsonResponse(res, 400, {
          success: false,
          message: 'Invalid layout template specified',
        });
        return;
      }
    }

    const page = await this.contentUC.createPage({
      title,
      slug,
      summary: description ?? null, // Using description value but assigning to the correct field name 'summary'
      metaTitle: metaTitle ?? null,
      metaDescription: metaDescription ?? null,
      status: status as 'draft' | 'published' | 'scheduled' | 'archived',
      publishedAt: publishedAt ? new Date(publishedAt) : null,
      templateId: layout ?? null, // Layout corresponds to templateId
      contentTypeId,
      visibility: visibility as 'public' | 'private' | 'passwordProtected',
    });

    jsonResponse(res, 201, {
      success: true,
      data: page,
      message: 'Page created successfully',
    });
  };

  /**
   * Update a page
   */
  updatePage = async (req: HttpRequest<Record<string, string>, unknown, UpdatePageBody>, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { title, slug, description, metaTitle, metaDescription, status, publishedAt, layout } = req.body;

    // Check if page exists
    const existingPage = await this.contentUC.findPageById(id);
    if (!existingPage) {
      jsonResponse(res, 404, {
        success: false,
        message: `Page with ID ${id} not found`,
      });
      return;
    }

    // Validate layout if provided
    if (layout) {
      const template = await this.contentUC.findTemplateById(layout);
      if (!template) {
        jsonResponse(res, 400, {
          success: false,
          message: 'Invalid layout template specified',
        });
        return;
      }
    }

    const updatedPage = await this.contentUC.updatePage(id, {
      title,
      slug,
      summary: description, // Using description value but mapping to 'summary' field
      metaTitle,
      metaDescription,
      status: status as 'draft' | 'published' | 'scheduled' | 'archived' | undefined,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      templateId: layout, // Layout corresponds to templateId
    });

    jsonResponse(res, 200, {
      success: true,
      data: updatedPage,
      message: 'Page updated successfully',
    });
  };

  /**
   * Delete a page
   */
  deletePage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;

    // Check if page exists
    const existingPage = await this.contentUC.findPageById(id);
    if (!existingPage) {
      jsonResponse(res, 404, {
        success: false,
        message: `Page with ID ${id} not found`,
      });
      return;
    }

    await this.contentUC.deletePage(id);

    jsonResponse(res, 200, {
      success: true,
      message: 'Page deleted successfully',
    });
  };

  // Page Action Handlers

  /**
   * Publish a page
   */
  publishPage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const result = await publishPageUseCase.execute(new PublishPageCommand(id, req.user?.id));
    jsonResponse(res, 200, { success: true, data: result, message: 'Page published successfully' });
  };

  /**
   * Unpublish a page
   */
  unpublishPage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const result = await unpublishPageUseCase.execute(new UnpublishPageCommand(id));
    jsonResponse(res, 200, { success: true, data: result, message: 'Page unpublished successfully' });
  };

  /**
   * Schedule a page for future publication
   */
  schedulePage = async (req: HttpRequest<Record<string, string>, unknown, SchedulePageBody>, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { scheduledAt } = req.body;

    const result = await schedulePageUseCase.execute(
      new SchedulePageCommand(id, scheduledAt ? new Date(scheduledAt) : (undefined as unknown as Date), req.user?.id),
    );
    jsonResponse(res, 200, { success: true, data: result, message: 'Page scheduled successfully' });
  };

  /**
   * Duplicate a page with all its blocks
   */
  duplicatePage = async (req: HttpRequest<Record<string, string>, unknown, DuplicatePageBody>, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { title, slug } = req.body;

    const result = await duplicatePageUseCase.execute(new DuplicatePageCommand(id, title, slug, req.user?.id));
    jsonResponse(res, 201, { success: true, data: result, message: 'Page duplicated successfully' });
  };

  // Page Publication Handlers

  /**
   * List a page's store/channel/locale publication assignments
   */
  getPagePublications = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const publications = await this.contentUC.findPagePublications(req.params.id);
    jsonResponse(res, 200, { success: true, data: publications });
  };

  /**
   * Publish a page to a store, optionally scoped to a channel and/or locale.
   * The store/channel pair must belong to the caller's organization.
   */
  createPagePublication = async (
    req: HttpRequest<Record<string, string>, unknown, { storeId?: string; channelId?: string; locale?: string }>,
    res: HttpResponse,
  ): Promise<void> => {
    const { id } = req.params;
    const { storeId, channelId, locale } = req.body;
    if (!storeId) {
      jsonResponse(res, 400, { success: false, message: 'storeId is required' });
      return;
    }
    await manageSalesChannelsUseCase.assertStoreChannelAccess({
      organizationId: req.user?.organizationId,
      storeId,
      channelId,
    });
    const page = await this.contentUC.findPageById(id);
    if (!page) {
      jsonResponse(res, 404, { success: false, message: 'Page not found' });
      return;
    }
    const publication = await this.contentUC.createPagePublication({
      contentPageId: id,
      storeId,
      channelId: channelId ?? null,
      locale: locale ?? null,
    });
    jsonResponse(res, 201, { success: true, data: publication, message: 'Page publication created' });
  };

  /**
   * Remove a page's publication assignment
   */
  deletePagePublication = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const deleted = await this.contentUC.deletePagePublication(req.params.publicationId);
    if (!deleted) {
      jsonResponse(res, 404, { success: false, message: 'Publication not found' });
      return;
    }
    jsonResponse(res, 200, { success: true, message: 'Page publication removed' });
  };
}
