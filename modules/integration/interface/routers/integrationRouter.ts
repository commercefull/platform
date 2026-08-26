import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { integrationController } from '../controllers/integrationController';

const router = Router();

router.use(isOrganizationLoggedIn);

// Integration CRUD
router.post('/', asyncHandler(integrationController.createIntegration.bind(integrationController)));
router.get('/', asyncHandler(integrationController.listIntegrations.bind(integrationController)));
router.get('/:integrationId', asyncHandler(integrationController.getIntegration.bind(integrationController)));
router.put('/:integrationId', asyncHandler(integrationController.updateIntegration.bind(integrationController)));
router.post('/:integrationId/activate', asyncHandler(integrationController.activateIntegration.bind(integrationController)));
router.post('/:integrationId/deactivate', asyncHandler(integrationController.deactivateIntegration.bind(integrationController)));
router.delete('/:integrationId', asyncHandler(integrationController.deleteIntegration.bind(integrationController)));

// Credentials
router.post('/:integrationId/credentials', asyncHandler(integrationController.addCredential.bind(integrationController)));
router.get('/:integrationId/credentials', asyncHandler(integrationController.listCredentials.bind(integrationController)));
router.put('/:integrationId/credentials/:credentialId', asyncHandler(integrationController.updateCredential.bind(integrationController)));
router.delete('/:integrationId/credentials/:credentialId', asyncHandler(integrationController.deleteCredential.bind(integrationController)));

// Event subscriptions
router.post('/:integrationId/subscriptions', asyncHandler(integrationController.createSubscription.bind(integrationController)));
router.get('/:integrationId/subscriptions', asyncHandler(integrationController.listSubscriptions.bind(integrationController)));
router.put('/:integrationId/subscriptions/:subscriptionId', asyncHandler(integrationController.updateSubscription.bind(integrationController)));
router.delete('/:integrationId/subscriptions/:subscriptionId', asyncHandler(integrationController.deleteSubscription.bind(integrationController)));

// Logs
router.get('/:integrationId/logs', asyncHandler(integrationController.listLogs.bind(integrationController)));
router.delete('/:integrationId/logs', asyncHandler(integrationController.deleteLogs.bind(integrationController)));

export { router as integrationBusinessRouter };
