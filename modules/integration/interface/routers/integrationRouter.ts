import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { integrationController } from '../controllers/integrationController';

const router = Router();

router.use(isOrganizationLoggedIn);

// Integration CRUD
router.post('/integration', asyncHandler(integrationController.createIntegration.bind(integrationController)));
router.get('/integration', asyncHandler(integrationController.listIntegrations.bind(integrationController)));
router.get('/integration/:integrationId', asyncHandler(integrationController.getIntegration.bind(integrationController)));
router.put('/integration/:integrationId', asyncHandler(integrationController.updateIntegration.bind(integrationController)));
router.post('/integration/:integrationId/activate', asyncHandler(integrationController.activateIntegration.bind(integrationController)));
router.post('/integration/:integrationId/deactivate', asyncHandler(integrationController.deactivateIntegration.bind(integrationController)));
router.delete('/integration/:integrationId', asyncHandler(integrationController.deleteIntegration.bind(integrationController)));

// Credentials
router.post('/integration/:integrationId/credentials', asyncHandler(integrationController.addCredential.bind(integrationController)));
router.get('/integration/:integrationId/credentials', asyncHandler(integrationController.listCredentials.bind(integrationController)));
router.put('/integration/:integrationId/credentials/:credentialId', asyncHandler(integrationController.updateCredential.bind(integrationController)));
router.delete(
  '/integration/:integrationId/credentials/:credentialId',
  asyncHandler(integrationController.deleteCredential.bind(integrationController)),
);

// Event subscriptions
router.post('/integration/:integrationId/subscriptions', asyncHandler(integrationController.createSubscription.bind(integrationController)));
router.get('/integration/:integrationId/subscriptions', asyncHandler(integrationController.listSubscriptions.bind(integrationController)));
router.put(
  '/integration/:integrationId/subscriptions/:subscriptionId',
  asyncHandler(integrationController.updateSubscription.bind(integrationController)),
);
router.delete(
  '/integration/:integrationId/subscriptions/:subscriptionId',
  asyncHandler(integrationController.deleteSubscription.bind(integrationController)),
);

// Logs
router.get('/integration/:integrationId/logs', asyncHandler(integrationController.listLogs.bind(integrationController)));
router.delete('/integration/:integrationId/logs', asyncHandler(integrationController.deleteLogs.bind(integrationController)));

export { router as integrationBusinessRouter };
