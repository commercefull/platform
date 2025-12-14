/**
 * Localization Customer Router
 * Public localization routes for customers
 */

import express from 'express';
import * as localizationController from './controllers/localizationCustomerController';

const router = express.Router();

// Public routes (no auth required)
router.get('/localization/locales', localizationController.getActiveLocales);
router.get('/localization/locales/:code', localizationController.getLocaleByCode);
router.get('/localization/countries', localizationController.getActiveCountries);
router.get('/localization/countries/:code', localizationController.getCountryByCode);
router.get('/localization/detect', localizationController.detectLocale);

export const localizationCustomerRouter = router;
