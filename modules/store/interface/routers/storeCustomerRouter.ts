import { jsonResponse } from 'libs/apiResponse';
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
    jsonResponse(res, 200, { data: stores });
  } catch {
    jsonResponse(res, 500, { error: 'Failed to list stores' });
  }
});

router.get('/stores/:storeId', async (req: HttpRequest, res: HttpResponse) => {
  try {
    const store = await manageStoresAdminUseCase.findById(req.params.storeId);
    if (!store) {
      return jsonResponse(res, 404, { error: 'Store not found' });
    }
    jsonResponse(res, 200, { data: store });
  } catch {
    jsonResponse(res, 500, { error: 'Failed to get store' });
  }
});

export const storeCustomerRouter = router;
export default router;
