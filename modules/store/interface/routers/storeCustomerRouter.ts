/**
 * Store Customer Router
 *
 * Public-facing routes for browsing stores and pickup locations.
 */

import { Router, Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import storeDataRepository from '../../infrastructure/repositories/StoreDataRepository';

const storeRepo = storeDataRepository.stores;
const router = Router();

router.get('/stores', async (req: TypedRequest, res: Response) => {
  try {
    const stores = await storeRepo.findAll();
    res.json({ data: stores });
  } catch {
    res.status(500).json({ error: 'Failed to list stores' });
  }
});

router.get('/stores/:storeId', async (req: TypedRequest, res: Response) => {
  try {
    const store = await storeRepo.findById(req.params.storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json({ data: store });
  } catch {
    res.status(500).json({ error: 'Failed to get store' });
  }
});

export const storeCustomerRouter = router;
export default router;
