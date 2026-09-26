/**
 * Store Customer Router
 *
 * Public-facing routes for browsing stores and pickup locations.
 */

import { createHttpRouter } from 'libs/http';
import type { HttpRequest, HttpResponse } from 'libs/http';
import { manageStoresAdminUseCase } from '../../application/useCases/wired';
const router = createHttpRouter();

router.get('/stores', async (req: HttpRequest, res: HttpResponse) => {
  try {
    const stores = await manageStoresAdminUseCase.findAll();
    res.json({ data: stores });
  } catch {
    res.status(500).json({ error: 'Failed to list stores' });
  }
});

router.get('/stores/:storeId', async (req: HttpRequest, res: HttpResponse) => {
  try {
    const store = await manageStoresAdminUseCase.findById(req.params.storeId);
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
