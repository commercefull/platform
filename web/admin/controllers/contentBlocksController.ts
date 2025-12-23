/**
 * Content Blocks Controller
 * Handles content block management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import ContentRepo from '../../../modules/content/repos/contentRepo';
import { adminRespond } from 'web/respond';

// ============================================================================
// Content Blocks Management
// ============================================================================

export const listContentBlocks = async (req: Request, res: Response): Promise<void> => {
  try {
    const pageId = req.query.pageId as string;
    const contentTypeId = req.query.contentTypeId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    let blocks: any[] = [];

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
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load content blocks',
    });
  }
};

export const createContentBlockForm = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createContentBlock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pageId, contentTypeId, name, order, content } = req.body;

    const block = await ContentRepo.createBlock({
      pageId,
      contentTypeId,
      name: name || 'Untitled Block',
      order: parseInt(order) || 1,
      content: content ? JSON.parse(content) : {},
      status: 'active',
    });

    res.redirect(`/hub/content/pages/${pageId}?success=Content block created successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    try {
      const page = await ContentRepo.findPageById(req.body.pageId);
      const contentTypes = await ContentRepo.findAllContentTypes(true);

      adminRespond(req, res, 'content/blocks/create', {
        pageName: 'Create Content Block',
        page,
        contentTypes,
        error: error.message || 'Failed to create content block',
        formData: req.body,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to create content block',
      });
    }
  }
};

export const editContentBlockForm = async (req: Request, res: Response): Promise<void> => {
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
    const page = await ContentRepo.findPageById(block.pageId);

    // Get content type details
    const contentType = await ContentRepo.findContentTypeById(block.contentTypeId);

    adminRespond(req, res, 'content/blocks/edit', {
      pageName: `Edit: ${block.name}`,
      block,
      page,
      contentType,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateContentBlock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { blockId } = req.params;
    const updates: any = {};

    const { name, order, content, status } = req.body;

    if (name !== undefined) updates.name = name;
    if (order !== undefined) updates.order = parseInt(order);
    if (content !== undefined) updates.content = JSON.parse(content);
    if (status !== undefined) updates.status = status;

    const block = await ContentRepo.updateBlock(blockId, updates);

    res.redirect(`/hub/content/pages/${block.pageId}?success=Content block updated successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    try {
      const block = await ContentRepo.findBlockById(req.params.blockId);
      const page = block ? await ContentRepo.findPageById(block.pageId) : null;
      const contentType = block ? await ContentRepo.findContentTypeById(block.contentTypeId) : null;

      adminRespond(req, res, 'content/blocks/edit', {
        pageName: `Edit: ${block?.name || 'Block'}`,
        block,
        page,
        contentType,
        error: error.message || 'Failed to update content block',
        formData: req.body,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to update content block',
      });
    }
  }
};

export const deleteContentBlock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { blockId } = req.params;

    // Get block info before deletion
    const block = await ContentRepo.findBlockById(blockId);
    if (!block) {
      throw new Error('Content block not found');
    }

    const pageId = block.pageId;

    const success = await ContentRepo.deleteBlock(blockId);

    if (!success) {
      throw new Error('Failed to delete content block');
    }

    res.json({ success: true, message: 'Content block deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to delete content block' });
  }
};

export const reorderContentBlocks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pageId } = req.params;
    const { blockOrders } = req.body;

    if (!Array.isArray(blockOrders)) {
      throw new Error('blockOrders must be an array');
    }

    const success = await ContentRepo.reorderBlocks(pageId, blockOrders);

    if (!success) {
      throw new Error('Failed to reorder blocks');
    }

    res.json({ success: true, message: 'Content blocks reordered successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to reorder content blocks' });
  }
};
