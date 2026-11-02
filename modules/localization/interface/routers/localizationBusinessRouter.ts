import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import {
  activateCountry,
  activateLocale,
  createCountry,
  createLocale,
  deactivateCountry,
  deactivateLocale,
  deleteCountry,
  deleteLocale,
  getCountries,
  getCountriesByRegion,
  getCountryByCode,
  getCountryById,
  getDefaultLocale,
  getLocaleByCode,
  getLocaleById,
  getLocaleStatistics,
  getLocales,
  getLocalesByCountry,
  getLocalesByLanguage,
  setDefaultLocale,
  updateCountry,
  updateLocale,
} from '../controllers/localizationBusinessController';
const router = createHttpRouter();

router.use(isOrganizationLoggedIn);

// ========== LOCALE ROUTES ==========

// Locale CRUD
router.get('/locales', asyncHandler(getLocales));
router.get('/locales/default', asyncHandler(getDefaultLocale));
router.get('/locales/statistics', asyncHandler(getLocaleStatistics));
router.get('/locales/language/:language', asyncHandler(getLocalesByLanguage));
router.get('/locales/country/:countryCode', asyncHandler(getLocalesByCountry));
router.get('/locales/code/:code', asyncHandler(getLocaleByCode));
router.get('/locales/:id', asyncHandler(getLocaleById));

router.post('/locales', asyncHandler(createLocale));
router.put('/locales/:id', asyncHandler(updateLocale));
router.delete('/locales/:id', asyncHandler(deleteLocale));

// Locale status management
router.post('/locales/:id/default', asyncHandler(setDefaultLocale));
router.post('/locales/:id/activate', asyncHandler(activateLocale));
router.post('/locales/:id/deactivate', asyncHandler(deactivateLocale));

// ========== COUNTRY ROUTES ==========

// Country CRUD
router.get('/countries', asyncHandler(getCountries));
router.get('/countries/region/:region', asyncHandler(getCountriesByRegion));
router.get('/countries/:id', asyncHandler(getCountryById));
router.get('/countries/code/:code', asyncHandler(getCountryByCode));

router.post('/countries', asyncHandler(createCountry));
router.put('/countries/:id', asyncHandler(updateCountry));
router.delete('/countries/:id', asyncHandler(deleteCountry));

// Country status management
router.post('/countries/:id/activate', asyncHandler(activateCountry));
router.post('/countries/:id/deactivate', asyncHandler(deactivateCountry));

export const localizationMerchantRouter = router;
