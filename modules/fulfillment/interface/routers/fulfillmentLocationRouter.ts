/**
 * Fulfillment Location & Partner Router
 *
 * Routes for managing fulfillment locations and partners.
 */

import { Router } from 'express';
import { isMerchantLoggedIn } from '../../../../libs/auth';
import * as locationController from '../controllers/FulfillmentLocationController';

const router = Router();

// ============================================================================
// Fulfillment Locations
// ============================================================================

router.get('/locations', isMerchantLoggedIn, locationController.listLocations);
router.get('/locations/nearest', isMerchantLoggedIn, locationController.findNearestLocations);
router.get('/locations/:locationId', isMerchantLoggedIn, locationController.getLocation);
router.post('/locations', isMerchantLoggedIn, locationController.createLocation);
router.put('/locations/:locationId', isMerchantLoggedIn, locationController.updateLocation);
router.post('/locations/:locationId/activate', isMerchantLoggedIn, locationController.activateLocation);
router.post('/locations/:locationId/deactivate', isMerchantLoggedIn, locationController.deactivateLocation);

// ============================================================================
// Fulfillment Partners
// ============================================================================

router.get('/partners', isMerchantLoggedIn, locationController.listPartners);
router.get('/partners/:partnerId', isMerchantLoggedIn, locationController.getPartner);
router.post('/partners', isMerchantLoggedIn, locationController.createPartner);

export const fulfillmentLocationRouter = router;
export default router;
