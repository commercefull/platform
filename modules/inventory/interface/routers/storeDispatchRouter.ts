import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
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
router.use(isOrganizationLoggedIn);

router.post('/dispatches', asyncHandler(createStoreDispatch));
router.get('/dispatches', asyncHandler(listStoreDispatches));
router.get('/dispatches/:dispatchId', asyncHandler(getStoreDispatch));
router.put('/dispatches/:dispatchId/approve', asyncHandler(approveStoreDispatch));
router.put('/dispatches/:dispatchId/dispatch', asyncHandler(dispatchFromStore));
router.put('/dispatches/:dispatchId/receive', asyncHandler(receiveStoreDispatch));
router.put('/dispatches/:dispatchId/cancel', asyncHandler(cancelStoreDispatch));

export const storeDispatchRouter = router;
export default router;
