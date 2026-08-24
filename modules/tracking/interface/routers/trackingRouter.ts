/**
 * Tracking Business Router
 * All routes require organization authentication.
 */

import { Router } from 'express';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { trackingController } from '../controllers/trackingController';

const router = Router();

// Config CRUD
router.get('/config', isOrganizationLoggedIn, trackingController.getConfig.bind(trackingController));
router.get('/status', isOrganizationLoggedIn, trackingController.getStatus.bind(trackingController));
router.post('/config', isOrganizationLoggedIn, trackingController.createConfig.bind(trackingController));
router.delete('/config/:storeId', isOrganizationLoggedIn, trackingController.deleteConfig.bind(trackingController));

// GTM
router.put('/config/:storeId/gtm', isOrganizationLoggedIn, trackingController.updateGtm.bind(trackingController));
router.delete('/config/:storeId/gtm', isOrganizationLoggedIn, trackingController.removeGtm.bind(trackingController));

// Meta CAPI
router.put('/config/:storeId/meta-capi', isOrganizationLoggedIn, trackingController.updateMetaCapi.bind(trackingController));
router.delete('/config/:storeId/meta-capi', isOrganizationLoggedIn, trackingController.removeMetaCapi.bind(trackingController));

// Event Mappings
router.post('/config/:storeId/mappings', isOrganizationLoggedIn, trackingController.addEventMapping.bind(trackingController));
router.delete('/config/:storeId/mappings/:sourceEvent', isOrganizationLoggedIn, trackingController.removeEventMapping.bind(trackingController));

// Lifecycle
router.post('/config/:storeId/activate', isOrganizationLoggedIn, trackingController.activate.bind(trackingController));
router.post('/config/:storeId/disable', isOrganizationLoggedIn, trackingController.disable.bind(trackingController));
router.post('/config/:storeId/hash-pii', isOrganizationLoggedIn, trackingController.setHashPii.bind(trackingController));
router.post('/config/:storeId/server-side', isOrganizationLoggedIn, trackingController.setServerSideEnabled.bind(trackingController));

// Process event (manual trigger)
router.post('/process-event', isOrganizationLoggedIn, trackingController.processEvent.bind(trackingController));

export const trackingBusinessRouter = router;
