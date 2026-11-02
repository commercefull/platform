/**
 * Shipping Admin Router
 * Admin routes for shipping management
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import {
  calculateRates,
  createCarrier,
  createLabel,
  createMethod,
  createPackagingType,
  createRate,
  createSurcharge,
  createZone,
  deleteCarrier,
  deleteMethod,
  deletePackagingType,
  deleteRate,
  deleteSurcharge,
  deleteZone,
  getCarrierById,
  getCarriers,
  getLabel,
  getLabelsByOrder,
  getMethodById,
  getMethods,
  getPackagingTypeById,
  getPackagingTypes,
  getRateById,
  getRates,
  getSurchargeById,
  getSurchargesByRate,
  getZoneById,
  getZones,
  trackShipment,
  updateCarrier,
  updateMethod,
  updatePackagingType,
  updateRate,
  updateSurcharge,
  updateZone,
  voidLabel,
} from '../controllers/shippingController';
const router = createHttpRouter();

router.use(isOrganizationLoggedIn);

// ============================================================================
// Carriers
// ============================================================================

router.get('/carriers', asyncHandler(getCarriers));
router.get('/carriers/:id', asyncHandler(getCarrierById));
router.post('/carriers', asyncHandler(createCarrier));
router.put('/carriers/:id', asyncHandler(updateCarrier));
router.delete('/carriers/:id', asyncHandler(deleteCarrier));

// ============================================================================
// Methods
// ============================================================================

router.get('/methods', asyncHandler(getMethods));
router.get('/methods/:id', asyncHandler(getMethodById));
router.post('/methods', asyncHandler(createMethod));
router.put('/methods/:id', asyncHandler(updateMethod));
router.delete('/methods/:id', asyncHandler(deleteMethod));

// ============================================================================
// Zones
// ============================================================================

router.get('/zones', asyncHandler(getZones));
router.get('/zones/:id', asyncHandler(getZoneById));
router.post('/zones', asyncHandler(createZone));
router.put('/zones/:id', asyncHandler(updateZone));
router.delete('/zones/:id', asyncHandler(deleteZone));

// ============================================================================
// Rates
// ============================================================================

router.get('/rates', asyncHandler(getRates));
router.get('/rates/:id', asyncHandler(getRateById));
router.post('/rates', asyncHandler(createRate));
router.put('/rates/:id', asyncHandler(updateRate));
router.delete('/rates/:id', asyncHandler(deleteRate));

// ============================================================================
// Packaging Types
// ============================================================================

router.get('/packaging-types', asyncHandler(getPackagingTypes));
router.get('/packaging-types/:id', asyncHandler(getPackagingTypeById));
router.post('/packaging-types', asyncHandler(createPackagingType));
router.put('/packaging-types/:id', asyncHandler(updatePackagingType));
router.delete('/packaging-types/:id', asyncHandler(deletePackagingType));

// ============================================================================
// Rate Calculation
// ============================================================================

router.post('/calculate-rates', asyncHandler(calculateRates));

// ============================================================================
// Shipping Labels
// ============================================================================

router.post('/labels', asyncHandler(createLabel));
router.get('/labels/:id', asyncHandler(getLabel));
router.get('/labels/order/:orderId', asyncHandler(getLabelsByOrder));
router.post('/labels/:id/void', asyncHandler(voidLabel));

// ============================================================================
// Tracking
// ============================================================================

router.get('/track/:id', asyncHandler(trackShipment));
router.get('/track', asyncHandler(trackShipment));

// ============================================================================
// Surcharges
// ============================================================================

router.get('/rates/:rateId/surcharges', asyncHandler(getSurchargesByRate));
router.get('/surcharges/:id', asyncHandler(getSurchargeById));
router.post('/surcharges', asyncHandler(createSurcharge));
router.put('/surcharges/:id', asyncHandler(updateSurcharge));
router.delete('/surcharges/:id', asyncHandler(deleteSurcharge));

export const shippingBusinessRouter = router;
