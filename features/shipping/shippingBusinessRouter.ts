/**
 * Shipping Admin Router
 * Admin routes for shipping management
 */

import { Router } from 'express';
import * as shippingController from './controllers/shippingController';

const router = Router();

// ============================================================================
// Carriers
// ============================================================================

router.get('/carriers', shippingController.getCarriers);
router.get('/carriers/:id', shippingController.getCarrierById);
router.post('/carriers', shippingController.createCarrier);
router.put('/carriers/:id', shippingController.updateCarrier);
router.delete('/carriers/:id', shippingController.deleteCarrier);

// ============================================================================
// Methods
// ============================================================================

router.get('/methods', shippingController.getMethods);
router.get('/methods/:id', shippingController.getMethodById);
router.post('/methods', shippingController.createMethod);
router.put('/methods/:id', shippingController.updateMethod);
router.delete('/methods/:id', shippingController.deleteMethod);

// ============================================================================
// Zones
// ============================================================================

router.get('/zones', shippingController.getZones);
router.get('/zones/:id', shippingController.getZoneById);
router.post('/zones', shippingController.createZone);
router.put('/zones/:id', shippingController.updateZone);
router.delete('/zones/:id', shippingController.deleteZone);

// ============================================================================
// Rates
// ============================================================================

router.get('/rates', shippingController.getRates);
router.get('/rates/:id', shippingController.getRateById);
router.post('/rates', shippingController.createRate);
router.put('/rates/:id', shippingController.updateRate);
router.delete('/rates/:id', shippingController.deleteRate);

// ============================================================================
// Packaging Types
// ============================================================================

router.get('/packaging-types', shippingController.getPackagingTypes);
router.get('/packaging-types/:id', shippingController.getPackagingTypeById);
router.post('/packaging-types', shippingController.createPackagingType);
router.put('/packaging-types/:id', shippingController.updatePackagingType);
router.delete('/packaging-types/:id', shippingController.deletePackagingType);

// ============================================================================
// Rate Calculation
// ============================================================================

router.post('/calculate-rates', shippingController.calculateRates);

export const shippingBusinessRouter = router;
