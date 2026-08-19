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

router.get('/locations', isOrganizationLoggedIn, locationController.listLocations);
router.get('/locations/nearest', isOrganizationLoggedIn, locationController.findNearestLocations);
router.get('/locations/:locationId', isOrganizationLoggedIn, locationController.getLocation);
router.post('/locations', isOrganizationLoggedIn, locationController.createLocation);
router.put('/locations/:locationId', isOrganizationLoggedIn, locationController.updateLocation);
router.delete('/locations/:locationId', isOrganizationLoggedIn, locationController.deleteLocation);
router.post('/locations/:locationId/activate', isOrganizationLoggedIn, locationController.activateLocation);
router.post('/locations/:locationId/deactivate', isOrganizationLoggedIn, locationController.deactivateLocation);

// ============================================================================
// Fulfillment Partners
// ============================================================================

router.get('/partners', isOrganizationLoggedIn, locationController.listPartners);
router.get('/partners/:partnerId', isOrganizationLoggedIn, locationController.getPartner);
router.post('/partners', isOrganizationLoggedIn, locationController.createPartner);
router.put('/partners/:partnerId', isOrganizationLoggedIn, locationController.updatePartner);
router.delete('/partners/:partnerId', isOrganizationLoggedIn, locationController.deletePartner);

export const fulfillmentLocationRouter = router;
export default router;
