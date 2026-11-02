/**
 * Recommendation Business Router — merchant rules, exclusions,
 * suggestions, preview, rebuild and stats (spec §11.2).
 * All routes require an authenticated organization user.
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import {
  acceptSuggestion,
  createExclusion,
  createRule,
  deleteExclusion,
  deleteRule,
  getStats,
  hideSuggestion,
  listExclusions,
  listRules,
  listSuggestions,
  previewPlacement,
  rebuild,
  updateRule,
} from '../controllers/RecommendationBusinessController';
const router = createHttpRouter();

router.use(isOrganizationLoggedIn);

router.get('/recommendation/products/:productId/suggestions', asyncHandler(listSuggestions));
router.post('/recommendation/products/:productId/suggestions/accept', asyncHandler(acceptSuggestion));
router.post('/recommendation/products/:productId/suggestions/hide', asyncHandler(hideSuggestion));
router.get('/recommendation/products/:productId/preview', asyncHandler(previewPlacement));

router.get('/recommendation/rules', asyncHandler(listRules));
router.post('/recommendation/rules', asyncHandler(createRule));
router.put('/recommendation/rules/:ruleId', asyncHandler(updateRule));
router.delete('/recommendation/rules/:ruleId', asyncHandler(deleteRule));

router.get('/recommendation/exclusions', asyncHandler(listExclusions));
router.post('/recommendation/exclusions', asyncHandler(createExclusion));
router.delete('/recommendation/exclusions/:exclusionId', asyncHandler(deleteExclusion));

router.post('/recommendation/rebuild', asyncHandler(rebuild));
router.get('/recommendation/stats', asyncHandler(getStats));

export const recommendationBusinessRouter = router;
