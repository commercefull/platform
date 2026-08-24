/**
 * Page Builder Business Router
 * All routes under /business/page-builder
 */

import { Router } from 'express';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { pageBuilderController } from '../controllers/pageBuilderController';

const router = Router();

router.use(isOrganizationLoggedIn);

// Block types
router.get('/block-types', asyncHandler(pageBuilderController.listBlockTypes));
router.get('/block-types/:category', asyncHandler(pageBuilderController.listBlockTypesByCategory));

// Drafts
router.get('/drafts', asyncHandler(pageBuilderController.listDrafts));
router.get('/drafts/:draftId', asyncHandler(pageBuilderController.getDraft));
router.post('/drafts', asyncHandler(pageBuilderController.createDraft));
router.patch('/drafts/:draftId/title', asyncHandler(pageBuilderController.updateDraftTitle));
router.patch('/drafts/:draftId/slug', asyncHandler(pageBuilderController.updateDraftSlug));
router.patch('/drafts/:draftId/theme', asyncHandler(pageBuilderController.updateDraftTheme));
router.delete('/drafts/:draftId', asyncHandler(pageBuilderController.deleteDraft));

// Blocks
router.post('/drafts/:draftId/blocks', asyncHandler(pageBuilderController.addBlock));
router.patch('/drafts/:draftId/blocks/:blockId', asyncHandler(pageBuilderController.updateBlock));
router.patch('/drafts/:draftId/blocks/:blockId/move', asyncHandler(pageBuilderController.moveBlock));
router.delete('/drafts/:draftId/blocks/:blockId', asyncHandler(pageBuilderController.removeBlock));
router.post('/drafts/:draftId/regions/:region/reorder', asyncHandler(pageBuilderController.reorderBlocks));

// Publish
router.post('/drafts/:draftId/publish', asyncHandler(pageBuilderController.publishDraft));
router.post('/drafts/:draftId/unpublish', asyncHandler(pageBuilderController.unpublishDraft));

// Preview
router.get('/drafts/:draftId/preview', asyncHandler(pageBuilderController.previewDraft));

export const pageBuilderBusinessRouter = router;
