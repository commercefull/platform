/**
 * SSO Business Router
 *
 * Routes for SSO configuration management and SSO login flows.
 * Config routes require organization auth. SSO login routes are public.
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { ssoController } from '../controllers/ssoController';

const router = createHttpRouter();

// -------------------- Public SSO Login Routes --------------------

// SAML SSO
router.post('/sso/saml/login/:providerId', asyncHandler(ssoController.initiateSamlLogin));
router.post('/sso/saml/callback/:providerId', asyncHandler(ssoController.samlCallback));

// OIDC SSO
router.post('/sso/oidc/login/:providerId', asyncHandler(ssoController.initiateOidcLogin));
router.post('/sso/oidc/callback/:providerId', asyncHandler(ssoController.oidcCallback));

// -------------------- Protected Config Routes --------------------

router.use(isOrganizationLoggedIn);

// List all SSO providers
router.get('/sso/providers', asyncHandler(ssoController.listProviders));

// SAML provider CRUD
router.post('/sso/saml/providers', asyncHandler(ssoController.createSamlProvider));
router.get('/sso/saml/providers/:providerId', asyncHandler(ssoController.getSamlProvider));
router.put('/sso/saml/providers/:providerId', asyncHandler(ssoController.updateSamlProvider));
router.delete('/sso/saml/providers/:providerId', asyncHandler(ssoController.deleteSamlProvider));
router.post('/sso/saml/providers/:providerId/activate', asyncHandler(ssoController.activateSamlProvider));
router.post('/sso/saml/providers/:providerId/deactivate', asyncHandler(ssoController.deactivateSamlProvider));

// OIDC provider CRUD
router.post('/sso/oidc/providers', asyncHandler(ssoController.createOidcProvider));
router.get('/sso/oidc/providers/:providerId', asyncHandler(ssoController.getOidcProvider));
router.put('/sso/oidc/providers/:providerId', asyncHandler(ssoController.updateOidcProvider));
router.delete('/sso/oidc/providers/:providerId', asyncHandler(ssoController.deleteOidcProvider));
router.post('/sso/oidc/providers/:providerId/activate', asyncHandler(ssoController.activateOidcProvider));
router.post('/sso/oidc/providers/:providerId/deactivate', asyncHandler(ssoController.deactivateOidcProvider));

export const ssoRouter = router;
