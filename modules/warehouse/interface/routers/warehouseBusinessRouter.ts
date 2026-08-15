import express from 'express';
import { isMerchantLoggedIn } from '../../../../libs/auth';
import * as warehouseController from '../controllers/warehouseBusinessController';

const router = express.Router();

router.use(isMerchantLoggedIn);

// ========== WAREHOUSE CRUD ROUTES ==========

// Warehouse listing with various filters
router.get('/warehouses', warehouseController.getWarehouses);
router.get('/warehouses/default', warehouseController.getDefaultWarehouse);
router.get('/warehouses/fulfillment-centers', warehouseController.getFulfillmentCenters);
router.get('/warehouses/return-centers', warehouseController.getReturnCenters);
router.get('/warehouses/statistics', warehouseController.getWarehouseStatistics);
router.get('/warehouses/nearest', warehouseController.findNearestWarehouses);
router.get('/warehouses/country/:country', warehouseController.getWarehousesByCountry);
router.get('/warehouses/:id', warehouseController.getWarehouseById);
router.get('/warehouses/code/:code', warehouseController.getWarehouseByCode);

// Warehouse CRUD operations
router.post('/warehouses', warehouseController.createWarehouse);
router.put('/warehouses/:id', warehouseController.updateWarehouse);
router.delete('/warehouses/:id', warehouseController.deleteWarehouse);

// Warehouse status management
router.post('/warehouses/:id/default', warehouseController.setDefaultWarehouse);
router.post('/warehouses/:id/activate', warehouseController.activateWarehouse);
router.post('/warehouses/:id/deactivate', warehouseController.deactivateWarehouse);

// Shipping method management
router.post('/warehouses/:id/shipping-methods', warehouseController.addShippingMethod);
router.delete('/warehouses/:id/shipping-methods/:method', warehouseController.removeShippingMethod);

// Merchant warehouses
router.get('/merchants/:merchantId/warehouses', warehouseController.getWarehousesByMerchant);

// ========== ZONE ROUTES ==========

router.post('/warehouses/:id/zones', warehouseController.createZone);
router.get('/warehouses/:id/zones', warehouseController.getZones);
router.get('/warehouses/:id/zones/:zoneId', warehouseController.getZoneById);
router.put('/warehouses/:id/zones/:zoneId', warehouseController.updateZone);
router.delete('/warehouses/:id/zones/:zoneId', warehouseController.deleteZone);

// ========== BIN ROUTES ==========

router.post('/warehouses/:id/bins', warehouseController.createBin);
router.get('/warehouses/:id/bins', warehouseController.getBins);
router.get('/warehouses/:id/bins/:binId', warehouseController.getBinById);
router.put('/warehouses/:id/bins/:binId', warehouseController.updateBin);
router.delete('/warehouses/:id/bins/:binId', warehouseController.deleteBin);

// ========== RECEIVING ROUTES ==========

router.post('/warehouses/:id/receiving', warehouseController.createReceiving);
router.get('/warehouses/:id/receiving', warehouseController.getReceiving);
router.get('/warehouses/:id/receiving/:receivingId', warehouseController.getReceivingById);
router.post('/warehouses/:id/receiving/:receivingId/complete', warehouseController.completeReceiving);

// ========== PICK/PACK ROUTES ==========

router.post('/warehouses/:id/pick-pack', warehouseController.createPickPack);
router.get('/warehouses/:id/pick-pack', warehouseController.getPickPacks);
router.get('/warehouses/:id/pick-pack/:pickPackId', warehouseController.getPickPackById);
router.post('/warehouses/:id/pick-pack/:pickPackId/start-picking', warehouseController.startPicking);
router.post('/warehouses/:id/pick-pack/:pickPackId/complete-picking', warehouseController.completePicking);
router.post('/warehouses/:id/pick-pack/:pickPackId/start-packing', warehouseController.startPacking);
router.post('/warehouses/:id/pick-pack/:pickPackId/complete-packing', warehouseController.completePacking);
router.post('/warehouses/:id/pick-pack/:pickPackId/assign', warehouseController.assignPickPack);

export const warehouseMerchantRouter = router;
