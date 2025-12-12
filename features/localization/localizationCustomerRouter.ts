/**
 * Localization Customer Router
 * Public localization routes for customers
 */

import express from 'express';
import * as localizationController from './controllers/localizationCustomerController';

const router = express.Router();

// Public routes (no auth required)
router.get('/locales', localizationController.getActiveLocales);
router.get('/locales/:code', localizationController.getLocaleByCode);
router.get('/countries', localizationController.getActiveCountries);
router.get('/countries/:code', localizationController.getCountryByCode);
router.get('/detect', localizationController.detectLocale);

export const localizationCustomerRouter = router;
