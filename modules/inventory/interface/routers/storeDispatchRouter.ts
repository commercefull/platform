import express from 'express';
import { isMerchantLoggedIn } from '../../../../libs/auth';
import {
  createStoreDispatch,
  listStoreDispatches,
  getStoreDispatch,
  approveStoreDispatch,
  dispatchFromStore,
  receiveStoreDispatch,
  cancelStoreDispatch,
} from '../controllers/StoreDispatchController';

const router = express.Router();
router.use(isMerchantLoggedIn);

router.post('/dispatches', createStoreDispatch);
router.get('/dispatches', listStoreDispatches);
router.get('/dispatches/:dispatchId', getStoreDispatch);
router.put('/dispatches/:dispatchId/approve', approveStoreDispatch);
router.put('/dispatches/:dispatchId/dispatch', dispatchFromStore);
router.put('/dispatches/:dispatchId/receive', receiveStoreDispatch);
router.put('/dispatches/:dispatchId/cancel', cancelStoreDispatch);

export const storeDispatchRouter = router;
export default router;
