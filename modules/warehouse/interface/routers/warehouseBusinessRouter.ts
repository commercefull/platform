import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import * as warehouseController from '../controllers/warehouseBusinessController';

const router = express.Router();

router.use(isOrganizationLoggedIn);

// ========== WAREHOUSE CRUD ROUTES ==========

// Warehouse listing with various filters
router.get('/warehouses', asyncHandler(warehouseController.getWarehouses));
router.get('/warehouses/default', asyncHandler(warehouseController.getDefaultWarehouse));
router.get('/warehouses/fulfillment-centers', asyncHandler(warehouseController.getFulfillmentCenters));
router.get('/warehouses/return-centers', asyncHandler(warehouseController.getReturnCenters));
router.get('/warehouses/statistics', asyncHandler(warehouseController.getWarehouseStatistics));
router.get('/warehouses/nearest', asyncHandler(warehouseController.findNearestWarehouses));
router.get('/warehouses/code/:code', asyncHandler(warehouseController.getWarehouseByCode));
router.get('/warehouses/country/:country', asyncHandler(warehouseController.getWarehousesByCountry));
router.get('/warehouses/:id', asyncHandler(warehouseController.getWarehouseById));

// Warehouse CRUD operations
router.post('/warehouses', asyncHandler(warehouseController.createWarehouse));
router.put('/warehouses/:id', asyncHandler(warehouseController.updateWarehouse));
router.delete('/warehouses/:id', asyncHandler(warehouseController.deleteWarehouse));

// Warehouse status management
router.post('/warehouses/:id/default', asyncHandler(warehouseController.setDefaultWarehouse));
router.post('/warehouses/:id/activate', asyncHandler(warehouseController.activateWarehouse));
router.post('/warehouses/:id/deactivate', asyncHandler(warehouseController.deactivateWarehouse));

// Shipping method management
router.post('/warehouses/:id/shipping-methods', asyncHandler(warehouseController.addShippingMethod));
router.delete('/warehouses/:id/shipping-methods/:method', asyncHandler(warehouseController.removeShippingMethod));

// Organization warehouses
router.get('/organizations/:organizationId/warehouses', asyncHandler(warehouseController.getWarehousesByMerchant));

// ========== ZONE ROUTES ==========

router.post('/warehouses/:id/zones', asyncHandler(warehouseController.createZone));
router.get('/warehouses/:id/zones', asyncHandler(warehouseController.getZones));
router.get('/warehouses/:id/zones/:zoneId', asyncHandler(warehouseController.getZoneById));
router.put('/warehouses/:id/zones/:zoneId', asyncHandler(warehouseController.updateZone));
router.delete('/warehouses/:id/zones/:zoneId', asyncHandler(warehouseController.deleteZone));

// ========== BIN ROUTES ==========

router.post('/warehouses/:id/bins', asyncHandler(warehouseController.createBin));
router.get('/warehouses/:id/bins', asyncHandler(warehouseController.getBins));
router.get('/warehouses/:id/bins/:binId', asyncHandler(warehouseController.getBinById));
router.put('/warehouses/:id/bins/:binId', asyncHandler(warehouseController.updateBin));
router.delete('/warehouses/:id/bins/:binId', asyncHandler(warehouseController.deleteBin));

// ========== RECEIVING ROUTES ==========

router.post('/warehouses/:id/receiving', asyncHandler(warehouseController.createReceiving));
router.get('/warehouses/:id/receiving', asyncHandler(warehouseController.getReceiving));
router.get('/warehouses/:id/receiving/:receivingId', asyncHandler(warehouseController.getReceivingById));
router.post('/warehouses/:id/receiving/:receivingId/complete', asyncHandler(warehouseController.completeReceiving));

// ========== PICK/PACK ROUTES ==========

router.post('/warehouses/:id/pick-pack', asyncHandler(warehouseController.createPickPack));
router.get('/warehouses/:id/pick-pack', asyncHandler(warehouseController.getPickPacks));
router.get('/warehouses/:id/pick-pack/:pickPackId', asyncHandler(warehouseController.getPickPackById));
router.post('/warehouses/:id/pick-pack/:pickPackId/start-picking', asyncHandler(warehouseController.startPicking));
router.post('/warehouses/:id/pick-pack/:pickPackId/complete-picking', asyncHandler(warehouseController.completePicking));
router.post('/warehouses/:id/pick-pack/:pickPackId/start-packing', asyncHandler(warehouseController.startPacking));
router.post('/warehouses/:id/pick-pack/:pickPackId/complete-packing', asyncHandler(warehouseController.completePacking));
router.post('/warehouses/:id/pick-pack/:pickPackId/assign', asyncHandler(warehouseController.assignPickPack));

export const warehouseMerchantRouter = router;
