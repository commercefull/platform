/**
 * Fulfillment Location & Partner Router
 *
 * Routes for managing fulfillment locations and partners.
 */

import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import * as locationController from '../controllers/FulfillmentLocationController';

const router = Router();

// ============================================================================
// Fulfillment Locations
// ============================================================================

router.get('/fulfillment/locations', isOrganizationLoggedIn, asyncHandler(locationController.listLocations));
router.get('/fulfillment/locations/nearest', isOrganizationLoggedIn, asyncHandler(locationController.findNearestLocations));
router.get('/fulfillment/locations/:locationId', isOrganizationLoggedIn, asyncHandler(locationController.getLocation));
router.post('/fulfillment/locations', isOrganizationLoggedIn, asyncHandler(locationController.createLocation));
router.put('/fulfillment/locations/:locationId', isOrganizationLoggedIn, asyncHandler(locationController.updateLocation));
router.delete('/fulfillment/locations/:locationId', isOrganizationLoggedIn, asyncHandler(locationController.deleteLocation));
router.post('/fulfillment/locations/:locationId/activate', isOrganizationLoggedIn, asyncHandler(locationController.activateLocation));
router.post('/fulfillment/locations/:locationId/deactivate', isOrganizationLoggedIn, asyncHandler(locationController.deactivateLocation));

// ============================================================================
// Fulfillment Partners
// ============================================================================

router.get('/fulfillment/partners', isOrganizationLoggedIn, asyncHandler(locationController.listPartners));
router.get('/fulfillment/partners/:partnerId', isOrganizationLoggedIn, asyncHandler(locationController.getPartner));
router.post('/fulfillment/partners', isOrganizationLoggedIn, asyncHandler(locationController.createPartner));
router.put('/fulfillment/partners/:partnerId', isOrganizationLoggedIn, asyncHandler(locationController.updatePartner));
router.delete('/fulfillment/partners/:partnerId', isOrganizationLoggedIn, asyncHandler(locationController.deletePartner));

export const fulfillmentLocationRouter = router;
export default router;
