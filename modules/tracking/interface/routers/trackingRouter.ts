/**
 * Tracking Business Router
 * All routes require organization authentication.
 * Mounted at /business, routes prefixed with /tracking.
 */

import { createHttpRouter } from 'libs/http';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { trackingController } from '../controllers/trackingController';

const router = createHttpRouter();

// Config CRUD
router.get('/tracking/config', isOrganizationLoggedIn, trackingController.getConfig);
router.get('/tracking/status', isOrganizationLoggedIn, trackingController.getStatus);
router.post('/tracking/config', isOrganizationLoggedIn, trackingController.createConfig);
router.delete('/tracking/config/:storeId', isOrganizationLoggedIn, trackingController.deleteConfig);

// GTM
router.put('/tracking/config/:storeId/gtm', isOrganizationLoggedIn, trackingController.updateGtm);
router.delete('/tracking/config/:storeId/gtm', isOrganizationLoggedIn, trackingController.removeGtm);

// Meta CAPI
router.put('/tracking/config/:storeId/meta-capi', isOrganizationLoggedIn, trackingController.updateMetaCapi);
router.delete('/tracking/config/:storeId/meta-capi', isOrganizationLoggedIn, trackingController.removeMetaCapi);

// Event Mappings
router.post('/tracking/config/:storeId/mappings', isOrganizationLoggedIn, trackingController.addEventMapping);
router.delete('/tracking/config/:storeId/mappings/:sourceEvent', isOrganizationLoggedIn, trackingController.removeEventMapping);

// Lifecycle
router.post('/tracking/config/:storeId/activate', isOrganizationLoggedIn, trackingController.activate);
router.post('/tracking/config/:storeId/disable', isOrganizationLoggedIn, trackingController.disable);
router.post('/tracking/config/:storeId/hash-pii', isOrganizationLoggedIn, trackingController.setHashPii);
router.post('/tracking/config/:storeId/server-side', isOrganizationLoggedIn, trackingController.setServerSideEnabled);

// Process event (manual trigger)
router.post('/tracking/process-event', isOrganizationLoggedIn, trackingController.processEvent);

export const trackingBusinessRouter = router;
