import type { HttpRequest, HttpResponse } from 'libs/http';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import {
  publishPageUseCase,
  unpublishPageUseCase,
  schedulePageUseCase,
  duplicatePageUseCase,
  createPageVersionUseCase,
  restorePageVersionUseCase,
  reorderPageBlocksUseCase,
  createCategoryUseCase,
  updateCategoryUseCase,
  deleteCategoryUseCase,
  moveCategoryUseCase,
  createNavigationUseCase,
  updateNavigationUseCase,
  addNavigationItemUseCase,
  uploadMediaUseCase,
  deleteMediaUseCase,
  trackMediaUsageUseCase,
  organizeMediaFolderUseCase,
  createRedirectUseCase,
  updateRedirectUseCase,
  deleteRedirectUseCase,
  createPageTranslationUseCase,
  updatePageTranslationUseCase,
  deletePageTranslationUseCase,
  assignPageToCategoryUseCase,
  removePageFromCategoryUseCase,
  setPrimaryCategoryUseCase,
  createTemplateUseCase,
  duplicateTemplateUseCase,
  manageContentUseCase,
} from '../../application/useCases/wired';
import { PublishPageCommand } from '../../application/useCases/PublishPage';
import { UnpublishPageCommand } from '../../application/useCases/page/UnpublishPage';
import { SchedulePageCommand } from '../../application/useCases/page/SchedulePage';
import { DuplicatePageCommand } from '../../application/useCases/page/DuplicatePage';
import { CreatePageVersionCommand } from '../../application/useCases/page/CreatePageVersion';
import { RestorePageVersionCommand } from '../../application/useCases/page/RestorePageVersion';
import { ReorderPageBlocksCommand } from '../../application/useCases/block/ReorderPageBlocks';
import { CreateCategoryCommand } from '../../application/useCases/category/CreateCategory';
import { UpdateCategoryCommand } from '../../application/useCases/category/UpdateCategory';
import { MoveCategoryCommand } from '../../application/useCases/category/MoveCategory';
import { CreateNavigationCommand } from '../../application/useCases/navigation/CreateNavigation';
import { UpdateNavigationCommand } from '../../application/useCases/navigation/UpdateNavigation';
import { AddNavigationItemCommand } from '../../application/useCases/navigation/AddNavigationItem';
import { UploadMediaCommand } from '../../application/useCases/media/UploadMedia';
import { TrackMediaUsageCommand } from '../../application/useCases/media/TrackMediaUsage';
import { MoveMediaToFolderCommand, CreateFolderCommand } from '../../application/useCases/media/OrganizeMediaFolder';
import { CreateRedirectCommand } from '../../application/useCases/redirect/CreateRedirect';
import { UpdateRedirectCommand } from '../../application/useCases/redirect/UpdateRedirect';
import { CreatePageTranslationCommand } from '../../application/useCases/translation/CreatePageTranslation';
import { UpdatePageTranslationCommand } from '../../application/useCases/translation/UpdatePageTranslation';
import { AssignPageToCategoryCommand } from '../../application/useCases/categorization/AssignPageToCategory';
import { RemovePageFromCategoryCommand } from '../../application/useCases/categorization/RemovePageFromCategory';
import { SetPrimaryCategoryCommand } from '../../application/useCases/categorization/SetPrimaryCategory';
import { CreateTemplateCommand } from '../../application/useCases/template/CreateTemplate';
import { DuplicateTemplateCommand } from '../../application/useCases/template/DuplicateTemplate';

// ============================================================================
// Request Body Interfaces
// ============================================================================

interface CreateContentTypeBody {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  allowedBlocks?: string[];
  defaultTemplate?: string;
  requiredFields?: string[];
  metaFields?: Record<string, unknown>;
  isSystem?: boolean;
  isActive?: boolean;
}

interface UpdateContentTypeBody {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  requiredFields?: string[];
  metaFields?: Record<string, unknown>;
  isActive?: boolean;
}

interface CreatePageBody {
  title: string;
  slug: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: string;
  publishedAt?: string;
  layout?: string;
  contentTypeId: string;
  visibility?: string;
}

interface UpdatePageBody {
  title?: string;
  slug?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: string;
  publishedAt?: string;
  layout?: string;
}

interface CreateBlockBody {
  contentPageId: string;
  blockTypeId: string;
  title?: string;
  area?: string;
  sortOrder: number;
  content: Record<string, unknown>;
  isVisible?: boolean;
}

interface UpdateBlockBody {
  blockTypeId?: string;
  title?: string;
  area?: string;
  sortOrder?: number;
  content?: Record<string, unknown>;
  isVisible?: boolean;
}

interface ReorderBlocksBody {
  blockOrders: Array<{ id: string; order: number }>;
}

interface CreateTemplateBody {
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  htmlStructure?: string;
  cssStyles?: string;
  jsScripts?: string;
  areas?: Record<string, unknown>;
  defaultBlocks?: Record<string, unknown>;
  compatibleContentTypes?: string[];
  isSystem?: boolean;
  isActive?: boolean;
}

