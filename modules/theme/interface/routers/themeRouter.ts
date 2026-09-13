/**
 * Theme Business Router
 * All routes require organization authentication.
 * Mounted at /business, routes prefixed with /theme.
 */

import { Router } from 'express';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { themeController } from '../controllers/themeController';

const router = Router();

// Theme CRUD
router.get('/theme', isOrganizationLoggedIn, themeController.listThemes.bind(themeController));
router.get('/theme/built-in', isOrganizationLoggedIn, themeController.listBuiltInThemes.bind(themeController));
router.get('/theme/slug/:slug', isOrganizationLoggedIn, themeController.getThemeBySlug.bind(themeController));
router.get('/theme/:themeId', isOrganizationLoggedIn, themeController.getTheme.bind(themeController));
router.post('/theme', isOrganizationLoggedIn, themeController.createTheme.bind(themeController));
router.put('/theme/:themeId', isOrganizationLoggedIn, themeController.updateTheme.bind(themeController));
router.delete('/theme/:themeId', isOrganizationLoggedIn, themeController.deleteTheme.bind(themeController));
router.post('/theme/:themeId/activate', isOrganizationLoggedIn, themeController.activateTheme.bind(themeController));
router.post('/theme/:themeId/archive', isOrganizationLoggedIn, themeController.archiveTheme.bind(themeController));

// Theme overrides
router.get('/theme/overrides/store/:storeId', isOrganizationLoggedIn, themeController.getOverrideByStore.bind(themeController));
router.get(
  '/theme/overrides/organization/:organizationId',
  isOrganizationLoggedIn,
  themeController.getOverridesByOrganization.bind(themeController),
);
router.post('/theme/overrides', isOrganizationLoggedIn, themeController.createOverride.bind(themeController));
router.put('/theme/overrides/:overrideId', isOrganizationLoggedIn, themeController.updateOverride.bind(themeController));
router.delete('/theme/overrides/:overrideId', isOrganizationLoggedIn, themeController.deleteOverride.bind(themeController));

// Theme assignment
router.post('/theme/assign/:storeId', isOrganizationLoggedIn, themeController.assignTheme.bind(themeController));
router.delete('/theme/assign/:storeId', isOrganizationLoggedIn, themeController.unassignTheme.bind(themeController));
router.get('/theme/assignment/:storeId', isOrganizationLoggedIn, themeController.getAssignment.bind(themeController));

// Resolve theme for storefront rendering
router.get('/theme/resolve/:storeId', isOrganizationLoggedIn, themeController.resolveTheme.bind(themeController));

// Admin: seed built-in themes
router.post('/theme/seed/built-in', isOrganizationLoggedIn, themeController.seedBuiltInThemes.bind(themeController));

export const themeBusinessRouter = router;
