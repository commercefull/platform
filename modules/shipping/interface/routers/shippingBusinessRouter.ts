/**
 * Shipping Admin Router
 * Admin routes for shipping management
 */

import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import * as shippingController from '../controllers/shippingController';

const router = Router();

router.use(isOrganizationLoggedIn);

// ============================================================================
// Carriers
// ============================================================================

router.get('/carriers', asyncHandler(shippingController.getCarriers));
router.get('/carriers/:id', asyncHandler(shippingController.getCarrierById));
router.post('/carriers', asyncHandler(shippingController.createCarrier));
router.put('/carriers/:id', asyncHandler(shippingController.updateCarrier));
router.delete('/carriers/:id', asyncHandler(shippingController.deleteCarrier));

// ============================================================================
// Methods
// ============================================================================

router.get('/methods', asyncHandler(shippingController.getMethods));
router.get('/methods/:id', asyncHandler(shippingController.getMethodById));
router.post('/methods', asyncHandler(shippingController.createMethod));
router.put('/methods/:id', asyncHandler(shippingController.updateMethod));
router.delete('/methods/:id', asyncHandler(shippingController.deleteMethod));

// ============================================================================
// Zones
// ============================================================================

router.get('/zones', asyncHandler(shippingController.getZones));
router.get('/zones/:id', asyncHandler(shippingController.getZoneById));
router.post('/zones', asyncHandler(shippingController.createZone));
router.put('/zones/:id', asyncHandler(shippingController.updateZone));
router.delete('/zones/:id', asyncHandler(shippingController.deleteZone));

// ============================================================================
// Rates
// ============================================================================

router.get('/rates', asyncHandler(shippingController.getRates));
router.get('/rates/:id', asyncHandler(shippingController.getRateById));
router.post('/rates', asyncHandler(shippingController.createRate));
router.put('/rates/:id', asyncHandler(shippingController.updateRate));
router.delete('/rates/:id', asyncHandler(shippingController.deleteRate));

// ============================================================================
// Packaging Types
// ============================================================================

router.get('/packaging-types', asyncHandler(shippingController.getPackagingTypes));
router.get('/packaging-types/:id', asyncHandler(shippingController.getPackagingTypeById));
router.post('/packaging-types', asyncHandler(shippingController.createPackagingType));
router.put('/packaging-types/:id', asyncHandler(shippingController.updatePackagingType));
router.delete('/packaging-types/:id', asyncHandler(shippingController.deletePackagingType));

// ============================================================================
// Rate Calculation
// ============================================================================

router.post('/calculate-rates', asyncHandler(shippingController.calculateRates));

// ============================================================================
// Shipping Labels
// ============================================================================

router.post('/labels', asyncHandler(shippingController.createLabel));
router.get('/labels/:id', asyncHandler(shippingController.getLabel));
router.get('/labels/order/:orderId', asyncHandler(shippingController.getLabelsByOrder));
router.post('/labels/:id/void', asyncHandler(shippingController.voidLabel));

// ============================================================================
// Tracking
// ============================================================================

router.get('/track/:id', asyncHandler(shippingController.trackShipment));
router.get('/track', asyncHandler(shippingController.trackShipment));

export const shippingBusinessRouter = router;
