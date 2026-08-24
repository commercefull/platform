/**
 * Theme Business Router
 * All routes require organization authentication.
 */

import { Router } from 'express';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { themeController } from '../controllers/themeController';

const router = Router();

// Theme CRUD
router.get('/', isOrganizationLoggedIn, themeController.listThemes.bind(themeController));
router.get('/built-in', isOrganizationLoggedIn, themeController.listBuiltInThemes.bind(themeController));
router.get('/slug/:slug', isOrganizationLoggedIn, themeController.getThemeBySlug.bind(themeController));
router.get('/:themeId', isOrganizationLoggedIn, themeController.getTheme.bind(themeController));
router.post('/', isOrganizationLoggedIn, themeController.createTheme.bind(themeController));
router.put('/:themeId', isOrganizationLoggedIn, themeController.updateTheme.bind(themeController));
router.delete('/:themeId', isOrganizationLoggedIn, themeController.deleteTheme.bind(themeController));
router.post('/:themeId/activate', isOrganizationLoggedIn, themeController.activateTheme.bind(themeController));
router.post('/:themeId/archive', isOrganizationLoggedIn, themeController.archiveTheme.bind(themeController));

// Theme overrides
router.get('/overrides/store/:storeId', isOrganizationLoggedIn, themeController.getOverrideByStore.bind(themeController));
router.get('/overrides/organization/:organizationId', isOrganizationLoggedIn, themeController.getOverridesByOrganization.bind(themeController));
router.post('/overrides', isOrganizationLoggedIn, themeController.createOverride.bind(themeController));
router.put('/overrides/:overrideId', isOrganizationLoggedIn, themeController.updateOverride.bind(themeController));
router.delete('/overrides/:overrideId', isOrganizationLoggedIn, themeController.deleteOverride.bind(themeController));

// Theme assignment
router.post('/assign/:storeId', isOrganizationLoggedIn, themeController.assignTheme.bind(themeController));
router.delete('/assign/:storeId', isOrganizationLoggedIn, themeController.unassignTheme.bind(themeController));
router.get('/assignment/:storeId', isOrganizationLoggedIn, themeController.getAssignment.bind(themeController));

// Resolve theme for storefront rendering
router.get('/resolve/:storeId', isOrganizationLoggedIn, themeController.resolveTheme.bind(themeController));

// Admin: seed built-in themes
router.post('/seed/built-in', isOrganizationLoggedIn, themeController.seedBuiltInThemes.bind(themeController));

export const themeBusinessRouter = router;
