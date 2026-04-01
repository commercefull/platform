/**
 * B2B Purchase Order Router
 * Routes for B2B purchase order operations
 */

import { Router } from 'express';
import { isB2BLoggedIn } from '../../../../libs/auth';
import { listPurchaseOrders, getPurchaseOrder, createPurchaseOrder } from '../controllers/b2bPurchaseOrderController';

const router = Router();

router.use(isB2BLoggedIn);

router.get('/b2b/purchase-orders', listPurchaseOrders);
router.post('/b2b/purchase-orders', createPurchaseOrder);
router.get('/b2b/purchase-orders/:purchaseOrderId', getPurchaseOrder);

export const b2bPurchaseOrderRouter = router;
