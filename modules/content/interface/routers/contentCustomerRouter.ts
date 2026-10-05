import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  getPublishedPages,
  getPublishedPageBySlug,
  getActiveContentTypes,
  getNavigationBySlug,
} from '../controllers/contentCustomerController';

const router = createHttpRouter();

// Public content routes (no auth required, only published/active content)
router.get('/content/pages', asyncHandler(getPublishedPages));
router.get('/content/pages/:slug', asyncHandler(getPublishedPageBySlug));
router.get('/content/types', asyncHandler(getActiveContentTypes));
router.get('/content/navigations/:slug', asyncHandler(getNavigationBySlug));

export const contentCustomerRouter = router;
