/**
 * Inventory Customer Router
 */

import express from 'express';
import * as inventoryController from '../controllers/InventoryController';

const router = express.Router();

router.get('/availability/:sku', inventoryController.checkAvailability);

export const inventoryCustomerRouter = router;
export default router;
