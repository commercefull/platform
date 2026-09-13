/**
 * Page Builder Business Router
 * All routes under /business/page-builder
 * Mounted at /business, routes prefixed with /page-builder.
 */

import { Router } from 'express';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { pageBuilderController } from '../controllers/pageBuilderController';

const router = Router();

router.use(isOrganizationLoggedIn);

// Block types
router.get('/page-builder/block-types', asyncHandler(pageBuilderController.listBlockTypes));
router.get('/page-builder/block-types/:category', asyncHandler(pageBuilderController.listBlockTypesByCategory));

// Drafts
router.get('/page-builder/drafts', asyncHandler(pageBuilderController.listDrafts));
router.get('/page-builder/drafts/:draftId', asyncHandler(pageBuilderController.getDraft));
router.post('/page-builder/drafts', asyncHandler(pageBuilderController.createDraft));
router.patch('/page-builder/drafts/:draftId/title', asyncHandler(pageBuilderController.updateDraftTitle));
router.patch('/page-builder/drafts/:draftId/slug', asyncHandler(pageBuilderController.updateDraftSlug));
router.patch('/page-builder/drafts/:draftId/theme', asyncHandler(pageBuilderController.updateDraftTheme));
router.delete('/page-builder/drafts/:draftId', asyncHandler(pageBuilderController.deleteDraft));

// Blocks
router.post('/page-builder/drafts/:draftId/blocks', asyncHandler(pageBuilderController.addBlock));
router.patch('/page-builder/drafts/:draftId/blocks/:blockId', asyncHandler(pageBuilderController.updateBlock));
router.patch('/page-builder/drafts/:draftId/blocks/:blockId/move', asyncHandler(pageBuilderController.moveBlock));
router.delete('/page-builder/drafts/:draftId/blocks/:blockId', asyncHandler(pageBuilderController.removeBlock));
router.post('/page-builder/drafts/:draftId/regions/:region/reorder', asyncHandler(pageBuilderController.reorderBlocks));

// Publish
router.post('/page-builder/drafts/:draftId/publish', asyncHandler(pageBuilderController.publishDraft));
router.post('/page-builder/drafts/:draftId/unpublish', asyncHandler(pageBuilderController.unpublishDraft));

// Preview
router.get('/page-builder/drafts/:draftId/preview', asyncHandler(pageBuilderController.previewDraft));

export const pageBuilderBusinessRouter = router;