interface UpdateTemplateBody {
  name?: string;
  slug?: string;
  description?: string;
  htmlStructure?: string;
  areas?: Record<string, unknown>;
  isActive?: boolean;
}

interface DuplicateTemplateBody {
  name: string;
  slug: string;
}

interface SchedulePageBody {
  scheduledAt: string;
}

interface DuplicatePageBody {
  title: string;
  slug: string;
}

interface CreateCategoryBody {
  name: string;
  slug: string;
  parentId?: string;
  description?: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  sortOrder?: number;
  isActive?: boolean;
}

interface UpdateCategoryBody {
  name?: string;
  slug?: string;
  description?: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  sortOrder?: number;
  isActive?: boolean;
}

interface MoveCategoryBody {
  newParentId: string | null;
}

interface CreateNavigationBody {
  name: string;
  slug: string;
  description?: string;
  location?: string;
  isActive?: boolean;
}

interface UpdateNavigationBody {
  name?: string;
  slug?: string;
  description?: string;
  location?: string;
  isActive?: boolean;
}

interface AddNavigationItemBody {
  parentId?: string;
  title: string;
  type: string;
  url?: string;
  contentPageId?: string;
  targetId?: string;
  targetSlug?: string;
  icon?: string;
  cssClasses?: string;
  openInNewTab?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  conditions?: Record<string, unknown>;
}

interface UpdateNavigationItemBody {
  title?: string;
  type?: string;
  url?: string;
  contentPageId?: string;
  icon?: string;
  openInNewTab?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

interface ReorderNavigationItemsBody {
  itemOrders: Array<{ id: string; order: number }>;
}

interface UploadMediaBody {
  title: string;
  fileName: string;
  filePath?: string;
  fileType?: string;
  fileSize?: number;
  url: string;
  width?: number;
  height?: number;
  duration?: number;
  altText?: string;
  caption?: string;
  description?: string;
  folderId?: string;
  thumbnailUrl?: string;
  tags?: string[];
  isExternal?: boolean;
  externalService?: string;
  externalId?: string;
}

interface UpdateMediaBody {
  title?: string;
  altText?: string;
  caption?: string;
  description?: string;
  folderId?: string;
  tags?: string[];
  sortOrder?: number;
}

interface MoveMediaToFolderBody {
  mediaIds: string[];
  folderId?: string;
}

interface CreateMediaFolderBody {
  name: string;
  parentId?: string;
}

interface UpdateMediaFolderBody {
  name?: string;
  parentId?: string;
  sortOrder?: number;
}

interface CreateRedirectBody {
  sourceUrl: string;
  targetUrl: string;
  statusCode?: number | string;
  isRegex?: boolean;
  isActive?: boolean;
  notes?: string;
}

interface UpdateRedirectBody {
  sourceUrl?: string;
  targetUrl?: string;
  statusCode?: string;
  isRegex?: boolean;
  isActive?: boolean;
  notes?: string;
}

interface CreatePageVersionBody {
  comment?: string;
}

interface CreatePageTranslationBody {
  localeId: string;
  title: string;
  slug?: string;
  summary?: string;
  content?: Record<string, unknown>;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  featuredImage?: string;
  isAutoTranslated?: boolean;
  translationSource?: string;
  isApproved?: boolean;
  isPublished?: boolean;
}

interface UpdatePageTranslationBody {
  title?: string;
  slug?: string;
  summary?: string;
  content?: Record<string, unknown>;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  featuredImage?: string;
  isAutoTranslated?: boolean;
  translationSource?: string;
  isApproved?: boolean;
  isPublished?: boolean;
  publishedAt?: string;
}

interface AssignCategoryBody {
  categoryId: string;
  isPrimary?: boolean;
}

interface SetPrimaryCategoryBody {
  categorizationId: string;
}

interface TrackMediaUsageBody {
  mediaId: string;
  entityType: 'contentPage' | 'contentBlock' | 'product' | 'category' | 'organization' | 'blog';
  entityId: string;
  field?: string;
  sortOrder?: number;
}

export class ContentController {
  private contentUC = manageContentUseCase;

  constructor() {}

  // Content Type Handlers

  /**
   * Get all content types with optional filtering
   */
  getContentTypes = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const contentTypes = await this.contentUC.findAllContentTypes(isActive, limit, offset);

