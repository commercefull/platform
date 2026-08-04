import express from 'express';
import {
  getPublishedPages,
  getPublishedPageBySlug,
  getActiveContentTypes,
} from '../controllers/contentCustomerController';

const router = express.Router();

// Public content routes (no auth required, only published/active content)
router.get('/content/pages', getPublishedPages);
router.get('/content/pages/:slug', getPublishedPageBySlug);
router.get('/content/types', getActiveContentTypes);

export const contentCustomerRouter = router;
