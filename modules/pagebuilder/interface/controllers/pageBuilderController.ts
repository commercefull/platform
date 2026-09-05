/**
 * Page Builder Business Controller
 * REST API for managing page builder drafts, blocks, and publishing.
 */

import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { PageDraftRepositoryImpl } from '../../infrastructure/repositories/PageDraftRepositoryImpl';
import { ThemeRepositoryImpl } from '../../../theme/infrastructure/repositories/ThemeRepositoryImpl';
import {
  ManageDraftsUseCase,
  ManageBlocksUseCase,
  PublishDraftUseCase,
  PreviewDraftUseCase,
  GetBlockTypesUseCase,
  CreateDraftCommand,
  AddBlockCommand,
  UpdateBlockCommand,
  MoveBlockCommand,
} from '../../application/useCases/PageBuilder';

const draftRepo = new PageDraftRepositoryImpl();
const themeRepo = new ThemeRepositoryImpl();
const manageDraftsUseCase = new ManageDraftsUseCase(draftRepo);
const manageBlocksUseCase = new ManageBlocksUseCase(draftRepo);
const publishDraftUseCase = new PublishDraftUseCase(draftRepo);
const previewDraftUseCase = new PreviewDraftUseCase(draftRepo, themeRepo);
const getBlockTypesUseCase = new GetBlockTypesUseCase();

class PageBuilderController {
  // ── Block Types ──────────────────────────────────────────────

  listBlockTypes = async (req: TypedRequest, res: Response): Promise<void> => {
    const types = getBlockTypesUseCase.execute();
    res.json({ success: true, data: types });
  };

  listBlockTypesByCategory = async (req: TypedRequest, res: Response): Promise<void> => {
    const { category } = req.params;
    const types = getBlockTypesUseCase.executeByCategory(category);
    res.json({ success: true, data: types });
  };

  // ── Drafts ───────────────────────────────────────────────────

  listDrafts = async (req: TypedRequest, res: Response): Promise<void> => {
    const storeId = req.query.storeId as string;
    const orgId = (req.user as { organizationId?: string })?.organizationId;

    if (storeId) {
      const drafts = await manageDraftsUseCase.listByStore(storeId);
      res.json({ success: true, data: drafts });
    } else if (orgId) {
      const drafts = await manageDraftsUseCase.listByOrganization(orgId);
      res.json({ success: true, data: drafts });
    } else {
      res.status(400).json({ success: false, message: 'storeId is required' });
    }
  };

  getDraft = async (req: TypedRequest, res: Response): Promise<void> => {
    const { draftId } = req.params;
    const draft = await manageDraftsUseCase.getById(draftId);
    res.json({ success: true, data: draft });
  };

  createDraft = async (req: TypedRequest, res: Response): Promise<void> => {
    const { storeId, themeId, title, slug, pageType, pageId } = req.body as RequestBody;
    const organizationId = (req.user as { organizationId?: string })?.organizationId || '';

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

  updateDraftTitle = async (req: TypedRequest, res: Response): Promise<void> => {
    const { draftId } = req.params;
    const { title } = req.body as RequestBody;
    const draft = await manageDraftsUseCase.updateTitle(draftId, title);
    res.json({ success: true, data: draft });
  };

  updateDraftSlug = async (req: TypedRequest, res: Response): Promise<void> => {
    const { draftId } = req.params;
    const { slug } = req.body as RequestBody;
    const draft = await manageDraftsUseCase.updateSlug(draftId, slug);
    res.json({ success: true, data: draft });
  };

  updateDraftTheme = async (req: TypedRequest, res: Response): Promise<void> => {
    const { draftId } = req.params;
    const { themeId } = req.body as RequestBody;
    const draft = await manageDraftsUseCase.updateTheme(draftId, themeId);
    res.json({ success: true, data: draft });
  };

  deleteDraft = async (req: TypedRequest, res: Response): Promise<void> => {
    const { draftId } = req.params;
    const success = await manageDraftsUseCase.delete(draftId);
    res.json({ success, message: success ? 'Draft deleted' : 'Draft not found' });
  };

  // ── Blocks ───────────────────────────────────────────────────

  addBlock = async (req: TypedRequest, res: Response): Promise<void> => {
    const { draftId } = req.params;
    const { typeId, region, content, settings, parentBlockId, order } = req.body as RequestBody;

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

  updateBlock = async (req: TypedRequest, res: Response): Promise<void> => {
    const { draftId, blockId } = req.params;
    const { content, settings } = req.body as RequestBody;

    const cmd: UpdateBlockCommand = { draftId, blockId, content, settings };
    const draft = await manageBlocksUseCase.updateBlock(cmd);
    res.json({ success: true, data: draft });
  };

  moveBlock = async (req: TypedRequest, res: Response): Promise<void> => {
    const { draftId, blockId } = req.params;
    const { region, order, parentBlockId } = req.body as RequestBody;

    const cmd: MoveBlockCommand = { draftId, blockId, region, order, parentBlockId };
    const draft = await manageBlocksUseCase.moveBlock(cmd);
    res.json({ success: true, data: draft });
  };

  removeBlock = async (req: TypedRequest, res: Response): Promise<void> => {
    const { draftId, blockId } = req.params;
    const draft = await manageBlocksUseCase.removeBlock(draftId, blockId);
    res.json({ success: true, data: draft });
  };

  reorderBlocks = async (req: TypedRequest, res: Response): Promise<void> => {
    const { draftId, region } = req.params;
    const { blockOrders } = req.body as RequestBody;
    const draft = await manageBlocksUseCase.reorderBlocks(draftId, region, blockOrders);
    res.json({ success: true, data: draft });
  };

  // ── Publish ──────────────────────────────────────────────────

  publishDraft = async (req: TypedRequest, res: Response): Promise<void> => {
    const { draftId } = req.params;
    const draft = await publishDraftUseCase.publish(draftId);
    res.json({ success: true, data: draft, message: 'Draft published successfully' });
  };

  unpublishDraft = async (req: TypedRequest, res: Response): Promise<void> => {
    const { draftId } = req.params;
    const draft = await publishDraftUseCase.unpublish(draftId);
    res.json({ success: true, data: draft, message: 'Draft unpublished' });
  };

  // ── Preview ──────────────────────────────────────────────────

  previewDraft = async (req: TypedRequest, res: Response): Promise<void> => {
    const { draftId } = req.params;
    const preview = await previewDraftUseCase.preview(draftId);
    res.json({ success: true, data: preview });
  };
}

export const pageBuilderController = new PageBuilderController();
