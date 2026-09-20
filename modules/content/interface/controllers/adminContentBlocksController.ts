/**
 * Content Blocks Controller
 * Handles content block management for the Admin Hub
 */

import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { manageContentUseCase } from '../../application/useCases/wired';
import { adminRespond } from '../../../../libs/adminRespond';

// ============================================================================
// Content Blocks Management
// ============================================================================

export const listContentBlocks = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const pageId = req.query.pageId as string;
  const contentTypeId = req.query.contentTypeId as string;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  let blocks: unknown[];

  if (pageId) {
    // Get blocks for a specific page
    blocks = await manageContentUseCase.findBlocksByPageId(pageId);
  } else {
    // Get all blocks (this would need to be implemented in the repo)
    // For now, just show empty
    blocks = [];
  }

  // Get content types for filtering
  const contentTypes = await manageContentUseCase.findAllContentTypes(true);

  adminRespond(req, res, 'content/blocks/index', {
    pageName: 'Content Blocks',
    blocks,
    contentTypes,
    filters: { pageId, contentTypeId },
    pagination: { limit, offset },

    success: req.query.success || null,
  });
};

export const createContentBlockForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const pageId = req.query.pageId as string;

  if (!pageId) {
    return res.redirect('/hub/content/pages');
  }

  // Get the page details
  const page = await manageContentUseCase.findPageById(pageId);
  if (!page) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Content page not found',
    });
    return;
  }

  // Get content types that can be used as blocks
  const contentTypes = await manageContentUseCase.findAllContentTypes(true);

  // Get existing blocks for this page to determine next order
  const existingBlocks = await manageContentUseCase.findBlocksByPageId(pageId);
  const nextOrder = existingBlocks.length + 1;

  adminRespond(req, res, 'content/blocks/create', {
    pageName: 'Create Content Block',
    page,
    contentTypes,
    nextOrder,
  });
};

export const createContentBlock = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as HttpRequestBody;
  const { contentPageId, blockTypeId, title, sortOrder, content } = body as {
    contentPageId: string;
    blockTypeId: string;
    title: string;
    sortOrder: string;
    content?: string;
  };

  const _block = await manageContentUseCase.createBlock({
    contentPageId,
    blockTypeId,
    title: title || 'Untitled Block',
    sortOrder: parseInt(sortOrder) || 1,
    content: content ? JSON.parse(content) : {},
    isVisible: true,
  });

  res.redirect(`/hub/content/pages/${contentPageId}?success=Content block created successfully`);
};

export const editContentBlockForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { blockId } = req.params;

  const block = await manageContentUseCase.findBlockById(blockId);

  if (!block) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Content block not found',
    });
    return;
  }

  // Get the page this block belongs to
  const page = await manageContentUseCase.findPageById(block.contentPageId);

  // Get content type details
  const contentType = await manageContentUseCase.findBlockTypeById(block.blockTypeId);

  adminRespond(req, res, 'content/blocks/edit', {
    pageName: `Edit: ${block.title || 'Untitled Block'}`,
    block,
    page,
    contentType,
  });
};

export const updateContentBlock = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { blockId } = req.params;
  const updates: Record<string, unknown> = {};

  const body = req.body as HttpRequestBody;
  const { title, sortOrder, content, isVisible } = body as {
    title?: string;
    sortOrder?: string;
    content?: string;
    isVisible?: string | boolean;
  };

  if (title !== undefined) updates.title = title;
  if (sortOrder !== undefined) updates.sortOrder = parseInt(sortOrder);
  if (content !== undefined) updates.content = JSON.parse(content);
  if (isVisible !== undefined) updates.isVisible = isVisible === 'true' || isVisible === true;

  const block = await manageContentUseCase.updateBlock(blockId, updates);

  res.redirect(`/hub/content/pages/${block.contentPageId}?success=Content block updated successfully`);
};

export const deleteContentBlock = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { blockId } = req.params;

  // Get block info before deletion
  const block = await manageContentUseCase.findBlockById(blockId);
  if (!block) {
    throw new Error('Content block not found');
  }

  const _pageId = block.contentPageId;

  const success = await manageContentUseCase.deleteBlock(blockId);

  if (!success) {
    throw new Error('Failed to delete content block');
  }

  res.json({ success: true, message: 'Content block deleted successfully' });
};

export const reorderContentBlocks = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { pageId } = req.params;
  const body = req.body as HttpRequestBody;
  const { blockOrders } = body;

  if (!Array.isArray(blockOrders)) {
    throw new Error('blockOrders must be an array');
  }

  const success = await manageContentUseCase.reorderBlocks(pageId, blockOrders);

  if (!success) {
    throw new Error('Failed to reorder blocks');
  }

  res.json({ success: true, message: 'Content blocks reordered successfully' });
};
