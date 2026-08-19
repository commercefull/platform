/**
 * Fulfillment Location & Partner Router
 *
 * Routes for managing fulfillment locations and partners.
 */

import { Router } from 'express';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import * as locationController from '../controllers/FulfillmentLocationController';

const router = Router();

// ============================================================================
// Fulfillment Locations
// ============================================================================

router.get('/fulfillment/locations', isOrganizationLoggedIn, locationController.listLocations);
router.get('/fulfillment/locations/nearest', isOrganizationLoggedIn, locationController.findNearestLocations);
router.get('/fulfillment/locations/:locationId', isOrganizationLoggedIn, locationController.getLocation);
router.post('/fulfillment/locations', isOrganizationLoggedIn, locationController.createLocation);
router.put('/fulfillment/locations/:locationId', isOrganizationLoggedIn, locationController.updateLocation);
router.delete('/fulfillment/locations/:locationId', isOrganizationLoggedIn, locationController.deleteLocation);
router.post('/fulfillment/locations/:locationId/activate', isOrganizationLoggedIn, locationController.activateLocation);
router.post('/fulfillment/locations/:locationId/deactivate', isOrganizationLoggedIn, locationController.deactivateLocation);

// ============================================================================
// Fulfillment Partners
// ============================================================================

router.get('/fulfillment/partners', isOrganizationLoggedIn, locationController.listPartners);
router.get('/fulfillment/partners/:partnerId', isOrganizationLoggedIn, locationController.getPartner);
router.post('/fulfillment/partners', isOrganizationLoggedIn, locationController.createPartner);
router.put('/fulfillment/partners/:partnerId', isOrganizationLoggedIn, locationController.updatePartner);
router.delete('/fulfillment/partners/:partnerId', isOrganizationLoggedIn, locationController.deletePartner);

export const fulfillmentLocationRouter = router;
export default router;
