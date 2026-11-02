import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import {
  activateWarehouse,
  addShippingMethod,
  assignPickPack,
  completePacking,
  completePicking,
  completeReceiving,
  createBin,
  createPickPack,
  createReceiving,
  createWarehouse,
  createZone,
  deactivateWarehouse,
  deleteBin,
  deleteWarehouse,
  deleteZone,
  findNearestWarehouses,
  getBinById,
  getBins,
  getDefaultWarehouse,
  getFulfillmentCenters,
  getPickPackById,
  getPickPacks,
  getReceiving,
  getReceivingById,
  getReturnCenters,
  getWarehouseByCode,
  getWarehouseById,
  getWarehouseStatistics,
  getWarehouses,
  getWarehousesByCountry,
  getWarehousesByMerchant,
  getZoneById,
  getZones,
  removeShippingMethod,
  setDefaultWarehouse,
  startPacking,
  startPicking,
  updateBin,
  updateWarehouse,
  updateZone,
} from '../controllers/warehouseBusinessController';
const router = createHttpRouter();

router.use(isOrganizationLoggedIn);

// ========== WAREHOUSE CRUD ROUTES ==========

// Warehouse listing with various filters
router.get('/warehouses', asyncHandler(getWarehouses));
router.get('/warehouses/default', asyncHandler(getDefaultWarehouse));
router.get('/warehouses/fulfillment-centers', asyncHandler(getFulfillmentCenters));
router.get('/warehouses/return-centers', asyncHandler(getReturnCenters));
router.get('/warehouses/statistics', asyncHandler(getWarehouseStatistics));
router.get('/warehouses/nearest', asyncHandler(findNearestWarehouses));
router.get('/warehouses/code/:code', asyncHandler(getWarehouseByCode));
router.get('/warehouses/country/:country', asyncHandler(getWarehousesByCountry));
router.get('/warehouses/:id', asyncHandler(getWarehouseById));

// Warehouse CRUD operations
router.post('/warehouses', asyncHandler(createWarehouse));
router.put('/warehouses/:id', asyncHandler(updateWarehouse));
router.delete('/warehouses/:id', asyncHandler(deleteWarehouse));

// Warehouse status management
router.post('/warehouses/:id/default', asyncHandler(setDefaultWarehouse));
router.post('/warehouses/:id/activate', asyncHandler(activateWarehouse));
router.post('/warehouses/:id/deactivate', asyncHandler(deactivateWarehouse));

// Shipping method management
router.post('/warehouses/:id/shipping-methods', asyncHandler(addShippingMethod));
router.delete('/warehouses/:id/shipping-methods/:method', asyncHandler(removeShippingMethod));

// Organization warehouses
router.get('/organizations/:organizationId/warehouses', asyncHandler(getWarehousesByMerchant));

// ========== ZONE ROUTES ==========

router.post('/warehouses/:id/zones', asyncHandler(createZone));
router.get('/warehouses/:id/zones', asyncHandler(getZones));
router.get('/warehouses/:id/zones/:zoneId', asyncHandler(getZoneById));
router.put('/warehouses/:id/zones/:zoneId', asyncHandler(updateZone));
router.delete('/warehouses/:id/zones/:zoneId', asyncHandler(deleteZone));

// ========== BIN ROUTES ==========

router.post('/warehouses/:id/bins', asyncHandler(createBin));
router.get('/warehouses/:id/bins', asyncHandler(getBins));
router.get('/warehouses/:id/bins/:binId', asyncHandler(getBinById));
router.put('/warehouses/:id/bins/:binId', asyncHandler(updateBin));
router.delete('/warehouses/:id/bins/:binId', asyncHandler(deleteBin));

// ========== RECEIVING ROUTES ==========

router.post('/warehouses/:id/receiving', asyncHandler(createReceiving));
router.get('/warehouses/:id/receiving', asyncHandler(getReceiving));
router.get('/warehouses/:id/receiving/:receivingId', asyncHandler(getReceivingById));
router.post('/warehouses/:id/receiving/:receivingId/complete', asyncHandler(completeReceiving));

// ========== PICK/PACK ROUTES ==========

router.post('/warehouses/:id/pick-pack', asyncHandler(createPickPack));
router.get('/warehouses/:id/pick-pack', asyncHandler(getPickPacks));
router.get('/warehouses/:id/pick-pack/:pickPackId', asyncHandler(getPickPackById));
router.post('/warehouses/:id/pick-pack/:pickPackId/start-picking', asyncHandler(startPicking));
router.post('/warehouses/:id/pick-pack/:pickPackId/complete-picking', asyncHandler(completePicking));
router.post('/warehouses/:id/pick-pack/:pickPackId/start-packing', asyncHandler(startPacking));
router.post('/warehouses/:id/pick-pack/:pickPackId/complete-packing', asyncHandler(completePacking));
router.post('/warehouses/:id/pick-pack/:pickPackId/assign', asyncHandler(assignPickPack));

export const warehouseMerchantRouter = router;
