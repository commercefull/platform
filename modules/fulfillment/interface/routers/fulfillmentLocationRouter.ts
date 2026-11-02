/**
 * Fulfillment Location & Partner Router
 *
 * Routes for managing fulfillment locations and partners.
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import {
  activateLocation,
  createLocation,
  createPartner,
  deactivateLocation,
  deleteLocation,
  deletePartner,
  findNearestLocations,
  getLocation,
  getPartner,
  listLocations,
  listPartners,
  updateLocation,
  updatePartner,
} from '../controllers/FulfillmentLocationController';
const router = createHttpRouter();

// ============================================================================
// Fulfillment Locations
// ============================================================================

router.get('/fulfillment/locations', isOrganizationLoggedIn, asyncHandler(listLocations));
router.get('/fulfillment/locations/nearest', isOrganizationLoggedIn, asyncHandler(findNearestLocations));
router.get('/fulfillment/locations/:locationId', isOrganizationLoggedIn, asyncHandler(getLocation));
router.post('/fulfillment/locations', isOrganizationLoggedIn, asyncHandler(createLocation));
router.put('/fulfillment/locations/:locationId', isOrganizationLoggedIn, asyncHandler(updateLocation));
router.delete('/fulfillment/locations/:locationId', isOrganizationLoggedIn, asyncHandler(deleteLocation));
router.post('/fulfillment/locations/:locationId/activate', isOrganizationLoggedIn, asyncHandler(activateLocation));
router.post('/fulfillment/locations/:locationId/deactivate', isOrganizationLoggedIn, asyncHandler(deactivateLocation));

// ============================================================================
// Fulfillment Partners
// ============================================================================

router.get('/fulfillment/partners', isOrganizationLoggedIn, asyncHandler(listPartners));
router.get('/fulfillment/partners/:partnerId', isOrganizationLoggedIn, asyncHandler(getPartner));
router.post('/fulfillment/partners', isOrganizationLoggedIn, asyncHandler(createPartner));
router.put('/fulfillment/partners/:partnerId', isOrganizationLoggedIn, asyncHandler(updatePartner));
router.delete('/fulfillment/partners/:partnerId', isOrganizationLoggedIn, asyncHandler(deletePartner));

export const fulfillmentLocationRouter = router;
export default router;
