/**
 * SSO Business Router
 *
 * Routes for SSO configuration management and SSO login flows.
 * Config routes require organization auth. SSO login routes are public.
 */

import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { ssoController } from '../controllers/ssoController';

const router = Router();

// -------------------- Public SSO Login Routes --------------------

// SAML SSO
router.post('/sso/saml/login/:providerId', asyncHandler(ssoController.initiateSamlLogin.bind(ssoController)));
router.post('/sso/saml/callback/:providerId', asyncHandler(ssoController.samlCallback.bind(ssoController)));

// OIDC SSO
router.post('/sso/oidc/login/:providerId', asyncHandler(ssoController.initiateOidcLogin.bind(ssoController)));
router.post('/sso/oidc/callback/:providerId', asyncHandler(ssoController.oidcCallback.bind(ssoController)));

// -------------------- Protected Config Routes --------------------

router.use(isOrganizationLoggedIn);

// List all SSO providers
router.get('/sso/providers', asyncHandler(ssoController.listProviders.bind(ssoController)));

// SAML provider CRUD
router.post('/sso/saml/providers', asyncHandler(ssoController.createSamlProvider.bind(ssoController)));
router.get('/sso/saml/providers/:providerId', asyncHandler(ssoController.getSamlProvider.bind(ssoController)));
router.put('/sso/saml/providers/:providerId', asyncHandler(ssoController.updateSamlProvider.bind(ssoController)));
router.delete('/sso/saml/providers/:providerId', asyncHandler(ssoController.deleteSamlProvider.bind(ssoController)));
router.post('/sso/saml/providers/:providerId/activate', asyncHandler(ssoController.activateSamlProvider.bind(ssoController)));
router.post('/sso/saml/providers/:providerId/deactivate', asyncHandler(ssoController.deactivateSamlProvider.bind(ssoController)));

// OIDC provider CRUD
router.post('/sso/oidc/providers', asyncHandler(ssoController.createOidcProvider.bind(ssoController)));
router.get('/sso/oidc/providers/:providerId', asyncHandler(ssoController.getOidcProvider.bind(ssoController)));
router.put('/sso/oidc/providers/:providerId', asyncHandler(ssoController.updateOidcProvider.bind(ssoController)));
router.delete('/sso/oidc/providers/:providerId', asyncHandler(ssoController.deleteOidcProvider.bind(ssoController)));
router.post('/sso/oidc/providers/:providerId/activate', asyncHandler(ssoController.activateOidcProvider.bind(ssoController)));
router.post('/sso/oidc/providers/:providerId/deactivate', asyncHandler(ssoController.deactivateOidcProvider.bind(ssoController)));

export const ssoRouter = router;
