/**
 * Recommendation Business Router — merchant rules, exclusions,
 * suggestions, preview, rebuild and stats (spec §11.2).
 * All routes require an authenticated organization user.
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import * as controller from '../controllers/RecommendationBusinessController';

const router = createHttpRouter();

router.use(isOrganizationLoggedIn);

router.get('/recommendation/products/:productId/suggestions', asyncHandler(controller.listSuggestions));
router.post('/recommendation/products/:productId/suggestions/accept', asyncHandler(controller.acceptSuggestion));
router.post('/recommendation/products/:productId/suggestions/hide', asyncHandler(controller.hideSuggestion));
router.get('/recommendation/products/:productId/preview', asyncHandler(controller.previewPlacement));

router.get('/recommendation/rules', asyncHandler(controller.listRules));
router.post('/recommendation/rules', asyncHandler(controller.createRule));
router.put('/recommendation/rules/:ruleId', asyncHandler(controller.updateRule));
router.delete('/recommendation/rules/:ruleId', asyncHandler(controller.deleteRule));

router.get('/recommendation/exclusions', asyncHandler(controller.listExclusions));
router.post('/recommendation/exclusions', asyncHandler(controller.createExclusion));
router.delete('/recommendation/exclusions/:exclusionId', asyncHandler(controller.deleteExclusion));

router.post('/recommendation/rebuild', asyncHandler(controller.rebuild));
router.get('/recommendation/stats', asyncHandler(controller.getStats));

export const recommendationBusinessRouter = router;
