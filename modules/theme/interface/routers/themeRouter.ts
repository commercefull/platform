/**
 * Theme Business Router
 * All routes require organization authentication.
 * Mounted at /business, routes prefixed with /theme.
 */

import { createHttpRouter } from 'libs/http';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { themeController } from '../controllers/themeController';

const router = createHttpRouter();

// Theme CRUD
router.get('/theme', isOrganizationLoggedIn, themeController.listThemes);
router.get('/theme/built-in', isOrganizationLoggedIn, themeController.listBuiltInThemes);
router.get('/theme/slug/:slug', isOrganizationLoggedIn, themeController.getThemeBySlug);
router.get('/theme/:themeId', isOrganizationLoggedIn, themeController.getTheme);
router.post('/theme', isOrganizationLoggedIn, themeController.createTheme);
router.put('/theme/:themeId', isOrganizationLoggedIn, themeController.updateTheme);
router.delete('/theme/:themeId', isOrganizationLoggedIn, themeController.deleteTheme);
router.post('/theme/:themeId/activate', isOrganizationLoggedIn, themeController.activateTheme);
router.post('/theme/:themeId/archive', isOrganizationLoggedIn, themeController.archiveTheme);

// Theme overrides
router.get('/theme/overrides/store/:storeId', isOrganizationLoggedIn, themeController.getOverrideByStore);
router.get('/theme/overrides/organization/:organizationId', isOrganizationLoggedIn, themeController.getOverridesByOrganization);
router.post('/theme/overrides', isOrganizationLoggedIn, themeController.createOverride);
router.put('/theme/overrides/:overrideId', isOrganizationLoggedIn, themeController.updateOverride);
router.delete('/theme/overrides/:overrideId', isOrganizationLoggedIn, themeController.deleteOverride);

// Theme assignment
router.post('/theme/assign/:storeId', isOrganizationLoggedIn, themeController.assignTheme);
router.delete('/theme/assign/:storeId', isOrganizationLoggedIn, themeController.unassignTheme);
router.get('/theme/assignment/:storeId', isOrganizationLoggedIn, themeController.getAssignment);

// Resolve theme for storefront rendering
router.get('/theme/resolve/:storeId', isOrganizationLoggedIn, themeController.resolveTheme);

// Admin: seed built-in themes
router.post('/theme/seed/built-in', isOrganizationLoggedIn, themeController.seedBuiltInThemes);

export const themeBusinessRouter = router;
