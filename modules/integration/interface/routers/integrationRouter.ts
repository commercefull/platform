import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { integrationController } from '../controllers/integrationController';

const router = createHttpRouter();

router.use(isOrganizationLoggedIn);

// Integration CRUD
router.post('/integration', asyncHandler(integrationController.createIntegration));
router.get('/integration', asyncHandler(integrationController.listIntegrations));
router.get('/integration/:integrationId', asyncHandler(integrationController.getIntegration));
router.put('/integration/:integrationId', asyncHandler(integrationController.updateIntegration));
router.post('/integration/:integrationId/activate', asyncHandler(integrationController.activateIntegration));
router.post('/integration/:integrationId/deactivate', asyncHandler(integrationController.deactivateIntegration));
router.delete('/integration/:integrationId', asyncHandler(integrationController.deleteIntegration));

// Credentials
router.post('/integration/:integrationId/credentials', asyncHandler(integrationController.addCredential));
router.get('/integration/:integrationId/credentials', asyncHandler(integrationController.listCredentials));
router.put('/integration/:integrationId/credentials/:credentialId', asyncHandler(integrationController.updateCredential));
router.delete('/integration/:integrationId/credentials/:credentialId', asyncHandler(integrationController.deleteCredential));

// Event subscriptions
router.post('/integration/:integrationId/subscriptions', asyncHandler(integrationController.createSubscription));
router.get('/integration/:integrationId/subscriptions', asyncHandler(integrationController.listSubscriptions));
router.put('/integration/:integrationId/subscriptions/:subscriptionId', asyncHandler(integrationController.updateSubscription));
router.delete('/integration/:integrationId/subscriptions/:subscriptionId', asyncHandler(integrationController.deleteSubscription));

// Logs
router.get('/integration/:integrationId/logs', asyncHandler(integrationController.listLogs));
router.delete('/integration/:integrationId/logs', asyncHandler(integrationController.deleteLogs));

export { router as integrationBusinessRouter };
