/**
 * Inventory Business Router
 */

import express from 'express';
import * as inventoryController from '../controllers/InventoryController';
import { isMerchantLoggedIn } from '../../../../libs/auth';

const router = express.Router();
router.use(isMerchantLoggedIn);

router.get('/', inventoryController.listInventory);
router.get('/low-stock', inventoryController.getLowStock);
router.get('/:inventoryId', inventoryController.getInventory);
router.post('/:inventoryId/restock', inventoryController.restockInventory);
router.post('/:inventoryId/adjust', inventoryController.adjustStock);
router.post('/:inventoryId/reserve', inventoryController.reserveStock);

export const inventoryBusinessRouter = router;
export default router;
