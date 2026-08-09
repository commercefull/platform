/**
 * Content Blocks Controller
 * Handles content block management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import ContentRepo from '../../../modules/content/infrastructure/repositories/contentRepo';
import { adminRespond } from '../../respond';

// ============================================================================
// Content Blocks Management
// ============================================================================

export const listContentBlocks = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const pageId = req.query.pageId as string;
    const contentTypeId = req.query.contentTypeId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    let blocks: unknown[] = [];

    if (pageId) {
      // Get blocks for a specific page
      blocks = await ContentRepo.findBlocksByPageId(pageId);
    } else {
      // Get all blocks (this would need to be implemented in the repo)
      // For now, just show empty
      blocks = [];
    }

    // Get content types for filtering
    const contentTypes = await ContentRepo.findAllContentTypes(true);

    adminRespond(req, res, 'content/blocks/index', {
      pageName: 'Content Blocks',
      blocks,
      contentTypes,
      filters: { pageId, contentTypeId },
      pagination: { limit, offset },

      success: req.query.success || null,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load content blocks',
    });
  }
};

export const createContentBlockForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const pageId = req.query.pageId as string;

    if (!pageId) {
      return res.redirect('/hub/content/pages');
    }

    // Get the page details
    const page = await ContentRepo.findPageById(pageId);
    if (!page) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Content page not found',
      });
      return;
    }

    // Get content types that can be used as blocks
    const contentTypes = await ContentRepo.findAllContentTypes(true);

    // Get existing blocks for this page to determine next order
    const existingBlocks = await ContentRepo.findBlocksByPageId(pageId);
    const nextOrder = existingBlocks.length + 1;

    adminRespond(req, res, 'content/blocks/create', {
      pageName: 'Create Content Block',
      page,
      contentTypes,
      nextOrder,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load form',
    });
  }
};

export const createContentBlock = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { contentPageId, blockTypeId, title, sortOrder, content } = body;

    const _block = await ContentRepo.createBlock({
      contentPageId,
      blockTypeId,
      title: title || 'Untitled Block',
      sortOrder: parseInt(sortOrder) || 1,
      content: content ? JSON.parse(content) : {},
      isVisible: true,
    });

    res.redirect(`/hub/content/pages/${contentPageId}?success=Content block created successfully`);
  } catch (error: unknown) {
    logger.error('Error:', error);

    try {
      const page = await ContentRepo.findPageById((req.body as RequestBody).pageId);
      const contentTypes = await ContentRepo.findAllContentTypes(true);

      adminRespond(req, res, 'content/blocks/create', {
        pageName: 'Create Content Block',
        page,
        contentTypes,
        error: (error as Error).message || 'Failed to create content block',
        formData: req.body as RequestBody,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: (error as Error).message || 'Failed to create content block',
      });
    }
  }
};

export const editContentBlockForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { blockId } = req.params;

    const block = await ContentRepo.findBlockById(blockId);

    if (!block) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Content block not found',
      });
      return;
    }

    // Get the page this block belongs to
    const page = await ContentRepo.findPageById(block.contentPageId);

    // Get content type details
    const contentType = await ContentRepo.findBlockTypeById(block.blockTypeId);

    adminRespond(req, res, 'content/blocks/edit', {
      pageName: `Edit: ${block.title || 'Untitled Block'}`,
      block,
      page,
      contentType,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load form',
    });
  }
};

export const updateContentBlock = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { blockId } = req.params;
    const updates: Record<string, unknown> = {};

    const body = req.body as RequestBody;
    const { title, sortOrder, content, isVisible } = body;

    if (title !== undefined) updates.title = title;
    if (sortOrder !== undefined) updates.sortOrder = parseInt(sortOrder);
    if (content !== undefined) updates.content = JSON.parse(content);
    if (isVisible !== undefined) updates.isVisible = isVisible === 'true' || isVisible === true;

    const block = await ContentRepo.updateBlock(blockId, updates);

    res.redirect(`/hub/content/pages/${block.contentPageId}?success=Content block updated successfully`);
  } catch (error: unknown) {
    logger.error('Error:', error);

    try {
      const block = await ContentRepo.findBlockById(req.params.blockId);
      const page = block ? await ContentRepo.findPageById(block.contentPageId) : null;
      const contentType = block ? await ContentRepo.findBlockTypeById(block.blockTypeId) : null;

      adminRespond(req, res, 'content/blocks/edit', {
        pageName: `Edit: ${block?.title || 'Block'}`,
        block,
        page,
        contentType,
        error: (error as Error).message || 'Failed to update content block',
        formData: req.body as RequestBody,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: (error as Error).message || 'Failed to update content block',
      });
    }
  }
};

export const deleteContentBlock = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { blockId } = req.params;

    // Get block info before deletion
    const block = await ContentRepo.findBlockById(blockId);
    if (!block) {
      throw new Error('Content block not found');
    }

    const _pageId = block.contentPageId;

    const success = await ContentRepo.deleteBlock(blockId);

    if (!success) {
      throw new Error('Failed to delete content block');
    }

    res.json({ success: true, message: 'Content block deleted successfully' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message || 'Failed to delete content block' });
  }
};

export const reorderContentBlocks = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { pageId } = req.params;
    const body = req.body as RequestBody;
    const { blockOrders } = body;

    if (!Array.isArray(blockOrders)) {
      throw new Error('blockOrders must be an array');
    }

    const success = await ContentRepo.reorderBlocks(pageId, blockOrders);

    if (!success) {
      throw new Error('Failed to reorder blocks');
    }

    res.json({ success: true, message: 'Content blocks reordered successfully' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message || 'Failed to reorder content blocks' });
  }
};
