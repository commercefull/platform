/**
 * Page Builder Admin Controller
 * Renders the page builder admin views (EJS templates)
 */

import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { adminRespond } from '../../respond';
import {
  manageDraftsUseCase,
  publishDraftUseCase,
  previewDraftUseCase,
  getBlockTypesUseCase,
} from '../../../modules/pagebuilder';

// ── Draft List ─────────────────────────────────────────────────

export const listPageBuilderDrafts = async (req: TypedRequest, res: Response): Promise<void> => {
  const storeId = req.query.storeId as string;
  const orgId = (req.user as { organizationId?: string })?.organizationId;

  let drafts: unknown[] = [];
  try {
    if (storeId) {
      drafts = await manageDraftsUseCase.listByStore(storeId);
    } else if (orgId) {
      drafts = await manageDraftsUseCase.listByOrganization(orgId);
    }
  } catch {
    drafts = [];
  }

  adminRespond(req, res, 'pagebuilder/drafts/index', {
    pageName: 'Page Builder',
    drafts,
    storeId,
  });
};

// ── Builder Editor ─────────────────────────────────────────────

export const pageBuilderEditor = async (req: TypedRequest, res: Response): Promise<void> => {
  const { draftId } = req.params;

  let draft;
  let preview;
  try {
    draft = await manageDraftsUseCase.getById(draftId);
    preview = await previewDraftUseCase.preview(draftId);
  } catch {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Page draft not found',
    });
    return;
  }

  const blockTypes = getBlockTypesUseCase.execute();
  const blockTypesByCategory = {
    layout: getBlockTypesUseCase.executeByCategory('layout'),
    content: getBlockTypesUseCase.executeByCategory('content'),
    media: getBlockTypesUseCase.executeByCategory('media'),
    commerce: getBlockTypesUseCase.executeByCategory('commerce'),
    advanced: getBlockTypesUseCase.executeByCategory('advanced'),
  };

  adminRespond(req, res, 'pagebuilder/builder', {
    pageName: `Builder: ${draft.title}`,
    draft,
    preview,
    blockTypes,
    blockTypesByCategory,
    blockTypesJson: JSON.stringify(blockTypes),
    draftJson: JSON.stringify(draft.toJSON()),
    previewJson: JSON.stringify({
      theme: preview.theme,
      blocks: preview.blocks,
    }),
  });
};

// ── Create Draft Form ──────────────────────────────────────────

export const createDraftForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'pagebuilder/drafts/create', {
    pageName: 'Create Page',
  });
};

// ── Create Draft ───────────────────────────────────────────────

export const createDraft = async (req: TypedRequest, res: Response): Promise<void> => {
  const { storeId, themeId, title, slug, pageType } = req.body as RequestBody;
  const organizationId = (req.user as { organizationId?: string })?.organizationId || '';

  try {
    const draft = await manageDraftsUseCase.create({
      storeId,
      organizationId,
      themeId,
      title,
      slug,
      pageType: pageType || 'page',
    });
    res.redirect(`/hub/page-builder/${draft.draftId}`);
  } catch (err) {
    adminRespond(req, res, 'pagebuilder/drafts/create', {
      pageName: 'Create Page',
      error: (err as Error).message,
    });
  }
};

// ── Preview ────────────────────────────────────────────────────

export const pageBuilderPreview = async (req: TypedRequest, res: Response): Promise<void> => {
  const { draftId } = req.params;

  try {
    const preview = await previewDraftUseCase.preview(draftId);

    res.render('admin/views/pagebuilder/preview', {
      title: preview.draft.title,
      theme: preview.theme,
      blocks: preview.blocks,
      draft: preview.draft,
      blockTypes: preview.blockTypes,
      user: req.user,
      session: req.session,
    });
  } catch {
    res.status(404).send('Draft not found');
  }
};

// ── Publish ────────────────────────────────────────────────────

export const publishDraft = async (req: TypedRequest, res: Response): Promise<void> => {
  const { draftId } = req.params;
  try {
    await publishDraftUseCase.publish(draftId);
    res.json({ success: true, message: 'Draft published successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
};

// ── Delete Draft ───────────────────────────────────────────────

export const deleteDraft = async (req: TypedRequest, res: Response): Promise<void> => {
  const { draftId } = req.params;
  const success = await manageDraftsUseCase.delete(draftId);
  res.json({ success, message: success ? 'Draft deleted' : 'Draft not found' });
};
