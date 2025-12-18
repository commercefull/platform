import express from 'express';
import { isMerchantLoggedIn } from '../../libs/auth';
import * as warehouseController from './controllers/warehouseBusinessController';

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

export const warehouseMerchantRouter = router;
