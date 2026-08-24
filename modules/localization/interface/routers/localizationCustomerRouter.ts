/**
 * Localization Customer Router
 * Public localization routes for customers
 */

import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  getActiveLocales,
  getActiveCountries,
  getLocaleByCode,
  getCountryByCode,
  detectLocale,
} from '../controllers/localizationCustomerController';

const router = express.Router();

// Public routes (no auth required)
router.get('/localization/locales', asyncHandler(getActiveLocales));
router.get('/localization/locales/:code', asyncHandler(getLocaleByCode));
router.get('/localization/countries', asyncHandler(getActiveCountries));
router.get('/localization/countries/:code', asyncHandler(getCountryByCode));
router.get('/localization/detect', asyncHandler(detectLocale));

export const localizationCustomerRouter = router;
