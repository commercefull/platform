import express from 'express';
import { isMerchantLoggedIn } from '../../libs/auth';
import * as localizationController from './controllers/localizationBusinessController';

const router = express.Router();

router.use(isMerchantLoggedIn);

// ========== LOCALE ROUTES ==========

// Locale CRUD
router.get('/locales', localizationController.getLocales);
router.get('/locales/default', localizationController.getDefaultLocale);
router.get('/locales/statistics', localizationController.getLocaleStatistics);
router.get('/locales/language/:language', localizationController.getLocalesByLanguage);
router.get('/locales/country/:countryCode', localizationController.getLocalesByCountry);
router.get('/locales/:id', localizationController.getLocaleById);
router.get('/locales/code/:code', localizationController.getLocaleByCode);

router.post('/locales', localizationController.createLocale);
router.put('/locales/:id', localizationController.updateLocale);
router.delete('/locales/:id', localizationController.deleteLocale);

// Locale status management
router.post('/locales/:id/default', localizationController.setDefaultLocale);
router.post('/locales/:id/activate', localizationController.activateLocale);
router.post('/locales/:id/deactivate', localizationController.deactivateLocale);

// ========== COUNTRY ROUTES ==========

// Country CRUD
router.get('/countries', localizationController.getCountries);
router.get('/countries/region/:region', localizationController.getCountriesByRegion);
router.get('/countries/:id', localizationController.getCountryById);
router.get('/countries/code/:code', localizationController.getCountryByCode);

router.post('/countries', localizationController.createCountry);
router.put('/countries/:id', localizationController.updateCountry);
router.delete('/countries/:id', localizationController.deleteCountry);

// Country status management
router.post('/countries/:id/activate', localizationController.activateCountry);
router.post('/countries/:id/deactivate', localizationController.deactivateCountry);

export const localizationMerchantRouter = router;
