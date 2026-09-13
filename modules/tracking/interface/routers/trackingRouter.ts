/**
 * Tracking Business Router
 * All routes require organization authentication.
 * Mounted at /business, routes prefixed with /tracking.
 */

import { Router } from 'express';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { trackingController } from '../controllers/trackingController';

const router = Router();

// Config CRUD
router.get('/tracking/config', isOrganizationLoggedIn, trackingController.getConfig.bind(trackingController));
router.get('/tracking/status', isOrganizationLoggedIn, trackingController.getStatus.bind(trackingController));
router.post('/tracking/config', isOrganizationLoggedIn, trackingController.createConfig.bind(trackingController));
router.delete('/tracking/config/:storeId', isOrganizationLoggedIn, trackingController.deleteConfig.bind(trackingController));

// GTM
router.put('/tracking/config/:storeId/gtm', isOrganizationLoggedIn, trackingController.updateGtm.bind(trackingController));
router.delete('/tracking/config/:storeId/gtm', isOrganizationLoggedIn, trackingController.removeGtm.bind(trackingController));

// Meta CAPI
router.put('/tracking/config/:storeId/meta-capi', isOrganizationLoggedIn, trackingController.updateMetaCapi.bind(trackingController));
router.delete('/tracking/config/:storeId/meta-capi', isOrganizationLoggedIn, trackingController.removeMetaCapi.bind(trackingController));

// Event Mappings
router.post('/tracking/config/:storeId/mappings', isOrganizationLoggedIn, trackingController.addEventMapping.bind(trackingController));
router.delete(
  '/tracking/config/:storeId/mappings/:sourceEvent',
  isOrganizationLoggedIn,
  trackingController.removeEventMapping.bind(trackingController),
);

// Lifecycle
router.post('/tracking/config/:storeId/activate', isOrganizationLoggedIn, trackingController.activate.bind(trackingController));
router.post('/tracking/config/:storeId/disable', isOrganizationLoggedIn, trackingController.disable.bind(trackingController));
router.post('/tracking/config/:storeId/hash-pii', isOrganizationLoggedIn, trackingController.setHashPii.bind(trackingController));
router.post('/tracking/config/:storeId/server-side', isOrganizationLoggedIn, trackingController.setServerSideEnabled.bind(trackingController));

// Process event (manual trigger)
router.post('/tracking/process-event', isOrganizationLoggedIn, trackingController.processEvent.bind(trackingController));

export const trackingBusinessRouter = router;
