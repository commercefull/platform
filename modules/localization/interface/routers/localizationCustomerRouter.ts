/**
 * Localization Customer Router
 * Public localization routes for customers
 */

import express from 'express';
import { getActiveLocales, getActiveCountries, getLocaleByCode, getCountryByCode, detectLocale } from '../controllers/localizationCustomerController';

const router = express.Router();

// Public routes (no auth required)
router.get('/localization/locales', getActiveLocales);
router.get('/localization/locales/:code', getLocaleByCode);
router.get('/localization/countries', getActiveCountries);
router.get('/localization/countries/:code', getCountryByCode);
router.get('/localization/detect', detectLocale);

export const localizationCustomerRouter = router;