    res.status(200).json({
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
      res.status(404).json({
        success: false,
        message: `Content type with ID ${id} not found`,
      });
      return;
    }

    res.status(200).json({
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
      res.status(404).json({
        success: false,
        message: `Content type with slug ${slug} not found`,
      });
      return;
    }

    res.status(200).json({
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
      res.status(400).json({
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

    res.status(201).json({
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
      res.status(404).json({
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

    res.status(200).json({
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
      res.status(404).json({
        success: false,
        message: `Content type with ID ${id} not found`,
      });
      return;
    }

    await this.contentUC.deleteContentType(id);

    res.status(200).json({
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

    res.status(200).json({
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
      res.status(404).json({
        success: false,
        message: `Page with ID ${id} not found`,
      });
      return;
    }

    res.status(200).json({
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
      res.status(404).json({
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

    res.status(200).json({
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
      res.status(400).json({
        success: false,
        message: 'Title, slug, and contentTypeId are required',
      });
      return;
    }

    // Validate layout if provided
    if (layout) {
      const template = await this.contentUC.findTemplateById(layout);
      if (!template) {
        res.status(400).json({
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
      status,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
      templateId: layout ?? null, // Layout corresponds to templateId
      contentTypeId,
      visibility,
    });

    res.status(201).json({
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
      res.status(404).json({
        success: false,
        message: `Page with ID ${id} not found`,
      });
      return;
    }

    // Validate layout if provided
    if (layout) {
      const template = await this.contentUC.findTemplateById(layout);
      if (!template) {
        res.status(400).json({
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
      status,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      templateId: layout, // Layout corresponds to templateId
    });

    res.status(200).json({
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
      res.status(404).json({
        success: false,
        message: `Page with ID ${id} not found`,
      });
      return;
    }

    await this.contentUC.deletePage(id);

    res.status(200).json({
      success: true,
      message: 'Page deleted successfully',
    });
  };

  // Content Block Handlers

  /**
   * Get blocks for a page
   */
  getPageBlocks = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { pageId } = req.params;

    // Check if page exists
    const page = await this.contentUC.findPageById(pageId);
    if (!page) {
      res.status(404).json({
        success: false,
        message: `Page with ID ${pageId} not found`,
      });
      return;
    }

    const blocks = await this.contentUC.findBlocksByPageId(pageId);

    res.status(200).json({
      success: true,
      data: blocks,
    });
  };

  /**
   * Get block by ID
   */
  getBlockById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const block = await this.contentUC.findBlockById(id);

    if (!block) {
      res.status(404).json({
        success: false,
        message: `Content block with ID ${id} not found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: block,
    });
  };

  /**
   * Create a new content block
   */
  createBlock = async (req: HttpRequest<Record<string, string>, unknown, CreateBlockBody>, res: HttpResponse): Promise<void> => {
    const { contentPageId, blockTypeId, title, area: _area, sortOrder, content, isVisible = true } = req.body;

    // Basic validation
    if (!contentPageId || !blockTypeId || sortOrder === undefined || !content) {
      res.status(400).json({
        success: false,
        message: 'contentPageId, blockTypeId, sortOrder, and content are required',
      });
      return;
    }

    // Validate block type exists
    const blockType = await this.contentUC.findBlockTypeById(blockTypeId);
    if (!blockType) {
      res.status(404).json({
        success: false,
        message: `Block type with ID ${blockTypeId} not found`,
      });
      return;
    }

    // Check schema required fields if defined on the block type
    if (blockType.schema && typeof blockType.schema === 'object') {
      const schema = blockType.schema as Record<string, unknown>;
      const missingFields: string[] = [];
      for (const [field, config] of Object.entries(schema)) {
        if (config && typeof config === 'object' && (config as Record<string, unknown>).required === true) {
          if (content[field] === undefined || content[field] === null || content[field] === '') {
            missingFields.push(field);
          }
        }
      }
      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          message: `Missing required fields for block type "${blockType.name}": ${missingFields.join(', ')}`,
        });
        return;
      }
    }

    const block = await this.contentUC.createBlock({
      contentPageId,
      blockTypeId,
      title: title || null,
      sortOrder,
      content,
      isVisible,
    });

    res.status(201).json({
      success: true,
      data: block,
      message: 'Content block created successfully',
    });
  };

  /**
   * Update a content block
   */
  updateBlock = async (req: HttpRequest<Record<string, string>, unknown, UpdateBlockBody>, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { blockTypeId, title, area, sortOrder, content, isVisible } = req.body;

    // Check if block exists
    const existingBlock = await this.contentUC.findBlockById(id);
    if (!existingBlock) {
      res.status(404).json({
        success: false,
        message: `Content block with ID ${id} not found`,
      });
      return;
    }

    // Validate against content type if blockTypeId or content is being updated
    const effectiveBlockTypeId = blockTypeId || existingBlock.blockTypeId;
    const _effectiveTitle = title || existingBlock.title;
    const effectiveContent = content || existingBlock.content;

    if (blockTypeId || content) {
      const blockType = await this.contentUC.findBlockTypeById(effectiveBlockTypeId);
      if (!blockType) {
        res.status(404).json({
          success: false,
          message: `Block type with ID ${effectiveBlockTypeId} not found`,
        });
        return;
      }

      // Check schema required fields
      if (blockType.schema && typeof blockType.schema === 'object' && effectiveContent) {
        const schema = blockType.schema as Record<string, unknown>;
        const missingFields: string[] = [];
        for (const [field, config] of Object.entries(schema)) {
          if (config && typeof config === 'object' && (config as Record<string, unknown>).required === true) {
            if (effectiveContent[field] === undefined || effectiveContent[field] === null || effectiveContent[field] === '') {
              missingFields.push(field);
            }
          }
        }
        if (missingFields.length > 0) {
          res.status(400).json({
            success: false,
            message: `Missing required fields for block type "${blockType.name}": ${missingFields.join(', ')}`,
          });
          return;
        }
      }
    }

    const updatedBlock = await this.contentUC.updateBlock(id, {
      blockTypeId,
      title,
      area,
      sortOrder,
      content,
      isVisible,
    });

    res.status(200).json({
      success: true,
      data: updatedBlock,
      message: 'Content block updated successfully',
    });
  };

  /**
   * Delete a content block
   */
  deleteBlock = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;

    // Check if block exists
    const existingBlock = await this.contentUC.findBlockById(id);
    if (!existingBlock) {
      res.status(404).json({
        success: false,
        message: `Content block with ID ${id} not found`,
      });
      return;
    }

    await this.contentUC.deleteBlock(id);

    res.status(200).json({
      success: true,
      message: 'Content block deleted successfully',
    });
  };

  /**
   * Reorder content blocks
   */
  reorderBlocks = async (req: HttpRequest<Record<string, string>, unknown, ReorderBlocksBody>, res: HttpResponse): Promise<void> => {
    const { pageId } = req.params;
    const { blockOrders } = req.body;

    // Validate input
    if (!Array.isArray(blockOrders) || blockOrders.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Block orders must be a non-empty array',
      });
      return;
    }

    for (const order of blockOrders) {
      if (!order.id || order.order === undefined) {
        res.status(400).json({
          success: false,
          message: 'Each block order must have id and order properties',
        });
        return;
      }
    }

    try {
      await reorderPageBlocksUseCase.execute(new ReorderPageBlocksCommand(pageId, blockOrders, req.user?.id));
      res.status(200).json({
        success: true,
        message: 'Content blocks reordered successfully',
      });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  /**
   * Get all templates with optional filtering
   */
  getTemplates = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const templates = await this.contentUC.findAllTemplates(isActive, limit, offset);

    res.status(200).json({
      success: true,
      data: templates,
      pagination: {
        limit,
        offset,
        total: templates.length, // This should ideally be the total count from DB
      },
    });
  };

  /**
   * Get template by ID
   */
  getTemplateById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const template = await this.contentUC.findTemplateById(id);

    if (!template) {
      res.status(404).json({
        success: false,
        message: `Template with ID ${id} not found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  };

  /**
   * Create a new template
   */
  createTemplate = async (req: HttpRequest<Record<string, string>, unknown, CreateTemplateBody>, res: HttpResponse): Promise<void> => {
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
      isActive = true,
    } = req.body;

    try {
      const result = await createTemplateUseCase.execute(
        new CreateTemplateCommand(
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
          isActive,
        ),
      );
      res.status(201).json({ success: true, data: result, message: 'Template created successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  /**
   * Update a template
   */
  updateTemplate = async (req: HttpRequest<Record<string, string>, unknown, UpdateTemplateBody>, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { name, slug, description, htmlStructure, areas, isActive } = req.body;

    // Check if template exists
    const existingTemplate = await this.contentUC.findTemplateById(id);
    if (!existingTemplate) {
      res.status(404).json({
        success: false,
        message: `Template with ID ${id} not found`,
      });
      return;
    }

    const updatedTemplate = await this.contentUC.updateTemplate(id, {
      name,
      slug,
      description,
      htmlStructure,
      areas,
      isActive,
    });

    res.status(200).json({
      success: true,
      data: updatedTemplate,
      message: 'Template updated successfully',
    });
  };

  /**
   * Delete a template
   */
  deleteTemplate = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;

    // Check if template exists
    const existingTemplate = await this.contentUC.findTemplateById(id);
    if (!existingTemplate) {
      res.status(404).json({
        success: false,
        message: `Template with ID ${id} not found`,
      });
      return;
    }

    await this.contentUC.deleteTemplate(id);

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully',
    });
  };

  /**
   * Duplicate a template
   */
  duplicateTemplate = async (
    req: HttpRequest<Record<string, string>, unknown, DuplicateTemplateBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { id } = req.params;
    const { name, slug } = req.body;

    try {
      const result = await duplicateTemplateUseCase.execute(new DuplicateTemplateCommand(id, name, slug));
      res.status(201).json({ success: true, data: result, message: 'Template duplicated successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  // Page Action Handlers

  /**
   * Publish a page
   */
  publishPage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await publishPageUseCase.execute(new PublishPageCommand(id, req.user?.id));
      res.status(200).json({ success: true, data: result, message: 'Page published successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  /**
   * Unpublish a page
   */
  unpublishPage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await unpublishPageUseCase.execute(new UnpublishPageCommand(id));
      res.status(200).json({ success: true, data: result, message: 'Page unpublished successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  /**
   * Schedule a page for future publication
   */
  schedulePage = async (req: HttpRequest<Record<string, string>, unknown, SchedulePageBody>, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { scheduledAt } = req.body;

    try {
      const result = await schedulePageUseCase.execute(
        new SchedulePageCommand(id, scheduledAt ? new Date(scheduledAt) : (undefined as unknown as Date), req.user?.id),
      );
      res.status(200).json({ success: true, data: result, message: 'Page scheduled successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  /**
   * Duplicate a page with all its blocks
   */
  duplicatePage = async (req: HttpRequest<Record<string, string>, unknown, DuplicatePageBody>, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { title, slug } = req.body;

    try {
      const result = await duplicatePageUseCase.execute(new DuplicatePageCommand(id, title, slug, req.user?.id));
      res.status(201).json({ success: true, data: result, message: 'Page duplicated successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  // Category Handlers

  getCategories = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const parentId = req.query.parentId as string | undefined;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const categories = await this.contentUC.findAllCategories(parentId, isActive, limit, offset);
    res.status(200).json({ success: true, data: categories });
  };

  getCategoryTree = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const categories = await this.contentUC.getCategoryTree(isActive);
    res.status(200).json({ success: true, data: categories });
  };

  createCategory = async (req: HttpRequest<Record<string, string>, unknown, CreateCategoryBody>, res: HttpResponse): Promise<void> => {
    const { name, slug, parentId, description, featuredImage, metaTitle, metaDescription, sortOrder, isActive } = req.body;

    try {
      const result = await createCategoryUseCase.execute(
        new CreateCategoryCommand(name, slug, parentId, description, featuredImage, metaTitle, metaDescription, sortOrder, isActive),
      );
      res
        .status(201)
        .json({ success: true, data: { ...result, contentCategoryId: result.id }, message: 'Category created successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  getCategoryById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const category = await this.contentUC.findCategoryById(id);
    if (!category) {
      res.status(404).json({ success: false, message: `Category with ID ${id} not found` });
      return;
    }
    res.status(200).json({ success: true, data: category });
  };

  updateCategory = async (req: HttpRequest<Record<string, string>, unknown, UpdateCategoryBody>, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { name, slug, description, featuredImage, metaTitle, metaDescription, sortOrder, isActive } = req.body;

    try {
      const result = await updateCategoryUseCase.execute(
        new UpdateCategoryCommand(id, { name, slug, description, featuredImage, metaTitle, metaDescription, sortOrder, isActive }),
      );
      res.status(200).json({ success: true, data: result, message: 'Category updated successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  deleteCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    try {
      await deleteCategoryUseCase.execute(id);
      res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  moveCategory = async (req: HttpRequest<Record<string, string>, unknown, MoveCategoryBody>, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { newParentId } = req.body;

    try {
      const result = await moveCategoryUseCase.execute(new MoveCategoryCommand(id, newParentId ?? null));
      res.status(200).json({ success: true, data: { ...result, contentCategoryId: result.id }, message: 'Category moved successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  // Navigation Handlers

  getNavigations = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const navigations = await this.contentUC.findAllNavigations(isActive);
    res.status(200).json({ success: true, data: navigations });
  };

  createNavigation = async (req: HttpRequest<Record<string, string>, unknown, CreateNavigationBody>, res: HttpResponse): Promise<void> => {
    const { name, slug, description, location, isActive } = req.body;

    try {
      const result = await createNavigationUseCase.execute(new CreateNavigationCommand(name, slug, description, location, isActive));
      res
        .status(201)
        .json({ success: true, data: { ...result, contentNavigationId: result.id }, message: 'Navigation created successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  getNavigationById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const navigation = await this.contentUC.findNavigationById(id);
    if (!navigation) {
      res.status(404).json({ success: false, message: `Navigation with ID ${id} not found` });
      return;
    }
    res.status(200).json({ success: true, data: navigation });
  };

  getNavigationWithItems = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const navigation = await this.contentUC.findNavigationById(id);
    if (!navigation) {
      res.status(404).json({ success: false, message: `Navigation with ID ${id} not found` });
      return;
    }

    const items = await this.contentUC.findAllNavigationItems(id);
    res.status(200).json({ success: true, data: { navigation, items } });
  };

  updateNavigation = async (req: HttpRequest<Record<string, string>, unknown, UpdateNavigationBody>, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { name, slug, description, location, isActive } = req.body;

    try {
      const result = await updateNavigationUseCase.execute(
        new UpdateNavigationCommand(id, { name, slug, description, location, isActive }),
      );
      res.status(200).json({ success: true, data: result, message: 'Navigation updated successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  deleteNavigation = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    await this.contentUC.deleteNavigation(id);
    res.status(200).json({ success: true, message: 'Navigation deleted successfully' });
  };

  addNavigationItem = async (
    req: HttpRequest<Record<string, string>, unknown, AddNavigationItemBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { navigationId } = req.params;
    const {
      parentId,
      title,
      type,
      url,
      contentPageId,
      targetId,
      targetSlug,
      icon,
      cssClasses,
      openInNewTab,
      isActive,
      sortOrder,
      conditions,
    } = req.body;

    try {
      const result = await addNavigationItemUseCase.execute(
        new AddNavigationItemCommand(
          navigationId,
          title,
          type as 'url' | 'page' | 'category' | 'product' | 'blog',
          parentId,
          url,
          contentPageId,
          targetId,
          targetSlug,
          icon,
          cssClasses,
          openInNewTab,
          isActive,
          sortOrder,
          conditions,
        ),
      );
      res
        .status(201)
        .json({ success: true, data: { ...result, contentNavigationItemId: result.id }, message: 'Navigation item added successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  updateNavigationItem = async (
    req: HttpRequest<Record<string, string>, unknown, UpdateNavigationItemBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { id } = req.params;
    const { title, type, url, contentPageId, icon, openInNewTab, isActive, sortOrder } = req.body;

    const updated = await this.contentUC.updateNavigationItem(id, {
      title,
      type,
      url,
      contentPageId,
      icon,
      openInNewTab,
      isActive,
      sortOrder,
    });
    res.status(200).json({ success: true, data: updated, message: 'Navigation item updated successfully' });
  };

  deleteNavigationItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    await this.contentUC.deleteNavigationItem(id);
    res.status(200).json({ success: true, message: 'Navigation item deleted successfully' });
  };

  reorderNavigationItems = async (
    req: HttpRequest<Record<string, string>, unknown, ReorderNavigationItemsBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { navigationId } = req.params;
    const { itemOrders } = req.body;

    if (!itemOrders || !Array.isArray(itemOrders)) {
      res.status(400).json({ success: false, message: 'Item orders array is required' });
      return;
    }

    await this.contentUC.reorderNavigationItems(navigationId, itemOrders);
    res.status(200).json({ success: true, message: 'Navigation items reordered successfully' });
  };

  // Media Handlers

  getMedia = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const folderId = req.query.folderId as string | undefined;
    const fileType = req.query.fileType as string | undefined;

    const media = await this.contentUC.findAllMedia(folderId, fileType, limit, offset);
    res.status(200).json({ success: true, data: media });
  };

  uploadMedia = async (req: HttpRequest<Record<string, string>, unknown, UploadMediaBody>, res: HttpResponse): Promise<void> => {
    const {
      title,
      fileName,
      filePath,
      fileType,
      fileSize,
      url,
      width,
      height,
      duration,
      altText,
      caption,
      description,
      folderId,
      thumbnailUrl,
      tags,
      isExternal,
      externalService,
      externalId,
    } = req.body;

    try {
      const result = await uploadMediaUseCase.execute(
        new UploadMediaCommand(
          title,
          fileName,
          filePath || '',
          fileType || 'application/octet-stream',
          fileSize || 0,
          url,
          width,
          height,
          duration,
          altText,
          caption,
          description,
          folderId || undefined,
          thumbnailUrl,
          tags,
          isExternal,
          externalService,
          externalId,
          req.user?.id,
        ),
      );
      res.status(201).json({
        success: true,
        data: { ...result, contentMediaId: result.id, contentMediaFolderId: folderId || null },
        message: 'Media uploaded successfully',
      });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  getMediaById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const media = await this.contentUC.findMediaById(id);
    if (!media) {
      res.status(404).json({ success: false, message: `Media with ID ${id} not found` });
      return;
    }
    res.status(200).json({ success: true, data: media });
  };

  updateMedia = async (req: HttpRequest<Record<string, string>, unknown, UpdateMediaBody>, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { title, altText, caption, description, folderId, tags, sortOrder } = req.body;

    const updated = await this.contentUC.updateMedia(id, {
      title,
      altText,
      caption,
      description,
      contentMediaFolderId: folderId,
      tags,
      sortOrder,
    });
    res.status(200).json({ success: true, data: updated, message: 'Media updated successfully' });
  };

  deleteMedia = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    try {
      await deleteMediaUseCase.execute(id);
      res.status(200).json({ success: true, message: 'Media deleted successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  moveMediaToFolder = async (
    req: HttpRequest<Record<string, string>, unknown, MoveMediaToFolderBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { mediaIds, folderId } = req.body;

    if (!mediaIds || !Array.isArray(mediaIds)) {
      res.status(400).json({ success: false, message: 'Media IDs array is required' });
      return;
    }

    try {
      const result = await organizeMediaFolderUseCase.moveMediaToFolder(new MoveMediaToFolderCommand(mediaIds, folderId ?? null));
      res
        .status(200)
        .json({ success: true, data: result, message: `${result.movedCount} media items moved successfully` });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  // Media Folder Handlers

  getMediaFolders = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const parentId = req.query.parentId as string | undefined;
    const folders = await this.contentUC.findAllFolders(parentId);
    res.status(200).json({ success: true, data: folders });
  };

  getMediaFolderTree = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const folders = await this.contentUC.findAllFolders();
    res.status(200).json({ success: true, data: folders });
  };

  createMediaFolder = async (
    req: HttpRequest<Record<string, string>, unknown, CreateMediaFolderBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { name, parentId } = req.body;

    try {
      const result = await organizeMediaFolderUseCase.createFolder(new CreateFolderCommand(name, parentId, req.user?.id));
      res
        .status(201)
        .json({ success: true, data: { ...result, contentMediaFolderId: result.id }, message: 'Folder created successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  updateMediaFolder = async (
    req: HttpRequest<Record<string, string>, unknown, UpdateMediaFolderBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { id } = req.params;
    const { name, parentId, sortOrder } = req.body;

    const updated = await this.contentUC.updateFolder(id, { name, parentId, sortOrder });
    res.status(200).json({ success: true, data: updated, message: 'Folder updated successfully' });
  };

  deleteMediaFolder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    await this.contentUC.deleteFolder(id);
    res.status(200).json({ success: true, message: 'Folder deleted successfully' });
  };

  // Redirect Handlers

  getRedirects = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const redirects = await this.contentUC.findAllRedirects(isActive, limit, offset);
    res.status(200).json({ success: true, data: redirects });
  };

  createRedirect = async (req: HttpRequest<Record<string, string>, unknown, CreateRedirectBody>, res: HttpResponse): Promise<void> => {
    const { sourceUrl, targetUrl, statusCode, isRegex, isActive, notes } = req.body;

    try {
      const result = await createRedirectUseCase.execute(
        new CreateRedirectCommand(
          sourceUrl,
          targetUrl,
          statusCode ? (Number(statusCode) as 301 | 302 | 303 | 307 | 308) : undefined,
          isRegex,
          isActive,
          notes,
          req.user?.id,
        ),
      );
      res
        .status(201)
        .json({ success: true, data: { ...result, contentRedirectId: result.id }, message: 'Redirect created successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  getRedirectById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const redirect = await this.contentUC.findRedirectById(id);
    if (!redirect) {
      res.status(404).json({ success: false, message: `Redirect with ID ${id} not found` });
      return;
    }
    res.status(200).json({ success: true, data: redirect });
  };

  updateRedirect = async (req: HttpRequest<Record<string, string>, unknown, UpdateRedirectBody>, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { sourceUrl, targetUrl, statusCode, isRegex, isActive, notes } = req.body;

    try {
      const result = await updateRedirectUseCase.execute(
        new UpdateRedirectCommand(id, { sourceUrl, targetUrl, statusCode, isRegex, isActive, notes }),
      );
      res.status(200).json({ success: true, data: result, message: 'Redirect updated successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  deleteRedirect = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    try {
      await deleteRedirectUseCase.execute(id);
      res.status(200).json({ success: true, message: 'Redirect deleted successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  // Page Version Handlers

  getPageVersions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { pageId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const page = await this.contentUC.findPageById(pageId);
    if (!page) {
      res.status(404).json({ success: false, message: `Page with ID ${pageId} not found` });
      return;
    }

    const versions = await this.contentUC.findVersionsByPageId(pageId, limit, offset);
    res.status(200).json({ success: true, data: versions });
  };

  createPageVersion = async (
    req: HttpRequest<Record<string, string>, unknown, CreatePageVersionBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { pageId } = req.params;
    const { comment } = req.body;

    try {
      const version = await createPageVersionUseCase.execute(new CreatePageVersionCommand(pageId, comment));
      res.status(201).json({ success: true, data: version, message: 'Page version created successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  restorePageVersion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { pageId, versionId } = req.params;

    try {
      const { restoredPage, version } = await restorePageVersionUseCase.execute(new RestorePageVersionCommand(pageId, versionId));
      res.status(200).json({ success: true, data: restoredPage, message: `Page restored to version ${version}` });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  deletePageVersion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { versionId } = req.params;

    const version = await this.contentUC.findVersionById(versionId);
    if (!version) {
      res.status(404).json({ success: false, message: `Version with ID ${versionId} not found` });
      return;
    }

    await this.contentUC.deleteVersion(versionId);
    res.status(200).json({ success: true, message: 'Page version deleted successfully' });
  };

  // Page Translation Handlers

  getPageTranslations = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { pageId } = req.params;

    const page = await this.contentUC.findPageById(pageId);
    if (!page) {
      res.status(404).json({ success: false, message: `Page with ID ${pageId} not found` });
      return;
    }

    const translations = await this.contentUC.findTranslationsByPageId(pageId);
    res.status(200).json({ success: true, data: translations });
  };

  getPageTranslationByLocale = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { pageId, localeId } = req.params;

    const translation = await this.contentUC.findTranslationByPageAndLocale(pageId, localeId);
    if (!translation) {
      res.status(404).json({ success: false, message: `Translation for locale ${localeId} not found` });
      return;
    }

    res.status(200).json({ success: true, data: translation });
  };

  createPageTranslation = async (
    req: HttpRequest<Record<string, string>, unknown, CreatePageTranslationBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { pageId } = req.params;
    const {
      localeId,
      title,
      slug,
      summary,
      content,
      metaTitle,
      metaDescription,
      metaKeywords,
      openGraphTitle,
      openGraphDescription,
      featuredImage,
      isAutoTranslated,
      translationSource,
      isApproved,
      isPublished,
    } = req.body;

    try {
      const result = await createPageTranslationUseCase.execute(
        new CreatePageTranslationCommand(pageId, localeId, title, {
          slug,
          summary,
          content,
          metaTitle,
          metaDescription,
          metaKeywords,
          openGraphTitle,
          openGraphDescription,
          featuredImage,
          isAutoTranslated,
          translationSource,
          isApproved,
          isPublished,
        }),
      );
      res.status(201).json({ success: true, data: result, message: 'Page translation created successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  updatePageTranslation = async (
    req: HttpRequest<Record<string, string>, unknown, UpdatePageTranslationBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { translationId } = req.params;
    const {
      title,
      slug,
      summary,
      content,
      metaTitle,
      metaDescription,
      metaKeywords,
      openGraphTitle,
      openGraphDescription,
      featuredImage,
      isAutoTranslated,
      translationSource,
      isApproved,
      isPublished,
      publishedAt,
    } = req.body;

    try {
      const result = await updatePageTranslationUseCase.execute(
        new UpdatePageTranslationCommand(translationId, {
          title,
          slug,
          summary,
          content,
          metaTitle,
          metaDescription,
          metaKeywords,
          openGraphTitle,
          openGraphDescription,
          featuredImage,
          isAutoTranslated,
          translationSource,
          isApproved,
          isPublished,
          publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        }),
      );
      res.status(200).json({ success: true, data: result, message: 'Page translation updated successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  deletePageTranslation = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { translationId } = req.params;
    try {
      await deletePageTranslationUseCase.execute(translationId);
      res.status(200).json({ success: true, message: 'Page translation deleted successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  // Categorization Handlers

  getPageCategories = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { pageId } = req.params;

    const page = await this.contentUC.findPageById(pageId);
    if (!page) {
      res.status(404).json({ success: false, message: `Page with ID ${pageId} not found` });
      return;
    }

    const categorizations = await this.contentUC.findCategorizationsByPageId(pageId);
    res.status(200).json({ success: true, data: categorizations });
  };

  assignPageToCategory = async (
    req: HttpRequest<Record<string, string>, unknown, AssignCategoryBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { pageId } = req.params;
    const { categoryId, isPrimary } = req.body;

    try {
      const result = await assignPageToCategoryUseCase.execute(new AssignPageToCategoryCommand(pageId, categoryId, isPrimary));
      res.status(201).json({ success: true, data: result, message: 'Page assigned to category successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  removePageFromCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { pageId, categoryId } = req.params;
    try {
      await removePageFromCategoryUseCase.execute(new RemovePageFromCategoryCommand(pageId, categoryId));
      res.status(200).json({ success: true, message: 'Page removed from category successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  setPrimaryCategory = async (
    req: HttpRequest<Record<string, string>, unknown, SetPrimaryCategoryBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { pageId } = req.params;
    const { categorizationId } = req.body;

    try {
      const result = await setPrimaryCategoryUseCase.execute(new SetPrimaryCategoryCommand(pageId, categorizationId));
      res.status(200).json({ success: true, data: result, message: 'Primary category set successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  getPagesByCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { categoryId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const categorizations = await this.contentUC.findCategorizationsByCategoryId(categoryId, limit, offset);

    // Fetch the actual pages
    const pages = await Promise.all(
      categorizations.map(async cat => {
        const page = await this.contentUC.findPageById(cat.contentPageId);
        return page ? { ...page, isPrimary: cat.isPrimary } : null;
      }),
    );

    const validPages = pages.filter(p => p !== null);
    res.status(200).json({ success: true, data: validPages });
  };

  // Media Usage Handlers

  getMediaUsage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { mediaId } = req.params;

    const media = await this.contentUC.findMediaById(mediaId);
    if (!media) {
      res.status(404).json({ success: false, message: `Media with ID ${mediaId} not found` });
      return;
    }

    const usages = await this.contentUC.findUsageByMediaId(mediaId);
    res.status(200).json({ success: true, data: usages });
  };

  getMediaUsageByEntity = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { entityType, entityId } = req.params;

    const usages = await this.contentUC.findUsageByEntity(entityType, entityId);
    res.status(200).json({ success: true, data: usages });
  };

  trackMediaUsage = async (req: HttpRequest<Record<string, string>, unknown, TrackMediaUsageBody>, res: HttpResponse): Promise<void> => {
    const { mediaId, entityType, entityId, field, sortOrder } = req.body;

    try {
      const result = await trackMediaUsageUseCase.execute(
        new TrackMediaUsageCommand(mediaId, entityType, entityId, field, sortOrder),
      );
      res.status(201).json({ success: true, data: result, message: 'Media usage tracked successfully' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  };

  untrackMediaUsage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { usageId } = req.params;

    const deleted = await this.contentUC.deleteMediaUsage(usageId);
    if (!deleted) {
      res.status(404).json({ success: false, message: `Media usage with ID ${usageId} not found` });
      return;
    }

    res.status(200).json({ success: true, message: 'Media usage untracked successfully' });
  };

  getMediaUsageCount = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { mediaId } = req.params;

    const count = await this.contentUC.getMediaUsageCount(mediaId);
    res.status(200).json({ success: true, data: { mediaId, usageCount: count } });
  };
}
