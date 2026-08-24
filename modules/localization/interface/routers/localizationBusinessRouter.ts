import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import * as localizationController from '../controllers/localizationBusinessController';

const router = express.Router();

router.use(isOrganizationLoggedIn);

// ========== LOCALE ROUTES ==========

// Locale CRUD
router.get('/locales', asyncHandler(localizationController.getLocales));
router.get('/locales/default', asyncHandler(localizationController.getDefaultLocale));
router.get('/locales/statistics', asyncHandler(localizationController.getLocaleStatistics));
router.get('/locales/language/:language', asyncHandler(localizationController.getLocalesByLanguage));
router.get('/locales/country/:countryCode', asyncHandler(localizationController.getLocalesByCountry));
router.get('/locales/code/:code', asyncHandler(localizationController.getLocaleByCode));
router.get('/locales/:id', asyncHandler(localizationController.getLocaleById));

router.post('/locales', asyncHandler(localizationController.createLocale));
router.put('/locales/:id', asyncHandler(localizationController.updateLocale));
router.delete('/locales/:id', asyncHandler(localizationController.deleteLocale));

// Locale status management
router.post('/locales/:id/default', asyncHandler(localizationController.setDefaultLocale));
router.post('/locales/:id/activate', asyncHandler(localizationController.activateLocale));
router.post('/locales/:id/deactivate', asyncHandler(localizationController.deactivateLocale));

// ========== COUNTRY ROUTES ==========

// Country CRUD
router.get('/countries', asyncHandler(localizationController.getCountries));
router.get('/countries/region/:region', asyncHandler(localizationController.getCountriesByRegion));
router.get('/countries/:id', asyncHandler(localizationController.getCountryById));
router.get('/countries/code/:code', asyncHandler(localizationController.getCountryByCode));

router.post('/countries', asyncHandler(localizationController.createCountry));
router.put('/countries/:id', asyncHandler(localizationController.updateCountry));
router.delete('/countries/:id', asyncHandler(localizationController.deleteCountry));

// Country status management
router.post('/countries/:id/activate', asyncHandler(localizationController.activateCountry));
router.post('/countries/:id/deactivate', asyncHandler(localizationController.deactivateCountry));

export const localizationMerchantRouter = router;
