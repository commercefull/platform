/**
 * Page Builder Business Controller
 * REST API for managing page builder drafts, blocks, and publishing.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { CreateDraftCommand } from '../../application/useCases/ManageDrafts';
import { AddBlockCommand, UpdateBlockCommand, MoveBlockCommand } from '../../application/useCases/ManageBlocks';
import {
  manageDraftsUseCase,
  manageBlocksUseCase,
  publishDraftUseCase,
  previewDraftUseCase,
  getBlockTypesUseCase,
} from '../../application/wired';

class PageBuilderController {
  // ── Block Types ──────────────────────────────────────────────

  listBlockTypes = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const types = getBlockTypesUseCase.execute();
    res.json({ success: true, data: types });
  };

  listBlockTypesByCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { category } = req.params;
    const types = getBlockTypesUseCase.executeByCategory(category);
    res.json({ success: true, data: types });
  };

  // ── Drafts ───────────────────────────────────────────────────

  listDrafts = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const storeId = req.query.storeId as string;
    const orgId = (req.user as { id?: string })?.id;

    if (storeId) {
      const drafts = await manageDraftsUseCase.listByStore(storeId);
      res.json({ success: true, data: drafts });
    } else if (orgId) {
      const drafts = await manageDraftsUseCase.listByOrganization(orgId);
      res.json({ success: true, data: drafts });
    } else {
      const drafts = await manageDraftsUseCase.listAll();
      res.json({ success: true, data: drafts });
    }
  };

  getDraft = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { draftId } = req.params;
    const draft = await manageDraftsUseCase.getById(draftId);
    res.json({ success: true, data: draft });
  };

  createDraft = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { storeId, themeId, title, slug, pageType, pageId } = req.body as {
      storeId?: string;
      themeId?: string;
      title: string;
      slug: string;
      pageType?: string;
      pageId?: string;
    };
    const organizationId = (req.user as { id?: string })?.id || '';

    const cmd: CreateDraftCommand = {
      storeId,
      organizationId,
      themeId,
      title,
      slug,
      pageType: pageType || 'page',
      pageId,
    };

    const draft = await manageDraftsUseCase.create(cmd);
    res.status(201).json({ success: true, data: draft });
  };

  updateDraftTitle = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { draftId } = req.params;
    const { title } = req.body as { title: string };
    const draft = await manageDraftsUseCase.updateTitle(draftId, title);
    res.json({ success: true, data: draft });
  };

  updateDraftSlug = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { draftId } = req.params;
    const { slug } = req.body as { slug: string };
    const draft = await manageDraftsUseCase.updateSlug(draftId, slug);
    res.json({ success: true, data: draft });
  };

  updateDraftTheme = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { draftId } = req.params;
    const { themeId } = req.body as { themeId: string };
    const draft = await manageDraftsUseCase.updateTheme(draftId, themeId);
    res.json({ success: true, data: draft });
  };

  deleteDraft = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { draftId } = req.params;
    const success = await manageDraftsUseCase.delete(draftId);
    res.json({ success, message: success ? 'Draft deleted' : 'Draft not found' });
  };

  // ── Blocks ───────────────────────────────────────────────────

  addBlock = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { draftId } = req.params;
    const body = req.body as {
      typeId?: string;
      blockType?: string;
      region: string;
      content?: Record<string, unknown>;
      settings?: Record<string, string | number | boolean>;
      parentBlockId?: string;
      order?: number;
    };
    const { region, content, settings, parentBlockId, order } = body;
    // Accept both "typeId" and "blockType" as the block type identifier
    const typeId = (body.typeId || body.blockType) as string;

    const cmd: AddBlockCommand = {
      draftId,
      typeId,
      region,
      content,
      settings,
      parentBlockId,
      order,
    };

    const draft = await manageBlocksUseCase.addBlock(cmd);
    res.status(201).json({ success: true, data: draft });
  };

  updateBlock = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { draftId, blockId } = req.params;
    const { content, settings } = req.body as {
      content?: Record<string, unknown>;
      settings?: Record<string, string | number | boolean>;
    };

    const cmd: UpdateBlockCommand = { draftId, blockId, content, settings };
    const draft = await manageBlocksUseCase.updateBlock(cmd);
    res.json({ success: true, data: draft });
  };

  moveBlock = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { draftId, blockId } = req.params;
    const { region, order, parentBlockId } = req.body as {
      region: string;
      order: number;
      parentBlockId?: string;
    };

    const cmd: MoveBlockCommand = { draftId, blockId, region, order, parentBlockId };
    const draft = await manageBlocksUseCase.moveBlock(cmd);
    res.json({ success: true, data: draft });
  };

  removeBlock = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { draftId, blockId } = req.params;
    const draft = await manageBlocksUseCase.removeBlock(draftId, blockId);
    res.json({ success: true, data: draft });
  };

  reorderBlocks = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { draftId, region } = req.params;
    const { blockOrders } = req.body as { blockOrders: { blockId: string; order: number }[] };
    const draft = await manageBlocksUseCase.reorderBlocks(draftId, region, blockOrders);
    res.json({ success: true, data: draft });
  };

  // ── Publish ──────────────────────────────────────────────────

  publishDraft = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { draftId } = req.params;
    const draft = await publishDraftUseCase.publish(draftId);
    res.json({ success: true, data: draft, message: 'Draft published successfully' });
  };

  unpublishDraft = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { draftId } = req.params;
    const draft = await publishDraftUseCase.unpublish(draftId);
    res.json({ success: true, data: draft, message: 'Draft unpublished' });
  };

  // ── Preview ──────────────────────────────────────────────────

  previewDraft = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { draftId } = req.params;
    const preview = await previewDraftUseCase.preview(draftId);
    res.json({ success: true, data: preview });
  };
}

export const pageBuilderController = new PageBuilderController();
