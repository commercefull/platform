import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import type { ContentBlockType } from '../../../../../libs/db/types';
import {
  reorderPageBlocksUseCase,
  createTemplateUseCase,
  duplicateTemplateUseCase,
  manageContentUseCase,
} from '../../../application/useCases/wired';
import { ReorderPageBlocksCommand } from '../../../application/useCases/block/ReorderPageBlocks';
import { CreateTemplateCommand } from '../../../application/useCases/template/CreateTemplate';
import { DuplicateTemplateCommand } from '../../../application/useCases/template/DuplicateTemplate';
import type {
  CreateBlockBody,
  UpdateBlockBody,
  ReorderBlocksBody,
  CreateTemplateBody,
  UpdateTemplateBody,
  DuplicateTemplateBody,
} from './types';

/** Required fields defined on the block type schema that are missing from content. */
function missingRequiredFields(blockType: ContentBlockType, content: Record<string, unknown>): string[] {
  if (!blockType.schema || typeof blockType.schema !== 'object') return [];
  const schema = blockType.schema as Record<string, unknown>;
  const missing: string[] = [];
  for (const [field, config] of Object.entries(schema)) {
    if (config && typeof config === 'object' && (config as Record<string, unknown>).required === true) {
      if (content[field] === undefined || content[field] === null || content[field] === '') {
        missing.push(field);
      }
    }
  }
  return missing;
}

/** Content block and template handlers. */
export class BlockAndTemplateHandlers {
  private contentUC = manageContentUseCase;

  // Content Block Handlers

  /**
   * Get blocks for a page
   */
  getPageBlocks = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { pageId } = req.params;

    // Check if page exists
    const page = await this.contentUC.findPageById(pageId);
    if (!page) {
      jsonResponse(res, 404, {
        success: false,
        message: `Page with ID ${pageId} not found`,
      });
      return;
    }

    const blocks = await this.contentUC.findBlocksByPageId(pageId);

    jsonResponse(res, 200, {
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
      jsonResponse(res, 404, {
        success: false,
        message: `Content block with ID ${id} not found`,
      });
      return;
    }

    jsonResponse(res, 200, {
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
      jsonResponse(res, 400, {
        success: false,
        message: 'contentPageId, blockTypeId, sortOrder, and content are required',
      });
      return;
    }

    // Validate block type exists
    const blockType = await this.contentUC.findBlockTypeById(blockTypeId);
    if (!blockType) {
      jsonResponse(res, 404, {
        success: false,
        message: `Block type with ID ${blockTypeId} not found`,
      });
      return;
    }

    // Check schema required fields if defined on the block type
    const missing = missingRequiredFields(blockType, content);
    if (missing.length > 0) {
      jsonResponse(res, 400, {
        success: false,
        message: `Missing required fields for block type "${blockType.name}": ${missing.join(', ')}`,
      });
      return;
    }

    const block = await this.contentUC.createBlock({
      contentPageId,
      blockTypeId,
      title: title || null,
      sortOrder,
      content,
      isVisible,
    });

    jsonResponse(res, 201, {
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
      jsonResponse(res, 404, {
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
        jsonResponse(res, 404, {
          success: false,
          message: `Block type with ID ${effectiveBlockTypeId} not found`,
        });
        return;
      }

      // Check schema required fields
      const missing = effectiveContent ? missingRequiredFields(blockType, effectiveContent as Record<string, unknown>) : [];
      if (missing.length > 0) {
        jsonResponse(res, 400, {
          success: false,
          message: `Missing required fields for block type "${blockType.name}": ${missing.join(', ')}`,
        });
        return;
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

    jsonResponse(res, 200, {
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
      jsonResponse(res, 404, {
        success: false,
        message: `Content block with ID ${id} not found`,
      });
      return;
    }

    await this.contentUC.deleteBlock(id);

    jsonResponse(res, 200, {
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
      jsonResponse(res, 400, {
        success: false,
        message: 'Block orders must be a non-empty array',
      });
      return;
    }

    for (const order of blockOrders) {
      if (!order.id || order.order === undefined) {
        jsonResponse(res, 400, {
          success: false,
          message: 'Each block order must have id and order properties',
        });
        return;
      }
    }

    await reorderPageBlocksUseCase.execute(new ReorderPageBlocksCommand(pageId, blockOrders, req.user?.id));
    jsonResponse(res, 200, {
      success: true,
      message: 'Content blocks reordered successfully',
    });
  };

  // Template Handlers

  /**
   * Get all templates with optional filtering
   */
  getTemplates = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const templates = await this.contentUC.findAllTemplates(isActive, limit, offset);

    jsonResponse(res, 200, {
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
      jsonResponse(res, 404, {
        success: false,
        message: `Template with ID ${id} not found`,
      });
      return;
    }

    jsonResponse(res, 200, {
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

    const result = await createTemplateUseCase.execute(
      new CreateTemplateCommand({
        name: name,
        slug: slug,
        description: description,
        thumbnail: thumbnail,
        htmlStructure: htmlStructure,
        cssStyles: cssStyles,
        jsScripts: jsScripts,
        areas: areas,
        defaultBlocks: defaultBlocks,
        compatibleContentTypes: compatibleContentTypes,
        isSystem: isSystem,
        isActive: isActive,
      }),
    );
    jsonResponse(res, 201, { success: true, data: result, message: 'Template created successfully' });
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
      jsonResponse(res, 404, {
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

    jsonResponse(res, 200, {
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
      jsonResponse(res, 404, {
        success: false,
        message: `Template with ID ${id} not found`,
      });
      return;
    }

    await this.contentUC.deleteTemplate(id);

    jsonResponse(res, 200, {
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

    const result = await duplicateTemplateUseCase.execute(new DuplicateTemplateCommand(id, name, slug));
    jsonResponse(res, 201, { success: true, data: result, message: 'Template duplicated successfully' });
  };
}
